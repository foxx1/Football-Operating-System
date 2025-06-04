import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPlayerSchema, insertTeamSchema, insertTrainingSessionSchema,
  insertSessionAttendanceSchema, insertTacticalFormationSchema, insertPlayerStatsSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Players
  app.get("/api/players", async (req, res) => {
    try {
      const players = await storage.getPlayers();
      res.json(players);
    } catch (error) {
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
      const validatedData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(validatedData);
      res.status(201).json(player);
    } catch (error) {
      res.status(400).json({ message: "Invalid player data" });
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

  // Dashboard Stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const players = await storage.getPlayers();
      const teams = await storage.getTeams();
      const sessions = await storage.getTrainingSessions();
      
      const today = new Date().toISOString().split('T')[0];
      const todaySessions = sessions.filter(s => s.date === today);
      const upcomingSessions = sessions.filter(s => s.date >= today).slice(0, 3);
      
      const stats = {
        totalPlayers: players.length,
        activeTeams: teams.length,
        weeklySessions: sessions.filter(s => {
          const sessionDate = new Date(s.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return sessionDate >= weekAgo;
        }).length,
        attendanceRate: 92, // This would be calculated from actual attendance data
        upcomingSessions: upcomingSessions.map(session => ({
          ...session,
          confirmedPlayers: Math.floor(Math.random() * 20) + 15, // Mock data for demo
          totalPlayers: 22
        }))
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
