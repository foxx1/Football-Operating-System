CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "type" text NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "link" text,
  "is_read" boolean DEFAULT false NOT NULL,
  "related_session_id" integer REFERENCES "training_sessions"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" ("user_id");
