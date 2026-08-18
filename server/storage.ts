import {
  users, players, teams, teamPlayers, teamStaff, trainingSessions, sessionAttendance,
  tacticalFormations, playerStats, staff, matches, matchSquads, meetings, analyticsReports, systemSettings,
  notifications,
  wearableDevices, wearableData, performanceMetrics, monthlyBudgets, expenses, playerContracts,
  performanceReactions, annualBudgets,
  tacticalBoards, playerInvitations, employeeInvitations, registrationReminders,
  injuries, injuryTreatmentLogs,
  type User, type InsertUser, type Player, type InsertPlayer,
  type Team, type InsertTeam, type TeamPlayer, type InsertTeamPlayer,
  type TeamStaff, type InsertTeamStaff,
  type TrainingSession, type InsertTrainingSession,
  type SessionAttendance, type InsertSessionAttendance,
  type TacticalFormation, type InsertTacticalFormation,
  type PlayerStats, type InsertPlayerStats,
  type Staff, type InsertStaff, type Match, type InsertMatch,
  type MatchSquad, type InsertMatchSquad, type Meeting, type InsertMeeting,
  type AnalyticsReport, type InsertAnalyticsReport,
  type SystemSettings, type InsertSystemSettings,
  type WearableDevice, type InsertWearableDevice,
  type WearableData, type InsertWearableData,
  type PerformanceMetrics, type InsertPerformanceMetrics,
  type MonthlyBudget, type InsertMonthlyBudget,
  type Expense, type InsertExpense,
  type PlayerContract, type InsertPlayerContract,
  type PerformanceReaction, type InsertPerformanceReaction,
  type TacticalBoard, type InsertTacticalBoard,
  type AnnualBudget, type InsertAnnualBudget,
  type PlayerInvitation, type InsertPlayerInvitation,
  type EmployeeInvitation, type InsertEmployeeInvitation,
  type RegistrationReminder, type InsertRegistrationReminder,
  type Notification, type InsertNotification,
  type Injury, type InsertInjury, type InjuryWithPlayer,
  type InjuryTreatmentLog, type InsertInjuryTreatmentLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  // organizationId omitted only for platform-wide uniqueness checks (login, signup) —
  // every other caller must scope. See tenancy-migration-plan.md decision #4/#5.
  getUsers(organizationId?: number): Promise<User[]>;
  // Trusted-id lookup only: session bootstrap or a self-reference. Never call with an id
  // taken from route params/body that could belong to another organization.
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser, organizationId: number): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>, organizationId: number): Promise<User | undefined>;
  deleteUser(id: number, organizationId: number): Promise<boolean>;

  // Players
  getPlayers(organizationId: number): Promise<Player[]>;
  getPlayer(id: number, organizationId: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer, organizationId: number): Promise<Player>;
  updatePlayer(id: number, player: Partial<InsertPlayer>, organizationId: number): Promise<Player | undefined>;
  deletePlayer(id: number, organizationId: number): Promise<boolean>;

  // Teams
  getTeams(organizationId: number): Promise<Team[]>;
  getTeam(id: number, organizationId: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam, organizationId: number): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>, organizationId: number): Promise<Team | undefined>;
  deleteTeam(id: number, organizationId: number): Promise<boolean>;

  // Team Players
  getTeamPlayers(teamId: number): Promise<(TeamPlayer & { player: Player })[]>;
  addPlayerToTeam(teamPlayer: InsertTeamPlayer): Promise<TeamPlayer>;
  removePlayerFromTeam(teamId: number, playerId: number): Promise<boolean>;

  // Team Staff
  getTeamStaff(teamId: number): Promise<(TeamStaff & { staff: Staff })[]>;
  getStaffTeams(staffId: number): Promise<(TeamStaff & { team: Team })[]>;
  addStaffToTeam(teamStaff: InsertTeamStaff): Promise<TeamStaff>;
  removeStaffFromTeam(teamId: number, staffId: number): Promise<boolean>;
  getPlayerTeams(playerId: number): Promise<(TeamPlayer & { team: Team })[]>;

  // Notifications
  getNotificationsForUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number, userId: number): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: number): Promise<void>;

  // Training Sessions
  getTrainingSessions(organizationId: number): Promise<TrainingSession[]>;
  getTrainingSession(id: number, organizationId: number): Promise<TrainingSession | undefined>;
  createTrainingSession(session: InsertTrainingSession, organizationId: number): Promise<TrainingSession>;
  updateTrainingSession(id: number, session: Partial<InsertTrainingSession>, organizationId: number): Promise<TrainingSession | undefined>;
  deleteTrainingSession(id: number, organizationId: number): Promise<boolean>;

  // Session Attendance
  getSessionAttendance(sessionId: number): Promise<(SessionAttendance & { player: Player })[]>;
  markAttendance(attendance: InsertSessionAttendance): Promise<SessionAttendance>;
  updateAttendance(id: number, attendance: Partial<InsertSessionAttendance>): Promise<SessionAttendance | undefined>;

  // Tactical Formations
  getFormations(teamId: number, organizationId: number): Promise<TacticalFormation[]>;
  createFormation(formation: InsertTacticalFormation, organizationId: number): Promise<TacticalFormation>;
  updateFormation(id: number, formation: Partial<InsertTacticalFormation>, organizationId: number): Promise<TacticalFormation | undefined>;
  deleteFormation(id: number, organizationId: number): Promise<boolean>;

  // Player Stats
  getPlayerStats(playerId: number): Promise<PlayerStats[]>;
  getAllPlayerStats(): Promise<PlayerStats[]>;
  createPlayerStats(stats: InsertPlayerStats): Promise<PlayerStats>;
  updatePlayerStats(id: number, stats: Partial<InsertPlayerStats>): Promise<PlayerStats | undefined>;

  // Staff
  getStaff(organizationId: number): Promise<Staff[]>;
  getStaffMember(id: number, organizationId: number): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff, organizationId: number): Promise<Staff>;
  updateStaff(id: number, staff: Partial<InsertStaff>, organizationId: number): Promise<Staff | undefined>;
  deleteStaff(id: number, organizationId: number): Promise<boolean>;

  // Matches
  getMatches(organizationId: number): Promise<Match[]>;
  getMatch(id: number, organizationId: number): Promise<Match | undefined>;
  createMatch(match: InsertMatch, organizationId: number): Promise<Match>;
  updateMatch(id: number, match: Partial<InsertMatch>, organizationId: number): Promise<Match | undefined>;
  deleteMatch(id: number, organizationId: number): Promise<boolean>;

  // Match Squads
  getMatchSquad(matchId: number): Promise<(MatchSquad & { player: Player })[]>;
  addPlayerToMatchSquad(matchSquad: InsertMatchSquad): Promise<MatchSquad>;
  updateMatchSquad(id: number, matchSquad: Partial<InsertMatchSquad>): Promise<MatchSquad | undefined>;
  removePlayerFromMatchSquad(matchId: number, playerId: number): Promise<boolean>;
  deleteMatchSquad(id: number): Promise<boolean>;

  // Meetings
  getMeetings(organizationId: number): Promise<Meeting[]>;
  getMeeting(id: number, organizationId: number): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting, organizationId: number): Promise<Meeting>;
  updateMeeting(id: number, meeting: Partial<InsertMeeting>, organizationId: number): Promise<Meeting | undefined>;
  deleteMeeting(id: number, organizationId: number): Promise<boolean>;

  // Analytics Reports
  getAnalyticsReports(organizationId: number): Promise<AnalyticsReport[]>;
  getAnalyticsReport(id: number, organizationId: number): Promise<AnalyticsReport | undefined>;
  createAnalyticsReport(report: InsertAnalyticsReport, organizationId: number): Promise<AnalyticsReport>;
  updateAnalyticsReport(id: number, report: Partial<InsertAnalyticsReport>, organizationId: number): Promise<AnalyticsReport | undefined>;
  deleteAnalyticsReport(id: number, organizationId: number): Promise<boolean>;

  // System Settings
  getSystemSettings(organizationId: number): Promise<SystemSettings[]>;
  getSystemSetting(id: number, organizationId: number): Promise<SystemSettings | undefined>;
  createSystemSetting(setting: InsertSystemSettings, organizationId: number): Promise<SystemSettings>;
  updateSystemSetting(id: number, setting: Partial<InsertSystemSettings>, organizationId: number): Promise<SystemSettings | undefined>;

  // Wearable Devices
  getWearableDevices(organizationId: number, playerId?: number): Promise<WearableDevice[]>;
  getWearableDevice(id: number, organizationId: number): Promise<WearableDevice | undefined>;
  createWearableDevice(device: InsertWearableDevice, organizationId: number): Promise<WearableDevice>;
  updateWearableDevice(id: number, device: Partial<InsertWearableDevice>, organizationId: number): Promise<WearableDevice | undefined>;
  deleteWearableDevice(id: number, organizationId: number): Promise<boolean>;

  // Wearable Data
  getWearableData(deviceId?: number, playerId?: number, dataType?: string): Promise<WearableData[]>;
  createWearableData(data: InsertWearableData): Promise<WearableData>;
  getLatestWearableData(playerId: number, dataType: string): Promise<WearableData | undefined>;

  // Performance Metrics
  getPerformanceMetrics(playerId?: number, metricType?: string): Promise<PerformanceMetrics[]>;
  createPerformanceMetrics(metrics: InsertPerformanceMetrics): Promise<PerformanceMetrics>;
  getPlayerPerformanceTrends(playerId: number, days: number): Promise<PerformanceMetrics[]>;

  // Injuries
  getInjuries(organizationId: number): Promise<InjuryWithPlayer[]>;
  getInjury(id: number, organizationId: number): Promise<InjuryWithPlayer | undefined>;
  createInjury(injury: InsertInjury, organizationId: number): Promise<Injury>;
  updateInjury(id: number, injury: Partial<InsertInjury>, organizationId: number): Promise<Injury | undefined>;
  deleteInjury(id: number, organizationId: number): Promise<boolean>;
  // Child table, scoped indirectly via the parent injury — callers must resolve/verify
  // the injury with getInjury(id, organizationId) first.
  getInjuryTreatmentLogs(injuryId: number): Promise<InjuryTreatmentLog[]>;
  createInjuryTreatmentLog(log: InsertInjuryTreatmentLog): Promise<InjuryTreatmentLog>;
  // Deleted by its own id (no parent injuryId available at the call site), so this one
  // does carry an explicit organizationId, enforced via a join back to injuries.
  deleteInjuryTreatmentLog(id: number, organizationId: number): Promise<boolean>;

  // Annual Budget Management
  getAnnualBudgets(organizationId: number): Promise<AnnualBudget[]>;
  getAnnualBudget(id: number, organizationId: number): Promise<AnnualBudget | undefined>;
  getAnnualBudgetByYear(fiscalYear: string, organizationId: number): Promise<AnnualBudget | undefined>;
  createAnnualBudget(budget: InsertAnnualBudget, organizationId: number): Promise<AnnualBudget>;

  // Budget Management
  getMonthlyBudgets(organizationId: number): Promise<MonthlyBudget[]>;
  getMonthlyBudget(id: number, organizationId: number): Promise<MonthlyBudget | undefined>;
  getMonthlyBudgetByMonth(month: string, organizationId: number): Promise<MonthlyBudget | undefined>;
  createMonthlyBudget(budget: InsertMonthlyBudget, organizationId: number): Promise<MonthlyBudget>;
  updateMonthlyBudget(id: number, budget: Partial<InsertMonthlyBudget>, organizationId: number): Promise<MonthlyBudget | undefined>;
  deleteMonthlyBudget(id: number, organizationId: number): Promise<boolean>;

  // Expense Management
  getExpenses(organizationId: number, budgetId?: number): Promise<Expense[]>;
  getExpense(id: number, organizationId: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense, organizationId: number): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>, organizationId: number): Promise<Expense | undefined>;
  deleteExpense(id: number, organizationId: number): Promise<boolean>;
  approveExpense(id: number, approvedBy: number, organizationId: number): Promise<Expense | undefined>;

  // Player Contracts
  getPlayerContracts(organizationId: number, playerId?: number): Promise<PlayerContract[]>;
  getPlayerContract(id: number, organizationId: number): Promise<PlayerContract | undefined>;
  createPlayerContract(contract: InsertPlayerContract, organizationId: number): Promise<PlayerContract>;
  updatePlayerContract(id: number, contract: Partial<InsertPlayerContract>, organizationId: number): Promise<PlayerContract | undefined>;
  deletePlayerContract(id: number, organizationId: number): Promise<boolean>;

  // Budget Summary Methods
  getTotalMonthlySalaries(month: string, organizationId: number): Promise<{ staff: number; players: number; total: number }>;
  getBudgetVsActualExpenses(budgetId: number, organizationId: number): Promise<{ budgeted: number; actual: number; remaining: number; categories: any[] }>;
  getPayrollDetails(month: string, organizationId: number): Promise<{ staff: Array<any>; players: Array<any> }>;
  getMonthlyBudgetBreakdown(budgetId: number, organizationId: number): Promise<Array<any>>;


  // Performance Reactions
  getPerformanceReactions(playerId?: number, performanceType?: string): Promise<PerformanceReaction[]>;
  getPlayerReactionsSummary(playerId: number): Promise<any>;
  createPerformanceReaction(reaction: InsertPerformanceReaction): Promise<PerformanceReaction>;
  deletePerformanceReaction(id: number): Promise<boolean>;

  // Tactical Boards
  getTacticalBoards(organizationId: number): Promise<TacticalBoard[]>;
  getTacticalBoard(id: number, organizationId: number): Promise<TacticalBoard | undefined>;
  createTacticalBoard(board: InsertTacticalBoard, organizationId: number): Promise<TacticalBoard>;
  updateTacticalBoard(id: number, board: Partial<InsertTacticalBoard>, organizationId: number): Promise<TacticalBoard | undefined>;
  deleteTacticalBoard(id: number, organizationId: number): Promise<boolean>;

  // Achievement System
  getAchievements(organizationId: number): Promise<any[]>;
  getPlayerAchievements(playerId: number, organizationId: number): Promise<any[]>;
  updateAchievementProgress(playerId: number, achievementTypeId: number, value: number, eventType: string, organizationId: number, eventId?: number): Promise<any>;
  getAchievementLeaderboard(organizationId: number): Promise<any[]>;
  initializePlayerAchievements(organizationId: number): Promise<any>;

  // Player Invitations
  // organizationId omitted only on the token lookup — invitation acceptance is
  // pre-auth, so the token itself (not the session) is the security boundary.
  getPlayerInvitations(organizationId: number): Promise<(PlayerInvitation & { team?: Team })[]>;
  getPlayerInvitation(id: number, organizationId: number): Promise<PlayerInvitation | undefined>;
  getPlayerInvitationByToken(token: string): Promise<(PlayerInvitation & { team?: Team }) | undefined>;
  createPlayerInvitation(invitation: InsertPlayerInvitation, organizationId: number): Promise<PlayerInvitation>;
  updatePlayerInvitation(id: number, invitation: Partial<InsertPlayerInvitation> & { usedAt?: Date | null }, organizationId: number): Promise<PlayerInvitation | undefined>;
  deletePlayerInvitation(id: number, organizationId: number): Promise<boolean>;

  // Employee Invitations
  getEmployeeInvitationByToken(token: string): Promise<EmployeeInvitation | undefined>;
  createEmployeeInvitation(invitation: InsertEmployeeInvitation, organizationId: number): Promise<EmployeeInvitation>;
  updateEmployeeInvitation(id: number, invitation: Partial<InsertEmployeeInvitation> & { usedAt?: Date | null }, organizationId: number): Promise<EmployeeInvitation | undefined>;

  // Registration Reminders
  getRegistrationRemindersForUser(userId: number): Promise<RegistrationReminder[]>;
  createRegistrationReminder(reminder: InsertRegistrationReminder): Promise<RegistrationReminder>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private players: Map<number, Player>;
  private teams: Map<number, Team>;
  private teamPlayers: Map<number, TeamPlayer>;
  private teamStaff: Map<number, TeamStaff>;
  private trainingSessions: Map<number, TrainingSession>;
  private sessionAttendance: Map<number, SessionAttendance>;
  private tacticalFormations: Map<number, TacticalFormation>;
  private playerStats: Map<number, PlayerStats>;
  private staff: Map<number, Staff>;
  private matches: Map<number, Match>;
  private matchSquads: Map<number, MatchSquad>;
  private playerInvitations: Map<number, PlayerInvitation>;
  private employeeInvitations: Map<number, EmployeeInvitation>;
  private registrationReminders: Map<number, RegistrationReminder>;
  private meetings: Map<number, Meeting>;
  private analyticsReports: Map<number, AnalyticsReport>;
  private systemSettings: Map<number, SystemSettings>;
  private annualBudgets: Map<number, AnnualBudget>;
  private monthlyBudgets: Map<number, MonthlyBudget>;
  private expenses: Map<number, Expense>;
  private notifications: Map<number, Notification>;
  private currentIds: Record<string, number>;

  constructor() {
    this.users = new Map();
    this.players = new Map();
    this.teams = new Map();
    this.teamPlayers = new Map();
    this.teamStaff = new Map();
    this.trainingSessions = new Map();
    this.sessionAttendance = new Map();
    this.tacticalFormations = new Map();
    this.playerStats = new Map();
    this.staff = new Map();
    this.matches = new Map();
    this.matchSquads = new Map();
    this.playerInvitations = new Map();
    this.employeeInvitations = new Map();
    this.registrationReminders = new Map();
    this.meetings = new Map();
    this.analyticsReports = new Map();
    this.systemSettings = new Map();
    this.annualBudgets = new Map();
    this.monthlyBudgets = new Map();
    this.expenses = new Map();
    this.notifications = new Map();
    this.currentIds = {
      users: 1,
      players: 1,
      teams: 1,
      teamPlayers: 1,
      teamStaff: 1,
      trainingSessions: 1,
      sessionAttendance: 1,
      tacticalFormations: 1,
      playerStats: 1,
      staff: 1,
      matches: 1,
      matchSquads: 1,
      playerInvitations: 1,
      employeeInvitations: 1,
      registrationReminders: 1,
      meetings: 1,
      analyticsReports: 1,
      systemSettings: 1,
      annualBudgets: 1,
      monthlyBudgets: 1,
      expenses: 1,
      notifications: 1,
    };

    this.seedData();
  }

  private seedData() {
    const adminUsername = process.env.SEED_ADMIN_USERNAME || "admin";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@procoach.local";

    // Create default admin user
    const admin: User = {
      organizationId: 1,
      id: this.currentIds.users++,
      username: adminUsername,
      password: adminPassword,
      role: "club_super_admin",
      firstName: "System",
      lastName: "Admin",
      email: adminEmail,
      phoneNumber: null,
      avatar: null,
      createdAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Create default coach user
    const coach: User = {
      organizationId: 1,
      id: this.currentIds.users++,
      username: "coach",
      password: "password",
      role: "head_coach",
      firstName: "Marcus",
      lastName: "Thompson",
      email: "marcus.thompson@procoach.com",
      phoneNumber: null,
      avatar: null,
      createdAt: new Date(),
    };
    this.users.set(coach.id, coach);

    // Create default team
    const firstTeam: Team = {
      organizationId: 1,
      id: this.currentIds.teams++,
      name: "First Team",
      category: "first_team",
      description: "Senior squad",
      isActive: true,
      createdAt: new Date(),
    };
    this.teams.set(firstTeam.id, firstTeam);

    // Create sample players
    const samplePlayers = [
      { firstName: "Alex", lastName: "Johnson", position: "midfielder", shirtNumber: 10 },
      { firstName: "Michael", lastName: "Roberts", position: "goalkeeper", shirtNumber: 1 },
      { firstName: "David", lastName: "Chen", position: "midfielder", shirtNumber: 8 },
      { firstName: "Sarah", lastName: "Wilson", position: "midfielder", shirtNumber: 7 },
      { firstName: "James", lastName: "Martinez", position: "forward", shirtNumber: 9 },
    ];

    samplePlayers.forEach((playerData) => {
      const player: Player = {
        organizationId: 1,
        id: this.currentIds.players++,
        ...playerData,
        firstNameAr: null,
        lastNameAr: null,
        dateOfBirth: "1995-01-01",
        nationality: "USA",
        isActive: true,
        height: 180,
        weight: 75,
        phoneNumber: null,
        email: null,
        emergencyContact: null,
        medicalNotes: null,
        idNumber: null,
        passportNumber: null,
        passportIssueDate: null,
        passportExpiryDate: null,
        profilePicture: null,
        idDocument: null,
        contractDocument: null,
        contractStartDate: null,
        contractEndDate: null,
        monthlySalary: null,
        createdAt: new Date(),
      };
      this.players.set(player.id, player);

      // Add to first team
      const teamPlayer: TeamPlayer = {
        id: this.currentIds.teamPlayers++,
        teamId: firstTeam.id,
        playerId: player.id,
        isStarter: true,
        createdAt: new Date(),
      };
      this.teamPlayers.set(teamPlayer.id, teamPlayer);
    });

    // Create default system settings
    const clubNameSetting: SystemSettings = {
      organizationId: 1,
      id: this.currentIds.systemSettings++,
      category: "general",
      settingKey: "clubName",
      settingValue: process.env.CLUB_NAME || "Um alhassam Club",
      description: "The name of the club",
      isActive: true,
      updatedBy: admin.id,
      updatedAt: new Date(),
    };
    this.systemSettings.set(clubNameSetting.id, clubNameSetting);
  }

  // Users
  async getUsers(organizationId?: number): Promise<User[]> {
    const all = Array.from(this.users.values());
    return organizationId === undefined ? all : all.filter(u => u.organizationId === organizationId);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser, organizationId: number): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = {
      organizationId,
      id,
      username: insertUser.username,
      password: insertUser.password,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      email: insertUser.email,
      role: insertUser.role ?? "assistant",
      phoneNumber: insertUser.phoneNumber ?? null,
      avatar: insertUser.avatar ?? null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>, organizationId: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user || user.organizationId !== organizationId) return undefined;

    const updatedUser: User = {
      ...user,
      ...updateData,
      role: updateData.role ?? user.role
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number, organizationId: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user || user.organizationId !== organizationId) return false;
    return this.users.delete(id);
  }

  // Players
  async getPlayers(organizationId: number): Promise<Player[]> {
    return Array.from(this.players.values()).filter(p => p.isActive && p.organizationId === organizationId);
  }

  async getPlayer(id: number, organizationId: number): Promise<Player | undefined> {
    const player = this.players.get(id);
    return player && player.organizationId === organizationId ? player : undefined;
  }

  async createPlayer(insertPlayer: InsertPlayer, organizationId: number): Promise<Player> {
    const id = this.currentIds.players++;
    const player: Player = {
      organizationId,
      id,
      firstName: insertPlayer.firstName,
      lastName: insertPlayer.lastName,
      firstNameAr: insertPlayer.firstNameAr ?? null,
      lastNameAr: insertPlayer.lastNameAr ?? null,
      position: insertPlayer.position,
      dateOfBirth: insertPlayer.dateOfBirth,
      nationality: insertPlayer.nationality,
      shirtNumber: insertPlayer.shirtNumber ?? null,
      height: insertPlayer.height ?? null,
      weight: insertPlayer.weight ?? null,
      phoneNumber: insertPlayer.phoneNumber ?? null,
      email: insertPlayer.email ?? null,
      emergencyContact: insertPlayer.emergencyContact ?? null,
      idNumber: insertPlayer.idNumber ?? null,
      passportNumber: insertPlayer.passportNumber ?? null,
      passportIssueDate: insertPlayer.passportIssueDate ?? null,
      passportExpiryDate: insertPlayer.passportExpiryDate ?? null,
      medicalNotes: insertPlayer.medicalNotes ?? null,
      profilePicture: insertPlayer.profilePicture ?? null,
      idDocument: insertPlayer.idDocument ?? null,
      contractDocument: insertPlayer.contractDocument ?? null,
      contractStartDate: insertPlayer.contractStartDate ?? null,
      contractEndDate: insertPlayer.contractEndDate ?? null,
      monthlySalary: insertPlayer.monthlySalary ?? null,
      isActive: insertPlayer.isActive ?? true,
      createdAt: new Date()
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: number, updateData: Partial<InsertPlayer>, organizationId: number): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player || player.organizationId !== organizationId) return undefined;

    const updatedPlayer = { ...player, ...updateData };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  async deletePlayer(id: number, organizationId: number): Promise<boolean> {
    const player = this.players.get(id);
    if (!player || player.organizationId !== organizationId) return false;

    const updatedPlayer = { ...player, isActive: false };
    this.players.set(id, updatedPlayer);
    return true;
  }

  // Teams
  async getTeams(organizationId: number): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(t => t.isActive && t.organizationId === organizationId);
  }

  async getTeam(id: number, organizationId: number): Promise<Team | undefined> {
    const team = this.teams.get(id);
    return team && team.organizationId === organizationId ? team : undefined;
  }

  async createTeam(insertTeam: InsertTeam, organizationId: number): Promise<Team> {
    const id = this.currentIds.teams++;
    const team: Team = {
      ...insertTeam, // Spread first
      organizationId,
      id,
      description: insertTeam.description ?? null, // Override potential undefined
      isActive: insertTeam.isActive ?? true, // Override potential undefined
      createdAt: new Date()
    };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: number, updateData: Partial<InsertTeam>, organizationId: number): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team || team.organizationId !== organizationId) return undefined;

    const updatedTeam = {
      ...team,
      ...updateData,
      description: updateData.description ?? team.description,
      isActive: updateData.isActive ?? team.isActive
    };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: number, organizationId: number): Promise<boolean> {
    const team = this.teams.get(id);
    if (!team || team.organizationId !== organizationId) return false;

    const updatedTeam = { ...team, isActive: false };
    this.teams.set(id, updatedTeam);
    return true;
  }

  // Team Players
  async getTeamPlayers(teamId: number): Promise<(TeamPlayer & { player: Player })[]> {
    const teamPlayers = Array.from(this.teamPlayers.values())
      .filter(tp => tp.teamId === teamId);

    return teamPlayers.map(tp => {
      const player = this.players.get(tp.playerId);
      return { ...tp, player: player! };
    }).filter(tp => tp.player?.isActive);
  }

  async addPlayerToTeam(insertTeamPlayer: InsertTeamPlayer): Promise<TeamPlayer> {
    // Check if player is already on the team
    const existingAssignment = Array.from(this.teamPlayers.values())
      .find(tp => tp.teamId === insertTeamPlayer.teamId && tp.playerId === insertTeamPlayer.playerId);

    if (existingAssignment) {
      throw new Error("Player is already assigned to this team");
    }

    const id = this.currentIds.teamPlayers++;
    const teamPlayer: TeamPlayer = {
      ...insertTeamPlayer,
      id,
      isStarter: insertTeamPlayer.isStarter ?? false,
      createdAt: new Date()
    };
    this.teamPlayers.set(id, teamPlayer);
    return teamPlayer;
  }

  async removePlayerFromTeam(teamId: number, playerId: number): Promise<boolean> {
    const teamPlayer = Array.from(this.teamPlayers.values())
      .find(tp => tp.teamId === teamId && tp.playerId === playerId);

    if (!teamPlayer) return false;

    this.teamPlayers.delete(teamPlayer.id);
    return true;
  }

  // Team Staff
  async getTeamStaff(teamId: number): Promise<(TeamStaff & { staff: Staff })[]> {
    return Array.from(this.teamStaff.values())
      .filter(ts => ts.teamId === teamId)
      .map(ts => {
        const staff = this.staff.get(ts.staffId);
        return { ...ts, staff: staff! };
      }).filter(ts => ts.staff?.isActive);
  }

  async getStaffTeams(staffId: number): Promise<(TeamStaff & { team: Team })[]> {
    return Array.from(this.teamStaff.values())
      .filter(ts => ts.staffId === staffId)
      .map(ts => {
        const team = this.teams.get(ts.teamId);
        return { ...ts, team: team! };
      })
      .filter(ts => ts.team?.isActive);
  }

  async addStaffToTeam(insertTeamStaff: InsertTeamStaff): Promise<TeamStaff> {
    // Check if staff is already on the team
    const existingAssignment = Array.from(this.teamStaff.values())
      .find(ts => ts.teamId === insertTeamStaff.teamId && ts.staffId === insertTeamStaff.staffId);

    if (existingAssignment) {
      throw new Error("Staff member is already assigned to this team");
    }

    const id = this.currentIds.teamStaff++;
    const teamStaff: TeamStaff = {
      ...insertTeamStaff,
      id,
      createdAt: new Date()
    };
    this.teamStaff.set(id, teamStaff);
    return teamStaff;
  }

  async removeStaffFromTeam(teamId: number, staffId: number): Promise<boolean> {
    const teamStaff = Array.from(this.teamStaff.values())
      .find(ts => ts.teamId === teamId && ts.staffId === staffId);

    if (!teamStaff) return false;

    this.teamStaff.delete(teamStaff.id);
    return true;
  }

  async getPlayerTeams(playerId: number): Promise<(TeamPlayer & { team: Team })[]> {
    return Array.from(this.teamPlayers.values())
      .filter(tp => tp.playerId === playerId)
      .map(tp => {
        const team = this.teams.get(tp.teamId);
        return { ...tp, team: team! };
      })
      .filter(tp => tp.team?.isActive);
  }

  // Training Sessions
  async getTrainingSessions(organizationId: number): Promise<TrainingSession[]> {
    return Array.from(this.trainingSessions.values()).filter(s => s.organizationId === organizationId);
  }

  async getTrainingSession(id: number, organizationId: number): Promise<TrainingSession | undefined> {
    const session = this.trainingSessions.get(id);
    return session && session.organizationId === organizationId ? session : undefined;
  }

  async createTrainingSession(insertSession: InsertTrainingSession, organizationId: number): Promise<TrainingSession> {
    const id = this.currentIds.trainingSessions++;
    const session: TrainingSession = {
      ...insertSession,
      organizationId,
      id,
      description: insertSession.description ?? null,
      maxParticipants: insertSession.maxParticipants ?? null,

      // Fitness Section
      fitnessAerobic: insertSession.fitnessAerobic ?? null,
      fitnessStrength: insertSession.fitnessStrength ?? null,
      fitnessEndurance: insertSession.fitnessEndurance ?? null,
      fitnessTests: insertSession.fitnessTests ?? null,
      fitnessRecovery: insertSession.fitnessRecovery ?? null,
      fitnessTapering: insertSession.fitnessTapering ?? null,
      fitnessWarmUp: insertSession.fitnessWarmUp ?? null,
      fitnessCoolDown: insertSession.fitnessCoolDown ?? null,
      fitnessFlexibility: insertSession.fitnessFlexibility ?? null,
      fitnessAgility: insertSession.fitnessAgility ?? null,
      fitnessSpeed: insertSession.fitnessSpeed ?? null,
      fitnessPower: insertSession.fitnessPower ?? null,
      fitnessOther: insertSession.fitnessOther ?? null,
      fitnessDuration: insertSession.fitnessDuration ?? null,

      // Main Part
      mainTechnical: insertSession.mainTechnical ?? null,
      mainTactical: insertSession.mainTactical ?? null,
      mainMatchPrep: insertSession.mainMatchPrep ?? null,
      mainPossession: insertSession.mainPossession ?? null,
      mainTransition: insertSession.mainTransition ?? null,
      mainSetPieces: insertSession.mainSetPieces ?? null,
      mainFinishing: insertSession.mainFinishing ?? null,
      mainPartDuration: insertSession.mainPartDuration ?? null,

      // Goalkeeper
      gkHandling: insertSession.gkHandling ?? null,
      gkShotStopping: insertSession.gkShotStopping ?? null,
      gkDistribution: insertSession.gkDistribution ?? null,
      gkFootwork: insertSession.gkFootwork ?? null,
      gkCrossing: insertSession.gkCrossing ?? null,
      gkOneOnOne: insertSession.gkOneOnOne ?? null,
      gkCommunication: insertSession.gkCommunication ?? null,
      gkPositioning: insertSession.gkPositioning ?? null,
      gkReactions: insertSession.gkReactions ?? null,
      gkDiving: insertSession.gkDiving ?? null,
      gkThrowing: insertSession.gkThrowing ?? null,
      gkKicking: insertSession.gkKicking ?? null,
      goalkeepingDuration: insertSession.goalkeepingDuration ?? null,

      // Specific Work
      specificIndividual: insertSession.specificIndividual ?? null,
      specificPosition: insertSession.specificPosition ?? null,
      specificInjuryPrev: insertSession.specificInjuryPrev ?? null,
      specificRehab: insertSession.specificRehab ?? null,
      specificYouth: insertSession.specificYouth ?? null,
      specificCondition: insertSession.specificCondition ?? null,
      specificFinishing: insertSession.specificFinishing ?? null,
      specificCrossing: insertSession.specificCrossing ?? null,
      specificDefending: insertSession.specificDefending ?? null,
      specificPressing: insertSession.specificPressing ?? null,
      specificCounterAttack: insertSession.specificCounterAttack ?? null,
      specificMental: insertSession.specificMental ?? null,
      specificWorkDuration: insertSession.specificWorkDuration ?? null,

      // Images
      trainingImageUrl: insertSession.trainingImageUrl ?? null,
      trainingImageType: insertSession.trainingImageType ?? null,
      trainingImageName: insertSession.trainingImageName ?? null,
      fitnessImageUrl: insertSession.fitnessImageUrl ?? null,
      fitnessImageType: insertSession.fitnessImageType ?? null,
      fitnessImageName: insertSession.fitnessImageName ?? null,
      goalkeepingImageUrl: insertSession.goalkeepingImageUrl ?? null,
      goalkeepingImageType: insertSession.goalkeepingImageType ?? null,
      goalkeepingImageName: insertSession.goalkeepingImageName ?? null,
      specificWorkImageUrl: insertSession.specificWorkImageUrl ?? null,
      specificWorkImageType: insertSession.specificWorkImageType ?? null,
      specificWorkImageName: insertSession.specificWorkImageName ?? null,

      notes: insertSession.notes ?? null,
      status: insertSession.status ?? "scheduled",
      createdAt: new Date()
    };
    this.trainingSessions.set(id, session);
    return session;
  }

  async updateTrainingSession(id: number, updateData: Partial<InsertTrainingSession>, organizationId: number): Promise<TrainingSession | undefined> {
    const session = this.trainingSessions.get(id);
    if (!session || session.organizationId !== organizationId) return undefined;

    const updatedSession = { ...session, ...updateData };
    this.trainingSessions.set(id, updatedSession as TrainingSession); // Casting to suppress for update if needed
    return updatedSession as TrainingSession;
  }

  async deleteTrainingSession(id: number, organizationId: number): Promise<boolean> {
    const session = this.trainingSessions.get(id);
    if (!session || session.organizationId !== organizationId) return false;
    return this.trainingSessions.delete(id);
  }

  // Session Attendance
  async getSessionAttendance(sessionId: number): Promise<(SessionAttendance & { player: Player })[]> {
    const attendance = Array.from(this.sessionAttendance.values())
      .filter(a => a.sessionId === sessionId);

    return attendance.map(a => {
      const player = this.players.get(a.playerId);
      return { ...a, player: player! };
    }).filter(a => a.player);
  }

  async markAttendance(insertAttendance: InsertSessionAttendance): Promise<SessionAttendance> {
    const existingAttendance = Array.from(this.sessionAttendance.values())
      .find(a => a.sessionId === insertAttendance.sessionId && a.playerId === insertAttendance.playerId);

    if (existingAttendance) {
      const updatedAttendance: SessionAttendance = {
        ...existingAttendance,
        ...insertAttendance,
        rating: insertAttendance.rating ?? existingAttendance.rating,
        notes: insertAttendance.notes ?? existingAttendance.notes,
      };
      this.sessionAttendance.set(existingAttendance.id, updatedAttendance);
      return updatedAttendance;
    }

    const id = this.currentIds.sessionAttendance++;
    const attendance: SessionAttendance = {
      ...insertAttendance,
      id,
      rating: insertAttendance.rating ?? null,
      notes: insertAttendance.notes ?? null,
      createdAt: new Date()
    };
    this.sessionAttendance.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: number, updateData: Partial<InsertSessionAttendance>): Promise<SessionAttendance | undefined> {
    const attendance = this.sessionAttendance.get(id);
    if (!attendance) return undefined;

    const updatedAttendance = {
      ...attendance,
      ...updateData,
      rating: updateData.rating ?? attendance.rating,
      notes: updateData.notes ?? attendance.notes
    };
    this.sessionAttendance.set(id, updatedAttendance);
    return updatedAttendance;
  }

  // Notifications
  async getNotificationsForUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentIds.notifications++;
    const notification: Notification = {
      ...insertNotification,
      id,
      link: insertNotification.link ?? null,
      relatedSessionId: insertNotification.relatedSessionId ?? null,
      isRead: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationRead(id: number, userId: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification || notification.userId !== userId) return undefined;

    const updated = { ...notification, isRead: true };
    this.notifications.set(id, updated);
    return updated;
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.isRead)
      .forEach(n => this.notifications.set(n.id, { ...n, isRead: true }));
  }

  // Tactical Formations
  async getFormations(teamId: number, organizationId: number): Promise<TacticalFormation[]> {
    return Array.from(this.tacticalFormations.values())
      .filter(f => f.teamId === teamId && f.organizationId === organizationId);
  }

  async createFormation(insertFormation: InsertTacticalFormation, organizationId: number): Promise<TacticalFormation> {
    const id = this.currentIds.tacticalFormations++;
    const formation: TacticalFormation = {
      ...insertFormation,
      organizationId,
      id,
      notes: insertFormation.notes ?? null,
      createdAt: new Date()
    };
    this.tacticalFormations.set(id, formation);
    return formation;
  }

  async updateFormation(id: number, updateData: Partial<InsertTacticalFormation>, organizationId: number): Promise<TacticalFormation | undefined> {
    const formation = this.tacticalFormations.get(id);
    if (!formation || formation.organizationId !== organizationId) return undefined;

    const updatedFormation = {
      ...formation,
      ...updateData,
      notes: updateData.notes ?? formation.notes
    };
    this.tacticalFormations.set(id, updatedFormation);
    return updatedFormation;
  }

  async deleteFormation(id: number, organizationId: number): Promise<boolean> {
    const formation = this.tacticalFormations.get(id);
    if (!formation || formation.organizationId !== organizationId) return false;
    return this.tacticalFormations.delete(id);
  }

  // Player Stats
  async getPlayerStats(playerId: number): Promise<PlayerStats[]> {
    return Array.from(this.playerStats.values())
      .filter(s => s.playerId === playerId);
  }

  async getAllPlayerStats(): Promise<PlayerStats[]> {
    return Array.from(this.playerStats.values());
  }

  async createPlayerStats(insertStats: InsertPlayerStats): Promise<PlayerStats> {
    const id = this.currentIds.playerStats++;
    const stats: PlayerStats = {
      ...insertStats,
      id,
      sessionId: insertStats.sessionId ?? null,
      goals: insertStats.goals ?? 0,
      assists: insertStats.assists ?? 0,
      yellowCards: insertStats.yellowCards ?? 0,
      redCards: insertStats.redCards ?? 0,
      minutesPlayed: insertStats.minutesPlayed ?? 0,
      fitnessScore: insertStats.fitnessScore ?? null,
      technicalScore: insertStats.technicalScore ?? null,
      tacticalScore: insertStats.tacticalScore ?? null,
      createdAt: new Date()
    };
    this.playerStats.set(id, stats);
    return stats;
  }

  async updatePlayerStats(id: number, updateData: Partial<InsertPlayerStats>): Promise<PlayerStats | undefined> {
    const stats = this.playerStats.get(id);
    if (!stats) return undefined;

    const updatedStats = { ...stats, ...updateData };
    this.playerStats.set(id, updatedStats);
    return updatedStats;
  }

  // Staff
  async getStaff(organizationId: number): Promise<Staff[]> {
    return Array.from(this.staff.values()).filter(s => s.organizationId === organizationId);
  }

  async getStaffMember(id: number, organizationId: number): Promise<Staff | undefined> {
    const member = this.staff.get(id);
    return member && member.organizationId === organizationId ? member : undefined;
  }

  async createStaff(insertStaff: InsertStaff, organizationId: number): Promise<Staff> {
    const id = this.currentIds.staff++;
    const staffMember: Staff = {
      organizationId,
      id,
      firstName: insertStaff.firstName,
      lastName: insertStaff.lastName,
      firstNameAr: insertStaff.firstNameAr ?? null,
      lastNameAr: insertStaff.lastNameAr ?? null,
      email: insertStaff.email,
      role: insertStaff.role,
      department: insertStaff.department,
      employmentType: insertStaff.employmentType,
      startDate: insertStaff.startDate,
      phoneNumber: insertStaff.phoneNumber ?? null,
      nationality: insertStaff.nationality ?? null,
      contractEndDate: insertStaff.contractEndDate ?? null,
      salary: insertStaff.salary ?? null,
      qualifications: insertStaff.qualifications ?? null,
      emergencyContact: insertStaff.emergencyContact ?? null,
      idNumber: insertStaff.idNumber ?? null,
      passportNumber: insertStaff.passportNumber ?? null,
      passportIssueDate: insertStaff.passportIssueDate ?? null,
      passportExpiryDate: insertStaff.passportExpiryDate ?? null,
      profilePicture: insertStaff.profilePicture ?? null,
      idDocument: insertStaff.idDocument ?? null,
      contractDocument: insertStaff.contractDocument ?? null,
      isActive: insertStaff.isActive ?? true,
      createdAt: new Date()
    };
    this.staff.set(id, staffMember);
    return staffMember;
  }

  // Injuries
  private injuries = new Map<number, Injury>();
  private injuryTreatmentLogs = new Map<number, InjuryTreatmentLog>();
  private nextInjuryId = 1;
  private nextInjuryTreatmentLogId = 1;

  private decorateInjury(injury: Injury): InjuryWithPlayer {
    const player = this.players.get(injury.playerId);
    const membership = Array.from(this.teamPlayers.values()).find(
      (tp) => tp.playerId === injury.playerId
    );
    const team = membership ? this.teams.get(membership.teamId) : undefined;
    const logsForInjury = Array.from(this.injuryTreatmentLogs.values())
      .filter((log) => log.injuryId === injury.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    return {
      ...injury,
      playerName: player ? `${player.firstName} ${player.lastName}` : "Unknown player",
      teamName: team?.name ?? "Unassigned",
      teamId: team?.id ?? null,
      treatmentCount: logsForInjury.length,
      latestTreatment: logsForInjury[0]
        ? { date: logsForInjury[0].date, treatmentType: logsForInjury[0].treatmentType }
        : null,
    };
  }

  async getInjuries(organizationId: number): Promise<InjuryWithPlayer[]> {
    return Array.from(this.injuries.values())
      .filter((injury) => injury.organizationId === organizationId)
      .sort((a, b) => b.injuryDate.localeCompare(a.injuryDate))
      .map((injury) => this.decorateInjury(injury));
  }

  async getInjury(id: number, organizationId: number): Promise<InjuryWithPlayer | undefined> {
    const injury = this.injuries.get(id);
    return injury && injury.organizationId === organizationId ? this.decorateInjury(injury) : undefined;
  }

  async createInjury(injury: InsertInjury, organizationId: number): Promise<Injury> {
    const id = this.nextInjuryId++;
    const created: Injury = {
      ...injury,
      organizationId,
      id,
      status: injury.status ?? "recovering",
      expectedReturn: injury.expectedReturn ?? null,
      mechanism: injury.mechanism ?? null,
      treatment: injury.treatment ?? null,
      notes: injury.notes ?? null,
      createdBy: injury.createdBy ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.injuries.set(id, created);
    return created;
  }

  async updateInjury(id: number, injury: Partial<InsertInjury>, organizationId: number): Promise<Injury | undefined> {
    const existing = this.injuries.get(id);
    if (!existing || existing.organizationId !== organizationId) return undefined;
    const updated: Injury = { ...existing, ...injury, updatedAt: new Date() };
    this.injuries.set(id, updated);
    return updated;
  }

  async deleteInjury(id: number, organizationId: number): Promise<boolean> {
    const existing = this.injuries.get(id);
    if (!existing || existing.organizationId !== organizationId) return false;
    for (const [logId, log] of this.injuryTreatmentLogs.entries()) {
      if (log.injuryId === id) this.injuryTreatmentLogs.delete(logId);
    }
    return this.injuries.delete(id);
  }

  async getInjuryTreatmentLogs(injuryId: number): Promise<InjuryTreatmentLog[]> {
    return Array.from(this.injuryTreatmentLogs.values())
      .filter((log) => log.injuryId === injuryId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async createInjuryTreatmentLog(log: InsertInjuryTreatmentLog): Promise<InjuryTreatmentLog> {
    const id = this.nextInjuryTreatmentLogId++;
    const created: InjuryTreatmentLog = {
      ...log,
      id,
      medicineCourse: log.medicineCourse ?? null,
      notes: log.notes ?? null,
      createdBy: log.createdBy ?? null,
      createdAt: new Date(),
    };
    this.injuryTreatmentLogs.set(id, created);
    return created;
  }

  async deleteInjuryTreatmentLog(id: number, organizationId: number): Promise<boolean> {
    const log = this.injuryTreatmentLogs.get(id);
    if (!log) return false;
    const parentInjury = this.injuries.get(log.injuryId);
    if (!parentInjury || parentInjury.organizationId !== organizationId) return false;
    return this.injuryTreatmentLogs.delete(id);
  }

  // Annual Budget Management
  async getAnnualBudgets(organizationId: number): Promise<AnnualBudget[]> {
    return Array.from(this.annualBudgets.values()).filter(b => b.organizationId === organizationId);
  }

  async getAnnualBudget(id: number, organizationId: number): Promise<AnnualBudget | undefined> {
    const budget = this.annualBudgets.get(id);
    return budget && budget.organizationId === organizationId ? budget : undefined;
  }

  async getAnnualBudgetByYear(fiscalYear: string, organizationId: number): Promise<AnnualBudget | undefined> {
    return Array.from(this.annualBudgets.values()).find(b => b.fiscalYear === fiscalYear && b.organizationId === organizationId);
  }

  async createAnnualBudget(insertBudget: InsertAnnualBudget, organizationId: number): Promise<AnnualBudget> {
    const id = this.currentIds.annualBudgets++;
    const budget: AnnualBudget = {
      ...insertBudget,
      organizationId,
      id,
      notes: insertBudget.notes ?? null,
      teamId: insertBudget.teamId ?? null,
      seasonStartDate: insertBudget.seasonStartDate ?? null,
      seasonEndDate: insertBudget.seasonEndDate ?? null,
      status: insertBudget.status ?? "active",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.annualBudgets.set(id, budget);
    return budget;
  }

  // Expense Management
  async getExpenses(organizationId: number, budgetId?: number): Promise<Expense[]> {
    const allExpenses = Array.from(this.expenses.values()).filter(e => e.organizationId === organizationId);
    if (budgetId) {
      return allExpenses.filter(e => e.budgetId === budgetId);
    }
    return allExpenses;
  }

  async getExpense(id: number, organizationId: number): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    return expense && expense.organizationId === organizationId ? expense : undefined;
  }

  async createExpense(insertExpense: InsertExpense, organizationId: number): Promise<Expense> {
    const id = this.currentIds.expenses++;
    const expense: Expense = {
      ...insertExpense,
      organizationId,
      id,
      subcategory: insertExpense.subcategory ?? null,
      vendor: insertExpense.vendor ?? null,
      paymentMethod: insertExpense.paymentMethod ?? null,
      receipt: insertExpense.receipt ?? null,
      status: insertExpense.status ?? "pending",
      approvedBy: insertExpense.approvedBy ?? null,
      approvedAt: null,
      paymentReference: insertExpense.paymentReference ?? null,
      notes: insertExpense.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: number, updateData: Partial<InsertExpense>, organizationId: number): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense || expense.organizationId !== organizationId) return undefined;

    const updatedExpense = {
      ...expense,
      ...updateData,
      updatedAt: new Date()
    };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number, organizationId: number): Promise<boolean> {
    const expense = this.expenses.get(id);
    if (!expense || expense.organizationId !== organizationId) return false;
    return this.expenses.delete(id);
  }

  async approveExpense(id: number, approvedBy: number, organizationId: number): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense || expense.organizationId !== organizationId) return undefined;

    const updatedExpense: Expense = {
      ...expense,
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date()
    };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }


  async updateStaff(id: number, updateData: Partial<InsertStaff>, organizationId: number): Promise<Staff | undefined> {
    const staff = this.staff.get(id);
    if (!staff || staff.organizationId !== organizationId) return undefined;

    const updatedStaff = { ...staff, ...updateData };
    this.staff.set(id, updatedStaff);
    return updatedStaff;
  }

  async deleteStaff(id: number, organizationId: number): Promise<boolean> {
    const staff = this.staff.get(id);
    if (!staff || staff.organizationId !== organizationId) return false;
    return this.staff.delete(id);
  }

  // Matches
  async getMatches(organizationId: number): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(m => m.organizationId === organizationId);
  }

  async getMatch(id: number, organizationId: number): Promise<Match | undefined> {
    const match = this.matches.get(id);
    return match && match.organizationId === organizationId ? match : undefined;
  }

  async createMatch(insertMatch: InsertMatch, organizationId: number): Promise<Match> {
    const id = this.currentIds.matches++;
    const match: Match = {
      organizationId,
      id,
      homeTeamId: insertMatch.homeTeamId,
      awayTeam: insertMatch.awayTeam,
      competition: insertMatch.competition,
      matchType: insertMatch.matchType,
      date: insertMatch.date,
      kickoffTime: insertMatch.kickoffTime,
      venue: insertMatch.venue,
      status: insertMatch.status ?? "scheduled",
      homeScore: insertMatch.homeScore ?? null,
      awayScore: insertMatch.awayScore ?? null,
      firstHalfHomeScore: insertMatch.firstHalfHomeScore ?? null,
      firstHalfAwayScore: insertMatch.firstHalfAwayScore ?? null,
      secondHalfHomeScore: insertMatch.secondHalfHomeScore ?? null,
      secondHalfAwayScore: insertMatch.secondHalfAwayScore ?? null,
      goalEvents: insertMatch.goalEvents ?? null,
      notes: insertMatch.notes ?? null,
      weatherConditions: insertMatch.weatherConditions ?? null,
      attendance: insertMatch.attendance ?? null,
      createdAt: new Date()
    };
    this.matches.set(id, match);
    return match;
  }

  async updateMatch(id: number, updateData: Partial<InsertMatch>, organizationId: number): Promise<Match | undefined> {
    const match = this.matches.get(id);
    if (!match || match.organizationId !== organizationId) return undefined;

    const updatedMatch: Match = {
      ...match,
      ...updateData,
      status: updateData.status ?? match.status,
      homeScore: updateData.homeScore ?? match.homeScore,
      awayScore: updateData.awayScore ?? match.awayScore,
      notes: updateData.notes ?? match.notes,
      weatherConditions: updateData.weatherConditions ?? match.weatherConditions,
      attendance: updateData.attendance ?? match.attendance
    };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  async deleteMatch(id: number, organizationId: number): Promise<boolean> {
    const match = this.matches.get(id);
    if (!match || match.organizationId !== organizationId) return false;
    return this.matches.delete(id);
  }

  // Match Squads
  async getMatchSquad(matchId: number): Promise<(MatchSquad & { player: Player })[]> {
    return Array.from(this.matchSquads.values())
      .filter(ms => ms.matchId === matchId)
      .map(ms => {
        const player = this.players.get(ms.playerId);
        return { ...ms, player: player! };
      });
  }

  async addPlayerToMatchSquad(insertMatchSquad: InsertMatchSquad): Promise<MatchSquad> {
    const existingSquadMember = Array.from(this.matchSquads.values())
      .find(ms => ms.matchId === insertMatchSquad.matchId && ms.playerId === insertMatchSquad.playerId);

    if (existingSquadMember) {
      const updatedMatchSquad: MatchSquad = {
        ...existingSquadMember,
        ...insertMatchSquad,
        position: insertMatchSquad.position ?? existingSquadMember.position,
        shirtNumber: insertMatchSquad.shirtNumber ?? existingSquadMember.shirtNumber,
        minutesPlayed: insertMatchSquad.minutesPlayed ?? existingSquadMember.minutesPlayed,
        goals: insertMatchSquad.goals ?? existingSquadMember.goals,
        assists: insertMatchSquad.assists ?? existingSquadMember.assists,
        yellowCards: insertMatchSquad.yellowCards ?? existingSquadMember.yellowCards,
        redCards: insertMatchSquad.redCards ?? existingSquadMember.redCards,
        rating: insertMatchSquad.rating ?? existingSquadMember.rating,
      };
      this.matchSquads.set(existingSquadMember.id, updatedMatchSquad);
      return updatedMatchSquad;
    }

    const id = this.currentIds.matchSquads++;
    const matchSquad: MatchSquad = {
      id,
      matchId: insertMatchSquad.matchId,
      playerId: insertMatchSquad.playerId,
      status: insertMatchSquad.status,
      position: insertMatchSquad.position ?? null,
      shirtNumber: insertMatchSquad.shirtNumber ?? null,
      minutesPlayed: insertMatchSquad.minutesPlayed ?? 0,
      goals: insertMatchSquad.goals ?? 0,
      assists: insertMatchSquad.assists ?? 0,
      yellowCards: insertMatchSquad.yellowCards ?? 0,
      redCards: insertMatchSquad.redCards ?? 0,
      rating: insertMatchSquad.rating ?? null,
      createdAt: new Date()
    };
    this.matchSquads.set(id, matchSquad);
    return matchSquad;
  }

  async updateMatchSquad(id: number, updateData: Partial<InsertMatchSquad>): Promise<MatchSquad | undefined> {
    const matchSquad = this.matchSquads.get(id);
    if (!matchSquad) return undefined;

    const updatedMatchSquad: MatchSquad = {
      ...matchSquad,
      ...updateData,
      position: updateData.position ?? matchSquad.position,
      shirtNumber: updateData.shirtNumber ?? matchSquad.shirtNumber,
      minutesPlayed: updateData.minutesPlayed ?? matchSquad.minutesPlayed,
      goals: updateData.goals ?? matchSquad.goals,
      assists: updateData.assists ?? matchSquad.assists,
      yellowCards: updateData.yellowCards ?? matchSquad.yellowCards,
      redCards: updateData.redCards ?? matchSquad.redCards,
      rating: updateData.rating ?? matchSquad.rating
    };
    this.matchSquads.set(id, updatedMatchSquad);
    return updatedMatchSquad;
  }

  async removePlayerFromMatchSquad(matchId: number, playerId: number): Promise<boolean> {
    const matchSquad = Array.from(this.matchSquads.values())
      .find(ms => ms.matchId === matchId && ms.playerId === playerId);

    if (!matchSquad) return false;
    return this.matchSquads.delete(matchSquad.id);
  }

  async deleteMatchSquad(id: number): Promise<boolean> {
    return this.matchSquads.delete(id);
  }

  // Meetings
  async getMeetings(organizationId: number): Promise<Meeting[]> {
    return Array.from(this.meetings.values())
      .filter(m => m.organizationId === organizationId)
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }

  async getMeeting(id: number, organizationId: number): Promise<Meeting | undefined> {
    const meeting = this.meetings.get(id);
    return meeting && meeting.organizationId === organizationId ? meeting : undefined;
  }

  async createMeeting(insertMeeting: InsertMeeting, organizationId: number): Promise<Meeting> {
    const id = this.currentIds.meetings++;
    const meeting: Meeting = {
      organizationId,
      id,
      title: insertMeeting.title,
      description: insertMeeting.description ?? null,
      meetingType: insertMeeting.meetingType,
      date: insertMeeting.date,
      startTime: insertMeeting.startTime,
      duration: insertMeeting.duration,
      location: insertMeeting.location,
      organizerId: insertMeeting.organizerId,
      attendees: insertMeeting.attendees ?? null,
      agenda: insertMeeting.agenda ?? null,
      notes: insertMeeting.notes ?? null,
      status: insertMeeting.status ?? "scheduled",
      priority: insertMeeting.priority ?? "medium",
      createdAt: new Date(),
    };
    this.meetings.set(id, meeting);
    return meeting;
  }

  async updateMeeting(id: number, updateData: Partial<InsertMeeting>, organizationId: number): Promise<Meeting | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting || meeting.organizationId !== organizationId) return undefined;

    const updatedMeeting: Meeting = {
      ...meeting,
      ...updateData,
      description: updateData.description ?? meeting.description,
      attendees: updateData.attendees ?? meeting.attendees,
      agenda: updateData.agenda ?? meeting.agenda,
      notes: updateData.notes ?? meeting.notes,
      status: updateData.status ?? meeting.status,
      priority: updateData.priority ?? meeting.priority,
    };
    this.meetings.set(id, updatedMeeting);
    return updatedMeeting;
  }

  async deleteMeeting(id: number, organizationId: number): Promise<boolean> {
    const meeting = this.meetings.get(id);
    if (!meeting || meeting.organizationId !== organizationId) return false;
    return this.meetings.delete(id);
  }

  // Analytics Reports
  async getAnalyticsReports(organizationId: number): Promise<AnalyticsReport[]> {
    return Array.from(this.analyticsReports.values()).filter(r => r.organizationId === organizationId);
  }

  async getAnalyticsReport(id: number, organizationId: number): Promise<AnalyticsReport | undefined> {
    const report = this.analyticsReports.get(id);
    return report && report.organizationId === organizationId ? report : undefined;
  }

  async createAnalyticsReport(insertReport: InsertAnalyticsReport, organizationId: number): Promise<AnalyticsReport> {
    const id = this.currentIds.analyticsReports++;
    const report: AnalyticsReport = {
      organizationId,
      id,
      title: insertReport.title,
      type: insertReport.type,
      period: insertReport.period,
      dataPoints: insertReport.dataPoints,
      generatedBy: insertReport.generatedBy,
      teamId: insertReport.teamId ?? null,
      playerId: insertReport.playerId ?? null,
      insights: insertReport.insights ?? null,
      recommendations: insertReport.recommendations ?? null,
      createdAt: new Date()
    };
    this.analyticsReports.set(id, report);
    return report;
  }

  async updateAnalyticsReport(id: number, updateData: Partial<InsertAnalyticsReport>, organizationId: number): Promise<AnalyticsReport | undefined> {
    const report = this.analyticsReports.get(id);
    if (!report || report.organizationId !== organizationId) return undefined;

    const updatedReport: AnalyticsReport = {
      ...report,
      ...updateData,
      teamId: updateData.teamId ?? report.teamId,
      playerId: updateData.playerId ?? report.playerId,
      insights: updateData.insights ?? report.insights,
      recommendations: updateData.recommendations ?? report.recommendations
    };
    this.analyticsReports.set(id, updatedReport);
    return updatedReport;
  }

  async deleteAnalyticsReport(id: number, organizationId: number): Promise<boolean> {
    const report = this.analyticsReports.get(id);
    if (!report || report.organizationId !== organizationId) return false;
    return this.analyticsReports.delete(id);
  }

  // System Settings
  async getSystemSettings(organizationId: number): Promise<SystemSettings[]> {
    return Array.from(this.systemSettings.values()).filter(s => s.organizationId === organizationId);
  }

  async getSystemSetting(id: number, organizationId: number): Promise<SystemSettings | undefined> {
    const setting = this.systemSettings.get(id);
    return setting && setting.organizationId === organizationId ? setting : undefined;
  }

  async createSystemSetting(insertSetting: InsertSystemSettings, organizationId: number): Promise<SystemSettings> {
    // Check for existing setting to prevent duplicates (Upsert logic)
    const existing = Array.from(this.systemSettings.values()).find(
      s => s.organizationId === organizationId && s.category === insertSetting.category && s.settingKey === insertSetting.settingKey
    );

    if (existing) {
      const updatedSetting = {
        ...existing,
        ...insertSetting,
        updatedAt: new Date()
      };
      this.systemSettings.set(existing.id, updatedSetting);
      return updatedSetting;
    }

    const id = this.currentIds.systemSettings++;
    const setting: SystemSettings = {
      organizationId,
      id,
      category: insertSetting.category,
      settingKey: insertSetting.settingKey,
      settingValue: insertSetting.settingValue ?? null,
      description: insertSetting.description ?? null,
      isActive: insertSetting.isActive ?? true,
      updatedBy: insertSetting.updatedBy,
      updatedAt: new Date()
    };
    this.systemSettings.set(id, setting);
    return setting;
  }

  async updateSystemSetting(id: number, updateData: Partial<InsertSystemSettings>, organizationId: number): Promise<SystemSettings | undefined> {
    const setting = this.systemSettings.get(id);
    if (!setting || setting.organizationId !== organizationId) return undefined;

    const updatedSetting: SystemSettings = {
      ...setting,
      ...updateData,
      settingValue: updateData.settingValue ?? setting.settingValue,
      description: updateData.description ?? setting.description,
      isActive: updateData.isActive ?? setting.isActive,
      updatedAt: new Date()
    };
    this.systemSettings.set(id, updatedSetting);
    return updatedSetting;
  }

  // Missing methods stubs and implementations
  async getWearableDevices(organizationId: number, playerId?: number): Promise<WearableDevice[]> { return []; }
  async getWearableDevice(id: number, organizationId: number): Promise<WearableDevice | undefined> { return undefined; }
  async createWearableDevice(device: InsertWearableDevice, organizationId: number): Promise<WearableDevice> { throw new Error("Not implemented"); }
  async updateWearableDevice(id: number, device: Partial<InsertWearableDevice>, organizationId: number): Promise<WearableDevice | undefined> { return undefined; }
  async deleteWearableDevice(id: number, organizationId: number): Promise<boolean> { return false; }
  async getWearableData(deviceId?: number, playerId?: number, dataType?: string): Promise<WearableData[]> { return []; }
  async createWearableData(data: InsertWearableData): Promise<WearableData> { throw new Error("Not implemented"); }
  async getLatestWearableData(playerId: number, dataType: string): Promise<WearableData | undefined> { return undefined; }
  async getPerformanceMetrics(playerId?: number, metricType?: string): Promise<PerformanceMetrics[]> { return []; }
  async createPerformanceMetrics(metrics: InsertPerformanceMetrics): Promise<PerformanceMetrics> { throw new Error("Not implemented"); }
  async getPlayerPerformanceTrends(playerId: number, days: number): Promise<PerformanceMetrics[]> { return []; }

  // Monthly Budgets
  async getMonthlyBudgets(organizationId: number): Promise<MonthlyBudget[]> {
    return Array.from(this.monthlyBudgets.values()).filter(b => b.organizationId === organizationId).sort((a, b) => a.month.localeCompare(b.month));
  }

  async getMonthlyBudget(id: number, organizationId: number): Promise<MonthlyBudget | undefined> {
    const budget = this.monthlyBudgets.get(id);
    return budget && budget.organizationId === organizationId ? budget : undefined;
  }

  async getMonthlyBudgetByMonth(month: string, organizationId: number): Promise<MonthlyBudget | undefined> {
    return Array.from(this.monthlyBudgets.values()).find(b => b.month === month && b.organizationId === organizationId);
  }

  async createMonthlyBudget(budget: InsertMonthlyBudget, organizationId: number): Promise<MonthlyBudget> {
    const id = this.currentIds.monthlyBudgets++;
    const newBudget: MonthlyBudget = {
      ...budget,
      organizationId,
      id,
      notes: budget.notes ?? null,
      approvedBy: budget.approvedBy ?? null,
      annualBudgetId: budget.annualBudgetId ?? null,
      teamId: budget.teamId ?? null,
      seasonStartDate: budget.seasonStartDate ?? null,
      seasonEndDate: budget.seasonEndDate ?? null,
      status: budget.status ?? "active",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.monthlyBudgets.set(id, newBudget);
    return newBudget;
  }

  async updateMonthlyBudget(id: number, budget: Partial<InsertMonthlyBudget>, organizationId: number): Promise<MonthlyBudget | undefined> {
    const existing = this.monthlyBudgets.get(id);
    if (!existing || existing.organizationId !== organizationId) return undefined;

    const updated = {
      ...existing,
      ...budget,
      updatedAt: new Date()
    };
    this.monthlyBudgets.set(id, updated);
    return updated;
  }

  async deleteMonthlyBudget(id: number, organizationId: number): Promise<boolean> {
    const existing = this.monthlyBudgets.get(id);
    if (!existing || existing.organizationId !== organizationId) return false;
    return this.monthlyBudgets.delete(id);
  }

  // Budget Summary
  async getTotalMonthlySalaries(month: string, organizationId: number): Promise<{ staff: number; players: number; total: number }> {
    let staffTotal = 0;
    for (const s of this.staff.values()) {
      if (s.isActive && s.salary && s.organizationId === organizationId) {
        staffTotal += Number(s.salary);
      }
    }
    let playerTotal = 0;
    for (const p of this.players.values()) {
      if (p.isActive && p.monthlySalary && p.organizationId === organizationId) {
        playerTotal += Number(p.monthlySalary);
      }
    }
    return { staff: staffTotal, players: playerTotal, total: staffTotal + playerTotal };
  }

  async getPayrollDetails(month: string, organizationId: number): Promise<{ staff: Array<any>; players: Array<any> }> {
    const staffDetails = Array.from(this.staff.values())
      .filter(s => s.isActive && s.organizationId === organizationId)
      .map(s => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        role: s.role,
        department: s.department,
        employmentType: s.employmentType,
        salary: Number(s.salary || 0),
        contractEndDate: s.contractEndDate,
      }));

    const playerDetails = Array.from(this.players.values())
      .filter(p => p.isActive && p.organizationId === organizationId)
      .map(p => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        position: p.position,
        shirtNumber: p.shirtNumber,
        monthlySalary: Number(p.monthlySalary || 0),
        contractEndDate: p.contractEndDate,
      }));

    return { staff: staffDetails, players: playerDetails };
  }

  async getMonthlyBudgetBreakdown(budgetId: number, organizationId: number): Promise<Array<any>> {
    // For fiscal year budgets, divide by 12 to get monthly allocations
    // Return 12 months of data
    const months = [
      { month: 'July', allocated: 0, spent: 0 },
      { month: 'August', allocated: 0, spent: 0 },
      { month: 'September', allocated: 0, spent: 0 },
      { month: 'October', allocated: 0, spent: 0 },
      { month: 'November', allocated: 0, spent: 0 },
      { month: 'December', allocated: 0, spent: 0 },
      { month: 'January', allocated: 0, spent: 0 },
      { month: 'February', allocated: 0, spent: 0 },
      { month: 'March', allocated: 0, spent: 0 },
      { month: 'April', allocated: 0, spent: 0 },
      { month: 'May', allocated: 0, spent: 0 },
      { month: 'June', allocated: 0, spent: 0 },
    ];
    return months;
  }

  async getBudgetVsActualExpenses(budgetId: number, organizationId: number): Promise<{ budgeted: number; actual: number; remaining: number; categories: any[] }> {
    return { budgeted: 0, actual: 0, remaining: 0, categories: [] };
  }


  // Expense Management
  // getExpenses etc already stubbed or implemented partially earlier?
  // lines 780+ showed expense stubs. I shouldn't duplicate.
  // ERROR: The previous stubs at 780 will conflict if I re-implement.
  // I must double check line 780.

  // Expenses (re-stubbing properly if needed, but if already there, I leave them alone.
  // However, `createExpense` threw error. I should leave it as is or implement if needed.
  // User didn't ask for expense creation fixes specifically, just "Create Budget".
  // So I will skip Expenses here assuming they are covered or I'll fix them if `MemStorage` complains about missing methods (which it won't if they are there).
  // Check lines 780 again... yes they are there.

  // Tactical Boards
  async getTacticalBoards(organizationId: number): Promise<TacticalBoard[]> { return []; }
  async getTacticalBoard(id: number, organizationId: number): Promise<TacticalBoard | undefined> { return undefined; }
  async createTacticalBoard(board: InsertTacticalBoard, organizationId: number): Promise<TacticalBoard> { throw new Error("Not implemented"); }
  async updateTacticalBoard(id: number, board: Partial<InsertTacticalBoard>, organizationId: number): Promise<TacticalBoard | undefined> { return undefined; }
  async deleteTacticalBoard(id: number, organizationId: number): Promise<boolean> { return false; }

  // Player Contracts
  async getPlayerContracts(organizationId: number, playerId?: number): Promise<PlayerContract[]> { return []; }
  async getPlayerContract(id: number, organizationId: number): Promise<PlayerContract | undefined> { return undefined; }
  async createPlayerContract(contract: InsertPlayerContract, organizationId: number): Promise<PlayerContract> { throw new Error("Not implemented"); }
  async updatePlayerContract(id: number, contract: Partial<InsertPlayerContract>, organizationId: number): Promise<PlayerContract | undefined> { return undefined; }
  async deletePlayerContract(id: number, organizationId: number): Promise<boolean> { return false; }

  // Performance Reactions
  async getPerformanceReactions(playerId?: number, performanceType?: string): Promise<PerformanceReaction[]> { return []; }
  async getPlayerReactionsSummary(playerId: number): Promise<any> { return {}; }
  async createPerformanceReaction(reaction: InsertPerformanceReaction): Promise<PerformanceReaction> { throw new Error("Not implemented"); }
  async deletePerformanceReaction(id: number): Promise<boolean> { return false; }

  // Achievement System
  async getAchievements(organizationId: number): Promise<any[]> { return []; }
  async getPlayerAchievements(playerId: number, organizationId: number): Promise<any[]> { return []; }
  async updateAchievementProgress(playerId: number, achievementTypeId: number, value: number, eventType: string, organizationId: number, eventId?: number): Promise<any> { return {}; }
  async getAchievementLeaderboard(organizationId: number): Promise<any[]> { return []; }
  async initializePlayerAchievements(organizationId: number): Promise<any> { return {}; }

  async getPlayerInvitations(organizationId: number): Promise<(PlayerInvitation & { team?: Team })[]> {
    return Array.from(this.playerInvitations.values())
      .filter((invitation) => invitation.organizationId === organizationId)
      .map((invitation) => ({
        ...invitation,
        team: this.teams.get(invitation.teamId),
      }));
  }

  async getPlayerInvitation(id: number, organizationId: number): Promise<PlayerInvitation | undefined> {
    const invitation = this.playerInvitations.get(id);
    return invitation && invitation.organizationId === organizationId ? invitation : undefined;
  }

  async getPlayerInvitationByToken(token: string): Promise<(PlayerInvitation & { team?: Team }) | undefined> {
    const invitation = Array.from(this.playerInvitations.values()).find((item) => item.token === token);
    return invitation ? { ...invitation, team: this.teams.get(invitation.teamId) } : undefined;
  }

  async createPlayerInvitation(insertInvitation: InsertPlayerInvitation, organizationId: number): Promise<PlayerInvitation> {
    const id = this.currentIds.playerInvitations++;
    const invitation: PlayerInvitation = {
      organizationId,
      id,
      token: insertInvitation.token,
      teamId: insertInvitation.teamId,
      email: insertInvitation.email ?? null,
      invitedBy: insertInvitation.invitedBy,
      expiresAt: insertInvitation.expiresAt,
      usedAt: null,
      createdAt: new Date(),
    };
    this.playerInvitations.set(id, invitation);
    return invitation;
  }

  async updatePlayerInvitation(id: number, updateData: Partial<InsertPlayerInvitation> & { usedAt?: Date | null }, organizationId: number): Promise<PlayerInvitation | undefined> {
    const invitation = this.playerInvitations.get(id);
    if (!invitation || invitation.organizationId !== organizationId) return undefined;
    const updatedInvitation = { ...invitation, ...updateData };
    this.playerInvitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  async deletePlayerInvitation(id: number, organizationId: number): Promise<boolean> {
    const invitation = this.playerInvitations.get(id);
    if (!invitation || invitation.organizationId !== organizationId) return false;
    return this.playerInvitations.delete(id);
  }

  async getEmployeeInvitationByToken(token: string): Promise<EmployeeInvitation | undefined> {
    return Array.from(this.employeeInvitations.values()).find((item) => item.token === token);
  }

  async createEmployeeInvitation(insertInvitation: InsertEmployeeInvitation, organizationId: number): Promise<EmployeeInvitation> {
    const id = this.currentIds.employeeInvitations++;
    const invitation: EmployeeInvitation = {
      organizationId,
      id,
      token: insertInvitation.token,
      role: insertInvitation.role,
      teamId: insertInvitation.teamId ?? null,
      email: insertInvitation.email ?? null,
      invitedBy: insertInvitation.invitedBy,
      expiresAt: insertInvitation.expiresAt,
      usedAt: null,
      createdAt: new Date(),
    };
    this.employeeInvitations.set(id, invitation);
    return invitation;
  }

  async updateEmployeeInvitation(id: number, updateData: Partial<InsertEmployeeInvitation> & { usedAt?: Date | null }, organizationId: number): Promise<EmployeeInvitation | undefined> {
    const invitation = this.employeeInvitations.get(id);
    if (!invitation || invitation.organizationId !== organizationId) return undefined;
    const updatedInvitation = { ...invitation, ...updateData };
    this.employeeInvitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  async getRegistrationRemindersForUser(userId: number): Promise<RegistrationReminder[]> {
    return Array.from(this.registrationReminders.values())
      .filter((reminder) => reminder.targetUserId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createRegistrationReminder(insertReminder: InsertRegistrationReminder): Promise<RegistrationReminder> {
    const id = this.currentIds.registrationReminders++;
    const reminder: RegistrationReminder = {
      id,
      targetUserId: insertReminder.targetUserId,
      sentBy: insertReminder.sentBy,
      missingFields: insertReminder.missingFields,
      message: insertReminder.message,
      createdAt: new Date(),
    };
    this.registrationReminders.set(id, reminder);
    return reminder;
  }



}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private async ensurePlayerInvitationsTable(): Promise<void> {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS player_invitations (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        team_id INTEGER NOT NULL REFERENCES teams(id),
        email TEXT,
        invited_by INTEGER NOT NULL REFERENCES users(id),
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS player_invitations_token_idx ON player_invitations(token)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS player_invitations_team_id_idx ON player_invitations(team_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS player_invitations_invited_by_idx ON player_invitations(invited_by)`);
  }

  private async ensureEmployeeInvitationsTable(): Promise<void> {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS employee_invitations (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        team_id INTEGER,
        email TEXT,
        invited_by INTEGER NOT NULL REFERENCES users(id),
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`ALTER TABLE employee_invitations ADD COLUMN IF NOT EXISTS team_id INTEGER`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS employee_invitations_token_idx ON employee_invitations(token)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS employee_invitations_invited_by_idx ON employee_invitations(invited_by)`);
  }

  // Budgets gained an owning team after launch. Existing rows keep team_id
  // NULL, which means "club-wide" and stays visible to club super admins only.
  private budgetTeamColumnReady = false;
  private async ensureBudgetTeamColumns(): Promise<void> {
    if (this.budgetTeamColumnReady) return;
    // Each statement is guarded so a table that does not exist yet on a given
    // environment cannot take down every budget read.
    const statements = [
      sql`ALTER TABLE monthly_budgets ADD COLUMN IF NOT EXISTS team_id INTEGER`,
      sql`ALTER TABLE annual_budgets ADD COLUMN IF NOT EXISTS team_id INTEGER`,
      sql`CREATE INDEX IF NOT EXISTS monthly_budgets_team_id_idx ON monthly_budgets(team_id)`,
      sql`CREATE INDEX IF NOT EXISTS annual_budgets_team_id_idx ON annual_budgets(team_id)`,
    ];
    for (const statement of statements) {
      try {
        await db.execute(statement);
      } catch (error) {
        console.error("Budget team_id migration step skipped:", error);
      }
    }
    this.budgetTeamColumnReady = true;
  }

  private async ensureRegistrationRemindersTable(): Promise<void> {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS registration_reminders (
        id SERIAL PRIMARY KEY,
        target_user_id INTEGER NOT NULL REFERENCES users(id),
        sent_by INTEGER NOT NULL REFERENCES users(id),
        missing_fields JSONB NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS registration_reminders_target_user_id_idx ON registration_reminders(target_user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS registration_reminders_sent_by_idx ON registration_reminders(sent_by)`);
  }

  async getUsers(organizationId?: number): Promise<User[]> {
    if (organizationId === undefined) return await db.select().from(users);
    return await db.select().from(users).where(eq(users.organizationId, organizationId));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser, organizationId: number): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, organizationId })
      .returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>, organizationId: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(users).where(and(eq(users.id, id), eq(users.organizationId, organizationId)));
    return (result.rowCount || 0) > 0;
  }

  async getPlayers(organizationId: number): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.organizationId, organizationId));
  }

  async getPlayer(id: number, organizationId: number): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(and(eq(players.id, id), eq(players.organizationId, organizationId)));
    return player || undefined;
  }

  async createPlayer(insertPlayer: InsertPlayer, organizationId: number): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values({ ...insertPlayer, organizationId })
      .returning();
    return player;
  }

  async updatePlayer(id: number, updateData: Partial<InsertPlayer>, organizationId: number): Promise<Player | undefined> {
    const [player] = await db
      .update(players)
      .set(updateData)
      .where(and(eq(players.id, id), eq(players.organizationId, organizationId)))
      .returning();
    return player || undefined;
  }

  async deletePlayer(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(players).where(and(eq(players.id, id), eq(players.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getTeams(organizationId: number): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.organizationId, organizationId));
  }

  async getTeam(id: number, organizationId: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(and(eq(teams.id, id), eq(teams.organizationId, organizationId)));
    return team || undefined;
  }

  async createTeam(insertTeam: InsertTeam, organizationId: number): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values({ ...insertTeam, organizationId })
      .returning();
    return team;
  }

  async updateTeam(id: number, updateData: Partial<InsertTeam>, organizationId: number): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set(updateData)
      .where(and(eq(teams.id, id), eq(teams.organizationId, organizationId)))
      .returning();
    return team || undefined;
  }

  async deleteTeam(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(teams).where(and(eq(teams.id, id), eq(teams.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getTeamPlayers(teamId: number): Promise<(TeamPlayer & { player: Player })[]> {
    const results = await db
      .select()
      .from(teamPlayers)
      .innerJoin(players, eq(teamPlayers.playerId, players.id))
      .where(eq(teamPlayers.teamId, teamId));
    return results.map(row => ({ ...row.team_players, player: row.players }));
  }

  async addPlayerToTeam(insertTeamPlayer: InsertTeamPlayer): Promise<TeamPlayer> {
    // Check if player is already on the team
    const [existingAssignment] = await db
      .select()
      .from(teamPlayers)
      .where(and(
        eq(teamPlayers.teamId, insertTeamPlayer.teamId),
        eq(teamPlayers.playerId, insertTeamPlayer.playerId)
      ));

    if (existingAssignment) {
      throw new Error("Player is already assigned to this team");
    }

    const [teamPlayer] = await db
      .insert(teamPlayers)
      .values(insertTeamPlayer)
      .returning();
    return teamPlayer;
  }

  async removePlayerFromTeam(teamId: number, playerId: number): Promise<boolean> {
    const result = await db
      .delete(teamPlayers)
      .where(and(eq(teamPlayers.teamId, teamId), eq(teamPlayers.playerId, playerId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getTeamStaff(teamId: number): Promise<(TeamStaff & { staff: Staff })[]> {
    const results = await db
      .select()
      .from(teamStaff)
      .innerJoin(staff, eq(teamStaff.staffId, staff.id))
      .where(eq(teamStaff.teamId, teamId));
    return results.map(row => ({ ...row.team_staff, staff: row.staff }));
  }

  async getStaffTeams(staffId: number): Promise<(TeamStaff & { team: Team })[]> {
    const results = await db
      .select()
      .from(teamStaff)
      .innerJoin(teams, eq(teamStaff.teamId, teams.id))
      .where(eq(teamStaff.staffId, staffId));
    return results.map(row => ({ ...row.team_staff, team: row.teams }));
  }

  async addStaffToTeam(insertTeamStaff: InsertTeamStaff): Promise<TeamStaff> {
    // Check if staff is already on the team
    const [existingAssignment] = await db
      .select()
      .from(teamStaff)
      .where(and(
        eq(teamStaff.teamId, insertTeamStaff.teamId),
        eq(teamStaff.staffId, insertTeamStaff.staffId)
      ));

    if (existingAssignment) {
      throw new Error("Staff member is already assigned to this team");
    }

    const [teamStaffRecord] = await db
      .insert(teamStaff)
      .values(insertTeamStaff)
      .returning();
    return teamStaffRecord;
  }

  async removeStaffFromTeam(teamId: number, staffId: number): Promise<boolean> {
    const result = await db
      .delete(teamStaff)
      .where(and(eq(teamStaff.teamId, teamId), eq(teamStaff.staffId, staffId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getPlayerTeams(playerId: number): Promise<(TeamPlayer & { team: Team })[]> {
    const results = await db
      .select()
      .from(teamPlayers)
      .innerJoin(teams, eq(teamPlayers.teamId, teams.id))
      .where(eq(teamPlayers.playerId, playerId));
    return results.map(row => ({ ...row.team_players, team: row.teams }));
  }

  async getTrainingSessions(organizationId: number): Promise<TrainingSession[]> {
    return await db.select().from(trainingSessions).where(eq(trainingSessions.organizationId, organizationId));
  }

  async getTrainingSession(id: number, organizationId: number): Promise<TrainingSession | undefined> {
    const [session] = await db.select().from(trainingSessions).where(and(eq(trainingSessions.id, id), eq(trainingSessions.organizationId, organizationId)));
    return session || undefined;
  }

  async createTrainingSession(insertSession: InsertTrainingSession, organizationId: number): Promise<TrainingSession> {
    const [session] = await db
      .insert(trainingSessions)
      .values({ ...insertSession, organizationId })
      .returning();
    return session;
  }

  async updateTrainingSession(id: number, updateData: Partial<InsertTrainingSession>, organizationId: number): Promise<TrainingSession | undefined> {
    const [session] = await db
      .update(trainingSessions)
      .set(updateData)
      .where(and(eq(trainingSessions.id, id), eq(trainingSessions.organizationId, organizationId)))
      .returning();
    return session || undefined;
  }

  async deleteTrainingSession(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(trainingSessions).where(and(eq(trainingSessions.id, id), eq(trainingSessions.organizationId, organizationId)));
    return (result.rowCount || 0) > 0;
  }

  async getSessionAttendance(sessionId: number): Promise<(SessionAttendance & { player: Player })[]> {
    const results = await db
      .select()
      .from(sessionAttendance)
      .innerJoin(players, eq(sessionAttendance.playerId, players.id))
      .where(eq(sessionAttendance.sessionId, sessionId));
    return results.map(row => ({ ...row.session_attendance, player: row.players }));
  }

  async markAttendance(insertAttendance: InsertSessionAttendance): Promise<SessionAttendance> {
    const [existingAttendance] = await db
      .select()
      .from(sessionAttendance)
      .where(and(
        eq(sessionAttendance.sessionId, insertAttendance.sessionId),
        eq(sessionAttendance.playerId, insertAttendance.playerId)
      ));

    if (existingAttendance) {
      const [updated] = await db
        .update(sessionAttendance)
        .set(insertAttendance)
        .where(eq(sessionAttendance.id, existingAttendance.id))
        .returning();
      return updated;
    }

    const [attendance] = await db
      .insert(sessionAttendance)
      .values(insertAttendance)
      .returning();
    return attendance;
  }

  async updateAttendance(id: number, updateData: Partial<InsertSessionAttendance>): Promise<SessionAttendance | undefined> {
    const [attendance] = await db
      .update(sessionAttendance)
      .set(updateData)
      .where(eq(sessionAttendance.id, id))
      .returning();
    return attendance || undefined;
  }

  async getNotificationsForUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationRead(id: number, userId: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getFormations(teamId: number, organizationId: number): Promise<TacticalFormation[]> {
    return await db.select().from(tacticalFormations)
      .where(and(eq(tacticalFormations.teamId, teamId), eq(tacticalFormations.organizationId, organizationId)));
  }

  async createFormation(insertFormation: InsertTacticalFormation, organizationId: number): Promise<TacticalFormation> {
    const [formation] = await db
      .insert(tacticalFormations)
      .values({ ...insertFormation, organizationId })
      .returning();
    return formation;
  }

  async updateFormation(id: number, updateData: Partial<InsertTacticalFormation>, organizationId: number): Promise<TacticalFormation | undefined> {
    const [formation] = await db
      .update(tacticalFormations)
      .set(updateData)
      .where(and(eq(tacticalFormations.id, id), eq(tacticalFormations.organizationId, organizationId)))
      .returning();
    return formation || undefined;
  }

  async deleteFormation(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(tacticalFormations).where(and(eq(tacticalFormations.id, id), eq(tacticalFormations.organizationId, organizationId)));
    return (result.rowCount || 0) > 0;
  }

  async getPlayerStats(playerId: number): Promise<PlayerStats[]> {
    return await db.select().from(playerStats).where(eq(playerStats.playerId, playerId));
  }

  async getAllPlayerStats(): Promise<PlayerStats[]> {
    return await db.select().from(playerStats);
  }

  async createPlayerStats(insertStats: InsertPlayerStats): Promise<PlayerStats> {
    const [stats] = await db
      .insert(playerStats)
      .values(insertStats)
      .returning();
    return stats;
  }

  async updatePlayerStats(id: number, updateData: Partial<InsertPlayerStats>): Promise<PlayerStats | undefined> {
    const [stats] = await db
      .update(playerStats)
      .set(updateData)
      .where(eq(playerStats.id, id))
      .returning();
    return stats || undefined;
  }

  async getStaff(organizationId: number): Promise<Staff[]> {
    return await db.select().from(staff).where(eq(staff.organizationId, organizationId));
  }

  async getStaffMember(id: number, organizationId: number): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(and(eq(staff.id, id), eq(staff.organizationId, organizationId)));
    return staffMember || undefined;
  }

  async createStaff(insertStaff: InsertStaff, organizationId: number): Promise<Staff> {
    const [staffMember] = await db
      .insert(staff)
      .values({ ...insertStaff, organizationId })
      .returning();
    return staffMember;
  }

  async updateStaff(id: number, updateData: Partial<InsertStaff>, organizationId: number): Promise<Staff | undefined> {
    const [staffMember] = await db
      .update(staff)
      .set(updateData)
      .where(and(eq(staff.id, id), eq(staff.organizationId, organizationId)))
      .returning();
    return staffMember || undefined;
  }

  async deleteStaff(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(staff).where(and(eq(staff.id, id), eq(staff.organizationId, organizationId)));
    return (result.rowCount || 0) > 0;
  }

  async getMatches(organizationId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.organizationId, organizationId));
  }

  async getMatch(id: number, organizationId: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(and(eq(matches.id, id), eq(matches.organizationId, organizationId)));
    return match || undefined;
  }

  async createMatch(insertMatch: InsertMatch, organizationId: number): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values({ ...insertMatch, organizationId })
      .returning();
    return match;
  }

  async updateMatch(id: number, updateData: Partial<InsertMatch>, organizationId: number): Promise<Match | undefined> {
    const [match] = await db
      .update(matches)
      .set(updateData)
      .where(and(eq(matches.id, id), eq(matches.organizationId, organizationId)))
      .returning();
    return match || undefined;
  }

  async deleteMatch(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(matches).where(and(eq(matches.id, id), eq(matches.organizationId, organizationId)));
    return (result.rowCount || 0) > 0;
  }

  async getMatchSquad(matchId: number): Promise<(MatchSquad & { player: Player })[]> {
    const results = await db
      .select()
      .from(matchSquads)
      .innerJoin(players, eq(matchSquads.playerId, players.id))
      .where(eq(matchSquads.matchId, matchId));

    return results.map(row => ({ ...row.match_squads, player: row.players }));
  }

  async addPlayerToMatchSquad(insertMatchSquad: InsertMatchSquad): Promise<MatchSquad> {
    const [existingSquadMember] = await db
      .select()
      .from(matchSquads)
      .where(and(
        eq(matchSquads.matchId, insertMatchSquad.matchId),
        eq(matchSquads.playerId, insertMatchSquad.playerId)
      ));

    if (existingSquadMember) {
      const [updated] = await db
        .update(matchSquads)
        .set(insertMatchSquad)
        .where(eq(matchSquads.id, existingSquadMember.id))
        .returning();
      return updated;
    }

    const [matchSquad] = await db
      .insert(matchSquads)
      .values(insertMatchSquad)
      .returning();
    return matchSquad;
  }

  async updateMatchSquad(id: number, updateData: Partial<InsertMatchSquad>): Promise<MatchSquad | undefined> {
    const [matchSquad] = await db
      .update(matchSquads)
      .set(updateData)
      .where(eq(matchSquads.id, id))
      .returning();
    return matchSquad || undefined;
  }

  async removePlayerFromMatchSquad(matchId: number, playerId: number): Promise<boolean> {
    const result = await db
      .delete(matchSquads)
      .where(and(eq(matchSquads.matchId, matchId), eq(matchSquads.playerId, playerId)));
    return (result.rowCount || 0) > 0;
  }

  async deleteMatchSquad(id: number): Promise<boolean> {
    const result = await db.delete(matchSquads).where(eq(matchSquads.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getMeetings(organizationId: number): Promise<Meeting[]> {
    return await db.select().from(meetings).where(eq(meetings.organizationId, organizationId));
  }

  async getMeeting(id: number, organizationId: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(and(eq(meetings.id, id), eq(meetings.organizationId, organizationId)));
    return meeting || undefined;
  }

  async createMeeting(insertMeeting: InsertMeeting, organizationId: number): Promise<Meeting> {
    const [meeting] = await db
      .insert(meetings)
      .values({ ...insertMeeting, organizationId })
      .returning();
    return meeting;
  }

  async updateMeeting(id: number, updateData: Partial<InsertMeeting>, organizationId: number): Promise<Meeting | undefined> {
    const [meeting] = await db
      .update(meetings)
      .set(updateData)
      .where(and(eq(meetings.id, id), eq(meetings.organizationId, organizationId)))
      .returning();
    return meeting || undefined;
  }

  async deleteMeeting(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(meetings).where(and(eq(meetings.id, id), eq(meetings.organizationId, organizationId)));
    return (result.rowCount || 0) > 0;
  }

  async getAnalyticsReports(organizationId: number): Promise<AnalyticsReport[]> {
    return await db.select().from(analyticsReports).where(eq(analyticsReports.organizationId, organizationId));
  }

  async getAnalyticsReport(id: number, organizationId: number): Promise<AnalyticsReport | undefined> {
    const [report] = await db.select().from(analyticsReports).where(and(eq(analyticsReports.id, id), eq(analyticsReports.organizationId, organizationId)));
    return report || undefined;
  }

  async createAnalyticsReport(insertReport: InsertAnalyticsReport, organizationId: number): Promise<AnalyticsReport> {
    const [report] = await db
      .insert(analyticsReports)
      .values({ ...insertReport, organizationId })
      .returning();
    return report;
  }

  async updateAnalyticsReport(id: number, updateData: Partial<InsertAnalyticsReport>, organizationId: number): Promise<AnalyticsReport | undefined> {
    const [report] = await db
      .update(analyticsReports)
      .set(updateData)
      .where(and(eq(analyticsReports.id, id), eq(analyticsReports.organizationId, organizationId)))
      .returning();
    return report || undefined;
  }

  async deleteAnalyticsReport(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(analyticsReports).where(and(eq(analyticsReports.id, id), eq(analyticsReports.organizationId, organizationId)));
    return (result.rowCount || 0) > 0;
  }

  async getSystemSettings(organizationId: number): Promise<SystemSettings[]> {
    return await db.select().from(systemSettings).where(eq(systemSettings.organizationId, organizationId));
  }

  async getSystemSetting(id: number, organizationId: number): Promise<SystemSettings | undefined> {
    const [setting] = await db.select().from(systemSettings).where(and(eq(systemSettings.id, id), eq(systemSettings.organizationId, organizationId)));
    return setting || undefined;
  }

  async createSystemSetting(insertSetting: InsertSystemSettings, organizationId: number): Promise<SystemSettings> {
    const [existingSetting] = await db
      .select()
      .from(systemSettings)
      .where(and(
        eq(systemSettings.organizationId, organizationId),
        eq(systemSettings.category, insertSetting.category),
        eq(systemSettings.settingKey, insertSetting.settingKey)
      ));

    if (existingSetting) {
      const [updated] = await db
        .update(systemSettings)
        .set({ ...insertSetting, updatedAt: new Date() })
        .where(eq(systemSettings.id, existingSetting.id))
        .returning();
      return updated;
    }

    const [setting] = await db
      .insert(systemSettings)
      .values({ ...insertSetting, organizationId })
      .returning();
    return setting;
  }

  async updateSystemSetting(id: number, updateData: Partial<InsertSystemSettings>, organizationId: number): Promise<SystemSettings | undefined> {
    const [setting] = await db
      .update(systemSettings)
      .set(updateData)
      .where(and(eq(systemSettings.id, id), eq(systemSettings.organizationId, organizationId)))
      .returning();
    return setting || undefined;
  }

  // Wearable Devices
  async getWearableDevices(organizationId: number, playerId?: number): Promise<WearableDevice[]> {
    if (playerId) {
      return await db.select().from(wearableDevices)
        .where(and(eq(wearableDevices.playerId, playerId), eq(wearableDevices.organizationId, organizationId)));
    }
    return await db.select().from(wearableDevices).where(eq(wearableDevices.organizationId, organizationId));
  }

  async getWearableDevice(id: number, organizationId: number): Promise<WearableDevice | undefined> {
    const [device] = await db.select().from(wearableDevices).where(and(eq(wearableDevices.id, id), eq(wearableDevices.organizationId, organizationId)));
    return device || undefined;
  }

  async createWearableDevice(device: InsertWearableDevice, organizationId: number): Promise<WearableDevice> {
    const [created] = await db
      .insert(wearableDevices)
      .values({ ...device, organizationId })
      .returning();
    return created;
  }

  async updateWearableDevice(id: number, device: Partial<InsertWearableDevice>, organizationId: number): Promise<WearableDevice | undefined> {
    const [updated] = await db
      .update(wearableDevices)
      .set(device)
      .where(and(eq(wearableDevices.id, id), eq(wearableDevices.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  async deleteWearableDevice(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(wearableDevices).where(and(eq(wearableDevices.id, id), eq(wearableDevices.organizationId, organizationId)));
    return (result.rowCount || 0) > 0;
  }

  // Wearable Data
  async getWearableData(deviceId?: number, playerId?: number, dataType?: string): Promise<WearableData[]> {
    const conditions = [];
    if (deviceId) conditions.push(eq(wearableData.deviceId, deviceId));
    if (playerId) conditions.push(eq(wearableData.playerId, playerId));
    if (dataType) conditions.push(eq(wearableData.dataType, dataType));

    if (conditions.length > 0) {
      return await db.select().from(wearableData).where(and(...conditions));
    }
    return await db.select().from(wearableData);
  }

  async createWearableData(data: InsertWearableData): Promise<WearableData> {
    const [created] = await db
      .insert(wearableData)
      .values(data)
      .returning();
    return created;
  }

  async getLatestWearableData(playerId: number, dataType: string): Promise<WearableData | undefined> {
    const [latest] = await db
      .select()
      .from(wearableData)
      .where(and(
        eq(wearableData.playerId, playerId),
        eq(wearableData.dataType, dataType)
      ))
      .orderBy(wearableData.timestamp)
      .limit(1);
    return latest || undefined;
  }

  // Performance Metrics
  async getPerformanceMetrics(playerId?: number, metricType?: string): Promise<PerformanceMetrics[]> {
    const conditions = [];
    if (playerId) conditions.push(eq(performanceMetrics.playerId, playerId));
    if (metricType) conditions.push(eq(performanceMetrics.metricType, metricType));

    if (conditions.length > 0) {
      return await db.select().from(performanceMetrics).where(and(...conditions));
    }
    return await db.select().from(performanceMetrics);
  }

  async createPerformanceMetrics(metrics: InsertPerformanceMetrics): Promise<PerformanceMetrics> {
    const [created] = await db
      .insert(performanceMetrics)
      .values(metrics)
      .returning();
    return created;
  }

  async getPlayerPerformanceTrends(playerId: number, days: number): Promise<PerformanceMetrics[]> {
    return await db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.playerId, playerId))
      .orderBy(performanceMetrics.date);
  }

  // Budget Management
  async getMonthlyBudgets(organizationId: number): Promise<MonthlyBudget[]> {
    await this.ensureBudgetTeamColumns();
    return await db.select().from(monthlyBudgets).where(eq(monthlyBudgets.organizationId, organizationId)).orderBy(monthlyBudgets.month);
  }

  async getMonthlyBudget(id: number, organizationId: number): Promise<MonthlyBudget | undefined> {
    await this.ensureBudgetTeamColumns();
    const [budget] = await db.select().from(monthlyBudgets).where(and(eq(monthlyBudgets.id, id), eq(monthlyBudgets.organizationId, organizationId)));
    return budget || undefined;
  }

  async getMonthlyBudgetByMonth(month: string, organizationId: number): Promise<MonthlyBudget | undefined> {
    await this.ensureBudgetTeamColumns();
    const [budget] = await db.select().from(monthlyBudgets).where(and(eq(monthlyBudgets.month, month), eq(monthlyBudgets.organizationId, organizationId)));
    return budget || undefined;
  }

  async createMonthlyBudget(budget: InsertMonthlyBudget, organizationId: number): Promise<MonthlyBudget> {
    await this.ensureBudgetTeamColumns();
    const [created] = await db
      .insert(monthlyBudgets)
      .values({ ...budget, organizationId })
      .returning();
    return created;
  }

  async updateMonthlyBudget(id: number, budget: Partial<InsertMonthlyBudget>, organizationId: number): Promise<MonthlyBudget | undefined> {
    const [updated] = await db
      .update(monthlyBudgets)
      .set(budget)
      .where(and(eq(monthlyBudgets.id, id), eq(monthlyBudgets.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  async deleteMonthlyBudget(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(monthlyBudgets).where(and(eq(monthlyBudgets.id, id), eq(monthlyBudgets.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Expense Management
  async getExpenses(organizationId: number, budgetId?: number): Promise<Expense[]> {
    if (budgetId) {
      return await db.select().from(expenses).where(and(eq(expenses.budgetId, budgetId), eq(expenses.organizationId, organizationId)));
    }
    return await db.select().from(expenses).where(eq(expenses.organizationId, organizationId));
  }

  async getExpense(id: number, organizationId: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)));
    return expense || undefined;
  }

  async createExpense(expense: InsertExpense, organizationId: number): Promise<Expense> {
    const [created] = await db
      .insert(expenses)
      .values({ ...expense, organizationId })
      .returning();
    return created;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>, organizationId: number): Promise<Expense | undefined> {
    const [updated] = await db
      .update(expenses)
      .set(expense)
      .where(and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  async deleteExpense(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  }

  async approveExpense(id: number, approvedBy: number, organizationId: number): Promise<Expense | undefined> {
    const [updated] = await db
      .update(expenses)
      .set({
        status: "approved",
        approvedBy: approvedBy,
        approvedAt: new Date()
      })
      .where(and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  // Injuries
  private injuryTablesReady = false;
  private async ensureInjuryTables(): Promise<void> {
    if (this.injuryTablesReady) return;
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS injuries (
        id SERIAL PRIMARY KEY,
        player_id INTEGER NOT NULL REFERENCES players(id),
        injury_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        body_part TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'recovering',
        injury_date DATE NOT NULL,
        expected_return DATE,
        mechanism TEXT,
        treatment TEXT,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS injury_treatment_logs (
        id SERIAL PRIMARY KEY,
        injury_id INTEGER NOT NULL REFERENCES injuries(id),
        date DATE NOT NULL,
        treatment_type TEXT NOT NULL,
        medicine_course TEXT,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS injuries_player_id_idx ON injuries(player_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS injuries_status_idx ON injuries(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS injury_treatment_logs_injury_id_idx ON injury_treatment_logs(injury_id)`);
    this.injuryTablesReady = true;
  }

  // Injuries are always rendered with the player and squad they belong to, so
  // the join happens once here rather than in every caller.
  private async selectInjuriesWithPlayer(organizationId: number): Promise<InjuryWithPlayer[]> {
    const rows = await db
      .select()
      .from(injuries)
      .leftJoin(players, eq(injuries.playerId, players.id))
      .leftJoin(teamPlayers, eq(teamPlayers.playerId, injuries.playerId))
      .leftJoin(teams, eq(teamPlayers.teamId, teams.id))
      .where(eq(injuries.organizationId, organizationId))
      .orderBy(desc(injuries.injuryDate));

    const logs = await db
      .select({
        injuryId: injuryTreatmentLogs.injuryId,
        date: injuryTreatmentLogs.date,
        treatmentType: injuryTreatmentLogs.treatmentType,
      })
      .from(injuryTreatmentLogs)
      .orderBy(desc(injuryTreatmentLogs.date));

    const treatmentCounts = new Map<number, number>();
    const latestTreatments = new Map<number, { date: string; treatmentType: string }>();
    for (const log of logs) {
      treatmentCounts.set(log.injuryId, (treatmentCounts.get(log.injuryId) ?? 0) + 1);
      // Rows arrive newest-first, so the first one seen per injury is the latest.
      if (!latestTreatments.has(log.injuryId)) {
        latestTreatments.set(log.injuryId, { date: log.date, treatmentType: log.treatmentType });
      }
    }

    return rows.map((row) => ({
      ...row.injuries,
      playerName: row.players
        ? `${row.players.firstName} ${row.players.lastName}`
        : "Unknown player",
      teamName: row.teams?.name ?? "Unassigned",
      teamId: row.teams?.id ?? null,
      treatmentCount: treatmentCounts.get(row.injuries.id) ?? 0,
      latestTreatment: latestTreatments.get(row.injuries.id) ?? null,
    }));
  }

  async getInjuries(organizationId: number): Promise<InjuryWithPlayer[]> {
    await this.ensureInjuryTables();
    return await this.selectInjuriesWithPlayer(organizationId);
  }

  async getInjury(id: number, organizationId: number): Promise<InjuryWithPlayer | undefined> {
    await this.ensureInjuryTables();
    const all = await this.selectInjuriesWithPlayer(organizationId);
    return all.find((injury) => injury.id === id);
  }

  async createInjury(injury: InsertInjury, organizationId: number): Promise<Injury> {
    await this.ensureInjuryTables();
    const [created] = await db.insert(injuries).values({ ...injury, organizationId }).returning();
    return created;
  }

  async updateInjury(id: number, injury: Partial<InsertInjury>, organizationId: number): Promise<Injury | undefined> {
    await this.ensureInjuryTables();
    const [updated] = await db
      .update(injuries)
      .set({ ...injury, updatedAt: new Date() })
      .where(and(eq(injuries.id, id), eq(injuries.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  async deleteInjury(id: number, organizationId: number): Promise<boolean> {
    await this.ensureInjuryTables();
    // Treatment logs reference the injury, so they go first.
    await db.delete(injuryTreatmentLogs).where(eq(injuryTreatmentLogs.injuryId, id));
    const result = await db.delete(injuries).where(and(eq(injuries.id, id), eq(injuries.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getInjuryTreatmentLogs(injuryId: number): Promise<InjuryTreatmentLog[]> {
    await this.ensureInjuryTables();
    return await db
      .select()
      .from(injuryTreatmentLogs)
      .where(eq(injuryTreatmentLogs.injuryId, injuryId))
      .orderBy(desc(injuryTreatmentLogs.date));
  }

  async createInjuryTreatmentLog(log: InsertInjuryTreatmentLog): Promise<InjuryTreatmentLog> {
    await this.ensureInjuryTables();
    const [created] = await db.insert(injuryTreatmentLogs).values(log).returning();
    return created;
  }

  async deleteInjuryTreatmentLog(id: number, organizationId: number): Promise<boolean> {
    await this.ensureInjuryTables();
    const [log] = await db
      .select({ id: injuryTreatmentLogs.id })
      .from(injuryTreatmentLogs)
      .innerJoin(injuries, eq(injuries.id, injuryTreatmentLogs.injuryId))
      .where(and(eq(injuryTreatmentLogs.id, id), eq(injuries.organizationId, organizationId)));
    if (!log) return false;
    const result = await db.delete(injuryTreatmentLogs).where(eq(injuryTreatmentLogs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Annual Budget Management
  async getAnnualBudgets(organizationId: number): Promise<AnnualBudget[]> {
    await this.ensureBudgetTeamColumns();
    return await db.select().from(annualBudgets).where(eq(annualBudgets.organizationId, organizationId));
  }

  async getAnnualBudget(id: number, organizationId: number): Promise<AnnualBudget | undefined> {
    await this.ensureBudgetTeamColumns();
    const [budget] = await db.select().from(annualBudgets).where(and(eq(annualBudgets.id, id), eq(annualBudgets.organizationId, organizationId)));
    return budget || undefined;
  }

  async getAnnualBudgetByYear(fiscalYear: string, organizationId: number): Promise<AnnualBudget | undefined> {
    await this.ensureBudgetTeamColumns();
    const [budget] = await db.select().from(annualBudgets).where(and(eq(annualBudgets.fiscalYear, fiscalYear), eq(annualBudgets.organizationId, organizationId)));
    return budget || undefined;
  }

  async createAnnualBudget(budget: InsertAnnualBudget, organizationId: number): Promise<AnnualBudget> {
    await this.ensureBudgetTeamColumns();
    const [created] = await db
      .insert(annualBudgets)
      .values({ ...budget, organizationId })
      .returning();
    return created;
  }

  // Player Contracts
  async getPlayerContracts(organizationId: number, playerId?: number): Promise<PlayerContract[]> {
    if (playerId) {
      return await db.select().from(playerContracts)
        .where(and(eq(playerContracts.playerId, playerId), eq(playerContracts.organizationId, organizationId)));
    }
    return await db.select().from(playerContracts).where(eq(playerContracts.organizationId, organizationId));
  }

  async getPlayerContract(id: number, organizationId: number): Promise<PlayerContract | undefined> {
    const [contract] = await db.select().from(playerContracts)
      .where(and(eq(playerContracts.id, id), eq(playerContracts.organizationId, organizationId)));
    return contract || undefined;
  }

  async createPlayerContract(contract: InsertPlayerContract, organizationId: number): Promise<PlayerContract> {
    const [created] = await db
      .insert(playerContracts)
      .values({ ...contract, organizationId })
      .returning();
    return created;
  }

  async updatePlayerContract(id: number, contract: Partial<InsertPlayerContract>, organizationId: number): Promise<PlayerContract | undefined> {
    const [updated] = await db
      .update(playerContracts)
      .set(contract)
      .where(and(eq(playerContracts.id, id), eq(playerContracts.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  async deletePlayerContract(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(playerContracts).where(and(eq(playerContracts.id, id), eq(playerContracts.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Budget Summary Methods
  async getTotalMonthlySalaries(month: string, organizationId: number): Promise<{ staff: number; players: number; total: number }> {
    // Get staff salaries
    const staffSalaries = await db
      .select({
        total: sql<number>`sum(${staff.salary})`
      })
      .from(staff)
      .where(and(eq(staff.isActive, true), eq(staff.organizationId, organizationId)));

    // Get player contract salaries
    const playerSalaries = await db
      .select({
        total: sql<number>`sum(${players.monthlySalary})`
      })
      .from(players)
      .where(and(eq(players.isActive, true), eq(players.organizationId, organizationId)));

    const staffTotal = Number(staffSalaries[0]?.total) || 0;
    const playersTotal = Number(playerSalaries[0]?.total) || 0;

    return {
      staff: staffTotal,
      players: playersTotal,
      total: staffTotal + playersTotal
    };
  }

  async getBudgetVsActualExpenses(budgetId: number, organizationId: number): Promise<{ budgeted: number; actual: number; remaining: number; categories: any[] }> {
    // Get budget details
    const budget = await this.getMonthlyBudget(budgetId, organizationId);
    if (!budget) {
      return { budgeted: 0, actual: 0, remaining: 0, categories: [] };
    }

    // Get actual expenses
    const actualExpenses = await db
      .select({
        category: expenses.category,
        total: sql<number>`sum(cast(amount as decimal))`
      })
      .from(expenses)
      .where(and(eq(expenses.budgetId, budgetId), eq(expenses.organizationId, organizationId)))
      .groupBy(expenses.category);

    const totalBudgeted = parseFloat(budget.totalBudget);
    const totalActual = actualExpenses.reduce((sum, exp) => sum + (exp.total || 0), 0);

    // Create category breakdown
    const categories = [
      { category: 'operational', budgeted: parseFloat(budget.operationalBudget), actual: 0 },
      { category: 'equipment', budgeted: parseFloat(budget.equipmentBudget), actual: 0 },
      { category: 'travel', budgeted: parseFloat(budget.travelBudget), actual: 0 },
      { category: 'medical', budgeted: parseFloat(budget.medicalBudget), actual: 0 },
      { category: 'facilities', budgeted: parseFloat(budget.facilitiesBudget), actual: 0 },
      { category: 'marketing', budgeted: parseFloat(budget.marketingBudget), actual: 0 },
      { category: 'other', budgeted: parseFloat(budget.otherBudget), actual: 0 }
    ];

    // Map actual expenses to categories
    actualExpenses.forEach(expense => {
      const category = categories.find(cat => cat.category === expense.category);
      if (category) {
        category.actual = expense.total || 0;
      }
    });

    // Calculate percentages and remaining amounts
    const categoriesWithMetrics = categories.map(cat => ({
      ...cat,
      remaining: cat.budgeted - cat.actual,
      percentage: cat.budgeted > 0 ? (cat.actual / cat.budgeted) * 100 : 0
    }));

    return {
      budgeted: totalBudgeted,
      actual: totalActual,
      remaining: totalBudgeted - totalActual,
      categories: categoriesWithMetrics
    };
  }

  async getPayrollDetails(month: string, organizationId: number): Promise<{ staff: Array<any>; players: Array<any> }> {
    // Get active staff with salaries
    const staffDetails = await db
      .select({
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
        department: staff.department,
        employmentType: staff.employmentType,
        salary: staff.salary,
        contractEndDate: staff.contractEndDate,
      })
      .from(staff)
      .where(and(eq(staff.isActive, true), eq(staff.organizationId, organizationId)));

    // Get active players with salaries
    const playerDetails = await db
      .select({
        id: players.id,
        firstName: players.firstName,
        lastName: players.lastName,
        position: players.position,
        shirtNumber: players.shirtNumber,
        monthlySalary: players.monthlySalary,
        contractEndDate: players.contractEndDate,
      })
      .from(players)
      .where(and(eq(players.isActive, true), eq(players.organizationId, organizationId)));

    return {
      staff: staffDetails.map(s => ({
        ...s,
        salary: Number(s.salary || 0)
      })),
      players: playerDetails.map(p => ({
        ...p,
        monthlySalary: Number(p.monthlySalary || 0)
      }))
    };
  }

  async getMonthlyBudgetBreakdown(budgetId: number, organizationId: number): Promise<Array<any>> {
    // Get the budget
    const budget = await this.getMonthlyBudget(budgetId, organizationId);
    if (!budget) {
      return [];
    }

    // Parse the fiscal year (e.g., "2025-26")
    const totalBudget = parseFloat(budget.totalBudget);
    const monthlyAllocation = totalBudget / 12;

    // Get expenses grouped by month for this budget
    const monthlyExpenses = await db
      .select({
        month: sql<string>`to_char(to_date(${expenses.expenseDate}, 'YYYY-MM-DD'), 'Month')`,
        total: sql<number>`sum(cast(amount as decimal))`
      })
      .from(expenses)
      .where(eq(expenses.budgetId, budgetId))
      .groupBy(sql`to_char(to_date(${expenses.expenseDate}, 'YYYY-MM-DD'), 'Month')`);

    // Create 12 months breakdown (fiscal year: July to June)
    const months = [
      'July', 'August', 'September', 'October', 'November', 'December',
      'January', 'February', 'March', 'April', 'May', 'June'
    ];

    return months.map(month => {
      const expenseData = monthlyExpenses.find(e => e.month?.trim() === month);
      const spent = expenseData?.total || 0;

      return {
        month,
        allocated: monthlyAllocation,
        spent,
        remaining: monthlyAllocation - spent,
        percentage: monthlyAllocation > 0 ? (spent / monthlyAllocation) * 100 : 0
      };
    });
  }


  // Performance Reactions Methods
  async getPerformanceReactions(playerId?: number, performanceType?: string): Promise<PerformanceReaction[]> {
    const conditions = [];

    if (playerId) {
      conditions.push(eq(performanceReactions.playerId, playerId));
    }

    if (performanceType) {
      conditions.push(eq(performanceReactions.performanceType, performanceType));
    }

    if (conditions.length > 0) {
      return await db.select().from(performanceReactions).where(and(...conditions)).orderBy(sql`created_at DESC`);
    }

    return await db.select().from(performanceReactions).orderBy(sql`created_at DESC`);
  }

  async getPlayerReactionsSummary(playerId: number): Promise<any> {
    const reactions = await db
      .select()
      .from(performanceReactions)
      .where(eq(performanceReactions.playerId, playerId));

    const summary = {
      totalReactions: reactions.length,
      positiveReactions: reactions.filter(r => r.isPositive).length,
      negativeReactions: reactions.filter(r => !r.isPositive).length,
      avgIntensity: reactions.length > 0 ? reactions.reduce((sum, r) => sum + r.intensity, 0) / reactions.length : 0,
      recentReactions: reactions.slice(0, 10), // Last 10 reactions
      categoryBreakdown: this.getCategoryBreakdown(reactions),
      emojiFrequency: this.getEmojiFrequency(reactions)
    };

    return summary;
  }

  private getCategoryBreakdown(reactions: PerformanceReaction[]) {
    const categories = ['effort', 'skill', 'attitude', 'fitness', 'teamwork', 'improvement'];
    return categories.map(category => ({
      category,
      count: reactions.filter(r => r.category === category).length,
      positive: reactions.filter(r => r.category === category && r.isPositive).length,
      negative: reactions.filter(r => r.category === category && !r.isPositive).length
    }));
  }

  private getEmojiFrequency(reactions: PerformanceReaction[]) {
    const emojiCounts: Record<string, number> = {};
    reactions.forEach(r => {
      emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
    });
    return Object.entries(emojiCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 emojis
  }

  async createPerformanceReaction(reaction: InsertPerformanceReaction): Promise<PerformanceReaction> {
    const [newReaction] = await db.insert(performanceReactions).values(reaction).returning();
    return newReaction;
  }

  async deletePerformanceReaction(id: number): Promise<boolean> {
    const result = await db.delete(performanceReactions).where(eq(performanceReactions.id, id));
    return result.rowCount! > 0;
  }

  // Tactical Boards
  async getTacticalBoards(organizationId: number): Promise<TacticalBoard[]> {
    return await db.select().from(tacticalBoards).where(eq(tacticalBoards.organizationId, organizationId)).orderBy(sql`updated_at DESC`);
  }

  async getTacticalBoard(id: number, organizationId: number): Promise<TacticalBoard | undefined> {
    const [board] = await db.select().from(tacticalBoards).where(and(eq(tacticalBoards.id, id), eq(tacticalBoards.organizationId, organizationId)));
    return board || undefined;
  }

  async createTacticalBoard(board: InsertTacticalBoard, organizationId: number): Promise<TacticalBoard> {
    const [created] = await db.insert(tacticalBoards).values({ ...board, organizationId } as any).returning();
    return created;
  }

  async updateTacticalBoard(id: number, board: Partial<InsertTacticalBoard>, organizationId: number): Promise<TacticalBoard | undefined> {
    const [updated] = await db
      .update(tacticalBoards)
      .set({ ...board, updatedAt: new Date() } as any)
      .where(and(eq(tacticalBoards.id, id), eq(tacticalBoards.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  async deleteTacticalBoard(id: number, organizationId: number): Promise<boolean> {
    const result = await db.delete(tacticalBoards).where(and(eq(tacticalBoards.id, id), eq(tacticalBoards.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Achievement System Implementation
  async getAchievements(organizationId: number): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT at.*,
             ac.criteria_type,
             ac.threshold,
             ac.timeframe,
             ar.reward_type,
             ar.reward_value,
             ar.description as reward_description
      FROM achievement_types at
      LEFT JOIN achievement_criteria ac ON at.id = ac.achievement_type_id
      LEFT JOIN achievement_rewards ar ON at.id = ar.achievement_type_id
      WHERE at.is_active = true AND at.organization_id = ${organizationId}
      ORDER BY at.rarity, at.points
    `);
    return result.rows;
  }

  async getPlayerAchievements(playerId: number, organizationId: number): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT at.*,
             pa.progress,
             pa.is_completed,
             pa.completed_at,
             pa.current_streak,
             pa.best_streak,
             ac.criteria_type,
             ac.threshold,
             ac.timeframe,
             ar.reward_type,
             ar.reward_value
      FROM achievement_types at
      LEFT JOIN player_achievements pa ON at.id = pa.achievement_type_id AND pa.player_id = ${playerId}
      LEFT JOIN achievement_criteria ac ON at.id = ac.achievement_type_id
      LEFT JOIN achievement_rewards ar ON at.id = ar.achievement_type_id
      WHERE at.is_active = true AND at.organization_id = ${organizationId}
      ORDER BY at.rarity, at.points
    `);
    return result.rows;
  }

  async updateAchievementProgress(playerId: number, achievementTypeId: number, value: number, eventType: string, organizationId: number, eventId?: number): Promise<any> {
    // Confirm the achievement type belongs to the caller's organization before writing anything.
    const owningType = await db.execute(sql`
      SELECT id FROM achievement_types WHERE id = ${achievementTypeId} AND organization_id = ${organizationId}
    `);
    if (owningType.rows.length === 0) {
      throw new Error("Achievement type not found");
    }

    // Insert achievement progress record
    await db.execute(sql`
      INSERT INTO achievement_progress (player_id, achievement_type_id, date, value, event_type, event_id)
      VALUES (${playerId}, ${achievementTypeId}, CURRENT_DATE, ${value}, ${eventType}, ${eventId || null})
    `);

    // Update or create player achievement record
    const existingAchievement = await db.execute(sql`
      SELECT * FROM player_achievements 
      WHERE player_id = ${playerId} AND achievement_type_id = ${achievementTypeId}
    `);

    if (existingAchievement.rows.length > 0) {
      // Update existing achievement
      const currentProgress = Number(existingAchievement.rows[0].progress) + value;

      // Check if achievement should be completed
      const criteria = await db.execute(sql`
        SELECT threshold FROM achievement_criteria 
        WHERE achievement_type_id = ${achievementTypeId}
      `);

      const threshold = Number(criteria.rows[0]?.threshold || 0);
      const isCompleted = currentProgress >= threshold;

      await db.execute(sql`
        UPDATE player_achievements 
        SET progress = ${currentProgress},
            is_completed = ${isCompleted},
            completed_at = ${isCompleted ? sql`NOW()` : sql`NULL`},
            updated_at = NOW()
        WHERE player_id = ${playerId} AND achievement_type_id = ${achievementTypeId}
      `);
    } else {
      // Create new achievement record
      const criteria = await db.execute(sql`
        SELECT threshold FROM achievement_criteria 
        WHERE achievement_type_id = ${achievementTypeId}
      `);

      const threshold = Number(criteria.rows[0]?.threshold || 0);
      const isCompleted = value >= threshold;

      await db.execute(sql`
        INSERT INTO player_achievements (player_id, achievement_type_id, progress, is_completed, completed_at)
        VALUES (${playerId}, ${achievementTypeId}, ${value}, ${isCompleted}, ${isCompleted ? sql`NOW()` : sql`NULL`})
      `);
    }

    return { success: true, playerId, achievementTypeId, value };
  }

  async getAchievementLeaderboard(organizationId: number): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT p.first_name, p.last_name, p.first_name_ar, p.last_name_ar, p.profile_picture,
             COUNT(pa.is_completed) FILTER (WHERE pa.is_completed = true) as completed_achievements,
             COALESCE(SUM(at.points) FILTER (WHERE pa.is_completed = true), 0) as total_points,
             MAX(pa.completed_at) as last_achievement_date
      FROM players p
      LEFT JOIN player_achievements pa ON p.id = pa.player_id
      LEFT JOIN achievement_types at ON pa.achievement_type_id = at.id
      WHERE p.organization_id = ${organizationId}
      GROUP BY p.id, p.first_name, p.last_name, p.first_name_ar, p.last_name_ar, p.profile_picture
      ORDER BY total_points DESC, completed_achievements DESC
      LIMIT 20
    `);
    return result.rows;
  }

  async initializePlayerAchievements(organizationId: number): Promise<any> {
    // Get all players and achievement types for this organization only
    const allPlayers = await db.select().from(players).where(eq(players.organizationId, organizationId));
    const achievements = await db.execute(sql`SELECT id FROM achievement_types WHERE is_active = true AND organization_id = ${organizationId}`);

    let initialized = 0;

    for (const player of allPlayers) {
      for (const achievement of achievements.rows) {
        // Check if player achievement already exists
        const existing = await db.execute(sql`
          SELECT id FROM player_achievements 
          WHERE player_id = ${player.id} AND achievement_type_id = ${achievement.id}
        `);

        if (existing.rows.length === 0) {
          // Initialize with zero progress
          await db.execute(sql`
            INSERT INTO player_achievements (player_id, achievement_type_id, progress, is_completed)
            VALUES (${player.id}, ${achievement.id}, 0, false)
          `);
          initialized++;
        }
      }
    }

    return { message: `Initialized ${initialized} player achievements`, count: initialized };
  }

  async getPlayerInvitations(organizationId: number): Promise<(PlayerInvitation & { team?: Team })[]> {
    await this.ensurePlayerInvitationsTable();
    const results = await db
      .select()
      .from(playerInvitations)
      .leftJoin(teams, eq(playerInvitations.teamId, teams.id))
      .where(eq(playerInvitations.organizationId, organizationId));
    return results.map((row) => ({
      ...row.player_invitations,
      team: row.teams ?? undefined,
    }));
  }

  async getPlayerInvitation(id: number, organizationId: number): Promise<PlayerInvitation | undefined> {
    await this.ensurePlayerInvitationsTable();
    const [invitation] = await db.select().from(playerInvitations).where(and(eq(playerInvitations.id, id), eq(playerInvitations.organizationId, organizationId)));
    return invitation || undefined;
  }

  async getPlayerInvitationByToken(token: string): Promise<(PlayerInvitation & { team?: Team }) | undefined> {
    await this.ensurePlayerInvitationsTable();
    const [result] = await db
      .select()
      .from(playerInvitations)
      .leftJoin(teams, eq(playerInvitations.teamId, teams.id))
      .where(eq(playerInvitations.token, token));
    return result ? { ...result.player_invitations, team: result.teams ?? undefined } : undefined;
  }

  async createPlayerInvitation(insertInvitation: InsertPlayerInvitation, organizationId: number): Promise<PlayerInvitation> {
    await this.ensurePlayerInvitationsTable();
    const [invitation] = await db.insert(playerInvitations).values({ ...insertInvitation, organizationId }).returning();
    return invitation;
  }

  async updatePlayerInvitation(id: number, updateData: Partial<InsertPlayerInvitation> & { usedAt?: Date | null }, organizationId: number): Promise<PlayerInvitation | undefined> {
    await this.ensurePlayerInvitationsTable();
    const [invitation] = await db
      .update(playerInvitations)
      .set(updateData)
      .where(and(eq(playerInvitations.id, id), eq(playerInvitations.organizationId, organizationId)))
      .returning();
    return invitation || undefined;
  }

  async deletePlayerInvitation(id: number, organizationId: number): Promise<boolean> {
    await this.ensurePlayerInvitationsTable();
    const result = await db.delete(playerInvitations).where(and(eq(playerInvitations.id, id), eq(playerInvitations.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getEmployeeInvitationByToken(token: string): Promise<EmployeeInvitation | undefined> {
    await this.ensureEmployeeInvitationsTable();
    const [invitation] = await db
      .select()
      .from(employeeInvitations)
      .where(eq(employeeInvitations.token, token));
    return invitation || undefined;
  }

  async createEmployeeInvitation(insertInvitation: InsertEmployeeInvitation, organizationId: number): Promise<EmployeeInvitation> {
    await this.ensureEmployeeInvitationsTable();
    const [invitation] = await db.insert(employeeInvitations).values({ ...insertInvitation, organizationId }).returning();
    return invitation;
  }

  async updateEmployeeInvitation(id: number, updateData: Partial<InsertEmployeeInvitation> & { usedAt?: Date | null }, organizationId: number): Promise<EmployeeInvitation | undefined> {
    await this.ensureEmployeeInvitationsTable();
    const [invitation] = await db
      .update(employeeInvitations)
      .set(updateData)
      .where(and(eq(employeeInvitations.id, id), eq(employeeInvitations.organizationId, organizationId)))
      .returning();
    return invitation || undefined;
  }

  async getRegistrationRemindersForUser(userId: number): Promise<RegistrationReminder[]> {
    await this.ensureRegistrationRemindersTable();
    return await db
      .select()
      .from(registrationReminders)
      .where(eq(registrationReminders.targetUserId, userId))
      .orderBy(sql`${registrationReminders.createdAt} DESC`);
  }

  async createRegistrationReminder(insertReminder: InsertRegistrationReminder): Promise<RegistrationReminder> {
    await this.ensureRegistrationRemindersTable();
    const [reminder] = await db.insert(registrationReminders).values(insertReminder).returning();
    return reminder;
  }
}

// Switch to DatabaseStorage for data persistence
// Switch to DatabaseStorage for data persistence, or MemStorage if no DB
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
