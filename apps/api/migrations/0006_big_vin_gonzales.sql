CREATE TABLE "employee_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"role" text NOT NULL,
	"team_id" integer,
	"email" text,
	"invited_by" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "injuries" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"injury_type" text NOT NULL,
	"severity" text NOT NULL,
	"body_part" text NOT NULL,
	"status" text DEFAULT 'recovering' NOT NULL,
	"injury_date" date NOT NULL,
	"expected_return" date,
	"mechanism" text,
	"treatment" text,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "injury_treatment_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"injury_id" integer NOT NULL,
	"date" date NOT NULL,
	"treatment_type" text NOT NULL,
	"medicine_course" text,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"related_session_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"team_id" integer NOT NULL,
	"email" text,
	"invited_by" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "player_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "registration_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_user_id" integer NOT NULL,
	"sent_by" integer NOT NULL,
	"missing_fields" jsonb NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "annual_budgets" ADD COLUMN "team_id" integer;--> statement-breakpoint
ALTER TABLE "monthly_budgets" ADD COLUMN "team_id" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "first_name_ar" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "last_name_ar" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "first_name_ar" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "last_name_ar" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar" text;--> statement-breakpoint
ALTER TABLE "employee_invitations" ADD CONSTRAINT "employee_invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_invitations" ADD CONSTRAINT "employee_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "injuries" ADD CONSTRAINT "injuries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "injuries" ADD CONSTRAINT "injuries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "injury_treatment_logs" ADD CONSTRAINT "injury_treatment_logs_injury_id_injuries_id_fk" FOREIGN KEY ("injury_id") REFERENCES "public"."injuries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "injury_treatment_logs" ADD CONSTRAINT "injury_treatment_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_session_id_training_sessions_id_fk" FOREIGN KEY ("related_session_id") REFERENCES "public"."training_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_invitations" ADD CONSTRAINT "player_invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_invitations" ADD CONSTRAINT "player_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_reminders" ADD CONSTRAINT "registration_reminders_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_reminders" ADD CONSTRAINT "registration_reminders_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_invitations_token_idx" ON "employee_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "employee_invitations_invited_by_idx" ON "employee_invitations" USING btree ("invited_by");--> statement-breakpoint
CREATE INDEX "injuries_player_id_idx" ON "injuries" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "injuries_status_idx" ON "injuries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "injuries_injury_date_idx" ON "injuries" USING btree ("injury_date");--> statement-breakpoint
CREATE INDEX "injury_treatment_logs_injury_id_idx" ON "injury_treatment_logs" USING btree ("injury_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "player_invitations_token_idx" ON "player_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "player_invitations_team_id_idx" ON "player_invitations" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "player_invitations_invited_by_idx" ON "player_invitations" USING btree ("invited_by");--> statement-breakpoint
CREATE INDEX "registration_reminders_target_user_id_idx" ON "registration_reminders" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "registration_reminders_sent_by_idx" ON "registration_reminders" USING btree ("sent_by");--> statement-breakpoint
ALTER TABLE "annual_budgets" ADD CONSTRAINT "annual_budgets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_budgets" ADD CONSTRAINT "monthly_budgets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;