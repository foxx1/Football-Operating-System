-- ═══════════════════════════════════════════════════════════════════
-- Multi-tenancy Phase T0: organizations table + organization_id on root
-- tenant tables. An organization is a club, an academy, or an association.
--
-- Additive and zero-downtime. All existing data is backfilled into
-- organization 1 (seeded from the org_name system setting when present).
-- Every organization_id column gets NOT NULL DEFAULT 1 so the running
-- app — which does not yet pass organization_id anywhere — keeps working
-- unchanged: new rows continue to land in organization 1. The DEFAULT is
-- a deliberate transition device; it is removed in Phase T2 once the
-- storage layer passes organization_id explicitly (Phase T1).
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "organizations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "name_ar" text,
  "slug" text NOT NULL UNIQUE,
  "type" text DEFAULT 'club' NOT NULL,
  "logo" text,
  "country" text DEFAULT 'BH' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

INSERT INTO "organizations" ("id", "name", "slug", "type")
SELECT
  1,
  COALESCE(
    (SELECT "setting_value" FROM "system_settings"
      WHERE "category" = 'general' AND "setting_key" = 'org_name'
        AND "setting_value" IS NOT NULL AND "setting_value" <> ''
      LIMIT 1),
    '360 FOS'
  ),
  'org-1',
  'club'
WHERE NOT EXISTS (SELECT 1 FROM "organizations" WHERE "id" = 1);
--> statement-breakpoint

SELECT setval(pg_get_serial_sequence('"organizations"', 'id'), GREATEST((SELECT MAX("id") FROM "organizations"), 1));
--> statement-breakpoint

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "users" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_organization_id_idx" ON "users" ("organization_id");
--> statement-breakpoint

ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "players" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "players_organization_id_idx" ON "players" ("organization_id");
--> statement-breakpoint

ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "teams" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "teams_organization_id_idx" ON "teams" ("organization_id");
--> statement-breakpoint

ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "staff" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "staff" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "staff" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "staff_organization_id_idx" ON "staff" ("organization_id");
--> statement-breakpoint

ALTER TABLE "training_sessions" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "training_sessions" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "training_sessions" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "training_sessions" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_sessions_organization_id_idx" ON "training_sessions" ("organization_id");
--> statement-breakpoint

ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "matches" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_organization_id_idx" ON "matches" ("organization_id");
--> statement-breakpoint

ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "meetings" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "meetings" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "meetings" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meetings_organization_id_idx" ON "meetings" ("organization_id");
--> statement-breakpoint

ALTER TABLE "tactical_formations" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "tactical_formations" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "tactical_formations" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "tactical_formations" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "tactical_formations" ADD CONSTRAINT "tactical_formations_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tactical_formations_organization_id_idx" ON "tactical_formations" ("organization_id");
--> statement-breakpoint

ALTER TABLE "tactical_boards" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "tactical_boards" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "tactical_boards" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "tactical_boards" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "tactical_boards" ADD CONSTRAINT "tactical_boards_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tactical_boards_organization_id_idx" ON "tactical_boards" ("organization_id");
--> statement-breakpoint

ALTER TABLE "analytics_reports" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "analytics_reports" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "analytics_reports" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "analytics_reports" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_reports_organization_id_idx" ON "analytics_reports" ("organization_id");
--> statement-breakpoint

ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "system_settings" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_settings_organization_id_idx" ON "system_settings" ("organization_id");
--> statement-breakpoint

-- settings uniqueness becomes per-organization
DROP INDEX IF EXISTS "system_settings_category_key_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "system_settings_org_category_key_unique" ON "system_settings" ("organization_id", "category", "setting_key");
--> statement-breakpoint

ALTER TABLE "injuries" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "injuries" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "injuries" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "injuries" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "injuries" ADD CONSTRAINT "injuries_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "injuries_organization_id_idx" ON "injuries" ("organization_id");
--> statement-breakpoint

ALTER TABLE "annual_budgets" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "annual_budgets" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "annual_budgets" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "annual_budgets" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "annual_budgets" ADD CONSTRAINT "annual_budgets_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "annual_budgets_organization_id_idx" ON "annual_budgets" ("organization_id");
--> statement-breakpoint

ALTER TABLE "monthly_budgets" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "monthly_budgets" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "monthly_budgets" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "monthly_budgets" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "monthly_budgets" ADD CONSTRAINT "monthly_budgets_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monthly_budgets_organization_id_idx" ON "monthly_budgets" ("organization_id");
--> statement-breakpoint

ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "expenses" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_organization_id_idx" ON "expenses" ("organization_id");
--> statement-breakpoint

ALTER TABLE "player_contracts" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "player_contracts" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "player_contracts" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "player_contracts" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "player_contracts" ADD CONSTRAINT "player_contracts_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "player_contracts_organization_id_idx" ON "player_contracts" ("organization_id");
--> statement-breakpoint

ALTER TABLE "achievement_types" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "achievement_types" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "achievement_types" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "achievement_types" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "achievement_types" ADD CONSTRAINT "achievement_types_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "achievement_types_organization_id_idx" ON "achievement_types" ("organization_id");
--> statement-breakpoint

ALTER TABLE "player_invitations" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "player_invitations" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "player_invitations" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "player_invitations" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "player_invitations" ADD CONSTRAINT "player_invitations_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "player_invitations_organization_id_idx" ON "player_invitations" ("organization_id");
--> statement-breakpoint

ALTER TABLE "employee_invitations" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "employee_invitations" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "employee_invitations" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "employee_invitations" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "employee_invitations" ADD CONSTRAINT "employee_invitations_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employee_invitations_organization_id_idx" ON "employee_invitations" ("organization_id");
--> statement-breakpoint

ALTER TABLE "terra_users" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "terra_users" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "terra_users" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "terra_users" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "terra_users" ADD CONSTRAINT "terra_users_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_users_organization_id_idx" ON "terra_users" ("organization_id");
--> statement-breakpoint

ALTER TABLE "wearable_devices" ADD COLUMN IF NOT EXISTS "organization_id" integer;
--> statement-breakpoint
UPDATE "wearable_devices" SET "organization_id" = 1 WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "wearable_devices" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "wearable_devices" ALTER COLUMN "organization_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "wearable_devices" ADD CONSTRAINT "wearable_devices_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wearable_devices_organization_id_idx" ON "wearable_devices" ("organization_id");
