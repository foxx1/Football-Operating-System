import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPlayerSchema, insertTeamSchema, insertTrainingSessionSchema,
  insertSessionAttendanceSchema, insertTacticalFormationSchema, insertPlayerStatsSchema,
  insertStaffSchema, insertMatchSchema, insertMatchSquadSchema,
  insertAnalyticsReportSchema, insertSystemSettingsSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Players
  app.get("/api/players", async (req, res) => {
    try {
      const players = await storage.getPlayers();
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.get("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const player = await storage.getPlayer(id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch player" });
    }
  });

  app.post("/api/players", async (req, res) => {
    try {
      console.log("POST /api/players - Request body:", JSON.stringify(req.body, null, 2));
      const validatedData = insertPlayerSchema.parse(req.body);
      console.log("POST /api/players - Validated data:", JSON.stringify(validatedData, null, 2));
      const player = await storage.createPlayer(validatedData);
      res.status(201).json(player);
    } catch (error) {
      console.error("POST /api/players - Error:", error);
      res.status(400).json({ message: "Invalid player data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPlayerSchema.partial().parse(req.body);
      const player = await storage.updatePlayer(id, validatedData);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      res.status(400).json({ message: "Invalid player data" });
    }
  });

  app.delete("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePlayer(id);
      if (!success) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete player" });
    }
  });

  // Teams
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.get("/api/teams/:id/players", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const teamPlayers = await storage.getTeamPlayers(id);
      res.json(teamPlayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team players" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const validatedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      res.status(400).json({ message: "Invalid team data" });
    }
  });

  app.post("/api/teams/:teamId/players/:playerId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const playerId = parseInt(req.params.playerId);
      const teamPlayer = await storage.addPlayerToTeam({ teamId, playerId, isStarter: false });
      res.status(201).json(teamPlayer);
    } catch (error) {
      res.status(400).json({ message: "Failed to add player to team" });
    }
  });

  app.delete("/api/teams/:teamId/players/:playerId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const playerId = parseInt(req.params.playerId);
      const success = await storage.removePlayerFromTeam(teamId, playerId);
      if (!success) {
        return res.status(404).json({ message: "Player not found in team" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove player from team" });
    }
  });

  // Training Sessions
  app.get("/api/training-sessions", async (req, res) => {
    try {
      const sessions = await storage.getTrainingSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch training sessions" });
    }
  });

  app.get("/api/training-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getTrainingSession(id);
      if (!session) {
        return res.status(404).json({ message: "Training session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch training session" });
    }
  });

  app.post("/api/training-sessions", async (req, res) => {
    try {
      const validatedData = insertTrainingSessionSchema.parse(req.body);
      const session = await storage.createTrainingSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid training session data" });
    }
  });

  app.put("/api/training-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTrainingSessionSchema.partial().parse(req.body);
      const session = await storage.updateTrainingSession(id, validatedData);
      if (!session) {
        return res.status(404).json({ message: "Training session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid training session data" });
    }
  });

  app.delete("/api/training-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTrainingSession(id);
      if (!success) {
        return res.status(404).json({ message: "Training session not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete training session" });
    }
  });

  // Session Attendance
  app.get("/api/training-sessions/:id/attendance", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const attendance = await storage.getSessionAttendance(sessionId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session attendance" });
    }
  });

  app.post("/api/session-attendance", async (req, res) => {
    try {
      const validatedData = insertSessionAttendanceSchema.parse(req.body);
      const attendance = await storage.markAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Invalid attendance data" });
    }
  });

  // Tactical Formations
  app.get("/api/teams/:id/formations", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const formations = await storage.getFormations(teamId);
      res.json(formations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch formations" });
    }
  });

  app.post("/api/formations", async (req, res) => {
    try {
      const validatedData = insertTacticalFormationSchema.parse(req.body);
      const formation = await storage.createFormation(validatedData);
      res.status(201).json(formation);
    } catch (error) {
      res.status(400).json({ message: "Invalid formation data" });
    }
  });

  app.put("/api/formations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTacticalFormationSchema.partial().parse(req.body);
      const formation = await storage.updateFormation(id, validatedData);
      if (!formation) {
        return res.status(404).json({ message: "Formation not found" });
      }
      res.json(formation);
    } catch (error) {
      res.status(400).json({ message: "Invalid formation data" });
    }
  });

  app.delete("/api/formations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFormation(id);
      if (!success) {
        return res.status(404).json({ message: "Formation not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete formation" });
    }
  });

  // Player Stats
  app.get("/api/players/:id/stats", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const stats = await storage.getPlayerStats(playerId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch player stats" });
    }
  });

  app.post("/api/player-stats", async (req, res) => {
    try {
      const validatedData = insertPlayerStatsSchema.parse(req.body);
      const stats = await storage.createPlayerStats(validatedData);
      res.status(201).json(stats);
    } catch (error) {
      res.status(400).json({ message: "Invalid player stats data" });
    }
  });

  // Staff Management
  app.get("/api/staff", async (req, res) => {
    try {
      const staff = await storage.getStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const staff = await storage.getStaffMember(id);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff member" });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const validatedData = insertStaffSchema.parse(req.body);
      const staff = await storage.createStaff(validatedData);
      res.status(201).json(staff);
    } catch (error) {
      res.status(400).json({ message: "Invalid staff data" });
    }
  });

  app.patch("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertStaffSchema.partial().parse(req.body);
      const staff = await storage.updateStaff(id, validatedData);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(staff);
    } catch (error) {
      res.status(400).json({ message: "Invalid staff data" });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStaff(id);
      if (!success) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  // Matches
  app.get("/api/matches", async (req, res) => {
    try {
      const matches = await storage.getMatches();
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.get("/api/matches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const match = await storage.getMatch(id);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch match" });
    }
  });

  app.post("/api/matches", async (req, res) => {
    try {
      const validatedData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(validatedData);
      res.status(201).json(match);
    } catch (error) {
      res.status(400).json({ message: "Invalid match data" });
    }
  });

  app.patch("/api/matches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMatchSchema.partial().parse(req.body);
      const match = await storage.updateMatch(id, validatedData);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.json(match);
    } catch (error) {
      res.status(400).json({ message: "Invalid match data" });
    }
  });

  app.delete("/api/matches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMatch(id);
      if (!success) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete match" });
    }
  });

  // Analytics Reports
  app.get("/api/analytics", async (req, res) => {
    try {
      const reports = await storage.getAnalyticsReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics reports" });
    }
  });

  app.post("/api/analytics", async (req, res) => {
    try {
      const validatedData = insertAnalyticsReportSchema.parse(req.body);
      const report = await storage.createAnalyticsReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "Invalid analytics report data" });
    }
  });

  app.delete("/api/analytics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAnalyticsReport(id);
      if (!success) {
        return res.status(404).json({ message: "Analytics report not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete analytics report" });
    }
  });

  // System Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSystemSettingsSchema.parse(req.body);
      const setting = await storage.createSystemSetting(validatedData);
      res.status(201).json(setting);
    } catch (error) {
      res.status(400).json({ message: "Invalid setting data" });
    }
  });

  app.patch("/api/settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSystemSettingsSchema.partial().parse(req.body);
      const setting = await storage.updateSystemSetting(id, validatedData);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(400).json({ message: "Invalid setting data" });
    }
  });

  // Dashboard Stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const players = await storage.getPlayers();
      const teams = await storage.getTeams();
      const sessions = await storage.getTrainingSessions();
      const staff = await storage.getStaff();
      const matches = await storage.getMatches();
      
      const today = new Date().toISOString().split('T')[0];
      const upcomingSessions = sessions.filter(s => s.date >= today).slice(0, 3);
      const upcomingMatches = matches.filter(m => m.date >= today && m.status === 'scheduled').slice(0, 3);
      
      const stats = {
        totalPlayers: players.filter(p => p.isActive).length,
        activeTeams: teams.filter(t => t.isActive).length,
        totalStaff: staff.filter(s => s.isActive).length,
        upcomingMatches: upcomingMatches.length,
        weeklySessions: sessions.filter(s => {
          const sessionDate = new Date(s.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return sessionDate >= weekAgo;
        }).length,
        upcomingSessions: upcomingSessions,
        upcomingFixtures: upcomingMatches
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
