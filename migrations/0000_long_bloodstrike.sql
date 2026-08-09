CREATE TABLE "achievement_criteria" (
	"id" serial PRIMARY KEY NOT NULL,
	"achievement_type_id" integer NOT NULL,
	"criteria_type" text NOT NULL,
	"threshold" numeric(10, 2) NOT NULL,
	"timeframe" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievement_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"achievement_type_id" integer NOT NULL,
	"date" date NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"event_type" text NOT NULL,
	"event_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievement_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"achievement_type_id" integer NOT NULL,
	"reward_type" text NOT NULL,
	"reward_value" text NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievement_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"rarity" text NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"period" text NOT NULL,
	"data_points" jsonb NOT NULL,
	"insights" text,
	"recommendations" text,
	"generated_by" integer NOT NULL,
	"team_id" integer,
	"player_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "annual_budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"fiscal_year" text NOT NULL,
	"season_start_date" date,
	"season_end_date" date,
	"total_budget" numeric(12, 2) NOT NULL,
	"salaries_budget" numeric(12, 2) NOT NULL,
	"operational_budget" numeric(12, 2) NOT NULL,
	"equipment_budget" numeric(12, 2) NOT NULL,
	"travel_budget" numeric(12, 2) NOT NULL,
	"medical_budget" numeric(12, 2) NOT NULL,
	"facilities_budget" numeric(12, 2) NOT NULL,
	"marketing_budget" numeric(12, 2) NOT NULL,
	"other_budget" numeric(12, 2) NOT NULL,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "annual_budgets_fiscal_year_unique" UNIQUE("fiscal_year")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"budget_id" integer NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"expense_date" text NOT NULL,
	"vendor" text,
	"payment_method" text,
	"receipt" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"payment_reference" text,
	"notes" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_squads" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"status" text NOT NULL,
	"position" text,
	"shirt_number" integer,
	"minutes_played" integer DEFAULT 0,
	"goals" integer DEFAULT 0,
	"assists" integer DEFAULT 0,
	"yellow_cards" integer DEFAULT 0,
	"red_cards" integer DEFAULT 0,
	"rating" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"home_team_id" integer NOT NULL,
	"away_team" text NOT NULL,
	"competition" text NOT NULL,
	"match_type" text NOT NULL,
	"date" text NOT NULL,
	"kickoff_time" text NOT NULL,
	"venue" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"first_half_home_score" integer,
	"first_half_away_score" integer,
	"second_half_home_score" integer,
	"second_half_away_score" integer,
	"goal_events" jsonb,
	"notes" text,
	"weather_conditions" text,
	"attendance" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"meeting_type" text NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"duration" integer NOT NULL,
	"location" text NOT NULL,
	"organizer_id" integer NOT NULL,
	"attendees" text[],
	"agenda" text,
	"notes" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" text NOT NULL,
	"annual_budget_id" integer,
	"season_start_date" date,
	"season_end_date" date,
	"budget_name" text NOT NULL,
	"total_budget" numeric(12, 2) NOT NULL,
	"salaries_budget" numeric(12, 2) NOT NULL,
	"operational_budget" numeric(12, 2) NOT NULL,
	"equipment_budget" numeric(12, 2) NOT NULL,
	"travel_budget" numeric(12, 2) NOT NULL,
	"medical_budget" numeric(12, 2) NOT NULL,
	"facilities_budget" numeric(12, 2) NOT NULL,
	"marketing_budget" numeric(12, 2) NOT NULL,
	"other_budget" numeric(12, 2) NOT NULL,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" integer NOT NULL,
	"approved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"metric_type" text NOT NULL,
	"date" text NOT NULL,
	"value" integer NOT NULL,
	"additional_data" jsonb,
	"session_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"coach_id" integer NOT NULL,
	"performance_type" text NOT NULL,
	"performance_id" integer,
	"emoji" text NOT NULL,
	"category" text NOT NULL,
	"comment" text,
	"is_positive" boolean NOT NULL,
	"intensity" integer DEFAULT 3 NOT NULL,
	"context_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"achievement_type_id" integer NOT NULL,
	"progress" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"best_streak" integer DEFAULT 0 NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"contract_type" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"monthly_salary" numeric(12, 2),
	"bonuses" numeric(12, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"contract_document" text,
	"notes" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"session_id" integer,
	"goals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"yellow_cards" integer DEFAULT 0 NOT NULL,
	"red_cards" integer DEFAULT 0 NOT NULL,
	"minutes_played" integer DEFAULT 0 NOT NULL,
	"fitness_score" integer,
	"technical_score" integer,
	"tactical_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"position" text NOT NULL,
	"shirt_number" integer,
	"date_of_birth" text NOT NULL,
	"height" integer,
	"weight" integer,
	"nationality" text NOT NULL,
	"phone_number" text,
	"email" text,
	"emergency_contact" text,
	"id_number" text,
	"passport_number" text,
	"passport_issue_date" date,
	"passport_expiry_date" date,
	"medical_notes" text,
	"profile_picture" text,
	"id_document" text,
	"contract_document" text,
	"contract_start_date" date,
	"contract_end_date" date,
	"monthly_salary" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"status" text NOT NULL,
	"rating" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text,
	"nationality" text,
	"role" text NOT NULL,
	"department" text NOT NULL,
	"employment_type" text NOT NULL,
	"start_date" text NOT NULL,
	"contract_end_date" text,
	"salary" integer,
	"qualifications" text,
	"emergency_contact" text,
	"id_number" text,
	"passport_number" text,
	"passport_issue_date" date,
	"passport_expiry_date" date,
	"profile_picture" text,
	"id_document" text,
	"contract_document" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" text,
	"description" text,
	"is_active" boolean DEFAULT true,
	"updated_by" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tactical_boards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"drawing_elements" jsonb NOT NULL,
	"thumbnail" text,
	"tags" json DEFAULT '[]'::json,
	"formation" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tactical_formations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"formation" text NOT NULL,
	"team_id" integer NOT NULL,
	"positions" jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"is_starter" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"staff_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terra_activity_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"terra_user_id" uuid NOT NULL,
	"activity_id" varchar(255),
	"name" varchar(255),
	"sport" varchar(100),
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"calories_total" numeric(10, 2),
	"calories_active" numeric(10, 2),
	"distance_meters" numeric(10, 2),
	"avg_heart_rate" integer,
	"max_heart_rate" integer,
	"resting_heart_rate" integer,
	"heart_rate_zones" json,
	"steps" integer,
	"cadence_avg" numeric(8, 2),
	"elevation_gain" numeric(10, 2),
	"elevation_loss" numeric(10, 2),
	"device_name" varchar(255),
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "terra_body_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"terra_user_id" uuid NOT NULL,
	"measurement_time" timestamp NOT NULL,
	"weight_kg" numeric(6, 2),
	"height_cm" numeric(6, 2),
	"bmi" numeric(5, 2),
	"bodyfat_percentage" numeric(5, 2),
	"muscle_mass_kg" numeric(6, 2),
	"bone_mass_kg" numeric(6, 2),
	"water_percentage" numeric(5, 2),
	"lean_mass_kg" numeric(6, 2),
	"bmr" integer,
	"rmr" integer,
	"blood_glucose_mmol" numeric(5, 2),
	"blood_oxygen_saturation" numeric(5, 2),
	"blood_pressure_systolic" integer,
	"blood_pressure_diastolic" integer,
	"metabolic_age" integer,
	"visceral_fat_level" integer,
	"skinfold_mm" numeric(5, 2),
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "terra_daily_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"terra_user_id" uuid NOT NULL,
	"calendar_date" date NOT NULL,
	"steps" integer,
	"distance_meters" numeric(10, 2),
	"floors_climbed" integer,
	"active_minutes" integer,
	"sedentary_minutes" integer,
	"calories_total" numeric(10, 2),
	"calories_active" numeric(10, 2),
	"calories_bmr" numeric(10, 2),
	"resting_heart_rate" integer,
	"avg_heart_rate" integer,
	"max_heart_rate" integer,
	"heart_rate_variability" numeric(8, 2),
	"training_load" numeric(8, 2),
	"stress_score" numeric(5, 2),
	"recovery_score" numeric(5, 2),
	"readiness_score" numeric(5, 2),
	"energy_level" integer,
	"stress_level" integer,
	"mood_score" integer,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "terra_device_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"auth_type" varchar(50) NOT NULL,
	"logo_url" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "terra_sleep_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"terra_user_id" uuid NOT NULL,
	"sleep_id" varchar(255),
	"bedtime_start" timestamp NOT NULL,
	"bedtime_end" timestamp NOT NULL,
	"sleep_start" timestamp,
	"sleep_end" timestamp,
	"sleep_duration_minutes" integer,
	"sleep_efficiency_percentage" numeric(5, 2),
	"time_in_bed_minutes" integer,
	"awakenings_count" integer,
	"light_sleep_minutes" integer,
	"deep_sleep_minutes" integer,
	"rem_sleep_minutes" integer,
	"awake_minutes" integer,
	"sleep_score" numeric(5, 2),
	"restfulness_score" numeric(5, 2),
	"avg_heart_rate" numeric(5, 2),
	"resting_heart_rate" numeric(5, 2),
	"heart_rate_variability" numeric(8, 2),
	"recovery_score" numeric(5, 2),
	"readiness_score" numeric(5, 2),
	"avg_body_temperature" numeric(4, 2),
	"avg_respiration_rate" numeric(5, 2),
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "terra_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"player_id" integer NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_user_id" varchar(255),
	"scopes" varchar(500) NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_webhook_update" timestamp,
	"auth_expiry" timestamp,
	"access_token" text,
	"refresh_token" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "terra_users_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "terra_webhook_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"terra_user_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"payload" json,
	"error_message" text,
	"processing_time_ms" integer,
	"signature" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"session_type" text NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"duration" integer NOT NULL,
	"fitness_duration" integer,
	"main_part_duration" integer,
	"goalkeeping_duration" integer,
	"specific_work_duration" integer,
	"location" text NOT NULL,
	"team_id" integer NOT NULL,
	"coach_id" integer NOT NULL,
	"max_participants" integer,
	"fitness_aerobic" text,
	"fitness_strength" text,
	"fitness_endurance" text,
	"fitness_tests" text,
	"fitness_recovery" text,
	"fitness_tapering" text,
	"fitness_warm_up" text,
	"fitness_cool_down" text,
	"fitness_flexibility" text,
	"fitness_agility" text,
	"fitness_speed" text,
	"fitness_power" text,
	"fitness_other" text,
	"main_technical" text,
	"main_tactical" text,
	"main_match_prep" text,
	"main_possession" text,
	"main_transition" text,
	"main_set_pieces" text,
	"main_finishing" text,
	"gk_handling" text,
	"gk_shot_stopping" text,
	"gk_distribution" text,
	"gk_footwork" text,
	"gk_crossing" text,
	"gk_one_on_one" text,
	"gk_communication" text,
	"gk_positioning" text,
	"gk_reactions" text,
	"gk_diving" text,
	"gk_throwing" text,
	"gk_kicking" text,
	"specific_individual" text,
	"specific_position" text,
	"specific_injury_prev" text,
	"specific_rehab" text,
	"specific_youth" text,
	"specific_condition" text,
	"specific_finishing" text,
	"specific_crossing" text,
	"specific_defending" text,
	"specific_pressing" text,
	"specific_counter_attack" text,
	"specific_mental" text,
	"training_image_url" text,
	"training_image_type" text,
	"training_image_name" text,
	"fitness_image_url" text,
	"fitness_image_type" text,
	"fitness_image_name" text,
	"goalkeeping_image_url" text,
	"goalkeeping_image_type" text,
	"goalkeeping_image_name" text,
	"specific_work_image_url" text,
	"specific_work_image_type" text,
	"specific_work_image_name" text,
	"notes" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'assistant' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wearable_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"data_type" text NOT NULL,
	"value" text NOT NULL,
	"unit" text,
	"timestamp" timestamp NOT NULL,
	"session_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wearable_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"device_type" text NOT NULL,
	"device_model" text NOT NULL,
	"device_id" text NOT NULL,
	"auth_token" text,
	"last_sync_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wearable_devices_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
ALTER TABLE "achievement_criteria" ADD CONSTRAINT "achievement_criteria_achievement_type_id_achievement_types_id_fk" FOREIGN KEY ("achievement_type_id") REFERENCES "public"."achievement_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_progress" ADD CONSTRAINT "achievement_progress_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_progress" ADD CONSTRAINT "achievement_progress_achievement_type_id_achievement_types_id_fk" FOREIGN KEY ("achievement_type_id") REFERENCES "public"."achievement_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_rewards" ADD CONSTRAINT "achievement_rewards_achievement_type_id_achievement_types_id_fk" FOREIGN KEY ("achievement_type_id") REFERENCES "public"."achievement_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annual_budgets" ADD CONSTRAINT "annual_budgets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_budget_id_monthly_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."monthly_budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_squads" ADD CONSTRAINT "match_squads_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_squads" ADD CONSTRAINT "match_squads_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_organizer_id_staff_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_budgets" ADD CONSTRAINT "monthly_budgets_annual_budget_id_annual_budgets_id_fk" FOREIGN KEY ("annual_budget_id") REFERENCES "public"."annual_budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_budgets" ADD CONSTRAINT "monthly_budgets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_budgets" ADD CONSTRAINT "monthly_budgets_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_session_id_training_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reactions" ADD CONSTRAINT "performance_reactions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reactions" ADD CONSTRAINT "performance_reactions_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_achievements" ADD CONSTRAINT "player_achievements_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_achievements" ADD CONSTRAINT "player_achievements_achievement_type_id_achievement_types_id_fk" FOREIGN KEY ("achievement_type_id") REFERENCES "public"."achievement_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_contracts" ADD CONSTRAINT "player_contracts_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_contracts" ADD CONSTRAINT "player_contracts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_session_id_training_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_session_id_training_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tactical_boards" ADD CONSTRAINT "tactical_boards_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tactical_formations" ADD CONSTRAINT "tactical_formations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_staff" ADD CONSTRAINT "team_staff_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_staff" ADD CONSTRAINT "team_staff_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_activity_data" ADD CONSTRAINT "terra_activity_data_terra_user_id_terra_users_user_id_fk" FOREIGN KEY ("terra_user_id") REFERENCES "public"."terra_users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_body_data" ADD CONSTRAINT "terra_body_data_terra_user_id_terra_users_user_id_fk" FOREIGN KEY ("terra_user_id") REFERENCES "public"."terra_users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_daily_data" ADD CONSTRAINT "terra_daily_data_terra_user_id_terra_users_user_id_fk" FOREIGN KEY ("terra_user_id") REFERENCES "public"."terra_users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_sleep_data" ADD CONSTRAINT "terra_sleep_data_terra_user_id_terra_users_user_id_fk" FOREIGN KEY ("terra_user_id") REFERENCES "public"."terra_users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_users" ADD CONSTRAINT "terra_users_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_webhook_logs" ADD CONSTRAINT "terra_webhook_logs_terra_user_id_terra_users_user_id_fk" FOREIGN KEY ("terra_user_id") REFERENCES "public"."terra_users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_coach_id_staff_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_data" ADD CONSTRAINT "wearable_data_device_id_wearable_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."wearable_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_data" ADD CONSTRAINT "wearable_data_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_data" ADD CONSTRAINT "wearable_data_session_id_training_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_devices" ADD CONSTRAINT "wearable_devices_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievement_criteria_type_id_idx" ON "achievement_criteria" USING btree ("achievement_type_id");--> statement-breakpoint
CREATE INDEX "achievement_progress_player_id_idx" ON "achievement_progress" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "achievement_progress_type_id_idx" ON "achievement_progress" USING btree ("achievement_type_id");--> statement-breakpoint
CREATE INDEX "achievement_progress_date_idx" ON "achievement_progress" USING btree ("date");--> statement-breakpoint
CREATE INDEX "achievement_rewards_type_id_idx" ON "achievement_rewards" USING btree ("achievement_type_id");--> statement-breakpoint
CREATE INDEX "analytics_reports_generated_by_idx" ON "analytics_reports" USING btree ("generated_by");--> statement-breakpoint
CREATE INDEX "analytics_reports_team_id_idx" ON "analytics_reports" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "analytics_reports_player_id_idx" ON "analytics_reports" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "annual_budgets_created_by_idx" ON "annual_budgets" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "annual_budgets_status_idx" ON "annual_budgets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expenses_budget_id_idx" ON "expenses" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "expenses_status_idx" ON "expenses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expenses_expense_date_idx" ON "expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE UNIQUE INDEX "match_squads_match_id_player_id_unique" ON "match_squads" USING btree ("match_id","player_id");--> statement-breakpoint
CREATE INDEX "match_squads_match_id_idx" ON "match_squads" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "match_squads_player_id_idx" ON "match_squads" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "matches_home_team_id_idx" ON "matches" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "matches_date_idx" ON "matches" USING btree ("date");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meetings_organizer_id_idx" ON "meetings" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "meetings_date_idx" ON "meetings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "meetings_status_idx" ON "meetings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "monthly_budgets_annual_budget_id_idx" ON "monthly_budgets" USING btree ("annual_budget_id");--> statement-breakpoint
CREATE INDEX "monthly_budgets_month_idx" ON "monthly_budgets" USING btree ("month");--> statement-breakpoint
CREATE INDEX "monthly_budgets_created_by_idx" ON "monthly_budgets" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "performance_metrics_player_metric_date_idx" ON "performance_metrics" USING btree ("player_id","metric_type","date");--> statement-breakpoint
CREATE INDEX "performance_metrics_player_id_idx" ON "performance_metrics" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "performance_metrics_session_id_idx" ON "performance_metrics" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "performance_reactions_player_id_idx" ON "performance_reactions" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "performance_reactions_coach_id_idx" ON "performance_reactions" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "performance_reactions_context_date_idx" ON "performance_reactions" USING btree ("context_date");--> statement-breakpoint
CREATE UNIQUE INDEX "player_achievements_player_id_type_id_unique" ON "player_achievements" USING btree ("player_id","achievement_type_id");--> statement-breakpoint
CREATE INDEX "player_achievements_player_id_idx" ON "player_achievements" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_achievements_type_id_idx" ON "player_achievements" USING btree ("achievement_type_id");--> statement-breakpoint
CREATE INDEX "player_contracts_player_id_idx" ON "player_contracts" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_contracts_created_by_idx" ON "player_contracts" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "player_contracts_is_active_idx" ON "player_contracts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "player_stats_player_id_idx" ON "player_stats" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_stats_session_id_idx" ON "player_stats" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_attendance_session_id_player_id_unique" ON "session_attendance" USING btree ("session_id","player_id");--> statement-breakpoint
CREATE INDEX "session_attendance_session_id_idx" ON "session_attendance" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_attendance_player_id_idx" ON "session_attendance" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "system_settings_category_key_unique" ON "system_settings" USING btree ("category","setting_key");--> statement-breakpoint
CREATE INDEX "tactical_boards_created_by_idx" ON "tactical_boards" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "tactical_boards_updated_at_idx" ON "tactical_boards" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "tactical_boards_is_public_idx" ON "tactical_boards" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "tactical_formations_team_id_idx" ON "tactical_formations" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_players_team_id_player_id_unique" ON "team_players" USING btree ("team_id","player_id");--> statement-breakpoint
CREATE INDEX "team_players_team_id_idx" ON "team_players" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_players_player_id_idx" ON "team_players" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_staff_team_id_staff_id_unique" ON "team_staff" USING btree ("team_id","staff_id");--> statement-breakpoint
CREATE INDEX "team_staff_team_id_idx" ON "team_staff" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_staff_staff_id_idx" ON "team_staff" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "terra_activity_data_terra_user_id_idx" ON "terra_activity_data" USING btree ("terra_user_id");--> statement-breakpoint
CREATE INDEX "terra_activity_data_start_time_idx" ON "terra_activity_data" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "terra_body_data_terra_user_id_idx" ON "terra_body_data" USING btree ("terra_user_id");--> statement-breakpoint
CREATE INDEX "terra_body_data_measurement_time_idx" ON "terra_body_data" USING btree ("measurement_time");--> statement-breakpoint
CREATE UNIQUE INDEX "terra_daily_data_terra_user_id_calendar_date_unique" ON "terra_daily_data" USING btree ("terra_user_id","calendar_date");--> statement-breakpoint
CREATE INDEX "terra_daily_data_terra_user_id_idx" ON "terra_daily_data" USING btree ("terra_user_id");--> statement-breakpoint
CREATE INDEX "terra_daily_data_calendar_date_idx" ON "terra_daily_data" USING btree ("calendar_date");--> statement-breakpoint
CREATE INDEX "terra_sleep_data_terra_user_id_idx" ON "terra_sleep_data" USING btree ("terra_user_id");--> statement-breakpoint
CREATE INDEX "terra_sleep_data_bedtime_start_idx" ON "terra_sleep_data" USING btree ("bedtime_start");--> statement-breakpoint
CREATE INDEX "terra_users_player_id_idx" ON "terra_users" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "terra_users_provider_idx" ON "terra_users" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "terra_users_provider_user_id_idx" ON "terra_users" USING btree ("provider_user_id");--> statement-breakpoint
CREATE INDEX "terra_webhook_logs_terra_user_id_idx" ON "terra_webhook_logs" USING btree ("terra_user_id");--> statement-breakpoint
CREATE INDEX "terra_webhook_logs_event_type_idx" ON "terra_webhook_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "terra_webhook_logs_status_idx" ON "terra_webhook_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "terra_webhook_logs_created_at_idx" ON "terra_webhook_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "training_sessions_team_id_idx" ON "training_sessions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "training_sessions_coach_id_idx" ON "training_sessions" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "training_sessions_date_idx" ON "training_sessions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "training_sessions_status_idx" ON "training_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wearable_data_device_id_idx" ON "wearable_data" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "wearable_data_player_id_idx" ON "wearable_data" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "wearable_data_data_type_idx" ON "wearable_data" USING btree ("data_type");--> statement-breakpoint
CREATE INDEX "wearable_data_timestamp_idx" ON "wearable_data" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "wearable_devices_player_id_idx" ON "wearable_devices" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "wearable_devices_is_active_idx" ON "wearable_devices" USING btree ("is_active");