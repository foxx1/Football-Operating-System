import {
  users, players, teams, teamPlayers, trainingSessions, sessionAttendance, 
  tacticalFormations, playerStats,
  type User, type InsertUser, type Player, type InsertPlayer,
  type Team, type InsertTeam, type TeamPlayer, type InsertTeamPlayer,
  type TrainingSession, type InsertTrainingSession,
  type SessionAttendance, type InsertSessionAttendance,
  type TacticalFormation, type InsertTacticalFormation,
  type PlayerStats, type InsertPlayerStats
} from "@shared/schema";

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
    this.currentIds = {
      users: 1,
      players: 1,
      teams: 1,
      teamPlayers: 1,
      trainingSessions: 1,
      sessionAttendance: 1,
      tacticalFormations: 1,
      playerStats: 1,
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
}

export const storage = new MemStorage();
