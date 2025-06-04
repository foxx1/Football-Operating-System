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
