CREATE TABLE IF NOT EXISTS "registration_reminders" (
  "id" serial PRIMARY KEY NOT NULL,
  "target_user_id" integer NOT NULL REFERENCES "users"("id"),
  "sent_by" integer NOT NULL REFERENCES "users"("id"),
  "missing_fields" jsonb NOT NULL,
  "message" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "registration_reminders_target_user_id_idx" ON "registration_reminders" ("target_user_id");
CREATE INDEX IF NOT EXISTS "registration_reminders_sent_by_idx" ON "registration_reminders" ("sent_by");
