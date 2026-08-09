import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { registerAuthRoutes } from "./auth";
import { setupVite, serveStatic, log } from "./vite";
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

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: false, limit: "20mb" }));

const sessionStore = new (MemoryStore(session))({ checkPeriod: 86400000 });

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "dev-session-secret-change-me",
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

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT ?? "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
    logger.info("server_started", { port, env: env.NODE_ENV, uploadProvider: uploadService.provider });
  });
})();
