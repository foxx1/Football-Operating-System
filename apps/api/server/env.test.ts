import { describe, expect, it } from "vitest";
import { validateEnv } from "./env";

describe("environment validation", () => {
  it("allows development without production-only settings", () => {
    expect(validateEnv({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toMatchObject({
      NODE_ENV: "development",
      UPLOAD_PROVIDER: "local",
      LOG_LEVEL: "info",
    });
  });

  it("requires database and session secret in production", () => {
    expect(() => validateEnv({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toThrow(/DATABASE_URL/);
    expect(() => validateEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgres://user:pass@example.com:5432/app",
      SESSION_SECRET: "12345678901234567890123456789012",
    } as NodeJS.ProcessEnv)).not.toThrow();
  });

  it("requires object storage settings when object storage is enabled", () => {
    expect(() => validateEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgres://user:pass@example.com:5432/app",
      SESSION_SECRET: "12345678901234567890123456789012",
      UPLOAD_PROVIDER: "object-storage",
    } as NodeJS.ProcessEnv)).toThrow(/OBJECT_STORAGE_BUCKET/);
  });
});
