import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { env } from "./env";
import { logger } from "./logger";

if (!env.DATABASE_URL) {
  logger.warn("DATABASE_URL not set, falling back to memory storage");
}

export const pool = new Pool({
  connectionString: env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/teamtactical",
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

export const db = drizzle(pool, { schema });
