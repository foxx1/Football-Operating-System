import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("assistant"), // head_coach, assistant_coach, admin
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  position: text("position").notNull(), // goalkeeper, defender, midfielder, forward
  shirtNumber: integer("shirt_number"),
  dateOfBirth: text("date_of_birth").notNull(),
  height: integer("height"), // in cm
  weight: integer("weight"), // in kg
  nationality: text("nationality").notNull(),
  phoneNumber: text("phone_number"),
  email: text("email"),
  emergencyContact: text("emergency_contact"),
  medicalNotes: text("medical_notes"),
  profilePicture: text("profile_picture"), // file path for profile photo
  idDocument: text("id_document"), // file path for ID/Passport copy
  contractDocument: text("contract_document"), // file path for contract
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // first_team, reserves, youth
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamPlayers = pgTable("team_players", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  playerId: integer("player_id").notNull(),
  isStarter: boolean("is_starter").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  sessionType: text("session_type").notNull(), // technical, fitness, tactical, match_prep
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  duration: integer("duration").notNull(), // in minutes
  location: text("location").notNull(),
  teamId: integer("team_id").notNull(),
  coachId: integer("coach_id").notNull(),
  maxParticipants: integer("max_participants"),
  notes: text("notes"),
  status: text("status").default("scheduled").notNull(), // scheduled, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessionAttendance = pgTable("session_attendance", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  playerId: integer("player_id").notNull(),
  status: text("status").notNull(), // present, absent, excused, late
  rating: integer("rating"), // 1-10 performance rating
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tacticalFormations = pgTable("tactical_formations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  formation: text("formation").notNull(), // e.g., "4-4-2", "3-5-2"
  teamId: integer("team_id").notNull(),
  positions: jsonb("positions").notNull(), // JSON array of player positions
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  sessionId: integer("session_id"),
  goals: integer("goals").default(0).notNull(),
  assists: integer("assists").default(0).notNull(),
  yellowCards: integer("yellow_cards").default(0).notNull(),
  redCards: integer("red_cards").default(0).notNull(),
  minutesPlayed: integer("minutes_played").default(0).notNull(),
  fitnessScore: integer("fitness_score"), // 1-100
  technicalScore: integer("technical_score"), // 1-100
  tacticalScore: integer("tactical_score"), // 1-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  role: text("role").notNull(), // head_coach, assistant_coach, fitness_coach, goalkeeping_coach, physiotherapist, analyst, kit_manager
  department: text("department").notNull(), // coaching, medical, analysis, operations
  employmentType: text("employment_type").notNull(), // full_time, part_time, contract, volunteer
  startDate: text("start_date").notNull(),
  salary: integer("salary"), // monthly salary
  qualifications: text("qualifications"),
  emergencyContact: text("emergency_contact"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  homeTeamId: integer("home_team_id").notNull(),
  awayTeam: text("away_team").notNull(), // opponent team name
  competition: text("competition").notNull(), // league, cup, friendly
  matchType: text("match_type").notNull(), // home, away, neutral
  date: text("date").notNull(),
  kickoffTime: text("kickoff_time").notNull(),
  venue: text("venue").notNull(),
  status: text("status").default("scheduled").notNull(), // scheduled, ongoing, completed, cancelled, postponed
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  notes: text("notes"),
  weatherConditions: text("weather_conditions"),
  attendance: integer("attendance"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matchSquads = pgTable("match_squads", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  playerId: integer("player_id").notNull(),
  status: text("status").notNull(), // starting_xi, substitute, not_selected, injured
  position: text("position"),
  shirtNumber: integer("shirt_number"),
  minutesPlayed: integer("minutes_played").default(0),
  goals: integer("goals").default(0),
  assists: integer("assists").default(0),
  yellowCards: integer("yellow_cards").default(0),
  redCards: integer("red_cards").default(0),
  rating: integer("rating"), // 1-10
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsReports = pgTable("analytics_reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // performance, tactical, fitness, injury, attendance
  period: text("period").notNull(), // weekly, monthly, season
  dataPoints: jsonb("data_points").notNull(), // JSON data for charts/metrics
  insights: text("insights"),
  recommendations: text("recommendations"),
  generatedBy: integer("generated_by").notNull(), // staff id
  teamId: integer("team_id"),
  playerId: integer("player_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // general, notifications, integrations, security
  settingKey: text("setting_key").notNull(),
  settingValue: text("setting_value"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  updatedBy: integer("updated_by").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertTeamPlayerSchema = createInsertSchema(teamPlayers).omit({
  id: true,
  createdAt: true,
});

export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).omit({
  id: true,
  createdAt: true,
});

export const insertSessionAttendanceSchema = createInsertSchema(sessionAttendance).omit({
  id: true,
  createdAt: true,
});

export const insertTacticalFormationSchema = createInsertSchema(tacticalFormations).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerStatsSchema = createInsertSchema(playerStats).omit({
  id: true,
  createdAt: true,
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export const insertMatchSquadSchema = createInsertSchema(matchSquads).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsReportSchema = createInsertSchema(analyticsReports).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertTeamPlayer = z.infer<typeof insertTeamPlayerSchema>;
export type TeamPlayer = typeof teamPlayers.$inferSelect;

export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type TrainingSession = typeof trainingSessions.$inferSelect;

export type InsertSessionAttendance = z.infer<typeof insertSessionAttendanceSchema>;
export type SessionAttendance = typeof sessionAttendance.$inferSelect;

export type InsertTacticalFormation = z.infer<typeof insertTacticalFormationSchema>;
export type TacticalFormation = typeof tacticalFormations.$inferSelect;

export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type PlayerStats = typeof playerStats.$inferSelect;

export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

export type InsertMatchSquad = z.infer<typeof insertMatchSquadSchema>;
export type MatchSquad = typeof matchSquads.$inferSelect;

export type InsertAnalyticsReport = z.infer<typeof insertAnalyticsReportSchema>;
export type AnalyticsReport = typeof analyticsReports.$inferSelect;

export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;
