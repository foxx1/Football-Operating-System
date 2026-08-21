CREATE TABLE IF NOT EXISTS "employee_invitations" (
  "id" serial PRIMARY KEY NOT NULL,
  "token" text NOT NULL UNIQUE,
  "role" text NOT NULL,
  "email" text,
  "invited_by" integer NOT NULL REFERENCES "users"("id"),
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "employee_invitations_token_idx" ON "employee_invitations" ("token");
CREATE INDEX IF NOT EXISTS "employee_invitations_invited_by_idx" ON "employee_invitations" ("invited_by");
