import {
  users, players, teams, teamPlayers, trainingSessions, sessionAttendance, 
  tacticalFormations, playerStats, staff, matches, matchSquads, analyticsReports, systemSettings,
  wearableDevices, wearableData, performanceMetrics, monthlyBudgets, expenses, playerContracts,
  type User, type InsertUser, type Player, type InsertPlayer,
  type Team, type InsertTeam, type TeamPlayer, type InsertTeamPlayer,
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
  type PlayerContract, type InsertPlayerContract
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private players: Map<number, Player>;
  private teams: Map<number, Team>;
  private teamPlayers: Map<number, TeamPlayer>;
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
}

// Switch to DatabaseStorage for data persistence
export const storage = new DatabaseStorage();
