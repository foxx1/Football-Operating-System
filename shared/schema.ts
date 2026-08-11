import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, varchar, uuid, json, date, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("assistant"), // club_super_admin, head_coach, assistant_coach, admin, assistant, player
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  firstNameAr: text("first_name_ar"), // Arabic first name, shown when Arabic locale is active
  lastNameAr: text("last_name_ar"), // Arabic last name, shown when Arabic locale is active
  position: text("position").notNull(), // goalkeeper, defender, midfielder, forward
  shirtNumber: integer("shirt_number"),
  dateOfBirth: text("date_of_birth").notNull(),
  height: integer("height"), // in cm
  weight: integer("weight"), // in kg
  nationality: text("nationality").notNull(),
  phoneNumber: text("phone_number"),
  email: text("email"),
  emergencyContact: text("emergency_contact"),
  idNumber: text("id_number"), // National ID or Passport number
  passportNumber: text("passport_number"), // Passport number if different from ID
  passportIssueDate: date("passport_issue_date"), // Passport issue date
  passportExpiryDate: date("passport_expiry_date"), // Passport expiry date
  medicalNotes: text("medical_notes"),
  profilePicture: text("profile_picture"), // file path for profile photo
  idDocument: text("id_document"), // file path for ID/Passport copy
  contractDocument: text("contract_document"), // file path for contract
  contractStartDate: date("contract_start_date"), // contract start date
  contractEndDate: date("contract_end_date"), // contract end date
  monthlySalary: decimal("monthly_salary", { precision: 10, scale: 2 }), // monthly salary amount
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
  teamId: integer("team_id").references(() => teams.id).notNull(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  isStarter: boolean("is_starter").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    teamPlayerUnique: uniqueIndex("team_players_team_id_player_id_unique").on(table.teamId, table.playerId),
    teamIdIdx: index("team_players_team_id_idx").on(table.teamId),
    playerIdIdx: index("team_players_player_id_idx").on(table.playerId),
  };
});

export const teamStaff = pgTable("team_staff", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  staffId: integer("staff_id").references(() => staff.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    teamStaffUnique: uniqueIndex("team_staff_team_id_staff_id_unique").on(table.teamId, table.staffId),
    teamIdIdx: index("team_staff_team_id_idx").on(table.teamId),
    staffIdIdx: index("team_staff_staff_id_idx").on(table.staffId),
  };
});

export const trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  sessionType: text("session_type").notNull(), // fitness, technical, tactical, match_prep, recovery
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  duration: integer("duration").notNull(), // in minutes
  fitnessDuration: integer("fitness_duration"), // Duration of fitness section in minutes
  mainPartDuration: integer("main_part_duration"), // Duration of main part section in minutes
  goalkeepingDuration: integer("goalkeeping_duration"), // Duration of goalkeeping section in minutes
  specificWorkDuration: integer("specific_work_duration"), // Duration of specific work section in minutes
  location: text("location").notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  coachId: integer("coach_id").references(() => staff.id).notNull(),
  maxParticipants: integer("max_participants"),

  // Fitness Section (General Preparation)
  fitnessAerobic: text("fitness_aerobic"), // Aerobic exercises and details
  fitnessStrength: text("fitness_strength"), // Strength training details
  fitnessEndurance: text("fitness_endurance"), // Endurance training details
  fitnessTests: text("fitness_tests"), // Fitness testing details
  fitnessRecovery: text("fitness_recovery"), // Recovery session details
  fitnessTapering: text("fitness_tapering"), // Tapering session details
  fitnessWarmUp: text("fitness_warm_up"), // Warm-up routines
  fitnessCoolDown: text("fitness_cool_down"), // Cool-down routines
  fitnessFlexibility: text("fitness_flexibility"), // Flexibility training
  fitnessAgility: text("fitness_agility"), // Agility training
  fitnessSpeed: text("fitness_speed"), // Speed training
  fitnessPower: text("fitness_power"), // Power training
  fitnessOther: text("fitness_other"), // Other fitness activities

  // Main Part Section
  mainTechnical: text("main_technical"), // Technical training details
  mainTactical: text("main_tactical"), // Tactical training details
  mainMatchPrep: text("main_match_prep"), // Match preparation details
  mainPossession: text("main_possession"), // Possession-based training
  mainTransition: text("main_transition"), // Transition training
  mainSetPieces: text("main_set_pieces"), // Set pieces training
  mainFinishing: text("main_finishing"), // Finishing training

  // Goalkeeper Specific Section
  gkHandling: text("gk_handling"), // Goalkeeper handling exercises
  gkShotStopping: text("gk_shot_stopping"), // Shot stopping training
  gkDistribution: text("gk_distribution"), // Distribution training
  gkFootwork: text("gk_footwork"), // Footwork and positioning
  gkCrossing: text("gk_crossing"), // Dealing with crosses
  gkOneOnOne: text("gk_one_on_one"), // 1v1 situations
  gkCommunication: text("gk_communication"), // Communication training
  gkPositioning: text("gk_positioning"), // Positioning training
  gkReactions: text("gk_reactions"), // Reaction training
  gkDiving: text("gk_diving"), // Diving techniques
  gkThrowing: text("gk_throwing"), // Throwing techniques
  gkKicking: text("gk_kicking"), // Kicking techniques

  // Specific Work Section
  specificIndividual: text("specific_individual"), // Individual player work
  specificPosition: text("specific_position"), // Position-specific training
  specificInjuryPrev: text("specific_injury_prev"), // Injury prevention
  specificRehab: text("specific_rehab"), // Rehabilitation work
  specificYouth: text("specific_youth"), // Youth player development
  specificCondition: text("specific_condition"), // Conditioning work
  specificFinishing: text("specific_finishing"), // Finishing training
  specificCrossing: text("specific_crossing"), // Crossing training
  specificDefending: text("specific_defending"), // Defending training
  specificPressing: text("specific_pressing"), // Pressing training
  specificCounterAttack: text("specific_counter_attack"), // Counter-attack training
  specificMental: text("specific_mental"), // Mental training

  // Training Image
  trainingImageUrl: text("training_image_url"),
  trainingImageType: text("training_image_type"), // 'library', 'upload', 'created'
  trainingImageName: text("training_image_name"),

  // Section-specific Training Images
  fitnessImageUrl: text("fitness_image_url"),
  fitnessImageType: text("fitness_image_type"), // 'library', 'upload', 'created'
  fitnessImageName: text("fitness_image_name"),

  goalkeepingImageUrl: text("goalkeeping_image_url"),
  goalkeepingImageType: text("goalkeeping_image_type"), // 'library', 'upload', 'created'
  goalkeepingImageName: text("goalkeeping_image_name"),

  specificWorkImageUrl: text("specific_work_image_url"),
  specificWorkImageType: text("specific_work_image_type"), // 'library', 'upload', 'created'
  specificWorkImageName: text("specific_work_image_name"),

  notes: text("notes"),
  status: text("status").default("scheduled").notNull(), // scheduled, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    teamIdIdx: index("training_sessions_team_id_idx").on(table.teamId),
    coachIdIdx: index("training_sessions_coach_id_idx").on(table.coachId),
    dateIdx: index("training_sessions_date_idx").on(table.date),
    statusIdx: index("training_sessions_status_idx").on(table.status),
  };
});

export const sessionAttendance = pgTable("session_attendance", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => trainingSessions.id).notNull(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  status: text("status").notNull(), // confirmed, leave_requested, late (player-set) | present, absent, excused, late (staff-set)
  rating: integer("rating"), // 1-10 performance rating
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    sessionPlayerUnique: uniqueIndex("session_attendance_session_id_player_id_unique").on(table.sessionId, table.playerId),
    sessionIdIdx: index("session_attendance_session_id_idx").on(table.sessionId),
    playerIdIdx: index("session_attendance_player_id_idx").on(table.playerId),
  };
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // training_scheduled, leave_requested
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false).notNull(),
  relatedSessionId: integer("related_session_id").references(() => trainingSessions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
  };
});

export const tacticalFormations = pgTable("tactical_formations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  formation: text("formation").notNull(), // e.g., "4-4-2", "3-5-2"
  teamId: integer("team_id").references(() => teams.id).notNull(),
  positions: jsonb("positions").notNull(), // JSON array of player positions
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    teamIdIdx: index("tactical_formations_team_id_idx").on(table.teamId),
  };
});

export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  sessionId: integer("session_id").references(() => trainingSessions.id),
  goals: integer("goals").default(0).notNull(),
  assists: integer("assists").default(0).notNull(),
  yellowCards: integer("yellow_cards").default(0).notNull(),
  redCards: integer("red_cards").default(0).notNull(),
  minutesPlayed: integer("minutes_played").default(0).notNull(),
  fitnessScore: integer("fitness_score"), // 1-100
  technicalScore: integer("technical_score"), // 1-100
  tacticalScore: integer("tactical_score"), // 1-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    playerIdIdx: index("player_stats_player_id_idx").on(table.playerId),
    sessionIdIdx: index("player_stats_session_id_idx").on(table.sessionId),
  };
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  firstNameAr: text("first_name_ar"), // Arabic first name, shown when Arabic locale is active
  lastNameAr: text("last_name_ar"), // Arabic last name, shown when Arabic locale is active
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  nationality: text("nationality"),
  role: text("role").notNull(), // head_coach, assistant_coach, fitness_coach, goalkeeping_coach, physiotherapist, analyst, kit_manager, team_manager, team_administrative
  department: text("department").notNull(), // coaching, medical, analysis, operations
  employmentType: text("employment_type").notNull(), // full_time, part_time, contract, volunteer
  startDate: text("start_date").notNull(),
  contractEndDate: text("contract_end_date"), // contract end date
  salary: integer("salary"), // monthly salary
  qualifications: text("qualifications"),
  emergencyContact: text("emergency_contact"),
  idNumber: text("id_number"), // official ID or passport number
  passportNumber: text("passport_number"), // Passport number if different from ID
  passportIssueDate: date("passport_issue_date"), // Passport issue date
  passportExpiryDate: date("passport_expiry_date"), // Passport expiry date
  profilePicture: text("profile_picture"), // file path to profile photo
  idDocument: text("id_document"), // file path to ID/passport copy
  contractDocument: text("contract_document"), // file path to signed contract
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  homeTeamId: integer("home_team_id").references(() => teams.id).notNull(),
  awayTeam: text("away_team").notNull(), // opponent team name
  competition: text("competition").notNull(), // league, cup, friendly
  matchType: text("match_type").notNull(), // home, away, neutral
  date: text("date").notNull(),
  kickoffTime: text("kickoff_time").notNull(),
  venue: text("venue").notNull(),
  status: text("status").default("scheduled").notNull(), // scheduled, ongoing, completed, cancelled, postponed
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  // Half-time scores
  firstHalfHomeScore: integer("first_half_home_score"),
  firstHalfAwayScore: integer("first_half_away_score"),
  secondHalfHomeScore: integer("second_half_home_score"),
  secondHalfAwayScore: integer("second_half_away_score"),
  // Goal events: array of { minute, half, team, scorerName, assistName }
  goalEvents: jsonb("goal_events"),
  notes: text("notes"),
  weatherConditions: text("weather_conditions"),
  attendance: integer("attendance"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    homeTeamIdIdx: index("matches_home_team_id_idx").on(table.homeTeamId),
    dateIdx: index("matches_date_idx").on(table.date),
    statusIdx: index("matches_status_idx").on(table.status),
  };
});

export const matchSquads = pgTable("match_squads", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  playerId: integer("player_id").references(() => players.id).notNull(),
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
}, (table) => {
  return {
    matchPlayerUnique: uniqueIndex("match_squads_match_id_player_id_unique").on(table.matchId, table.playerId),
    matchIdIdx: index("match_squads_match_id_idx").on(table.matchId),
    playerIdIdx: index("match_squads_player_id_idx").on(table.playerId),
  };
});

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  meetingType: text("meeting_type").notNull(), // team, tactical, staff, individual, medical, board, sponsors, other
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  duration: integer("duration").notNull(), // in minutes
  location: text("location").notNull(),
  organizerId: integer("organizer_id").references(() => staff.id).notNull(), // staff id who organized the meeting
  attendees: text("attendees").array(), // array of staff/player IDs or names
  agenda: text("agenda"),
  notes: text("notes"),
  status: text("status").default("scheduled").notNull(), // scheduled, in_progress, completed, cancelled, postponed
  priority: text("priority").default("medium").notNull(), // low, medium, high, urgent
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    organizerIdIdx: index("meetings_organizer_id_idx").on(table.organizerId),
    dateIdx: index("meetings_date_idx").on(table.date),
    statusIdx: index("meetings_status_idx").on(table.status),
  };
});

export const analyticsReports = pgTable("analytics_reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // performance, tactical, fitness, injury, attendance
  period: text("period").notNull(), // weekly, monthly, season
  dataPoints: jsonb("data_points").notNull(), // JSON data for charts/metrics
  insights: text("insights"),
  recommendations: text("recommendations"),
  generatedBy: integer("generated_by").references(() => users.id).notNull(),
  teamId: integer("team_id").references(() => teams.id),
  playerId: integer("player_id").references(() => players.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    generatedByIdx: index("analytics_reports_generated_by_idx").on(table.generatedBy),
    teamIdIdx: index("analytics_reports_team_id_idx").on(table.teamId),
    playerIdIdx: index("analytics_reports_player_id_idx").on(table.playerId),
  };
});

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // general, notifications, integrations, security
  settingKey: text("setting_key").notNull(),
  settingValue: text("setting_value"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  updatedBy: integer("updated_by").references(() => users.id).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    categoryKeyUnique: uniqueIndex("system_settings_category_key_unique").on(table.category, table.settingKey),
  };
});

// Injury Records. Team association is derived through the player's squad
// membership, so an injury is always scoped with the player it belongs to.
export const injuries = pgTable("injuries", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  injuryType: text("injury_type").notNull(),
  severity: text("severity").notNull(), // mild, moderate, severe
  bodyPart: text("body_part").notNull(),
  status: text("status").notNull().default("recovering"), // recovering, out, available
  injuryDate: date("injury_date").notNull(),
  expectedReturn: date("expected_return"),
  mechanism: text("mechanism"),
  treatment: text("treatment"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    playerIdIdx: index("injuries_player_id_idx").on(table.playerId),
    statusIdx: index("injuries_status_idx").on(table.status),
    injuryDateIdx: index("injuries_injury_date_idx").on(table.injuryDate),
  };
});

// Running course-of-care log kept by medical staff against an injury.
export const injuryTreatmentLogs = pgTable("injury_treatment_logs", {
  id: serial("id").primaryKey(),
  injuryId: integer("injury_id").references(() => injuries.id).notNull(),
  date: date("date").notNull(),
  treatmentType: text("treatment_type").notNull(),
  medicineCourse: text("medicine_course"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    injuryIdIdx: index("injury_treatment_logs_injury_id_idx").on(table.injuryId),
  };
});

// Annual Budget Management (Fiscal Year Allocations)
export const annualBudgets = pgTable("annual_budgets", {
  id: serial("id").primaryKey(),
  fiscalYear: text("fiscal_year").notNull().unique(), // e.g., "2025-26"
  // Owning squad. NULL means a club-wide budget, visible only to club super admins.
  teamId: integer("team_id").references(() => teams.id),
  seasonStartDate: date("season_start_date"),
  seasonEndDate: date("season_end_date"),
  totalBudget: decimal("total_budget", { precision: 12, scale: 2 }).notNull(),
  salariesBudget: decimal("salaries_budget", { precision: 12, scale: 2 }).notNull(),
  operationalBudget: decimal("operational_budget", { precision: 12, scale: 2 }).notNull(),
  equipmentBudget: decimal("equipment_budget", { precision: 12, scale: 2 }).notNull(),
  travelBudget: decimal("travel_budget", { precision: 12, scale: 2 }).notNull(),
  medicalBudget: decimal("medical_budget", { precision: 12, scale: 2 }).notNull(),
  facilitiesBudget: decimal("facilities_budget", { precision: 12, scale: 2 }).notNull(),
  marketingBudget: decimal("marketing_budget", { precision: 12, scale: 2 }).notNull(),
  otherBudget: decimal("other_budget", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  status: text("status").default("active").notNull(), // active, archived, draft
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    createdByIdx: index("annual_budgets_created_by_idx").on(table.createdBy),
    statusIdx: index("annual_budgets_status_idx").on(table.status),
  };
});

// Monthly Budget Management
export const monthlyBudgets = pgTable("monthly_budgets", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(), // YYYY-MM format
  annualBudgetId: integer("annual_budget_id").references(() => annualBudgets.id),
  // Owning squad. NULL means a club-wide budget, visible only to club super admins.
  teamId: integer("team_id").references(() => teams.id),
  seasonStartDate: date("season_start_date"),
  seasonEndDate: date("season_end_date"),
  budgetName: text("budget_name").notNull(),
  totalBudget: decimal("total_budget", { precision: 12, scale: 2 }).notNull(),
  salariesBudget: decimal("salaries_budget", { precision: 12, scale: 2 }).notNull(),
  operationalBudget: decimal("operational_budget", { precision: 12, scale: 2 }).notNull(),
  equipmentBudget: decimal("equipment_budget", { precision: 12, scale: 2 }).notNull(),
  travelBudget: decimal("travel_budget", { precision: 12, scale: 2 }).notNull(),
  medicalBudget: decimal("medical_budget", { precision: 12, scale: 2 }).notNull(),
  facilitiesBudget: decimal("facilities_budget", { precision: 12, scale: 2 }).notNull(),
  marketingBudget: decimal("marketing_budget", { precision: 12, scale: 2 }).notNull(),
  otherBudget: decimal("other_budget", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  status: text("status").default("active").notNull(), // active, archived, draft
  createdBy: integer("created_by").references(() => users.id).notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    annualBudgetIdIdx: index("monthly_budgets_annual_budget_id_idx").on(table.annualBudgetId),
    monthIdx: index("monthly_budgets_month_idx").on(table.month),
    createdByIdx: index("monthly_budgets_created_by_idx").on(table.createdBy),
  };
});

// Expense Tracking
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").references(() => monthlyBudgets.id).notNull(),
  category: text("category").notNull(), // salaries, operational, equipment, travel, medical, facilities, marketing, other
  subcategory: text("subcategory"), // specific expense type
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  expenseDate: text("expense_date").notNull(), // YYYY-MM-DD
  vendor: text("vendor"), // supplier/vendor name
  paymentMethod: text("payment_method"), // cash, card, transfer, cheque
  receipt: text("receipt"), // file path to receipt/invoice
  status: text("status").default("pending").notNull(), // pending, approved, rejected, paid
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paymentReference: text("payment_reference"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    budgetIdIdx: index("expenses_budget_id_idx").on(table.budgetId),
    categoryIdx: index("expenses_category_idx").on(table.category),
    statusIdx: index("expenses_status_idx").on(table.status),
    expenseDateIdx: index("expenses_expense_date_idx").on(table.expenseDate),
  };
});

// Player Salaries (extending player info with salary details)
export const playerContracts = pgTable("player_contracts", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  contractType: text("contract_type").notNull(), // professional, amateur, youth, loan
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }),
  bonuses: decimal("bonuses", { precision: 12, scale: 2 }), // monthly performance bonuses
  currency: text("currency").default("USD").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  contractDocument: text("contract_document"), // file path
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    playerIdIdx: index("player_contracts_player_id_idx").on(table.playerId),
    createdByIdx: index("player_contracts_created_by_idx").on(table.createdBy),
    activeIdx: index("player_contracts_is_active_idx").on(table.isActive),
  };
});

// Terra-like Unified Wearable API System
export const terraDeviceProviders = pgTable("terra_device_providers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // fitbit, garmin, oura, apple_health, etc.
  displayName: varchar("display_name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // event_driven, polled
  isActive: boolean("is_active").default(true),
  authType: varchar("auth_type", { length: 50 }).notNull(), // oauth2, api_key, device_pairing
  logoUrl: varchar("logo_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const terraUsers = pgTable("terra_users", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").defaultRandom().notNull().unique(), // Terra-style UUID
  playerId: integer("player_id").references(() => players.id).notNull(), // Reference ID in Terra terms
  provider: varchar("provider", { length: 50 }).notNull(),
  providerUserId: varchar("provider_user_id", { length: 255 }),
  scopes: varchar("scopes", { length: 500 }).notNull(), // activity:read,sleep:read,body:read,etc
  isActive: boolean("is_active").default(true),
  lastWebhookUpdate: timestamp("last_webhook_update"),
  authExpiry: timestamp("auth_expiry"),
  accessToken: text("access_token"), // Encrypted
  refreshToken: text("refresh_token"), // Encrypted
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    playerIdIdx: index("terra_users_player_id_idx").on(table.playerId),
    providerIdx: index("terra_users_provider_idx").on(table.provider),
    providerUserIdx: index("terra_users_provider_user_id_idx").on(table.providerUserId),
  };
});

// Terra-like Activity Data Model
export const terraActivityData = pgTable("terra_activity_data", {
  id: serial("id").primaryKey(),
  terraUserId: uuid("terra_user_id").references(() => terraUsers.userId).notNull(),
  activityId: varchar("activity_id", { length: 255 }), // Provider-specific ID
  name: varchar("name", { length: 255 }),
  sport: varchar("sport", { length: 100 }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  // Calories data
  caloriesTotal: decimal("calories_total", { precision: 10, scale: 2 }),
  caloriesActive: decimal("calories_active", { precision: 10, scale: 2 }),
  // Distance data
  distanceMeters: decimal("distance_meters", { precision: 10, scale: 2 }),
  // Heart rate data
  avgHeartRate: integer("avg_heart_rate"),
  maxHeartRate: integer("max_heart_rate"),
  restingHeartRate: integer("resting_heart_rate"),
  heartRateZones: json("heart_rate_zones"), // Zone distribution
  // Movement data
  steps: integer("steps"),
  cadenceAvg: decimal("cadence_avg", { precision: 8, scale: 2 }),
  // Position data (GPS)
  elevationGain: decimal("elevation_gain", { precision: 10, scale: 2 }),
  elevationLoss: decimal("elevation_loss", { precision: 10, scale: 2 }),
  // Device data
  deviceName: varchar("device_name", { length: 255 }),
  // Additional metadata
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    terraUserIdIdx: index("terra_activity_data_terra_user_id_idx").on(table.terraUserId),
    startTimeIdx: index("terra_activity_data_start_time_idx").on(table.startTime),
  };
});

// Terra-like Sleep Data Model
export const terraSleepData = pgTable("terra_sleep_data", {
  id: serial("id").primaryKey(),
  terraUserId: uuid("terra_user_id").references(() => terraUsers.userId).notNull(),
  sleepId: varchar("sleep_id", { length: 255 }),
  bedtimeStart: timestamp("bedtime_start").notNull(),
  bedtimeEnd: timestamp("bedtime_end").notNull(),
  sleepStart: timestamp("sleep_start"),
  sleepEnd: timestamp("sleep_end"),
  // Sleep metrics
  sleepDurationMinutes: integer("sleep_duration_minutes"),
  sleepEfficiencyPercentage: decimal("sleep_efficiency_percentage", { precision: 5, scale: 2 }),
  timeInBedMinutes: integer("time_in_bed_minutes"),
  awakeningsCount: integer("awakenings_count"),
  // Sleep stages
  lightSleepMinutes: integer("light_sleep_minutes"),
  deepSleepMinutes: integer("deep_sleep_minutes"),
  remSleepMinutes: integer("rem_sleep_minutes"),
  awakeMinutes: integer("awake_minutes"),
  // Sleep scores
  sleepScore: decimal("sleep_score", { precision: 5, scale: 2 }),
  restfulnessScore: decimal("restfulness_score", { precision: 5, scale: 2 }),
  // Heart rate during sleep
  avgHeartRate: decimal("avg_heart_rate", { precision: 5, scale: 2 }),
  restingHeartRate: decimal("resting_heart_rate", { precision: 5, scale: 2 }),
  heartRateVariability: decimal("heart_rate_variability", { precision: 8, scale: 2 }),
  // Recovery metrics
  recoveryScore: decimal("recovery_score", { precision: 5, scale: 2 }),
  readinessScore: decimal("readiness_score", { precision: 5, scale: 2 }),
  // Temperature
  avgBodyTemperature: decimal("avg_body_temperature", { precision: 4, scale: 2 }),
  // Respiratory
  avgRespirationRate: decimal("avg_respiration_rate", { precision: 5, scale: 2 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    terraUserIdIdx: index("terra_sleep_data_terra_user_id_idx").on(table.terraUserId),
    bedtimeStartIdx: index("terra_sleep_data_bedtime_start_idx").on(table.bedtimeStart),
  };
});

// Terra-like Body Data Model
export const terraBodyData = pgTable("terra_body_data", {
  id: serial("id").primaryKey(),
  terraUserId: uuid("terra_user_id").references(() => terraUsers.userId).notNull(),
  measurementTime: timestamp("measurement_time").notNull(),
  // Basic measurements
  weightKg: decimal("weight_kg", { precision: 6, scale: 2 }),
  heightCm: decimal("height_cm", { precision: 6, scale: 2 }),
  bmi: decimal("bmi", { precision: 5, scale: 2 }),
  // Body composition
  bodyfatPercentage: decimal("bodyfat_percentage", { precision: 5, scale: 2 }),
  muscleMassKg: decimal("muscle_mass_kg", { precision: 6, scale: 2 }),
  boneMassKg: decimal("bone_mass_kg", { precision: 6, scale: 2 }),
  waterPercentage: decimal("water_percentage", { precision: 5, scale: 2 }),
  leanMassKg: decimal("lean_mass_kg", { precision: 6, scale: 2 }),
  // Metabolic measurements
  bmr: integer("bmr"), // Basal Metabolic Rate
  rmr: integer("rmr"), // Resting Metabolic Rate
  // Blood measurements
  bloodGlucoseMmol: decimal("blood_glucose_mmol", { precision: 5, scale: 2 }),
  bloodOxygenSaturation: decimal("blood_oxygen_saturation", { precision: 5, scale: 2 }),
  // Blood pressure
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  // Advanced metrics
  metabolicAge: integer("metabolic_age"),
  visceralFatLevel: integer("visceral_fat_level"),
  skinfoldMm: decimal("skinfold_mm", { precision: 5, scale: 2 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    terraUserIdIdx: index("terra_body_data_terra_user_id_idx").on(table.terraUserId),
    measurementTimeIdx: index("terra_body_data_measurement_time_idx").on(table.measurementTime),
  };
});

// Terra-like Daily Summary Data
export const terraDailyData = pgTable("terra_daily_data", {
  id: serial("id").primaryKey(),
  terraUserId: uuid("terra_user_id").references(() => terraUsers.userId).notNull(),
  calendarDate: date("calendar_date").notNull(),
  // Activity summary
  steps: integer("steps"),
  distanceMeters: decimal("distance_meters", { precision: 10, scale: 2 }),
  floorsClimbed: integer("floors_climbed"),
  activeMinutes: integer("active_minutes"),
  sedentaryMinutes: integer("sedentary_minutes"),
  // Calories
  caloriesTotal: decimal("calories_total", { precision: 10, scale: 2 }),
  caloriesActive: decimal("calories_active", { precision: 10, scale: 2 }),
  caloriesBmr: decimal("calories_bmr", { precision: 10, scale: 2 }),
  // Heart rate
  restingHeartRate: integer("resting_heart_rate"),
  avgHeartRate: integer("avg_heart_rate"),
  maxHeartRate: integer("max_heart_rate"),
  heartRateVariability: decimal("heart_rate_variability", { precision: 8, scale: 2 }),
  // Training load and recovery
  trainingLoad: decimal("training_load", { precision: 8, scale: 2 }),
  stressScore: decimal("stress_score", { precision: 5, scale: 2 }),
  recoveryScore: decimal("recovery_score", { precision: 5, scale: 2 }),
  readinessScore: decimal("readiness_score", { precision: 5, scale: 2 }),
  // Energy and mood
  energyLevel: integer("energy_level"), // 1-5 scale
  stressLevel: integer("stress_level"), // 1-5 scale
  moodScore: integer("mood_score"), // 1-10 scale
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    terraUserDateUnique: uniqueIndex("terra_daily_data_terra_user_id_calendar_date_unique").on(table.terraUserId, table.calendarDate),
    terraUserIdIdx: index("terra_daily_data_terra_user_id_idx").on(table.terraUserId),
    calendarDateIdx: index("terra_daily_data_calendar_date_idx").on(table.calendarDate),
  };
});

// Event/Webhook logs
export const terraWebhookLogs = pgTable("terra_webhook_logs", {
  id: serial("id").primaryKey(),
  terraUserId: uuid("terra_user_id").references(() => terraUsers.userId),
  eventType: varchar("event_type", { length: 100 }).notNull(), // activity, sleep, body, daily, auth, etc.
  provider: varchar("provider", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // success, failed, retry
  payload: json("payload"),
  errorMessage: text("error_message"),
  processingTimeMs: integer("processing_time_ms"),
  signature: varchar("signature", { length: 255 }), // HMAC verification
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    terraUserIdIdx: index("terra_webhook_logs_terra_user_id_idx").on(table.terraUserId),
    eventTypeIdx: index("terra_webhook_logs_event_type_idx").on(table.eventType),
    statusIdx: index("terra_webhook_logs_status_idx").on(table.status),
    createdAtIdx: index("terra_webhook_logs_created_at_idx").on(table.createdAt),
  };
});

// Performance Reactions - Quick emoji feedback for player performances
export const performanceReactions = pgTable("performance_reactions", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id),
  coachId: integer("coach_id").notNull().references(() => users.id),
  performanceType: text("performance_type").notNull(), // training, match, individual_session, assessment
  performanceId: integer("performance_id"), // reference to specific training session, match, etc.
  emoji: text("emoji").notNull(), // 👍, 👎, ⚡, 🔥, 💪, ⭐, 😴, 🎯, 💯, ❤️
  category: text("category").notNull(), // effort, skill, attitude, fitness, teamwork, improvement
  comment: text("comment"), // optional text comment
  isPositive: boolean("is_positive").notNull(), // true for positive reactions, false for constructive feedback
  intensity: integer("intensity").default(3).notNull(), // 1-5 scale for reaction intensity
  contextDate: date("context_date").notNull(), // when the performance being reacted to occurred
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    playerIdIdx: index("performance_reactions_player_id_idx").on(table.playerId),
    coachIdIdx: index("performance_reactions_coach_id_idx").on(table.coachId),
    contextDateIdx: index("performance_reactions_context_date_idx").on(table.contextDate),
  };
});

// Tactical Boards Library - Save/Open tactical formations and drawings
export const tacticalBoards = pgTable("tactical_boards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  drawingElements: jsonb("drawing_elements").notNull(), // Array of drawing elements
  thumbnail: text("thumbnail"), // Base64 or file path for thumbnail
  tags: json("tags").$type<string[]>().default([]), // Array of tags for categorization
  formation: text("formation"), // 4-4-2, 4-3-3, etc.
  isPublic: boolean("is_public").default(false).notNull(), // Can be used by other apps
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    createdByIdx: index("tactical_boards_created_by_idx").on(table.createdBy),
    updatedAtIdx: index("tactical_boards_updated_at_idx").on(table.updatedAt),
    publicIdx: index("tactical_boards_is_public_idx").on(table.isPublic),
  };
});

// Achievement System - Gamified training milestone tracking
export const achievementTypes = pgTable("achievement_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // training, fitness, skill, attendance, leadership, team_spirit
  icon: text("icon").notNull(), // lucide icon name or emoji
  color: text("color").notNull(), // badge color: gold, silver, bronze, blue, green, purple, red
  rarity: text("rarity").notNull(), // common, uncommon, rare, epic, legendary
  points: integer("points").default(0).notNull(), // achievement points value
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievementCriteria = pgTable("achievement_criteria", {
  id: serial("id").primaryKey(),
  achievementTypeId: integer("achievement_type_id").references(() => achievementTypes.id).notNull(),
  criteriaType: text("criteria_type").notNull(), // sessions_completed, streak_days, performance_score, attendance_rate
  threshold: decimal("threshold", { precision: 10, scale: 2 }).notNull(), // required value to unlock
  timeframe: text("timeframe"), // daily, weekly, monthly, yearly, all_time
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    achievementTypeIdIdx: index("achievement_criteria_type_id_idx").on(table.achievementTypeId),
  };
});

export const playerAchievements = pgTable("player_achievements", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  achievementTypeId: integer("achievement_type_id").references(() => achievementTypes.id).notNull(),
  progress: decimal("progress", { precision: 10, scale: 2 }).default('0').notNull(), // current progress value
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  currentStreak: integer("current_streak").default(0).notNull(), // for streak-based achievements
  bestStreak: integer("best_streak").default(0).notNull(),
  metadata: json("metadata"), // additional tracking data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    playerAchievementUnique: uniqueIndex("player_achievements_player_id_type_id_unique").on(table.playerId, table.achievementTypeId),
    playerIdIdx: index("player_achievements_player_id_idx").on(table.playerId),
    achievementTypeIdIdx: index("player_achievements_type_id_idx").on(table.achievementTypeId),
  };
});

export const achievementRewards = pgTable("achievement_rewards", {
  id: serial("id").primaryKey(),
  achievementTypeId: integer("achievement_type_id").references(() => achievementTypes.id).notNull(),
  rewardType: text("reward_type").notNull(), // badge, points, title, unlock_feature
  rewardValue: text("reward_value").notNull(), // specific reward content
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    achievementTypeIdIdx: index("achievement_rewards_type_id_idx").on(table.achievementTypeId),
  };
});

export const achievementProgress = pgTable("achievement_progress", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  achievementTypeId: integer("achievement_type_id").references(() => achievementTypes.id).notNull(),
  date: date("date").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(), // progress value for that day
  eventType: text("event_type").notNull(), // training_session, match, fitness_test, etc.
  eventId: integer("event_id"), // reference to specific event
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    playerIdIdx: index("achievement_progress_player_id_idx").on(table.playerId),
    achievementTypeIdIdx: index("achievement_progress_type_id_idx").on(table.achievementTypeId),
    dateIdx: index("achievement_progress_date_idx").on(table.date),
  };
});

// Player Invitations - Tokens for inviting players to self-register
export const playerInvitations = pgTable("player_invitations", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  email: text("email"), // optional: where the invite was sent
  invitedBy: integer("invited_by").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"), // null = not yet used
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    tokenIdx: index("player_invitations_token_idx").on(table.token),
    teamIdIdx: index("player_invitations_team_id_idx").on(table.teamId),
    invitedByIdx: index("player_invitations_invited_by_idx").on(table.invitedBy),
  };
});

// Keep this list shared by the employee invite UI and the API so an invite can
// never grant an arbitrary user role.
export const employeeRoles = [
  "head_coach",
  "assistant_coach",
  "fitness_coach",
  "goalkeeping_coach",
  "physiotherapist",
  "analyst",
  "kit_manager",
  "team_manager",
  "team_administrative",
  "team_admin_supervisor",
  "team_admin_director",
] as const;

export type EmployeeRole = (typeof employeeRoles)[number];

// Roles that belong in the restricted technical workspace. Operations roles
// deliberately remain on the manager side of the application.
export const technicalStaffRoles = [
  "head_coach",
  "assistant_coach",
  "fitness_coach",
  "goalkeeping_coach",
  "analyst",
  "physiotherapist",
] as const satisfies readonly EmployeeRole[];

export type TechnicalStaffRole = (typeof technicalStaffRoles)[number];

export function isTechnicalStaffRole(role: string | null | undefined): role is TechnicalStaffRole {
  return Boolean(role && (technicalStaffRoles as readonly string[]).includes(role));
}

// Roles that belong in the administrator workspace.
export const adminRoles = [
  "team_admin_supervisor",
  "team_admin_director",
] as const satisfies readonly EmployeeRole[];

export type AdminRole = (typeof adminRoles)[number];

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  // Also includes the legacy 'admin' role
  return Boolean(role && ((adminRoles as readonly string[]).includes(role) || role === "admin"));
}

// Employee Invitations - Tokens for inviting staff accounts with a fixed role
export const employeeInvitations = pgTable("employee_invitations", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  role: text("role").$type<EmployeeRole>().notNull(),
  teamId: integer("team_id").references(() => teams.id),
  email: text("email"),
  invitedBy: integer("invited_by").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    tokenIdx: index("employee_invitations_token_idx").on(table.token),
    invitedByIdx: index("employee_invitations_invited_by_idx").on(table.invitedBy),
  };
});

export const registrationReminders = pgTable("registration_reminders", {
  id: serial("id").primaryKey(),
  targetUserId: integer("target_user_id").references(() => users.id).notNull(),
  sentBy: integer("sent_by").references(() => users.id).notNull(),
  missingFields: jsonb("missing_fields").$type<string[]>().notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  targetUserIdIdx: index("registration_reminders_target_user_id_idx").on(table.targetUserId),
  sentByIdx: index("registration_reminders_sent_by_idx").on(table.sentBy),
}));

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

export const insertTeamStaffSchema = createInsertSchema(teamStaff).omit({
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

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
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

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
});

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

export const insertAnalyticsReportSchema = createInsertSchema(analyticsReports).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertPerformanceReactionSchema = createInsertSchema(performanceReactions).omit({
  id: true,
  createdAt: true,
});

// Terra-style insert schemas
export const insertTerraDeviceProviderSchema = createInsertSchema(terraDeviceProviders).omit({
  id: true,
  createdAt: true,
});

export const insertTerraUserSchema = createInsertSchema(terraUsers).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertTerraActivityDataSchema = createInsertSchema(terraActivityData).omit({
  id: true,
  createdAt: true,
});

export const insertTerraSleepDataSchema = createInsertSchema(terraSleepData).omit({
  id: true,
  createdAt: true,
});

export const insertTerraBodyDataSchema = createInsertSchema(terraBodyData).omit({
  id: true,
  createdAt: true,
});

export const insertTerraDailyDataSchema = createInsertSchema(terraDailyData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTerraWebhookLogSchema = createInsertSchema(terraWebhookLogs).omit({
  id: true,
  createdAt: true,
});

export const insertInjurySchema = createInsertSchema(injuries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInjuryTreatmentLogSchema = createInsertSchema(injuryTreatmentLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAnnualBudgetSchema = createInsertSchema(annualBudgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyBudgetSchema = createInsertSchema(monthlyBudgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
});

export const insertPlayerContractSchema = createInsertSchema(playerContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTacticalBoardSchema = createInsertSchema(tacticalBoards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAchievementTypeSchema = createInsertSchema(achievementTypes).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementCriteriaSchema = createInsertSchema(achievementCriteria).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerAchievementSchema = createInsertSchema(playerAchievements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAchievementRewardSchema = createInsertSchema(achievementRewards).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementProgressSchema = createInsertSchema(achievementProgress).omit({
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

export type InsertTeamStaff = z.infer<typeof insertTeamStaffSchema>;
export type TeamStaff = typeof teamStaff.$inferSelect;

export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type TrainingSession = typeof trainingSessions.$inferSelect;

export type InsertSessionAttendance = z.infer<typeof insertSessionAttendanceSchema>;
export type SessionAttendance = typeof sessionAttendance.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

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

export type InsertInjury = z.infer<typeof insertInjurySchema>;
export type Injury = typeof injuries.$inferSelect;

export type InsertInjuryTreatmentLog = z.infer<typeof insertInjuryTreatmentLogSchema>;
export type InjuryTreatmentLog = typeof injuryTreatmentLogs.$inferSelect;

// An injury enriched with the player and squad it belongs to, which is what
// every injury screen actually renders.
export type InjuryWithPlayer = Injury & {
  playerName: string;
  teamName: string;
  teamId: number | null;
  treatmentCount: number;
  latestTreatment: { date: string; treatmentType: string } | null;
};

export type InsertAnnualBudget = z.infer<typeof insertAnnualBudgetSchema>;
export type AnnualBudget = typeof annualBudgets.$inferSelect;

export type InsertMonthlyBudget = z.infer<typeof insertMonthlyBudgetSchema>;
export type MonthlyBudget = typeof monthlyBudgets.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export type InsertPlayerContract = z.infer<typeof insertPlayerContractSchema>;
export type PlayerContract = typeof playerContracts.$inferSelect;

export type InsertTacticalBoard = z.infer<typeof insertTacticalBoardSchema>;
export type TacticalBoard = typeof tacticalBoards.$inferSelect;

export type InsertPerformanceReaction = z.infer<typeof insertPerformanceReactionSchema>;
export type PerformanceReaction = typeof performanceReactions.$inferSelect;

// Wearable Devices - For tracking connected fitness devices
export const wearableDevices = pgTable("wearable_devices", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  deviceType: text("device_type").notNull(), // fitbit, apple_watch, garmin, polar, etc.
  deviceModel: text("device_model").notNull(),
  deviceId: text("device_id").notNull().unique(), // unique device identifier
  authToken: text("auth_token"), // encrypted auth token for device API
  lastSyncAt: timestamp("last_sync_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    playerIdIdx: index("wearable_devices_player_id_idx").on(table.playerId),
    activeIdx: index("wearable_devices_is_active_idx").on(table.isActive),
  };
});

// Wearable Data - Raw data from wearable devices
export const wearableData = pgTable("wearable_data", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => wearableDevices.id).notNull(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  dataType: text("data_type").notNull(), // heart_rate, steps, calories, sleep, distance, etc.
  value: text("value").notNull(), // JSON string for complex data or simple value
  unit: text("unit"), // bpm, steps, calories, minutes, km, etc.
  timestamp: timestamp("timestamp").notNull(), // when the data was recorded
  sessionId: integer("session_id").references(() => trainingSessions.id), // link to training session if applicable
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    deviceIdIdx: index("wearable_data_device_id_idx").on(table.deviceId),
    playerIdIdx: index("wearable_data_player_id_idx").on(table.playerId),
    dataTypeIdx: index("wearable_data_data_type_idx").on(table.dataType),
    timestampIdx: index("wearable_data_timestamp_idx").on(table.timestamp),
  };
});

// Performance Metrics - Processed analytics from wearable data
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  metricType: text("metric_type").notNull(), // daily_activity, workout_intensity, recovery_score, etc.
  date: text("date").notNull(), // YYYY-MM-DD format
  value: integer("value").notNull(),
  additionalData: jsonb("additional_data"), // any extra metrics as JSON
  sessionId: integer("session_id").references(() => trainingSessions.id), // link to training session
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    playerMetricDateIdx: index("performance_metrics_player_metric_date_idx").on(table.playerId, table.metricType, table.date),
    playerIdIdx: index("performance_metrics_player_id_idx").on(table.playerId),
    sessionIdIdx: index("performance_metrics_session_id_idx").on(table.sessionId),
  };
});

export const insertWearableDeviceSchema = createInsertSchema(wearableDevices).omit({
  id: true,
  createdAt: true,
});

export const insertWearableDataSchema = createInsertSchema(wearableData).omit({
  id: true,
  createdAt: true,
});

export const insertPerformanceMetricsSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  createdAt: true,
});

export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;

export type InsertWearableDevice = z.infer<typeof insertWearableDeviceSchema>;
export type WearableDevice = typeof wearableDevices.$inferSelect;

export type InsertWearableData = z.infer<typeof insertWearableDataSchema>;
export type WearableData = typeof wearableData.$inferSelect;

export type InsertPerformanceMetrics = z.infer<typeof insertPerformanceMetricsSchema>;
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;

// Terra-style types
export type InsertTerraDeviceProvider = z.infer<typeof insertTerraDeviceProviderSchema>;
export type TerraDeviceProvider = typeof terraDeviceProviders.$inferSelect;

export type InsertTerraUser = z.infer<typeof insertTerraUserSchema>;
export type TerraUser = typeof terraUsers.$inferSelect;

export type InsertTerraActivityData = z.infer<typeof insertTerraActivityDataSchema>;
export type TerraActivityData = typeof terraActivityData.$inferSelect;

export type InsertTerraSleepData = z.infer<typeof insertTerraSleepDataSchema>;
export type TerraSleepData = typeof terraSleepData.$inferSelect;

export type InsertTerraBodyData = z.infer<typeof insertTerraBodyDataSchema>;
export type TerraBodyData = typeof terraBodyData.$inferSelect;

export type InsertTerraDailyData = z.infer<typeof insertTerraDailyDataSchema>;
export type TerraDailyData = typeof terraDailyData.$inferSelect;

export type InsertTerraWebhookLog = z.infer<typeof insertTerraWebhookLogSchema>;
export type TerraWebhookLog = typeof terraWebhookLogs.$inferSelect;

// Achievement system types
export type InsertAchievementType = z.infer<typeof insertAchievementTypeSchema>;
export type AchievementType = typeof achievementTypes.$inferSelect;

export type InsertAchievementCriteria = z.infer<typeof insertAchievementCriteriaSchema>;
export type AchievementCriteria = typeof achievementCriteria.$inferSelect;

export type InsertPlayerAchievement = z.infer<typeof insertPlayerAchievementSchema>;
export type PlayerAchievement = typeof playerAchievements.$inferSelect;

export type InsertAchievementReward = z.infer<typeof insertAchievementRewardSchema>;
export type AchievementReward = typeof achievementRewards.$inferSelect;

export type InsertAchievementProgress = z.infer<typeof insertAchievementProgressSchema>;
export type AchievementProgress = typeof achievementProgress.$inferSelect;

// Player Invitation insert schema and types
export const insertPlayerInvitationSchema = createInsertSchema(playerInvitations).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export type InsertPlayerInvitation = z.infer<typeof insertPlayerInvitationSchema>;
export type PlayerInvitation = typeof playerInvitations.$inferSelect;

export const insertEmployeeInvitationSchema = createInsertSchema(employeeInvitations, {
  role: z.enum(employeeRoles),
}).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export type InsertEmployeeInvitation = z.infer<typeof insertEmployeeInvitationSchema>;
export type EmployeeInvitation = typeof employeeInvitations.$inferSelect;

export const insertRegistrationReminderSchema = createInsertSchema(registrationReminders, {
  missingFields: z.array(z.string()),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertRegistrationReminder = z.infer<typeof insertRegistrationReminderSchema>;
export type RegistrationReminder = typeof registrationReminders.$inferSelect;
