import crypto from "crypto";
import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { getCurrentUserId, requireAuth, rolePermissions } from "./auth";
import { registerMatchSquadRoutes } from "./route-modules/match-squads";
import { registerMeetingRoutes } from "./route-modules/meetings";
import { registerAdminUserRoutes } from "./route-modules/admin-users";
import { registerNotificationRoutes } from "./route-modules/notifications";
import type { UploadService } from "./services/upload-service";
import {
  insertPlayerSchema, insertTeamSchema, insertTrainingSessionSchema,
  insertSessionAttendanceSchema, insertTacticalFormationSchema, insertPlayerStatsSchema,
  insertStaffSchema, insertMatchSchema,
  insertAnalyticsReportSchema, insertSystemSettingsSchema,
  insertMonthlyBudgetSchema, insertExpenseSchema, insertPlayerContractSchema,
  insertPerformanceReactionSchema, insertTacticalBoardSchema, employeeRoles,
  isTechnicalStaffRole, isAdminRole,
  type User
} from "@shared/schema";

const employeeInvitationSchema = z.object({
  role: z.enum(employeeRoles),
  teamId: z.number().int().positive().optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
});

// Team IDs an administrator is limited to. Administrators (team_admin_supervisor
// / team_admin_director) only ever see their assigned squads; everyone else
// (super admin, technical staff, players) gets club-wide visibility, signalled
// by returning null. An administrator with no assignment yet sees nothing.
async function getScopedTeamIds(req: { session: { userId?: number } }): Promise<number[] | null> {
  const userId = req.session?.userId;
  if (!userId) return null;

  const user = await storage.getUser(userId);
  if (!user || !isAdminRole(user.role)) return null;

  const normalizedEmail = user.email.toLowerCase();
  const member = (await storage.getStaff()).find(
    (candidate) => candidate.email.toLowerCase() === normalizedEmail
  );
  if (!member) return [];

  const staffTeams = await storage.getStaffTeams(member.id);
  return staffTeams.map((st) => st.teamId);
}

// Player IDs belonging to any of the given teams.
async function getPlayerIdsForTeams(teamIds: number[]): Promise<Set<number>> {
  const ids = new Set<number>();
  for (const teamId of teamIds) {
    const teamPlayers = await storage.getTeamPlayers(teamId);
    teamPlayers.forEach((tp) => ids.add(tp.playerId));
  }
  return ids;
}

// Staff IDs belonging to any of the given teams.
async function getStaffIdsForTeams(teamIds: number[]): Promise<Set<number>> {
  const ids = new Set<number>();
  for (const teamId of teamIds) {
    const teamStaff = await storage.getTeamStaff(teamId);
    teamStaff.forEach((ts) => ids.add(ts.staffId));
  }
  return ids;
}

const playerProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  firstNameAr: z.string().trim().nullable().optional(),
  lastNameAr: z.string().trim().nullable().optional(),
  email: z.string().trim().email("Valid email is required"),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
  nationality: z.string().trim().min(1, "Nationality is required"),
  dateOfBirth: z.string().trim().min(1, "Date of birth is required"),
  idNumber: z.string().trim().min(1, "National ID number is required"),
  profilePicture: z.string().trim().nullable().optional(),
});

const staffProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  firstNameAr: z.string().trim().nullable().optional(),
  lastNameAr: z.string().trim().nullable().optional(),
  email: z.string().trim().email("Valid email is required"),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
  nationality: z.string().trim().min(1, "Nationality is required"),
  idNumber: z.string().trim().min(1, "National ID number is required"),
  employmentType: z.enum(["full_time", "part_time", "contract", "volunteer"]),
  startDate: z.string().trim().min(1, "Start date is required"),
  profilePicture: z.string().trim().nullable().optional(),
});

function isPlayerProfileComplete(player: Awaited<ReturnType<typeof storage.getPlayers>>[number] | undefined) {
  return Boolean(
    player?.firstName &&
    player.lastName &&
    player.email &&
    player.phoneNumber &&
    player.nationality &&
    player.dateOfBirth &&
    player.idNumber,
  );
}

function isEmployeeAccountRole(role: string): role is (typeof employeeRoles)[number] {
  return (employeeRoles as readonly string[]).includes(role);
}

// Technical staff (coaches, analysts, physio, etc.) can review and edit the
// player roster, but only club administration can add or remove players.
const blockTechnicalStaffFromRosterMutation: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (isTechnicalStaffRole(user.role)) {
    return res.status(403).json({ message: "Technical staff can review and edit players, but cannot add or delete them" });
  }

  next();
};

function getStaffDepartment(role: (typeof employeeRoles)[number]) {
  if (role === "physiotherapist") return "medical";
  if (role === "analyst") return "analysis";
  if (["kit_manager", "team_manager", "team_administrative"].includes(role)) return "operations";
  return "coaching";
}

function isStaffProfileComplete(member: Awaited<ReturnType<typeof storage.getStaff>>[number] | undefined) {
  return Boolean(
    member?.firstName &&
    member.lastName &&
    member.email &&
    member.phoneNumber &&
    member.nationality &&
    member.idNumber &&
    member.employmentType &&
    member.startDate,
  );
}

const playerRegistrationFields = [
  ["firstName", "First name"],
  ["lastName", "Last name"],
  ["email", "Email"],
  ["phoneNumber", "Phone number"],
  ["nationality", "Nationality"],
  ["dateOfBirth", "Date of birth"],
  ["idNumber", "National ID number"],
] as const;

const staffRegistrationFields = [
  ["firstName", "First name"],
  ["lastName", "Last name"],
  ["email", "Email"],
  ["phoneNumber", "Phone number"],
  ["nationality", "Nationality"],
  ["idNumber", "National ID number"],
  ["employmentType", "Employment type"],
  ["startDate", "Employment start date"],
] as const;

async function getUserRegistrationStatus(user: User) {
  if (user.role === "player") {
    const profile = (await storage.getPlayers()).find((player) => player.email?.toLowerCase() === user.email.toLowerCase());
    const missingFields = playerRegistrationFields
      .filter(([key]) => !profile?.[key])
      .map(([, label]) => label);
    return { type: "player" as const, profileId: profile?.id ?? null, missingFields, isComplete: missingFields.length === 0 };
  }

  const profile = (await storage.getStaff()).find((member) => member.email.toLowerCase() === user.email.toLowerCase());
  const missingFields = staffRegistrationFields
    .filter(([key]) => !profile?.[key])
    .map(([, label]) => label);
  return { type: "staff" as const, profileId: profile?.id ?? null, missingFields, isComplete: missingFields.length === 0 };
}

function isRegistrationAdmin(user: User | undefined) {
  return user?.role === "club_super_admin" || user?.role === "admin";
}

// Notifies every player and staff member on a team (who already has a linked
// user account, matched by email like the rest of the app's identity checks)
// that a training session was scheduled for their team.
async function notifyTeamOfTraining(session: Awaited<ReturnType<typeof storage.createTrainingSession>>) {
  const [teamPlayers, teamStaffMembers, users, team] = await Promise.all([
    storage.getTeamPlayers(session.teamId),
    storage.getTeamStaff(session.teamId),
    storage.getUsers(),
    storage.getTeam(session.teamId),
  ]);

  const usersByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
  const link = `/training/attendance?session=${session.id}`;
  const title = "New training session scheduled";
  const message = `${session.title} for ${team?.name ?? "your team"} on ${session.date} at ${session.startTime}`;

  const recipientEmails = [
    ...teamPlayers.map((tp) => tp.player.email),
    ...teamStaffMembers.map((ts) => ts.staff.email),
  ];

  for (const email of recipientEmails) {
    if (!email) continue;
    const user = usersByEmail.get(email.toLowerCase());
    if (!user) continue;
    await storage.createNotification({
      userId: user.id,
      type: "training_scheduled",
      title,
      message,
      link,
      relatedSessionId: session.id,
    });
  }
}

// Notifies a team's staff when a player requests leave for a training session.
async function notifyStaffOfLeaveRequest(sessionId: number, player: Awaited<ReturnType<typeof storage.getPlayers>>[number]) {
  const session = await storage.getTrainingSession(sessionId);
  if (!session) return;

  const [teamStaffMembers, users] = await Promise.all([
    storage.getTeamStaff(session.teamId),
    storage.getUsers(),
  ]);

  const usersByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
  const link = `/training/attendance?session=${session.id}`;
  const title = "Leave request for training";
  const message = `${player.firstName} ${player.lastName} requested leave for ${session.title} on ${session.date}`;

  for (const ts of teamStaffMembers) {
    const user = usersByEmail.get(ts.staff.email.toLowerCase());
    if (!user) continue;
    await storage.createNotification({
      userId: user.id,
      type: "leave_requested",
      title,
      message,
      link,
      relatedSessionId: session.id,
    });
  }
}

export async function registerRoutes(app: Express, uploadService?: UploadService): Promise<Server> {
  const upload = uploadService?.middleware;
  registerMatchSquadRoutes(app);
  registerMeetingRoutes(app);
  registerAdminUserRoutes(app);
  registerNotificationRoutes(app);

  app.get("/api/player/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(getCurrentUserId(req));
      if (!user || user.role !== "player") {
        return res.status(403).json({ message: "Player access required" });
      }

      const normalizedEmail = user.email.toLowerCase();
      const player = (await storage.getPlayers()).find((candidate) => {
        return candidate.email?.toLowerCase() === normalizedEmail;
      });

      res.json({
        user,
        player: player ?? null,
        isComplete: isPlayerProfileComplete(player),
      });
    } catch (error) {
      console.error("Error fetching player profile:", error);
      res.status(500).json({ message: "Failed to fetch player profile" });
    }
  });

  app.post("/api/player/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(getCurrentUserId(req));
      if (!user || user.role !== "player") {
        return res.status(403).json({ message: "Player access required" });
      }

      const profile = playerProfileSchema.parse(req.body);
      const normalizedEmail = profile.email.toLowerCase();
      const users = await storage.getUsers();
      const emailOwner = users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);

      if (emailOwner && emailOwner.id !== user.id) {
        return res.status(400).json({ message: "Email is already registered to another user" });
      }

      await storage.updateUser(user.id, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: normalizedEmail,
      });

      const players = await storage.getPlayers();
      const linkedPlayer = players.find((candidate) => {
        return candidate.email?.toLowerCase() === user.email.toLowerCase()
          || candidate.email?.toLowerCase() === normalizedEmail;
      });

      const playerData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        firstNameAr: profile.firstNameAr || null,
        lastNameAr: profile.lastNameAr || null,
        email: normalizedEmail,
        phoneNumber: profile.phoneNumber,
        nationality: profile.nationality,
        dateOfBirth: profile.dateOfBirth,
        idNumber: profile.idNumber,
        profilePicture: profile.profilePicture || null,
        position: linkedPlayer?.position ?? "midfielder",
      };

      const player = linkedPlayer
        ? await storage.updatePlayer(linkedPlayer.id, playerData)
        : await storage.createPlayer(playerData);

      res.json({
        user: await storage.getUser(user.id),
        player,
        isComplete: isPlayerProfileComplete(player),
      });
    } catch (error) {
      console.error("Error saving player profile:", error);
      res.status(400).json({
        message: "Invalid player profile data",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/staff/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(getCurrentUserId(req));
      if (!user || !isEmployeeAccountRole(user.role)) {
        return res.status(403).json({ message: "Employee access required" });
      }

      const normalizedEmail = user.email.toLowerCase();
      const member = (await storage.getStaff()).find((candidate) => {
        return candidate.email.toLowerCase() === normalizedEmail;
      });

      res.json({
        user,
        staff: member ?? null,
        isComplete: isStaffProfileComplete(member),
      });
    } catch (error) {
      console.error("Error fetching staff profile:", error);
      res.status(500).json({ message: "Failed to fetch staff profile" });
    }
  });

  app.post("/api/staff/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(getCurrentUserId(req));
      if (!user || !isEmployeeAccountRole(user.role)) {
        return res.status(403).json({ message: "Employee access required" });
      }

      const profile = staffProfileSchema.parse(req.body);
      const normalizedEmail = profile.email.toLowerCase();
      const users = await storage.getUsers();
      const emailOwner = users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
      if (emailOwner && emailOwner.id !== user.id) {
        return res.status(400).json({ message: "Email is already registered to another user" });
      }

      const allStaff = await storage.getStaff();
      const emailOwnerStaff = allStaff.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
      const linkedStaff = allStaff.find((candidate) => {
        const candidateEmail = candidate.email.toLowerCase();
        return candidateEmail === user.email.toLowerCase() || candidateEmail === normalizedEmail;
      });
      if (emailOwnerStaff && emailOwnerStaff.id !== linkedStaff?.id) {
        return res.status(400).json({ message: "Email is already assigned to another employee" });
      }

      await storage.updateUser(user.id, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: normalizedEmail,
      });

      const staffData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        firstNameAr: profile.firstNameAr || null,
        lastNameAr: profile.lastNameAr || null,
        email: normalizedEmail,
        phoneNumber: profile.phoneNumber,
        nationality: profile.nationality,
        idNumber: profile.idNumber,
        employmentType: profile.employmentType,
        startDate: profile.startDate,
        profilePicture: profile.profilePicture || null,
        role: user.role,
        department: getStaffDepartment(user.role),
      };

      const member = linkedStaff
        ? await storage.updateStaff(linkedStaff.id, staffData)
        : await storage.createStaff(staffData);

      res.json({
        user: await storage.getUser(user.id),
        staff: member,
        isComplete: isStaffProfileComplete(member),
      });
    } catch (error) {
      console.error("Error saving staff profile:", error);
      res.status(400).json({
        message: "Invalid staff profile data",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/admin/registration-status", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(getCurrentUserId(req));
      if (!isRegistrationAdmin(currentUser)) {
        return res.status(403).json({ message: "Administrator access required" });
      }

      const accountUsers = (await storage.getUsers()).filter((user) => {
        return user.role === "player" || isEmployeeAccountRole(user.role);
      });
      const statuses = await Promise.all(accountUsers.map(async (user) => {
        const status = await getUserRegistrationStatus(user);
        const [latestReminder] = await storage.getRegistrationRemindersForUser(user.id);
        return {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          ...status,
          lastReminderAt: latestReminder?.createdAt ?? null,
        };
      }));

      res.json(statuses);
    } catch (error) {
      console.error("Error fetching registration statuses:", error);
      res.status(500).json({ message: "Failed to fetch registration statuses" });
    }
  });

  app.post("/api/admin/registration-reminders", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(getCurrentUserId(req));
      if (!isRegistrationAdmin(currentUser)) {
        return res.status(403).json({ message: "Administrator access required" });
      }

      const payload = z.object({ userId: z.coerce.number().int().positive() }).parse(req.body);
      const targetUser = await storage.getUser(payload.userId);
      if (!targetUser || (targetUser.role !== "player" && !isEmployeeAccountRole(targetUser.role))) {
        return res.status(404).json({ message: "Player or staff account not found" });
      }

      const status = await getUserRegistrationStatus(targetUser);
      if (status.isComplete) {
        return res.status(400).json({ message: "Registration is already complete" });
      }

      const message = `Please complete your registration. Missing information: ${status.missingFields.join(", ")}.`;
      const reminder = await storage.createRegistrationReminder({
        targetUserId: targetUser.id,
        sentBy: currentUser!.id,
        missingFields: status.missingFields,
        message,
      });
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "A valid user is required" });
      }
      console.error("Error sending registration reminder:", error);
      res.status(500).json({ message: "Failed to send registration reminder" });
    }
  });

  app.get("/api/registration-reminders/me", requireAuth, async (req, res) => {
    try {
      const reminders = await storage.getRegistrationRemindersForUser(getCurrentUserId(req));
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching registration reminders:", error);
      res.status(500).json({ message: "Failed to fetch registration reminders" });
    }
  });

  app.get("/api/player/analytics-summary", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(getCurrentUserId(req));
      if (!user || user.role !== "player") {
        return res.status(403).json({ message: "Player access required" });
      }

      const normalizedEmail = user.email.toLowerCase();
      const player = (await storage.getPlayers()).find((candidate) => {
        return candidate.email?.toLowerCase() === normalizedEmail;
      });

      if (!player) {
        return res.json({
          player: null,
          stats: [],
          totals: {
            goals: 0,
            assists: 0,
            minutesPlayed: 0,
            averageFitnessScore: 0,
            averageTechnicalScore: 0,
            averageTacticalScore: 0,
            sessionsTracked: 0,
          },
        });
      }

      const stats = await storage.getPlayerStats(player.id);
      const average = (values: Array<number | null>) => {
        const validValues = values.filter((value): value is number => typeof value === "number");
        if (!validValues.length) return 0;
        return Math.round(validValues.reduce((sum, value) => sum + value, 0) / validValues.length);
      };

      res.json({
        player,
        stats,
        totals: {
          goals: stats.reduce((sum, stat) => sum + stat.goals, 0),
          assists: stats.reduce((sum, stat) => sum + stat.assists, 0),
          minutesPlayed: stats.reduce((sum, stat) => sum + stat.minutesPlayed, 0),
          averageFitnessScore: average(stats.map((stat) => stat.fitnessScore)),
          averageTechnicalScore: average(stats.map((stat) => stat.technicalScore)),
          averageTacticalScore: average(stats.map((stat) => stat.tacticalScore)),
          sessionsTracked: stats.length,
        },
      });
    } catch (error) {
      console.error("Error fetching player analytics summary:", error);
      res.status(500).json({ message: "Failed to fetch player analytics summary" });
    }
  });

  // Players
  app.get("/api/players", async (req, res) => {
    try {
      const players = await storage.getPlayers();
      const scopedTeamIds = await getScopedTeamIds(req);
      if (scopedTeamIds) {
        const allowedPlayerIds = await getPlayerIdsForTeams(scopedTeamIds);
        return res.json(players.filter((player) => allowedPlayerIds.has(player.id)));
      }
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

  app.post("/api/players", blockTechnicalStaffFromRosterMutation, async (req, res) => {
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

  app.patch("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPlayerSchema.partial().parse(req.body);
      const player = await storage.updatePlayer(id, validatedData);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      console.error("PATCH /api/players/:id - Error:", error);
      res.status(400).json({ message: "Invalid player data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/players/:id", blockTechnicalStaffFromRosterMutation, async (req, res) => {
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
          result.profilePicture = uploadService!.publicPath(files.profilePicture[0].filename);
        }
        if (files.idDocument) {
          result.idDocument = uploadService!.publicPath(files.idDocument[0].filename);
        }
        if (files.contractDocument) {
          result.contractDocument = uploadService!.publicPath(files.contractDocument[0].filename);
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
        
        const filePath = uploadService!.publicPath(req.file.filename);
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
      const scopedTeamIds = await getScopedTeamIds(req);
      if (scopedTeamIds) {
        return res.json(teams.filter((team) => scopedTeamIds.includes(team.id)));
      }
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

  app.get("/api/teams/:id/staff", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const teamStaff = await storage.getTeamStaff(id);
      res.json(teamStaff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team staff" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      // Administrators manage their assigned squads only — they cannot open new ones.
      const scopedTeamIds = await getScopedTeamIds(req);
      if (scopedTeamIds) {
        return res.status(403).json({ message: "Administrators cannot create teams" });
      }
      const validatedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      res.status(400).json({ message: "Invalid team data" });
    }
  });

  app.put("/api/teams/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scopedTeamIds = await getScopedTeamIds(req);
      if (scopedTeamIds && !scopedTeamIds.includes(id)) {
        return res.status(403).json({ message: "This team is not assigned to you" });
      }
      const team = await storage.updateTeam(id, req.body);
      if (!team) return res.status(404).json({ message: "Team not found" });
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete("/api/teams/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scopedTeamIds = await getScopedTeamIds(req);
      if (scopedTeamIds && !scopedTeamIds.includes(id)) {
        return res.status(403).json({ message: "This team is not assigned to you" });
      }
      const success = await storage.deleteTeam(id);
      if (!success) return res.status(404).json({ message: "Team not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  app.post("/api/invitations", requireAuth, blockTechnicalStaffFromRosterMutation, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const teamId = Number(req.body.teamId);
      const email = req.body.email ? String(req.body.email).trim() : null;

      if (!teamId || Number.isNaN(teamId)) {
        return res.status(400).json({ message: "teamId is required" });
      }

      const token = crypto.randomBytes(20).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      const invitation = await storage.createPlayerInvitation({
        token,
        teamId,
        email,
        invitedBy: userId,
        expiresAt,
      });

      const link = `${req.protocol}://${req.get("host")}/invite/${invitation.token}`;
      res.status(201).json({ link });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Get invitation details by token (public endpoint for signup)
  app.get("/api/invitations/:token", async (req, res) => {
    try {
      const { token } = req.params;

      const invitation = await storage.getPlayerInvitationByToken(token);

      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation" });
      }

      const isExpired = new Date(invitation.expiresAt) < new Date();
      const isUsed = invitation.usedAt ? true : false;

      if (isExpired || isUsed) {
        return res.status(400).json({
          message: isExpired ? "Invitation expired" : "Invitation already used",
          isExpired,
          isUsed,
        });
      }

      res.json({
        id: invitation.id,
        email: invitation.email || "",
        teamName: invitation.team?.name || "Team",
        teamId: invitation.teamId,
        expiresAt: invitation.expiresAt,
        isExpired: false,
        isUsed: false,
      });
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });

  app.post("/api/employee-invitations", requireAuth, async (req, res) => {
    try {
      const { role, teamId, email } = employeeInvitationSchema.parse(req.body);
      const token = crypto.randomBytes(20).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      const invitation = await storage.createEmployeeInvitation({
        token,
        role,
        teamId: teamId ?? null,
        email: email || null,
        invitedBy: getCurrentUserId(req),
        expiresAt,
      });

      const link = `${req.protocol}://${req.get("host")}/employee-invite/${invitation.token}`;
      res.status(201).json({ link });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "A valid employee role and email are required" });
      }
      console.error("Error creating employee invitation:", error);
      res.status(500).json({ message: "Failed to create employee invitation" });
    }
  });

  app.get("/api/employee-invitations/:token", async (req, res) => {
    try {
      const invitation = await storage.getEmployeeInvitationByToken(req.params.token);
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation" });
      }

      const isExpired = new Date(invitation.expiresAt) < new Date();
      const isUsed = Boolean(invitation.usedAt);
      if (isExpired || isUsed) {
        return res.status(400).json({
          message: isExpired ? "Invitation expired" : "Invitation already used",
          isExpired,
          isUsed,
        });
      }

      let teamName: string | null = null;
      if (invitation.teamId) {
        const team = await storage.getTeam(invitation.teamId);
        teamName = team?.name ?? null;
      }

      res.json({
        id: invitation.id,
        email: invitation.email || "",
        role: invitation.role,
        teamName,
        expiresAt: invitation.expiresAt,
        isExpired: false,
        isUsed: false,
      });
    } catch (error) {
      console.error("Error fetching employee invitation:", error);
      res.status(500).json({ message: "Failed to fetch employee invitation" });
    }
  });

  app.post("/api/teams/:teamId/players/:playerId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const playerId = parseInt(req.params.playerId);
      console.log(`Adding player ${playerId} to team ${teamId}`);
      const teamPlayer = await storage.addPlayerToTeam({ teamId, playerId, isStarter: false });
      res.status(201).json(teamPlayer);
    } catch (error) {
      console.error("Error adding player to team:", error);
      const message = error instanceof Error ? error.message : "Failed to add player to team";
      res.status(400).json({ message });
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

  // Staff-Teams endpoints
  app.post("/api/staff-teams", async (req, res) => {
    try {
      const { teamId, staffId } = req.body;
      console.log(`Adding staff ${staffId} to team ${teamId}`);
      const teamStaff = await storage.addStaffToTeam({ teamId, staffId });
      res.status(201).json(teamStaff);
    } catch (error) {
      console.error("Error adding staff to team:", error);
      const message = error instanceof Error ? error.message : "Failed to add staff to team";
      res.status(400).json({ message });
    }
  });

  app.delete("/api/teams/:teamId/staff/:staffId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const staffId = parseInt(req.params.staffId);
      const success = await storage.removeStaffFromTeam(teamId, staffId);
      if (!success) {
        return res.status(404).json({ message: "Staff not found in team" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove staff from team" });
    }
  });

  app.get("/api/staff-teams/:staffId", async (req, res) => {
    try {
      const staffId = parseInt(req.params.staffId);
      const staffTeams = await storage.getStaffTeams(staffId);
      res.json(staffTeams);
    } catch (error) {
      res.status(500).json({ message: "Failed to get staff teams" });
    }
  });

  // Teams assigned to the signed-in staff member or player (matched by
  // email, same as /api/staff/profile and /api/player/profile). Powers
  // dashboard "Next Up" cards so every card is restricted to the caller's
  // own team(s) instead of the whole club.
  app.get("/api/dashboard/my-teams", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(getCurrentUserId(req));
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const normalizedEmail = user.email.toLowerCase();

      if (user.role === "player") {
        const player = (await storage.getPlayers()).find(
          (candidate) => candidate.email?.toLowerCase() === normalizedEmail
        );
        if (!player) {
          return res.json([]);
        }
        const playerTeams = await storage.getPlayerTeams(player.id);
        return res.json(playerTeams.map((pt) => pt.team));
      }

      const member = (await storage.getStaff()).find(
        (candidate) => candidate.email.toLowerCase() === normalizedEmail
      );

      if (!member) {
        return res.json([]);
      }

      const staffTeams = await storage.getStaffTeams(member.id);
      res.json(staffTeams.map((st) => st.team));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assigned teams" });
    }
  });

  // Admin training session creation (simplified — only Date, Time, Venue, TeamId)
  app.post("/api/admin/training-sessions", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(getCurrentUserId(req));
      if (!user || !isAdminRole(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { teamId, date, startTime, location } = req.body as {
        teamId: number; date: string; startTime: string; location: string;
      };
      if (!teamId || !date || !startTime || !location) {
        return res.status(400).json({ message: "teamId, date, startTime, and location are required" });
      }

      // Use the admin's own staff record as coachId
      const normalizedEmail = user.email.toLowerCase();
      const member = (await storage.getStaff()).find(
        (s) => s.email.toLowerCase() === normalizedEmail
      );

      let coachId: number;
      if (member) {
        coachId = member.id;
      } else {
        const teamStaffList = await storage.getTeamStaff(teamId);
        if (!teamStaffList.length) {
          return res.status(400).json({ message: "No staff found for this team" });
        }
        coachId = teamStaffList[0].staff.id;
      }

      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayOfWeek = dayNames[new Date(date).getDay()];

      const session = await storage.createTrainingSession({
        title: `Training - ${dayOfWeek}`,
        sessionType: "tactical",
        date,
        startTime,
        duration: 90,
        location,
        teamId,
        coachId,
      });

      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating admin training session:", error);
      res.status(500).json({ message: "Failed to create training session" });
    }
  });

  // Training Sessions
  app.get("/api/training-sessions", async (req, res) => {
    try {
      const sessions = await storage.getTrainingSessions();

      // An administrator's scope is enforced here, not taken from the client.
      const scopedTeamIds = await getScopedTeamIds(req);
      if (scopedTeamIds) {
        return res.json(sessions.filter((s) => scopedTeamIds.includes(s.teamId ?? 0)));
      }

      const teamIdsParam = req.query.teamIds as string | undefined;
      if (teamIdsParam) {
        const ids = teamIdsParam.split(",").map(Number).filter(Boolean);
        return res.json(sessions.filter((s) => ids.includes(s.teamId ?? 0)));
      }
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

      // Notification delivery shouldn't block or fail session creation.
      notifyTeamOfTraining(session).catch((error) => {
        console.error("Failed to send training-scheduled notifications:", error);
      });
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

  app.post("/api/session-attendance", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(getCurrentUserId(req));
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      let body = req.body;
      let respondingPlayer: Awaited<ReturnType<typeof storage.getPlayers>>[number] | undefined;

      if (user.role === "player") {
        const normalizedEmail = user.email.toLowerCase();
        respondingPlayer = (await storage.getPlayers()).find(
          (candidate) => candidate.email?.toLowerCase() === normalizedEmail
        );
        if (!respondingPlayer) {
          return res.status(403).json({ message: "Player profile not found" });
        }
        // A player can only ever submit their own attendance response.
        body = { ...body, playerId: respondingPlayer.id };
      } else if (!rolePermissions[user.role]?.has("schedule_training")) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertSessionAttendanceSchema.parse(body);
      const attendance = await storage.markAttendance(validatedData);
      res.status(201).json(attendance);

      if (validatedData.status === "leave_requested" && respondingPlayer) {
        notifyStaffOfLeaveRequest(validatedData.sessionId, respondingPlayer).catch((error) => {
          console.error("Failed to send leave-request notifications:", error);
        });
      }
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
      const scopedTeamIds = await getScopedTeamIds(req);
      if (scopedTeamIds) {
        const allowedStaffIds = await getStaffIdsForTeams(scopedTeamIds);
        return res.json(staff.filter((member) => allowedStaffIds.has(member.id)));
      }
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

      // An administrator's scope is enforced here, not taken from the client.
      const scopedTeamIds = await getScopedTeamIds(req);
      if (scopedTeamIds) {
        return res.json(matches.filter((m) => scopedTeamIds.includes(m.homeTeamId ?? 0)));
      }

      const teamIdsParam = req.query.teamIds as string | undefined;
      if (teamIdsParam) {
        const ids = teamIdsParam.split(",").map(Number).filter(Boolean);
        return res.json(matches.filter((m) => ids.includes(m.homeTeamId ?? 0)));
      }
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

      // Guard against the same fixture being scheduled twice (e.g. a
      // double form submission) — same team, opponent, date, and kickoff.
      const existingMatches = await storage.getMatches();
      const isDuplicate = existingMatches.some((m) =>
        m.homeTeamId === validatedData.homeTeamId &&
        m.awayTeam.trim().toLowerCase() === validatedData.awayTeam.trim().toLowerCase() &&
        m.date === validatedData.date &&
        m.kickoffTime === validatedData.kickoffTime
      );
      if (isDuplicate) {
        return res.status(409).json({ message: "A match against this opponent at this date and time already exists" });
      }

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

  // Get specific setting by category and key
  app.get("/api/settings/:category/:key", async (req, res) => {
    try {
      const { category, key } = req.params;
      const settings = await storage.getSystemSettings();
      const setting = settings.find(
        s => s.category === category && s.settingKey === key && s.isActive
      );
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch setting" });
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

      // Attendance rate and player count, optionally scoped to a set of teams
      // (used by the technical staff dashboard to restrict every card to the
      // teams the signed-in staff member is actually assigned to).
      const teamIds = typeof req.query.teamIds === "string" && req.query.teamIds.length > 0
        ? req.query.teamIds.split(",").map(Number).filter(n => !Number.isNaN(n))
        : undefined;

      const attendanceSessions = teamIds
        ? sessions.filter(s => teamIds.includes(s.teamId))
        : sessions;
      const attendanceRecords = (
        await Promise.all(attendanceSessions.map(s => storage.getSessionAttendance(s.id)))
      ).flat();
      const attendedCount = attendanceRecords.filter(a => a.status === "present" || a.status === "late").length;
      const attendanceRate = attendanceRecords.length > 0
        ? Math.round((attendedCount / attendanceRecords.length) * 100)
        : 0;

      let totalPlayers = players.filter(p => p.isActive).length;
      if (teamIds) {
        const teamPlayerLists = await Promise.all(teamIds.map(id => storage.getTeamPlayers(id)));
        const uniqueActivePlayerIds = new Set<number>();
        teamPlayerLists.flat().forEach(tp => {
          if (tp.player?.isActive) uniqueActivePlayerIds.add(tp.playerId);
        });
        totalPlayers = uniqueActivePlayerIds.size;
      }

      const stats = {
        totalPlayers,
        activeTeams: teams.filter(t => t.isActive).length,
        totalStaff: staff.filter(s => s.isActive).length,
        upcomingMatches: upcomingMatches.length,
        weeklySessions: sessions.filter(s => {
          const sessionDate = new Date(s.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return sessionDate >= weekAgo;
        }).length,
        attendanceRate,
        upcomingSessions: upcomingSessions,
        upcomingFixtures: upcomingMatches
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Logo upload endpoint
  if (upload) {
    app.post("/api/upload/logo", upload.single('logo'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No logo file provided" });
        }

        const logoUrl = uploadService!.publicPath(req.file.filename);

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
  }

  // Training image library route (for future tactical board integration)
  app.get("/api/training-images/library", async (req, res) => {
    try {
      // This would return saved tactical board images in production
      // For now, return empty array
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch training images" });
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
        system_name: "360FOS Wearables API",
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

  // Catapult OpenField API Integration
  app.post("/api/catapult/connect", async (req, res) => {
    try {
      const { playerId, apiKey, baseUrl } = req.body;
      
      if (!playerId || !apiKey) {
        return res.status(400).json({ error: "Player ID and API key are required" });
      }

      // In a real implementation, this would make actual API calls to Catapult
      // For now, we'll simulate the connection and return success
      console.log(`Connecting player ${playerId} to Catapult OpenField...`);
      console.log(`API Base URL: ${baseUrl}`);
      console.log(`API Key provided: ${apiKey.substring(0, 8)}...`);

      // Simulate API validation (in real app, make actual call to Catapult)
      if (apiKey.length < 10) {
        return res.status(401).json({ error: "Invalid API key format" });
      }

      // Store connection details (in real app, save to database)
      const connectionData = {
        playerId,
        provider: "catapult_openfield",
        apiKey: apiKey.substring(0, 8) + "...", // Don't store full key in logs
        baseUrl,
        connectedAt: new Date().toISOString(),
        status: "connected",
        lastSync: new Date().toISOString()
      };

      console.log("Catapult connection established:", connectionData);

      res.json({
        success: true,
        message: "Successfully connected to Catapult OpenField",
        connection: {
          playerId,
          provider: "catapult_openfield",
          status: "connected",
          connectedAt: connectionData.connectedAt
        }
      });
    } catch (error) {
      console.error("Error connecting to Catapult OpenField:", error);
      res.status(500).json({ error: "Failed to connect to Catapult OpenField" });
    }
  });

  app.get("/api/catapult/players/:playerId/data", async (req, res) => {
    try {
      const { playerId } = req.params;
      const { dataType, startDate, endDate } = req.query;

      // In real implementation, fetch from Catapult API
      // For now, return mock data structure similar to Catapult's format
      const mockCatapultData = {
        player: {
          id: playerId,
          external_id: `catapult_${playerId}`,
          first_name: "Ahmed",
          last_name: "Al-Dosari",
          position: "Midfielder"
        },
        sessions: [
          {
            id: "session_001",
            date: "2025-01-01",
            session_type: "Training",
            duration_minutes: 90,
            gps_data: {
              total_distance_meters: 8420,
              high_speed_running_meters: 1250,
              sprint_count: 15,
              max_speed_kmh: 28.5,
              average_speed_kmh: 6.2
            },
            load_metrics: {
              player_load: 485.2,
              player_load_per_minute: 5.39,
              accelerations: 45,
              decelerations: 38,
              impacts: 28
            },
            heart_rate: {
              max_hr: 185,
              average_hr: 155,
              time_in_zones: {
                zone_1: 12,
                zone_2: 25,
                zone_3: 30,
                zone_4: 20,
                zone_5: 3
              }
            }
          }
        ],
        wellness_data: {
          readiness_score: 8.5,
          fatigue_level: 3.1,
          wellness_score: 7.2,
          sleep_quality: 8.0
        }
      };

      res.json({
        success: true,
        data: mockCatapultData,
        fetched_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching Catapult player data:", error);
      res.status(500).json({ error: "Failed to fetch player data from Catapult" });
    }
  });

  // Monthly Budgets API endpoints
  app.get("/api/budgets", async (req, res) => {
    try {
      const budgets = await storage.getMonthlyBudgets();
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ error: "Failed to fetch budgets" });
    }
  });

  app.get("/api/budgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budget = await storage.getMonthlyBudget(id);
      
      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }
      
      res.json(budget);
    } catch (error) {
      console.error("Error fetching budget:", error);
      res.status(500).json({ error: "Failed to fetch budget" });
    }
  });

  app.post("/api/budgets", async (req, res) => {
    try {
      const validatedData = insertMonthlyBudgetSchema.parse(req.body);
      const budget = await storage.createMonthlyBudget(validatedData);
      res.status(201).json(budget);
    } catch (error) {
      console.error("Error creating budget:", error);
      res.status(400).json({ error: "Invalid budget data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/budgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budget = await storage.updateMonthlyBudget(id, req.body);
      
      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }
      
      res.json(budget);
    } catch (error) {
      console.error("Error updating budget:", error);
      res.status(500).json({ error: "Failed to update budget" });
    }
  });

  app.delete("/api/budgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMonthlyBudget(id);
      
      if (!success) {
        return res.status(404).json({ error: "Budget not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting budget:", error);
      res.status(500).json({ error: "Failed to delete budget" });
    }
  });

  // Expense Management API endpoints
  app.get("/api/expenses", async (req, res) => {
    try {
      const budgetId = req.query.budgetId ? parseInt(req.query.budgetId as string) : undefined;
      const expenses = await storage.getExpenses(budgetId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const expense = await storage.getExpense(id);
      
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ error: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(400).json({ error: "Invalid expense data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const expense = await storage.updateExpense(id, req.body);
      
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExpense(id);
      
      if (!success) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  app.patch("/api/expenses/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const approvedBy = 1; // Current user ID from session/auth
      const expense = await storage.approveExpense(id, approvedBy);
      
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error) {
      console.error("Error approving expense:", error);
      res.status(500).json({ error: "Failed to approve expense" });
    }
  });

  // Budget Analysis endpoints
  app.get("/api/budgets/salary-summary/:month", async (req, res) => {
    try {
      const month = req.params.month;
      const salarySummary = await storage.getTotalMonthlySalaries(month);
      res.json(salarySummary);
    } catch (error) {
      console.error("Error fetching salary summary:", error);
      res.status(500).json({ error: "Failed to fetch salary summary" });
    }
  });

  // Salary summary without month parameter (fallback)
  app.get("/api/budgets/salary-summary", async (req, res) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const salarySummary = await storage.getTotalMonthlySalaries(currentMonth);
      res.json(salarySummary);
    } catch (error) {
      console.error("Error fetching salary summary:", error);
      res.status(500).json({ error: "Failed to fetch salary summary" });
    }
  });

  app.get("/api/budgets/summary/:budgetId", async (req, res) => {
    try {
      const budgetId = parseInt(req.params.budgetId);
      const budgetSummary = await storage.getBudgetVsActualExpenses(budgetId);
      res.json(budgetSummary);
    } catch (error) {
      console.error("Error fetching budget summary:", error);
      res.status(500).json({ error: "Failed to fetch budget summary" });
    }
  });

  // Player Contracts API endpoints
  app.get("/api/player-contracts", async (req, res) => {
    try {
      const playerId = req.query.playerId ? parseInt(req.query.playerId as string) : undefined;
      const contracts = await storage.getPlayerContracts(playerId);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching player contracts:", error);
      res.status(500).json({ error: "Failed to fetch player contracts" });
    }
  });

  app.post("/api/player-contracts", async (req, res) => {
    try {
      const validatedData = insertPlayerContractSchema.parse(req.body);
      const contract = await storage.createPlayerContract(validatedData);
      res.status(201).json(contract);
    } catch (error) {
      console.error("Error creating player contract:", error);
      res.status(400).json({ error: "Invalid contract data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Performance Reactions API endpoints
  app.get("/api/performance-reactions", async (req, res) => {
    try {
      const playerId = req.query.playerId ? parseInt(req.query.playerId as string) : undefined;
      const performanceType = req.query.performanceType as string;
      const reactions = await storage.getPerformanceReactions(playerId, performanceType);
      res.json(reactions);
    } catch (error) {
      console.error("Error fetching performance reactions:", error);
      res.status(500).json({ error: "Failed to fetch performance reactions" });
    }
  });

  app.get("/api/performance-reactions/player/:playerId", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const reactions = await storage.getPlayerReactionsSummary(playerId);
      res.json(reactions);
    } catch (error) {
      console.error("Error fetching player reactions summary:", error);
      res.status(500).json({ error: "Failed to fetch player reactions" });
    }
  });

  app.post("/api/performance-reactions", async (req, res) => {
    try {
      const validatedData = insertPerformanceReactionSchema.parse(req.body);
      // Set coach ID from session (for now using ID 1 as placeholder)
      validatedData.coachId = 1;
      const reaction = await storage.createPerformanceReaction(validatedData);
      res.status(201).json(reaction);
    } catch (error) {
      console.error("Error creating performance reaction:", error);
      res.status(400).json({ error: "Invalid reaction data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/performance-reactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePerformanceReaction(id);
      
      if (!success) {
        return res.status(404).json({ error: "Reaction not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting performance reaction:", error);
      res.status(500).json({ error: "Failed to delete reaction" });
    }
  });

  // Tactical Boards API
  app.get("/api/tactical-boards", async (req, res) => {
    try {
      const boards = await storage.getTacticalBoards();
      res.json(boards);
    } catch (error) {
      console.error("Error fetching tactical boards:", error);
      res.status(500).json({ error: "Failed to fetch tactical boards" });
    }
  });

  app.get("/api/tactical-boards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const board = await storage.getTacticalBoard(id);
      if (!board) {
        return res.status(404).json({ error: "Tactical board not found" });
      }
      res.json(board);
    } catch (error) {
      console.error("Error fetching tactical board:", error);
      res.status(500).json({ error: "Failed to fetch tactical board" });
    }
  });

  app.post("/api/tactical-boards", async (req, res) => {
    try {
      const validatedData = insertTacticalBoardSchema.parse(req.body);
      // Set created by user ID (placeholder for now)
      validatedData.createdBy = 1;
      const board = await storage.createTacticalBoard(validatedData);
      res.status(201).json(board);
    } catch (error) {
      console.error("Error creating tactical board:", error);
      res.status(400).json({ error: "Invalid tactical board data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/tactical-boards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTacticalBoardSchema.parse(req.body);
      const board = await storage.updateTacticalBoard(id, validatedData);
      if (!board) {
        return res.status(404).json({ error: "Tactical board not found" });
      }
      res.json(board);
    } catch (error) {
      console.error("Error updating tactical board:", error);
      res.status(400).json({ error: "Invalid tactical board data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/tactical-boards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTacticalBoard(id);
      if (!success) {
        return res.status(404).json({ error: "Tactical board not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tactical board:", error);
      res.status(500).json({ error: "Failed to delete tactical board" });
    }
  });

  // Achievement System Routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  // Registered before the "/:playerId" route below so "leaderboard" is never
  // matched as a playerId (Express matches routes in registration order).
  app.get("/api/achievements/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getAchievementLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching achievement leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch achievement leaderboard" });
    }
  });

  app.get("/api/achievements/:playerId", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const achievements = await storage.getPlayerAchievements(playerId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching player achievements:", error);
      res.status(500).json({ error: "Failed to fetch player achievements" });
    }
  });

  app.post("/api/achievements/:playerId/progress", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const { achievementTypeId, value, eventType, eventId } = req.body;

      const progress = await storage.updateAchievementProgress(playerId, achievementTypeId, value, eventType, eventId);
      res.json(progress);
    } catch (error) {
      console.error("Error updating achievement progress:", error);
      res.status(500).json({ error: "Failed to update achievement progress" });
    }
  });

  // Initialize player achievements for all existing players
  app.post("/api/achievements/initialize", async (req, res) => {
    try {
      const result = await storage.initializePlayerAchievements();
      res.json(result);
    } catch (error) {
      console.error("Error initializing player achievements:", error);
      res.status(500).json({ error: "Failed to initialize player achievements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
