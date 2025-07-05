import {
  users, players, teams, teamPlayers, teamStaff, trainingSessions, sessionAttendance, 
  tacticalFormations, playerStats, staff, matches, matchSquads, analyticsReports, systemSettings,
  wearableDevices, wearableData, performanceMetrics, monthlyBudgets, expenses, playerContracts,
  performanceReactions,
  type User, type InsertUser, type Player, type InsertPlayer,
  type Team, type InsertTeam, type TeamPlayer, type InsertTeamPlayer,
  type TeamStaff, type InsertTeamStaff,
  type TrainingSession, type InsertTrainingSession,
  type SessionAttendance, type InsertSessionAttendance,
  type TacticalFormation, type InsertTacticalFormation,
  type PlayerStats, type InsertPlayerStats,
  type Staff, type InsertStaff, type Match, type InsertMatch,
  type MatchSquad, type InsertMatchSquad, type AnalyticsReport, type InsertAnalyticsReport,
  type SystemSettings, type InsertSystemSettings,
  type WearableDevice, type InsertWearableDevice,
  type WearableData, type InsertWearableData,
  type PerformanceMetrics, type InsertPerformanceMetrics,
  type MonthlyBudget, type InsertMonthlyBudget,
  type Expense, type InsertExpense,
  type PlayerContract, type InsertPlayerContract,
  type PerformanceReaction, type InsertPerformanceReaction
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Players
  getPlayers(): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined>;
  deletePlayer(id: number): Promise<boolean>;

  // Teams
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;

  // Team Players
  getTeamPlayers(teamId: number): Promise<(TeamPlayer & { player: Player })[]>;
  addPlayerToTeam(teamPlayer: InsertTeamPlayer): Promise<TeamPlayer>;
  removePlayerFromTeam(teamId: number, playerId: number): Promise<boolean>;

  // Team Staff
  getTeamStaff(teamId: number): Promise<(TeamStaff & { staff: Staff })[]>;
  addStaffToTeam(teamStaff: InsertTeamStaff): Promise<TeamStaff>;
  removeStaffFromTeam(teamId: number, staffId: number): Promise<boolean>;

  // Training Sessions
  getTrainingSessions(): Promise<TrainingSession[]>;
  getTrainingSession(id: number): Promise<TrainingSession | undefined>;
  createTrainingSession(session: InsertTrainingSession): Promise<TrainingSession>;
  updateTrainingSession(id: number, session: Partial<InsertTrainingSession>): Promise<TrainingSession | undefined>;
  deleteTrainingSession(id: number): Promise<boolean>;

  // Session Attendance
  getSessionAttendance(sessionId: number): Promise<(SessionAttendance & { player: Player })[]>;
  markAttendance(attendance: InsertSessionAttendance): Promise<SessionAttendance>;
  updateAttendance(id: number, attendance: Partial<InsertSessionAttendance>): Promise<SessionAttendance | undefined>;

  // Tactical Formations
  getFormations(teamId: number): Promise<TacticalFormation[]>;
  createFormation(formation: InsertTacticalFormation): Promise<TacticalFormation>;
  updateFormation(id: number, formation: Partial<InsertTacticalFormation>): Promise<TacticalFormation | undefined>;
  deleteFormation(id: number): Promise<boolean>;

  // Player Stats
  getPlayerStats(playerId: number): Promise<PlayerStats[]>;
  createPlayerStats(stats: InsertPlayerStats): Promise<PlayerStats>;
  updatePlayerStats(id: number, stats: Partial<InsertPlayerStats>): Promise<PlayerStats | undefined>;

  // Staff
  getStaff(): Promise<Staff[]>;
  getStaffMember(id: number): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: number, staff: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaff(id: number): Promise<boolean>;

  // Matches
  getMatches(): Promise<Match[]>;
  getMatch(id: number): Promise<Match | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, match: Partial<InsertMatch>): Promise<Match | undefined>;
  deleteMatch(id: number): Promise<boolean>;

  // Match Squads
  getMatchSquad(matchId: number): Promise<(MatchSquad & { player: Player })[]>;
  addPlayerToMatchSquad(matchSquad: InsertMatchSquad): Promise<MatchSquad>;
  updateMatchSquad(id: number, matchSquad: Partial<InsertMatchSquad>): Promise<MatchSquad | undefined>;

  // Analytics Reports
  getAnalyticsReports(): Promise<AnalyticsReport[]>;
  getAnalyticsReport(id: number): Promise<AnalyticsReport | undefined>;
  createAnalyticsReport(report: InsertAnalyticsReport): Promise<AnalyticsReport>;
  updateAnalyticsReport(id: number, report: Partial<InsertAnalyticsReport>): Promise<AnalyticsReport | undefined>;
  deleteAnalyticsReport(id: number): Promise<boolean>;

  // System Settings
  getSystemSettings(): Promise<SystemSettings[]>;
  getSystemSetting(id: number): Promise<SystemSettings | undefined>;
  createSystemSetting(setting: InsertSystemSettings): Promise<SystemSettings>;
  updateSystemSetting(id: number, setting: Partial<InsertSystemSettings>): Promise<SystemSettings | undefined>;

  // Wearable Devices
  getWearableDevices(playerId?: number): Promise<WearableDevice[]>;
  getWearableDevice(id: number): Promise<WearableDevice | undefined>;
  createWearableDevice(device: InsertWearableDevice): Promise<WearableDevice>;
  updateWearableDevice(id: number, device: Partial<InsertWearableDevice>): Promise<WearableDevice | undefined>;
  deleteWearableDevice(id: number): Promise<boolean>;

  // Wearable Data
  getWearableData(deviceId?: number, playerId?: number, dataType?: string): Promise<WearableData[]>;
  createWearableData(data: InsertWearableData): Promise<WearableData>;
  getLatestWearableData(playerId: number, dataType: string): Promise<WearableData | undefined>;

  // Performance Metrics
  getPerformanceMetrics(playerId?: number, metricType?: string): Promise<PerformanceMetrics[]>;
  createPerformanceMetrics(metrics: InsertPerformanceMetrics): Promise<PerformanceMetrics>;
  getPlayerPerformanceTrends(playerId: number, days: number): Promise<PerformanceMetrics[]>;

  // Budget Management
  getMonthlyBudgets(): Promise<MonthlyBudget[]>;
  getMonthlyBudget(id: number): Promise<MonthlyBudget | undefined>;
  getMonthlyBudgetByMonth(month: string): Promise<MonthlyBudget | undefined>;
  createMonthlyBudget(budget: InsertMonthlyBudget): Promise<MonthlyBudget>;
  updateMonthlyBudget(id: number, budget: Partial<InsertMonthlyBudget>): Promise<MonthlyBudget | undefined>;
  deleteMonthlyBudget(id: number): Promise<boolean>;

  // Expense Management  
  getExpenses(budgetId?: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  approveExpense(id: number, approvedBy: number): Promise<Expense | undefined>;

  // Player Contracts
  getPlayerContracts(playerId?: number): Promise<PlayerContract[]>;
  getPlayerContract(id: number): Promise<PlayerContract | undefined>;
  createPlayerContract(contract: InsertPlayerContract): Promise<PlayerContract>;
  updatePlayerContract(id: number, contract: Partial<InsertPlayerContract>): Promise<PlayerContract | undefined>;
  deletePlayerContract(id: number): Promise<boolean>;

  // Budget Summary Methods
  getTotalMonthlySalaries(month: string): Promise<{ staff: number; players: number; total: number }>;
  getBudgetVsActualExpenses(budgetId: number): Promise<{ budgeted: number; actual: number; remaining: number; categories: any[] }>;

  // Performance Reactions
  getPerformanceReactions(playerId?: number, performanceType?: string): Promise<PerformanceReaction[]>;
  getPlayerReactionsSummary(playerId: number): Promise<any>;
  createPerformanceReaction(reaction: InsertPerformanceReaction): Promise<PerformanceReaction>;
  deletePerformanceReaction(id: number): Promise<boolean>;

  // Achievement System
  getAchievements(): Promise<any[]>;
  getPlayerAchievements(playerId: number): Promise<any[]>;
  updateAchievementProgress(playerId: number, achievementTypeId: number, value: number, eventType: string, eventId?: number): Promise<any>;
  getAchievementLeaderboard(): Promise<any[]>;
  initializePlayerAchievements(): Promise<any>;
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
  private analyticsReports: Map<number, AnalyticsReport>;
  private systemSettings: Map<number, SystemSettings>;
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
    this.analyticsReports = new Map();
    this.systemSettings = new Map();
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
      analyticsReports: 1,
      systemSettings: 1,
    };

    this.seedData();
  }

  private seedData() {
    // Create default coach user
    const coach: User = {
      id: this.currentIds.users++,
      username: "coach",
      password: "password",
      role: "head_coach",
      firstName: "Marcus",
      lastName: "Thompson",
      email: "marcus.thompson@procoach.com",
      createdAt: new Date(),
    };
    this.users.set(coach.id, coach);

    // Create default team
    const firstTeam: Team = {
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
        id: this.currentIds.players++,
        ...playerData,
        dateOfBirth: "1995-01-01",
        nationality: "USA",
        isActive: true,
        height: 180,
        weight: 75,
        phoneNumber: null,
        email: null,
        emergencyContact: null,
        medicalNotes: null,
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
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Players
  async getPlayers(): Promise<Player[]> {
    return Array.from(this.players.values()).filter(p => p.isActive);
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.currentIds.players++;
    const player: Player = { 
      ...insertPlayer, 
      id, 
      createdAt: new Date() 
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: number, updateData: Partial<InsertPlayer>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...updateData };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  async deletePlayer(id: number): Promise<boolean> {
    const player = this.players.get(id);
    if (!player) return false;
    
    const updatedPlayer = { ...player, isActive: false };
    this.players.set(id, updatedPlayer);
    return true;
  }

  // Teams
  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(t => t.isActive);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.currentIds.teams++;
    const team: Team = { 
      ...insertTeam, 
      id, 
      createdAt: new Date() 
    };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: number, updateData: Partial<InsertTeam>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    
    const updatedTeam = { ...team, ...updateData };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const team = this.teams.get(id);
    if (!team) return false;
    
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

  // Training Sessions
  async getTrainingSessions(): Promise<TrainingSession[]> {
    return Array.from(this.trainingSessions.values());
  }

  async getTrainingSession(id: number): Promise<TrainingSession | undefined> {
    return this.trainingSessions.get(id);
  }

  async createTrainingSession(insertSession: InsertTrainingSession): Promise<TrainingSession> {
    const id = this.currentIds.trainingSessions++;
    const session: TrainingSession = { 
      ...insertSession, 
      id, 
      createdAt: new Date() 
    };
    this.trainingSessions.set(id, session);
    return session;
  }

  async updateTrainingSession(id: number, updateData: Partial<InsertTrainingSession>): Promise<TrainingSession | undefined> {
    const session = this.trainingSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updateData };
    this.trainingSessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteTrainingSession(id: number): Promise<boolean> {
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
    const id = this.currentIds.sessionAttendance++;
    const attendance: SessionAttendance = { 
      ...insertAttendance, 
      id, 
      createdAt: new Date() 
    };
    this.sessionAttendance.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: number, updateData: Partial<InsertSessionAttendance>): Promise<SessionAttendance | undefined> {
    const attendance = this.sessionAttendance.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance = { ...attendance, ...updateData };
    this.sessionAttendance.set(id, updatedAttendance);
    return updatedAttendance;
  }

  // Tactical Formations
  async getFormations(teamId: number): Promise<TacticalFormation[]> {
    return Array.from(this.tacticalFormations.values())
      .filter(f => f.teamId === teamId);
  }

  async createFormation(insertFormation: InsertTacticalFormation): Promise<TacticalFormation> {
    const id = this.currentIds.tacticalFormations++;
    const formation: TacticalFormation = { 
      ...insertFormation, 
      id, 
      createdAt: new Date() 
    };
    this.tacticalFormations.set(id, formation);
    return formation;
  }

  async updateFormation(id: number, updateData: Partial<InsertTacticalFormation>): Promise<TacticalFormation | undefined> {
    const formation = this.tacticalFormations.get(id);
    if (!formation) return undefined;
    
    const updatedFormation = { ...formation, ...updateData };
    this.tacticalFormations.set(id, updatedFormation);
    return updatedFormation;
  }

  async deleteFormation(id: number): Promise<boolean> {
    return this.tacticalFormations.delete(id);
  }

  // Player Stats
  async getPlayerStats(playerId: number): Promise<PlayerStats[]> {
    return Array.from(this.playerStats.values())
      .filter(s => s.playerId === playerId);
  }

  async createPlayerStats(insertStats: InsertPlayerStats): Promise<PlayerStats> {
    const id = this.currentIds.playerStats++;
    const stats: PlayerStats = { 
      ...insertStats, 
      id, 
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
  async getStaff(): Promise<Staff[]> {
    return Array.from(this.staff.values());
  }

  async getStaffMember(id: number): Promise<Staff | undefined> {
    return this.staff.get(id);
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const id = this.currentIds.staff++;
    const staff: Staff = { 
      ...insertStaff, 
      id, 
      createdAt: new Date() 
    };
    this.staff.set(id, staff);
    return staff;
  }

  async updateStaff(id: number, updateData: Partial<InsertStaff>): Promise<Staff | undefined> {
    const staff = this.staff.get(id);
    if (!staff) return undefined;
    
    const updatedStaff = { ...staff, ...updateData };
    this.staff.set(id, updatedStaff);
    return updatedStaff;
  }

  async deleteStaff(id: number): Promise<boolean> {
    return this.staff.delete(id);
  }

  // Matches
  async getMatches(): Promise<Match[]> {
    return Array.from(this.matches.values());
  }

  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.currentIds.matches++;
    const match: Match = { 
      ...insertMatch, 
      id, 
      createdAt: new Date() 
    };
    this.matches.set(id, match);
    return match;
  }

  async updateMatch(id: number, updateData: Partial<InsertMatch>): Promise<Match | undefined> {
    const match = this.matches.get(id);
    if (!match) return undefined;
    
    const updatedMatch = { ...match, ...updateData };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  async deleteMatch(id: number): Promise<boolean> {
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
    const id = this.currentIds.matchSquads++;
    const matchSquad: MatchSquad = { 
      ...insertMatchSquad, 
      id, 
      createdAt: new Date() 
    };
    this.matchSquads.set(id, matchSquad);
    return matchSquad;
  }

  async updateMatchSquad(id: number, updateData: Partial<InsertMatchSquad>): Promise<MatchSquad | undefined> {
    const matchSquad = this.matchSquads.get(id);
    if (!matchSquad) return undefined;
    
    const updatedMatchSquad = { ...matchSquad, ...updateData };
    this.matchSquads.set(id, updatedMatchSquad);
    return updatedMatchSquad;
  }

  // Analytics Reports
  async getAnalyticsReports(): Promise<AnalyticsReport[]> {
    return Array.from(this.analyticsReports.values());
  }

  async getAnalyticsReport(id: number): Promise<AnalyticsReport | undefined> {
    return this.analyticsReports.get(id);
  }

  async createAnalyticsReport(insertReport: InsertAnalyticsReport): Promise<AnalyticsReport> {
    const id = this.currentIds.analyticsReports++;
    const report: AnalyticsReport = { 
      ...insertReport, 
      id, 
      createdAt: new Date() 
    };
    this.analyticsReports.set(id, report);
    return report;
  }

  async updateAnalyticsReport(id: number, updateData: Partial<InsertAnalyticsReport>): Promise<AnalyticsReport | undefined> {
    const report = this.analyticsReports.get(id);
    if (!report) return undefined;
    
    const updatedReport = { ...report, ...updateData };
    this.analyticsReports.set(id, updatedReport);
    return updatedReport;
  }

  async deleteAnalyticsReport(id: number): Promise<boolean> {
    return this.analyticsReports.delete(id);
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings[]> {
    return Array.from(this.systemSettings.values());
  }

  async getSystemSetting(id: number): Promise<SystemSettings | undefined> {
    return this.systemSettings.get(id);
  }

  async createSystemSetting(insertSetting: InsertSystemSettings): Promise<SystemSettings> {
    const id = this.currentIds.systemSettings++;
    const setting: SystemSettings = { 
      ...insertSetting, 
      id, 
      updatedAt: new Date() 
    };
    this.systemSettings.set(id, setting);
    return setting;
  }

  async updateSystemSetting(id: number, updateData: Partial<InsertSystemSettings>): Promise<SystemSettings | undefined> {
    const setting = this.systemSettings.get(id);
    if (!setting) return undefined;
    
    const updatedSetting = { ...setting, ...updateData, updatedAt: new Date() };
    this.systemSettings.set(id, updatedSetting);
    return updatedSetting;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getPlayers(): Promise<Player[]> {
    return await db.select().from(players);
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values(insertPlayer)
      .returning();
    return player;
  }

  async updatePlayer(id: number, updateData: Partial<InsertPlayer>): Promise<Player | undefined> {
    const [player] = await db
      .update(players)
      .set(updateData)
      .where(eq(players.id, id))
      .returning();
    return player || undefined;
  }

  async deletePlayer(id: number): Promise<boolean> {
    const result = await db.delete(players).where(eq(players.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values(insertTeam)
      .returning();
    return team;
  }

  async updateTeam(id: number, updateData: Partial<InsertTeam>): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set(updateData)
      .where(eq(teams.id, id))
      .returning();
    return team || undefined;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id));
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

  async getTrainingSessions(): Promise<TrainingSession[]> {
    return await db.select().from(trainingSessions);
  }

  async getTrainingSession(id: number): Promise<TrainingSession | undefined> {
    const [session] = await db.select().from(trainingSessions).where(eq(trainingSessions.id, id));
    return session || undefined;
  }

  async createTrainingSession(insertSession: InsertTrainingSession): Promise<TrainingSession> {
    const [session] = await db
      .insert(trainingSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateTrainingSession(id: number, updateData: Partial<InsertTrainingSession>): Promise<TrainingSession | undefined> {
    const [session] = await db
      .update(trainingSessions)
      .set(updateData)
      .where(eq(trainingSessions.id, id))
      .returning();
    return session || undefined;
  }

  async deleteTrainingSession(id: number): Promise<boolean> {
    const result = await db.delete(trainingSessions).where(eq(trainingSessions.id, id));
    return result.rowCount > 0;
  }

  async getSessionAttendance(sessionId: number): Promise<(SessionAttendance & { player: Player })[]> {
    return await db
      .select()
      .from(sessionAttendance)
      .innerJoin(players, eq(sessionAttendance.playerId, players.id))
      .where(eq(sessionAttendance.sessionId, sessionId));
  }

  async markAttendance(insertAttendance: InsertSessionAttendance): Promise<SessionAttendance> {
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

  async getFormations(teamId: number): Promise<TacticalFormation[]> {
    return await db.select().from(tacticalFormations).where(eq(tacticalFormations.teamId, teamId));
  }

  async createFormation(insertFormation: InsertTacticalFormation): Promise<TacticalFormation> {
    const [formation] = await db
      .insert(tacticalFormations)
      .values(insertFormation)
      .returning();
    return formation;
  }

  async updateFormation(id: number, updateData: Partial<InsertTacticalFormation>): Promise<TacticalFormation | undefined> {
    const [formation] = await db
      .update(tacticalFormations)
      .set(updateData)
      .where(eq(tacticalFormations.id, id))
      .returning();
    return formation || undefined;
  }

  async deleteFormation(id: number): Promise<boolean> {
    const result = await db.delete(tacticalFormations).where(eq(tacticalFormations.id, id));
    return result.rowCount > 0;
  }

  async getPlayerStats(playerId: number): Promise<PlayerStats[]> {
    return await db.select().from(playerStats).where(eq(playerStats.playerId, playerId));
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

  async getStaff(): Promise<Staff[]> {
    return await db.select().from(staff);
  }

  async getStaffMember(id: number): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
    return staffMember || undefined;
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const [staffMember] = await db
      .insert(staff)
      .values(insertStaff)
      .returning();
    return staffMember;
  }

  async updateStaff(id: number, updateData: Partial<InsertStaff>): Promise<Staff | undefined> {
    const [staffMember] = await db
      .update(staff)
      .set(updateData)
      .where(eq(staff.id, id))
      .returning();
    return staffMember || undefined;
  }

  async deleteStaff(id: number): Promise<boolean> {
    const result = await db.delete(staff).where(eq(staff.id, id));
    return result.rowCount > 0;
  }

  async getMatches(): Promise<Match[]> {
    return await db.select().from(matches);
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match || undefined;
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values(insertMatch)
      .returning();
    return match;
  }

  async updateMatch(id: number, updateData: Partial<InsertMatch>): Promise<Match | undefined> {
    const [match] = await db
      .update(matches)
      .set(updateData)
      .where(eq(matches.id, id))
      .returning();
    return match || undefined;
  }

  async deleteMatch(id: number): Promise<boolean> {
    const result = await db.delete(matches).where(eq(matches.id, id));
    return result.rowCount > 0;
  }

  async getMatchSquad(matchId: number): Promise<(MatchSquad & { player: Player })[]> {
    return await db
      .select()
      .from(matchSquads)
      .innerJoin(players, eq(matchSquads.playerId, players.id))
      .where(eq(matchSquads.matchId, matchId));
  }

  async addPlayerToMatchSquad(insertMatchSquad: InsertMatchSquad): Promise<MatchSquad> {
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

  async getAnalyticsReports(): Promise<AnalyticsReport[]> {
    return await db.select().from(analyticsReports);
  }

  async getAnalyticsReport(id: number): Promise<AnalyticsReport | undefined> {
    const [report] = await db.select().from(analyticsReports).where(eq(analyticsReports.id, id));
    return report || undefined;
  }

  async createAnalyticsReport(insertReport: InsertAnalyticsReport): Promise<AnalyticsReport> {
    const [report] = await db
      .insert(analyticsReports)
      .values(insertReport)
      .returning();
    return report;
  }

  async updateAnalyticsReport(id: number, updateData: Partial<InsertAnalyticsReport>): Promise<AnalyticsReport | undefined> {
    const [report] = await db
      .update(analyticsReports)
      .set(updateData)
      .where(eq(analyticsReports.id, id))
      .returning();
    return report || undefined;
  }

  async deleteAnalyticsReport(id: number): Promise<boolean> {
    const result = await db.delete(analyticsReports).where(eq(analyticsReports.id, id));
    return result.rowCount > 0;
  }

  async getSystemSettings(): Promise<SystemSettings[]> {
    return await db.select().from(systemSettings);
  }

  async getSystemSetting(id: number): Promise<SystemSettings | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.id, id));
    return setting || undefined;
  }

  async createSystemSetting(insertSetting: InsertSystemSettings): Promise<SystemSettings> {
    const [setting] = await db
      .insert(systemSettings)
      .values(insertSetting)
      .returning();
    return setting;
  }

  async updateSystemSetting(id: number, updateData: Partial<InsertSystemSettings>): Promise<SystemSettings | undefined> {
    const [setting] = await db
      .update(systemSettings)
      .set(updateData)
      .where(eq(systemSettings.id, id))
      .returning();
    return setting || undefined;
  }

  // Wearable Devices
  async getWearableDevices(playerId?: number): Promise<WearableDevice[]> {
    if (playerId) {
      return await db.select().from(wearableDevices).where(eq(wearableDevices.playerId, playerId));
    }
    return await db.select().from(wearableDevices);
  }

  async getWearableDevice(id: number): Promise<WearableDevice | undefined> {
    const [device] = await db.select().from(wearableDevices).where(eq(wearableDevices.id, id));
    return device || undefined;
  }

  async createWearableDevice(device: InsertWearableDevice): Promise<WearableDevice> {
    const [created] = await db
      .insert(wearableDevices)
      .values(device)
      .returning();
    return created;
  }

  async updateWearableDevice(id: number, device: Partial<InsertWearableDevice>): Promise<WearableDevice | undefined> {
    const [updated] = await db
      .update(wearableDevices)
      .set(device)
      .where(eq(wearableDevices.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWearableDevice(id: number): Promise<boolean> {
    const result = await db.delete(wearableDevices).where(eq(wearableDevices.id, id));
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
  async getMonthlyBudgets(): Promise<MonthlyBudget[]> {
    return await db.select().from(monthlyBudgets).orderBy(monthlyBudgets.month);
  }

  async getMonthlyBudget(id: number): Promise<MonthlyBudget | undefined> {
    const [budget] = await db.select().from(monthlyBudgets).where(eq(monthlyBudgets.id, id));
    return budget || undefined;
  }

  async getMonthlyBudgetByMonth(month: string): Promise<MonthlyBudget | undefined> {
    const [budget] = await db.select().from(monthlyBudgets).where(eq(monthlyBudgets.month, month));
    return budget || undefined;
  }

  async createMonthlyBudget(budget: InsertMonthlyBudget): Promise<MonthlyBudget> {
    const [created] = await db
      .insert(monthlyBudgets)
      .values(budget)
      .returning();
    return created;
  }

  async updateMonthlyBudget(id: number, budget: Partial<InsertMonthlyBudget>): Promise<MonthlyBudget | undefined> {
    const [updated] = await db
      .update(monthlyBudgets)
      .set(budget)
      .where(eq(monthlyBudgets.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMonthlyBudget(id: number): Promise<boolean> {
    const result = await db.delete(monthlyBudgets).where(eq(monthlyBudgets.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Expense Management  
  async getExpenses(budgetId?: number): Promise<Expense[]> {
    if (budgetId) {
      return await db.select().from(expenses).where(eq(expenses.budgetId, budgetId));
    }
    return await db.select().from(expenses);
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [created] = await db
      .insert(expenses)
      .values(expense)
      .returning();
    return created;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db
      .update(expenses)
      .set(expense)
      .where(eq(expenses.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async approveExpense(id: number, approvedBy: number): Promise<Expense | undefined> {
    const [updated] = await db
      .update(expenses)
      .set({ 
        status: "approved",
        approvedBy: approvedBy,
        approvedAt: new Date()
      })
      .where(eq(expenses.id, id))
      .returning();
    return updated || undefined;
  }

  // Player Contracts
  async getPlayerContracts(playerId?: number): Promise<PlayerContract[]> {
    if (playerId) {
      return await db.select().from(playerContracts).where(eq(playerContracts.playerId, playerId));
    }
    return await db.select().from(playerContracts);
  }

  async getPlayerContract(id: number): Promise<PlayerContract | undefined> {
    const [contract] = await db.select().from(playerContracts).where(eq(playerContracts.id, id));
    return contract || undefined;
  }

  async createPlayerContract(contract: InsertPlayerContract): Promise<PlayerContract> {
    const [created] = await db
      .insert(playerContracts)
      .values(contract)
      .returning();
    return created;
  }

  async updatePlayerContract(id: number, contract: Partial<InsertPlayerContract>): Promise<PlayerContract | undefined> {
    const [updated] = await db
      .update(playerContracts)
      .set(contract)
      .where(eq(playerContracts.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePlayerContract(id: number): Promise<boolean> {
    const result = await db.delete(playerContracts).where(eq(playerContracts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Budget Summary Methods
  async getTotalMonthlySalaries(month: string): Promise<{ staff: number; players: number; total: number }> {
    // Get staff salaries
    const staffSalaries = await db
      .select({
        total: sql<number>`sum(salary)`
      })
      .from(staff)
      .where(eq(staff.isActive, true));

    // Get player contract salaries
    const playerSalaries = await db
      .select({
        total: sql<number>`sum(monthly_salary)`
      })
      .from(playerContracts)
      .where(eq(playerContracts.isActive, true));

    const staffTotal = staffSalaries[0]?.total || 0;
    const playersTotal = playerSalaries[0]?.total || 0;

    return {
      staff: staffTotal,
      players: playersTotal,
      total: staffTotal + playersTotal
    };
  }

  async getBudgetVsActualExpenses(budgetId: number): Promise<{ budgeted: number; actual: number; remaining: number; categories: any[] }> {
    // Get budget details
    const budget = await this.getMonthlyBudget(budgetId);
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
      .where(eq(expenses.budgetId, budgetId))
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

  // Performance Reactions Methods
  async getPerformanceReactions(playerId?: number, performanceType?: string): Promise<PerformanceReaction[]> {
    let query = db.select().from(performanceReactions);
    
    if (playerId) {
      query = query.where(eq(performanceReactions.playerId, playerId));
    }
    
    if (performanceType) {
      query = query.where(eq(performanceReactions.performanceType, performanceType));
    }
    
    return await query.orderBy(sql`created_at DESC`);
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
      .sort(([,a], [,b]) => b - a)
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

  // Achievement System Implementation
  async getAchievements(): Promise<any[]> {
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
      WHERE at.is_active = true
      ORDER BY at.rarity, at.points
    `);
    return result.rows;
  }

  async getPlayerAchievements(playerId: number): Promise<any[]> {
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
      WHERE at.is_active = true
      ORDER BY at.rarity, at.points
    `);
    return result.rows;
  }

  async updateAchievementProgress(playerId: number, achievementTypeId: number, value: number, eventType: string, eventId?: number): Promise<any> {
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
      
      const threshold = criteria.rows[0]?.threshold || 0;
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
      
      const threshold = criteria.rows[0]?.threshold || 0;
      const isCompleted = value >= threshold;
      
      await db.execute(sql`
        INSERT INTO player_achievements (player_id, achievement_type_id, progress, is_completed, completed_at)
        VALUES (${playerId}, ${achievementTypeId}, ${value}, ${isCompleted}, ${isCompleted ? sql`NOW()` : sql`NULL`})
      `);
    }

    return { success: true, playerId, achievementTypeId, value };
  }

  async getAchievementLeaderboard(): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT p.first_name, p.last_name, p.profile_picture,
             COUNT(pa.is_completed) FILTER (WHERE pa.is_completed = true) as completed_achievements,
             COALESCE(SUM(at.points) FILTER (WHERE pa.is_completed = true), 0) as total_points,
             MAX(pa.completed_at) as last_achievement_date
      FROM players p
      LEFT JOIN player_achievements pa ON p.id = pa.player_id
      LEFT JOIN achievement_types at ON pa.achievement_type_id = at.id
      GROUP BY p.id, p.first_name, p.last_name, p.profile_picture
      ORDER BY total_points DESC, completed_achievements DESC
      LIMIT 20
    `);
    return result.rows;
  }

  async initializePlayerAchievements(): Promise<any> {
    // Get all players and achievement types
    const players = await db.select().from(players);
    const achievements = await db.execute(sql`SELECT id FROM achievement_types WHERE is_active = true`);
    
    let initialized = 0;
    
    for (const player of players) {
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
}

// Switch to DatabaseStorage for data persistence
export const storage = new DatabaseStorage();
