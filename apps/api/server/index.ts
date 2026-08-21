import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { registerAuthRoutes } from "./auth";
import { apiErrorHandler } from "./api-contracts";
import { env } from "./env";
import { registerBackgroundJobs } from "./jobs/job-queue";
import { logger } from "./logger";
import { createUploadService } from "./services/upload-service";

const app = express();
// Railway (and most PaaS) terminate SSL at the load balancer and forward
// traffic to the app over plain HTTP. Without this, express-session sees
// the connection as insecure and silently omits the Set-Cookie header when
// cookie.secure=true, breaking all session-based auth in production.
app.set("trust proxy", 1);

// Redirect HTTP → HTTPS in production (Railway sets X-Forwarded-Proto)
if (env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// app./admin./www.360fos.com are all separate static hosts (apps/app,
// fos-admin, fos-www) calling this API cross-origin, so they need to be
// allow-listed explicitly. localhost:5173 is apps/app's local Vite dev
// server, needed to test the real cross-origin path locally.
// TODO: once the Cloudflare Pages project for apps/app exists, add its
// *.pages.dev preview URL here temporarily while validating before DNS cutover.
const ALLOWED_ORIGINS = [
  "https://app.360fos.com",
  "https://admin.360fos.com",
  "https://www.360fos.com",
  "http://localhost:5173",
];
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || ALLOWED_ORIGINS.includes(origin)),
  credentials: true,
}));

// verify: stash the raw body bytes on req.rawBody. Terra webhook signature
// verification needs the exact bytes Terra signed, which JSON.parse (and any
// re-stringify) can't reliably reproduce.
app.use(express.json({
  limit: "20mb",
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false, limit: "20mb" }));

// Session storage. Backed by Postgres (via connect-pg-simple) whenever
// DATABASE_URL is set, so sessions survive redeploys and work across
// multiple instances — falls back to an in-memory store only for local dev
// without a database.
//
// This uses its OWN connection pool, deliberately separate from the app's
// main query pool in server/db.ts. Two earlier attempts at this (see git
// history: 843cc93, 48df82d, 3a62aa6, 4ac8226) reverted to memorystore
// after "silent failures" on Neon. The most likely causes, based on that
// history: (1) session writes sharing a pool with regular API traffic, so
// a burst of app queries could starve session.save() of a connection, and
// (2) no explicit connectionTimeoutMillis, so a slow/cold-starting Neon
// compute (serverless Postgres auto-suspends when idle) could hang rather
// than fail fast or retry. A small, isolated pool with a generous but
// finite timeout addresses both. createTableIfMissing is intentionally
// re-enabled: it runs a `CREATE TABLE IF NOT EXISTS`, so it's a no-op once
// the table exists, and it makes this self-healing in any fresh
// environment (a new Neon branch, disaster recovery) instead of depending
// on a table that was created by hand outside the migration system.
const sessionPool = env.DATABASE_URL
  ? new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    })
  : undefined;

if (sessionPool) {
  sessionPool.on("error", (err) => {
    // A connection idling in the pool was terminated (e.g. Neon closing it
    // after a suspend). This does not crash the process — pg replaces the
    // connection on the next checkout — but it's worth knowing about if
    // session errors are being investigated again.
    logger.error("session_pool_error", { error: err.message });
  });
}

const sessionStore = sessionPool
  ? new (connectPgSimple(session))({
      pool: sessionPool,
      tableName: "user_sessions",
      createTableIfMissing: true,
      errorLog: (err: Error) => logger.error("session_store_error", { error: err.message }),
    })
  : new (MemoryStore(session))({ checkPeriod: 86400000 });

if (!sessionPool) {
  logger.warn("DATABASE_URL not set — using in-memory session store (fine for local dev; sessions won't persist across restarts or work across multiple instances)");
}

// env.ts requires SESSION_SECRET in production, so this fallback only ever
// runs in local dev. Generated fresh at boot rather than hardcoded, so
// there's no static secret sitting in the (public) repo.
const sessionSecret = env.SESSION_SECRET ?? crypto.randomBytes(32).toString("hex");
if (!env.SESSION_SECRET) {
  logger.warn("SESSION_SECRET not set — using a random secret generated at boot (dev only; this invalidates existing sessions on every restart)");
}

app.use(session({
  store: sessionStore,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 8,
  },
}));

registerBackgroundJobs();

const uploadService = createUploadService();

// Local uploads are still served by this process. Object storage providers should serve through signed/public URLs.
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Add CORS headers for uploads
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve uploaded files with proper headers
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, path) => {
    if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.jfif')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      logger.info("api_request", {
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs: duration,
        response: capturedJsonResponse,
      });
    }
  });

  next();
});

(async () => {
  registerAuthRoutes(app);
  const server = await registerRoutes(app, uploadService);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    apiErrorHandler(err, _req, res, _next);
  });

  const port = parseInt(process.env.PORT ?? "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    logger.info("server_started", { port, env: env.NODE_ENV, uploadProvider: uploadService.provider });
  });
})();
