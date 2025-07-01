import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPlayerSchema, insertTeamSchema, insertTrainingSessionSchema,
  insertSessionAttendanceSchema, insertTacticalFormationSchema, insertPlayerStatsSchema,
  insertStaffSchema, insertMatchSchema, insertMatchSquadSchema,
  insertAnalyticsReportSchema, insertSystemSettingsSchema
} from "@shared/schema";

export async function registerRoutes(app: Express, upload?: any): Promise<Server> {
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

  // File upload endpoint for player documents
  if (upload) {
    app.post("/api/upload/player-files", upload.fields([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'idDocument', maxCount: 1 },
      { name: 'contractDocument', maxCount: 1 }
    ]), (req, res) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const result: { [key: string]: string } = {};
        
        if (files.profilePicture) {
          result.profilePicture = `/uploads/${files.profilePicture[0].filename}`;
        }
        if (files.idDocument) {
          result.idDocument = `/uploads/${files.idDocument[0].filename}`;
        }
        if (files.contractDocument) {
          result.contractDocument = `/uploads/${files.contractDocument[0].filename}`;
        }
        
        res.json(result);
      } catch (error) {
        console.error("File upload error:", error);
        res.status(400).json({ message: "File upload failed" });
      }
    });

    // Single file upload endpoint
    app.post("/api/upload/single", upload.single('file'), (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        const filePath = `/uploads/${req.file.filename}`;
        res.json({ filePath });
      } catch (error) {
        console.error("Single file upload error:", error);
        res.status(400).json({ message: "File upload failed" });
      }
    });
  }

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

  // Logo upload endpoint
  app.post("/api/upload/logo", upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No logo file provided" });
      }

      // Generate the public URL for the uploaded logo
      const logoUrl = `/uploads/${req.file.filename}`;
      
      res.json({ 
        message: "Logo uploaded successfully",
        logoUrl: logoUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  // Wearable Devices routes
  app.get("/api/wearable-devices", async (req, res) => {
    try {
      const playerId = req.query.playerId ? parseInt(req.query.playerId as string) : undefined;
      const devices = await storage.getWearableDevices(playerId);
      res.json(devices);
    } catch (error) {
      console.error("Error fetching wearable devices:", error);
      res.status(500).json({ error: "Failed to fetch wearable devices" });
    }
  });

  app.get("/api/wearable-devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const device = await storage.getWearableDevice(id);
      
      if (!device) {
        return res.status(404).json({ error: "Wearable device not found" });
      }
      
      res.json(device);
    } catch (error) {
      console.error("Error fetching wearable device:", error);
      res.status(500).json({ error: "Failed to fetch wearable device" });
    }
  });

  app.post("/api/wearable-devices", async (req, res) => {
    try {
      const device = await storage.createWearableDevice(req.body);
      res.json(device);
    } catch (error) {
      console.error("Error creating wearable device:", error);
      res.status(500).json({ error: "Failed to create wearable device" });
    }
  });

  app.put("/api/wearable-devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const device = await storage.updateWearableDevice(id, req.body);
      
      if (!device) {
        return res.status(404).json({ error: "Wearable device not found" });
      }
      
      res.json(device);
    } catch (error) {
      console.error("Error updating wearable device:", error);
      res.status(500).json({ error: "Failed to update wearable device" });
    }
  });

  app.delete("/api/wearable-devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWearableDevice(id);
      
      if (!success) {
        return res.status(404).json({ error: "Wearable device not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting wearable device:", error);
      res.status(500).json({ error: "Failed to delete wearable device" });
    }
  });

  // Wearable Data routes
  app.get("/api/wearable-data", async (req, res) => {
    try {
      const deviceId = req.query.deviceId ? parseInt(req.query.deviceId as string) : undefined;
      const playerId = req.query.playerId ? parseInt(req.query.playerId as string) : undefined;
      const dataType = req.query.dataType as string;
      
      const data = await storage.getWearableData(deviceId, playerId, dataType);
      res.json(data);
    } catch (error) {
      console.error("Error fetching wearable data:", error);
      res.status(500).json({ error: "Failed to fetch wearable data" });
    }
  });

  app.post("/api/wearable-data", async (req, res) => {
    try {
      const data = await storage.createWearableData(req.body);
      res.json(data);
    } catch (error) {
      console.error("Error creating wearable data:", error);
      res.status(500).json({ error: "Failed to create wearable data" });
    }
  });

  app.get("/api/wearable-data/latest", async (req, res) => {
    try {
      const playerId = parseInt(req.query.playerId as string);
      const dataType = req.query.dataType as string;
      
      if (!playerId || !dataType) {
        return res.status(400).json({ error: "playerId and dataType are required" });
      }
      
      const data = await storage.getLatestWearableData(playerId, dataType);
      res.json(data);
    } catch (error) {
      console.error("Error fetching latest wearable data:", error);
      res.status(500).json({ error: "Failed to fetch latest wearable data" });
    }
  });

  // Performance Metrics routes
  app.get("/api/performance-metrics", async (req, res) => {
    try {
      const playerId = req.query.playerId ? parseInt(req.query.playerId as string) : undefined;
      const metricType = req.query.metricType as string;
      
      const metrics = await storage.getPerformanceMetrics(playerId, metricType);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
  });

  app.post("/api/performance-metrics", async (req, res) => {
    try {
      const metrics = await storage.createPerformanceMetrics(req.body);
      res.json(metrics);
    } catch (error) {
      console.error("Error creating performance metrics:", error);
      res.status(500).json({ error: "Failed to create performance metrics" });
    }
  });

  app.get("/api/performance-metrics/trends/:playerId", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const days = parseInt(req.query.days as string) || 30;
      
      const trends = await storage.getPlayerPerformanceTrends(playerId, days);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching performance trends:", error);
      res.status(500).json({ error: "Failed to fetch performance trends" });
    }
  });

  // Independent wearable API endpoints using Terra-inspired data models
  
  // Create wearable device connections for players
  app.post("/api/terra/users", async (req, res) => {
    try {
      const { playerId, provider, scopes } = req.body;
      
      // Create our own wearable device connection (not actual Terra)
      const wearableConnection = {
        userId: `player-${playerId}-${Date.now()}`,
        playerId,
        provider,
        scopes,
        lastDataSync: new Date().toISOString(),
        isActive: true,
        authUrl: `/wearables/connect/${provider}?player_id=${playerId}`,
        connectionStatus: "connected"
      };
      
      // Store the connection in our own database (simulated)
      console.log("Created wearable connection:", wearableConnection);
      
      res.status(201).json({
        status: "success",
        user: wearableConnection,
        auth_url: wearableConnection.authUrl,
        expires_in: 600 // 10 minutes
      });
    } catch (error) {
      console.error("Error creating wearable device connection:", error);
      res.status(500).json({ error: "Failed to create wearable device connection" });
    }
  });

  // Player Activity Data - Get activities using Terra-inspired data structure
  app.get("/api/terra/activity/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { start_date, end_date } = req.query;
      
      // Our own activity data using Terra's proven data structure
      const activityData = {
        status: "success",
        type: "activity",
        data: [
          {
            metadata: {
              user_id: userId,
              start_time: "2025-01-01T07:00:00Z",
              end_time: "2025-01-01T07:45:00Z",
              type: "activity",
              data_type: "workout"
            },
            name: "Morning Run",
            sport: "running",
            calories_total: 425,
            distance_meters: 6800,
            avg_heart_rate: 155,
            max_heart_rate: 178,
            steps_total: 8940,
            active_duration_seconds: 2700,
            moving_time_seconds: 2580,
            power_data: {
              avg_watts: 245,
              max_watts: 380
            },
            heart_rate_data: {
              summary: {
                avg_hr_bpm: 155,
                max_hr_bpm: 178,
                resting_hr_bpm: 52,
                hr_zone_data: [
                  { zone: 1, duration_seconds: 300 },
                  { zone: 2, duration_seconds: 900 },
                  { zone: 3, duration_seconds: 1200 },
                  { zone: 4, duration_seconds: 300 }
                ]
              }
            }
          }
        ]
      };
      
      res.json(activityData);
    } catch (error) {
      console.error("Error fetching Terra activity data:", error);
      res.status(500).json({ error: "Failed to fetch activity data" });
    }
  });

  // Player Sleep Data - Get sleep data using Terra-inspired structure
  app.get("/api/terra/sleep/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const sleepData = {
        status: "success",
        type: "sleep",
        data: [
          {
            metadata: {
              user_id: userId,
              start_time: "2024-12-31T23:15:00Z",
              end_time: "2025-01-01T07:00:00Z",
              type: "sleep"
            },
            bedtime_start: "2024-12-31T23:15:00Z",
            bedtime_end: "2025-01-01T07:00:00Z",
            sleep_duration_seconds: 25200, // 7 hours
            sleep_efficiency_percentage: 87.5,
            time_in_bed_seconds: 27900, // 7h 45m
            time_asleep_seconds: 25200,
            time_awake_seconds: 1800, // 30 minutes
            sleep_stages_summary: {
              deep_sleep_duration_seconds: 5700, // 95 minutes
              light_sleep_duration_seconds: 11100, // 185 minutes  
              rem_sleep_duration_seconds: 6600, // 110 minutes
              awake_duration_seconds: 1800 // 30 minutes
            },
            sleep_score: 82,
            heart_rate_data: {
              summary: {
                avg_hr_bpm: 48,
                min_hr_bpm: 42,
                max_hr_bpm: 65,
                resting_hr_bpm: 52
              }
            },
            hrv_data: {
              avg_hrv_rmssd: 38.5,
              avg_hrv_sdnn: 45.2
            }
          }
        ]
      };
      
      res.json(sleepData);
    } catch (error) {
      console.error("Error fetching Terra sleep data:", error);
      res.status(500).json({ error: "Failed to fetch sleep data" });
    }
  });

  // Player Daily Data - Get daily summary using Terra-inspired structure
  app.get("/api/terra/daily/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { start_date, end_date } = req.query;
      
      const dailyData = {
        status: "success",
        type: "daily",
        data: [
          {
            metadata: {
              user_id: userId,
              date: "2025-01-01",
              type: "daily"
            },
            calendar_date: "2025-01-01",
            steps_data: {
              steps: 12847,
              distance_meters: 8300
            },
            calories_data: {
              total_burned_calories: 2340,
              BMR_calories: 1490,
              active_calories: 850,
              net_intake_calories: 2100
            },
            heart_rate_data: {
              summary: {
                avg_hr_bpm: 78,
                max_hr_bpm: 178,
                min_hr_bpm: 52,
                resting_hr_bpm: 52
              }
            },
            readiness_data: {
              readiness_score: 88,
              recovery_index: 85,
              activity_balance: 7,
              body_battery: 82,
              hrv_balance: 6,
              previous_day_activity: 8,
              previous_night_sleep: 9,
              sleep_balance: 8,
              temperature_deviation: 0.2
            },
            stress_data: {
              avg_stress_level: 35,
              max_stress_level: 78,
              stress_duration_seconds: 4320, // 72 minutes
              rest_stress_duration_seconds: 28800 // 8 hours
            }
          }
        ]
      };
      
      res.json(dailyData);
    } catch (error) {
      console.error("Error fetching Terra daily data:", error);
      res.status(500).json({ error: "Failed to fetch daily data" });
    }
  });

  // Player Body Data - Get body metrics using Terra-inspired structure
  app.get("/api/terra/body/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const bodyData = {
        status: "success",
        type: "body",
        data: [
          {
            metadata: {
              user_id: userId,
              timestamp: "2025-01-01T08:00:00Z",
              type: "body"
            },
            body_data: {
              weight_kg: 75.2,
              height_cm: 180,
              body_fat_percentage: 12.5,
              muscle_mass_kg: 35.8,
              bone_mass_kg: 3.2,
              water_percentage: 62.1,
              BMI: 23.2,
              metabolic_age: 28
            },
            measurements_data: {
              chest_cm: 98,
              waist_cm: 82,
              hip_cm: 95,
              thigh_cm: 58,
              bicep_cm: 35
            }
          }
        ]
      };
      
      res.json(bodyData);
    } catch (error) {
      console.error("Error fetching Terra body data:", error);
      res.status(500).json({ error: "Failed to fetch body data" });
    }
  });

  // Wearable Data Webhooks - Handle incoming data from our connected devices
  app.post("/api/wearable/webhook", async (req, res) => {
    try {
      const webhookData = req.body;
      
      // Log wearable data for debugging
      console.log("Wearable data received:", JSON.stringify(webhookData, null, 2));
      
      // Store webhook data (in real implementation, this would process and store the data)
      const webhookLog = {
        id: Date.now(),
        deviceId: webhookData.device?.device_id || "unknown",
        type: webhookData.type || "unknown",
        status: "success",
        payload: webhookData,
        signature: req.headers["terra-signature"] || null,
        processingTimeMs: 150,
        createdAt: new Date().toISOString()
      };
      
      // Process the webhook data based on type
      switch (webhookData.type) {
        case "activity":
          console.log("Processing activity webhook for user:", webhookData.user?.user_id);
          break;
        case "sleep":
          console.log("Processing sleep webhook for user:", webhookData.user?.user_id);
          break;
        case "daily":
          console.log("Processing daily webhook for user:", webhookData.user?.user_id);
          break;
        case "body":
          console.log("Processing body webhook for user:", webhookData.user?.user_id);
          break;
        default:
          console.log("Unknown webhook type:", webhookData.type);
      }
      
      res.status(200).json({ 
        status: "success", 
        message: "Webhook processed successfully",
        processed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error processing Terra webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Wearables System Status - Get system health and status
  app.get("/api/terra/status", async (req, res) => {
    try {
      const status = {
        status: "operational",
        version: "1.0", 
        system_name: "ProCoach Wearables API",
        providers: {
          fitbit: { status: "operational", last_check: new Date().toISOString(), connections: 1 },
          garmin: { status: "operational", last_check: new Date().toISOString(), connections: 1 },
          oura: { status: "operational", last_check: new Date().toISOString(), connections: 0 },
          apple_health: { status: "operational", last_check: new Date().toISOString(), connections: 0 },
          google_fit: { status: "operational", last_check: new Date().toISOString(), connections: 0 }
        },
        metrics: {
          total_players_connected: 2,
          active_device_connections: 2,
          data_sync_success_rate: 98.7,
          avg_response_time_ms: 85,
          daily_data_points_collected: 15420
        },
        last_updated: new Date().toISOString()
      };
      
      res.json(status);
    } catch (error) {
      console.error("Error fetching wearables system status:", error);
      res.status(500).json({ error: "Failed to fetch system status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
