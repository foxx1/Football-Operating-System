import fs from "fs";
import path from "path";
import { z } from "zod";

let loaded = false;

export function loadDotEnv() {
  if (loaded) return;
  loaded = true;

  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const [key, ...valueParts] = trimmed.split("=");
    if (!key || valueParts.length === 0 || process.env[key.trim()] !== undefined) return;

    process.env[key.trim()] = valueParts.join("=").trim();
  });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  UPLOAD_PROVIDER: z.enum(["local", "object-storage"]).default("local"),
  OBJECT_STORAGE_BUCKET: z.string().optional(),
  OBJECT_STORAGE_REGION: z.string().optional(),
  OBJECT_STORAGE_ENDPOINT: z.string().url().optional(),
  OBJECT_STORAGE_ACCESS_KEY_ID: z.string().optional(),
  OBJECT_STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  OBJECT_STORAGE_PUBLIC_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  APP_URL: z.string().url().default("http://localhost:5000"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  BACKUP_SCHEDULE: z.string().optional(),
  MONITORING_DSN: z.string().url().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: NodeJS.ProcessEnv = process.env): AppEnv {
  const env = envSchema.parse(rawEnv);

  if (env.NODE_ENV === "production") {
    const missing: string[] = [];
    if (!env.DATABASE_URL) missing.push("DATABASE_URL");
    if (!env.SESSION_SECRET) missing.push("SESSION_SECRET");

    if (env.UPLOAD_PROVIDER === "object-storage") {
      if (!env.OBJECT_STORAGE_BUCKET) missing.push("OBJECT_STORAGE_BUCKET");
      if (!env.OBJECT_STORAGE_REGION) missing.push("OBJECT_STORAGE_REGION");
      if (!env.OBJECT_STORAGE_ENDPOINT) missing.push("OBJECT_STORAGE_ENDPOINT");
      if (!env.OBJECT_STORAGE_ACCESS_KEY_ID) missing.push("OBJECT_STORAGE_ACCESS_KEY_ID");
      if (!env.OBJECT_STORAGE_SECRET_ACCESS_KEY) missing.push("OBJECT_STORAGE_SECRET_ACCESS_KEY");
      if (!env.OBJECT_STORAGE_PUBLIC_URL) missing.push("OBJECT_STORAGE_PUBLIC_URL");
    }

    if (missing.length > 0) {
      throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
    }
  }

  return env;
}

loadDotEnv();
export const env = validateEnv();
