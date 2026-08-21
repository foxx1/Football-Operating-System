import type { Express, RequestHandler } from "express";
import crypto from "crypto";
import { promisify } from "util";
import { z } from "zod";
import { storage } from "./storage";
import { employeeRoles, type User } from "@shared/schema";
import { sendPasswordResetEmail } from "./services/email-service";
import { env } from "./env";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      // Tenant scope for the current request. Set exclusively by requireAuth/requirePermission
      // from the authenticated user's row — never read from the request body or query string.
      organizationId?: number;
    }
  }
}

const scryptAsync = promisify(crypto.scrypt);
const HASH_PREFIX = "scrypt";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const updateOwnProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Valid email is required"),
  phoneNumber: z.string().trim().nullable().optional(),
  avatar: z.string().trim().nullable().optional(),
});

export type SafeUser = Omit<User, "password">;

export function sanitizeUser(user: User): SafeUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${HASH_PREFIX}:${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  if (!storedPassword.startsWith(`${HASH_PREFIX}:`)) {
    return password === storedPassword;
  }

  const [, salt, key] = storedPassword.split(":");
  if (!salt || !key) return false;

  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(key, "hex");

  return storedKey.length === derivedKey.length && crypto.timingSafeEqual(storedKey, derivedKey);
}

async function findUserByLogin(identifier: string): Promise<User | undefined> {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  if (!normalizedIdentifier) return undefined;

  const exactUsernameMatch = await storage.getUserByUsername(normalizedIdentifier);
  if (exactUsernameMatch) return exactUsernameMatch;

  const users = await storage.getUsers();
  return users.find((candidate) => {
    return (
      candidate.username.toLowerCase() === normalizedIdentifier ||
      candidate.email.toLowerCase() === normalizedIdentifier
    );
  });
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user) {
    req.session.destroy(() => undefined);
    return res.status(401).json({ message: "Authentication required" });
  }

  req.organizationId = user.organizationId;
  next();
};

export const rolePermissions: Record<string, Set<string>> = {
  club_super_admin: new Set(["manage_players", "manage_teams", "schedule_training", "view_reports", "manage_tactics", "manage_users", "export_data", "manage_finance", "manage_roles"]),
  head_coach: new Set(["manage_players", "manage_teams", "schedule_training", "view_reports", "manage_tactics", "manage_users", "export_data", "manage_finance"]),
  admin: new Set(["manage_players", "manage_teams", "view_reports", "manage_users", "export_data", "manage_finance"]),
  team_admin_director: new Set(["manage_players", "manage_teams", "schedule_training", "view_reports", "manage_users", "export_data", "manage_finance"]),
  team_admin_supervisor: new Set(["manage_players", "manage_teams", "schedule_training", "view_reports", "export_data", "manage_finance"]),
  assistant_coach: new Set(["manage_players", "schedule_training", "view_reports", "manage_tactics"]),
  assistant: new Set(["view_reports"]),
  player: new Set(),
};

export function getRolePermissions(role: string): string[] {
  return Array.from(rolePermissions[role] ?? []);
}

export function requirePermission(permission: string): RequestHandler {
  return async (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!rolePermissions[user.role]?.has(permission)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    req.organizationId = user.organizationId;
    next();
  };
}

export function getCurrentUserId(req: { session: { userId?: number } }): number {
  if (!req.session.userId) {
    throw new Error("Authenticated user missing from session");
  }
  return req.session.userId;
}

// Tenant scope for the current request. Only valid after requireAuth/requirePermission
// has run — organization_id must never be sourced from the request body or query string.
export function getCurrentOrganizationId(req: { organizationId?: number }): number {
  if (req.organizationId === undefined) {
    throw new Error("Request is not organization-scoped (requireAuth/requirePermission must run first)");
  }
  return req.organizationId;
}

// The platform owner is the super-admin of organization 1 (the platform's own
// tenant, seeded at install). Only they may perform platform-level actions such
// as creating new organizations — this is deliberately NOT a per-org permission,
// because a club_super_admin of some customer org must never be able to mint
// other organizations. Onboarding is a hand-operated, owner-only action.
export const PLATFORM_ORGANIZATION_ID = 1;

export const requirePlatformOwner: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (user.organizationId !== PLATFORM_ORGANIZATION_ID || user.role !== "club_super_admin") {
    return res.status(403).json({ message: "Platform owner access required" });
  }
  req.organizationId = user.organizationId;
  next();
};

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await findUserByLogin(credentials.username);

      if (!user || !(await verifyPassword(credentials.password, user.password))) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      if (!user.password.startsWith(`${HASH_PREFIX}:`)) {
        const password = await hashPassword(credentials.password);
        await storage.updateUser(user.id, { password }, user.organizationId);
      }

      req.session.regenerate((regenErr) => {
        if (regenErr) {
          return res.status(500).json({ message: "Failed to start session" });
        }

        req.session.userId = user.id;

        req.session.save((saveErr) => {
          if (saveErr) {
            return res.status(500).json({ message: "Failed to save session" });
          }
          res.json({ user: sanitizeUser(user) });
        });
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid login request" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((error) => {
      if (error) {
        return res.status(500).json({ message: "Failed to end session" });
      }

      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => undefined);
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.json({ user: sanitizeUser(user) });
  });

  app.patch("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const payload = updateOwnProfileSchema.parse(req.body);
      const normalizedEmail = payload.email.trim().toLowerCase();

      const users = await storage.getUsers();
      const emailOwner = users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
      if (emailOwner && emailOwner.id !== req.session.userId) {
        return res.status(400).json({ message: "Email is already registered to another user" });
      }

      const updated = await storage.updateUser(req.session.userId, {
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: normalizedEmail,
        phoneNumber: payload.phoneNumber?.trim() || null,
        avatar: payload.avatar || null,
      }, currentUser.organizationId);

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user: sanitizeUser(updated) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message ?? "Invalid profile data" });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Player signup via invitation
  app.post("/api/auth/signup-player", async (req, res) => {
    try {
      const { token, email, password, confirmPassword, firstName, lastName, username } = req.body;

      // Validate input
      if (!token || !email || !password || !confirmPassword || !firstName || !lastName || !username) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Get the invitation
      const invitation = await storage.getPlayerInvitationByToken(token);

      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation" });
      }

      // Check if invitation is expired
      if (new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ message: "This invitation has expired" });
      }

      // Check if invitation is already used
      if (invitation.usedAt) {
        return res.status(400).json({ message: "This invitation has already been used" });
      }

      // Check if email matches (if email was provided in invitation)
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedUsername = username.toLowerCase().trim();

      if (invitation.email && invitation.email.toLowerCase().trim() !== normalizedEmail) {
        return res.status(400).json({ message: "Email does not match the invitation" });
      }

      // Check if username already exists
      const existingUser = await findUserByLogin(normalizedUsername);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUsers();
      if (existingEmail.some((u: any) => u.email.toLowerCase() === normalizedEmail)) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create user account, scoped to the inviting organization
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username: normalizedUsername,
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        role: "player",
      }, invitation.organizationId);

      // Mark invitation as used
      await storage.updatePlayerInvitation(invitation.id, { usedAt: new Date() }, invitation.organizationId);

      res.status(201).json({
        user: sanitizeUser(user),
        redirectTo: "/login",
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ 
        message: "Signup failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // ── Password reset ───────────────────────────────────────────────────

  function makeResetToken(userId: number, passwordHash: string): string {
    const secret = process.env.SESSION_SECRET ?? "dev-session-secret-change-me";
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour
    const payload = `${userId}:${expiry}:${passwordHash.slice(0, 12)}`;
    const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return `${Buffer.from(payload).toString("base64url")}.${sig}`;
  }

  function verifyResetToken(token: string, user: User): boolean {
    const [encodedPayload, sig] = token.split(".");
    if (!encodedPayload || !sig) return false;

    const secret = process.env.SESSION_SECRET ?? "dev-session-secret-change-me";
    const payload = Buffer.from(encodedPayload, "base64url").toString();
    const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) return false;

    const [userIdStr, expiryStr, hashPrefix] = payload.split(":");
    if (Number(userIdStr) !== user.id) return false;
    if (Date.now() > Number(expiryStr)) return false;
    if (!user.password.startsWith(hashPrefix)) return false;

    return true;
  }

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body ?? {};
    // Always return 200 to avoid leaking whether an email exists
    if (typeof email !== "string" || !email.trim()) {
      return res.json({ success: true });
    }
    try {
      const users = await storage.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (user) {
        const token = makeResetToken(user.id, user.password);
        const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
        await sendPasswordResetEmail(user.email, user.firstName, resetUrl);
      }
    } catch (err) {
      // Log but don't expose error
      console.error("forgot-password error:", err);
    }
    res.json({ success: true });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, password } = req.body ?? {};
    if (typeof token !== "string" || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Invalid request" });
    }

    try {
      const [encodedPayload] = token.split(".");
      if (!encodedPayload) return res.status(400).json({ message: "Invalid token" });

      const payload = Buffer.from(encodedPayload, "base64url").toString();
      const [userIdStr] = payload.split(":");
      const user = await storage.getUser(Number(userIdStr));

      if (!user || !verifyResetToken(token, user)) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      if (await verifyPassword(password, user.password)) {
        return res.status(400).json({
          message: "That's your current password. Choose a new one, or just sign in with it.",
        });
      }

      const hashed = await hashPassword(password);
      await storage.updateUser(user.id, { password: hashed }, user.organizationId);

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Reset failed" });
    }
  });

  app.post("/api/auth/signup-employee", async (req, res) => {
    try {
      const { token, email, password, confirmPassword, firstName, lastName, username } = req.body;

      if (!token || !email || !password || !confirmPassword || !firstName || !lastName || !username) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const invitation = await storage.getEmployeeInvitationByToken(String(token));
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation" });
      }
      if (new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ message: "This invitation has expired" });
      }
      if (invitation.usedAt) {
        return res.status(400).json({ message: "This invitation has already been used" });
      }
      if (!employeeRoles.includes(invitation.role)) {
        return res.status(400).json({ message: "Invalid employee role" });
      }

      const normalizedEmail = String(email).toLowerCase().trim();
      const normalizedUsername = String(username).toLowerCase().trim();
      if (invitation.email && invitation.email.toLowerCase().trim() !== normalizedEmail) {
        return res.status(400).json({ message: "Email does not match the invitation" });
      }

      const existingUser = await findUserByLogin(normalizedUsername);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      const existingEmail = await storage.getUsers();
      if (existingEmail.some((user) => user.email.toLowerCase() === normalizedEmail)) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser({
        username: normalizedUsername,
        password: await hashPassword(String(password)),
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: normalizedEmail,
        role: invitation.role,
      }, invitation.organizationId);
      await storage.updateEmployeeInvitation(invitation.id, { usedAt: new Date() }, invitation.organizationId);

      res.status(201).json({
        user: sanitizeUser(user),
        redirectTo: "/login",
      });
    } catch (error) {
      console.error("Employee signup error:", error);
      res.status(400).json({
        message: "Signup failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
