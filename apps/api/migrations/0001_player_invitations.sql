CREATE TABLE IF NOT EXISTS "player_invitations" (
  "id" serial PRIMARY KEY NOT NULL,
  "token" text NOT NULL UNIQUE,
  "team_id" integer NOT NULL REFERENCES "teams"("id"),
  "email" text,
  "invited_by" integer NOT NULL REFERENCES "users"("id"),
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "player_invitations_token_idx" ON "player_invitations" ("token");
CREATE INDEX IF NOT EXISTS "player_invitations_team_id_idx" ON "player_invitations" ("team_id");
CREATE INDEX IF NOT EXISTS "player_invitations_invited_by_idx" ON "player_invitations" ("invited_by");
