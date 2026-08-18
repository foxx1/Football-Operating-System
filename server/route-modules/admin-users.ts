import type { Express } from "express";
import { z } from "zod";
import { asyncHandler, parseBody, parseIdParam, validateBody } from "../api-contracts";
import { getRolePermissions, getCurrentUserId, getCurrentOrganizationId, hashPassword, requirePermission, sanitizeUser } from "../auth";
import { storage } from "../storage";

const roles = ["club_super_admin", "head_coach", "admin", "assistant_coach", "assistant", "player"] as const;

const createUserSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(8),
  role: z.enum(roles),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
});

const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(8).optional(),
});

function roleDescriptor(role: typeof roles[number]) {
  return {
    role,
    label: role
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    permissions: getRolePermissions(role),
  };
}

export function registerAdminUserRoutes(app: Express) {
  app.get("/api/admin/roles", requirePermission("manage_roles"), asyncHandler(async (_req, res) => {
    res.json(roles.map(roleDescriptor));
  }));

  app.get("/api/admin/users", requirePermission("manage_roles"), asyncHandler(async (req, res) => {
    const users = await storage.getUsers(getCurrentOrganizationId(req));
    res.json(users.map(sanitizeUser));
  }));

  app.post(
    "/api/admin/users",
    requirePermission("manage_roles"),
    validateBody(createUserSchema),
    asyncHandler(async (req, res) => {
      const existing = await storage.getUserByUsername(req.body.username);
      if (existing) {
        return res.status(409).json({ error: "Username is already in use" });
      }

      const password = await hashPassword(req.body.password);
      const user = await storage.createUser({ ...req.body, password }, getCurrentOrganizationId(req));
      res.status(201).json(sanitizeUser(user));
    }),
  );

  app.patch("/api/admin/users/:id", requirePermission("manage_roles"), asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id);
    const payload = parseBody(updateUserSchema, req.body);
    const update = {
      ...payload,
      password: payload.password ? await hashPassword(payload.password) : undefined,
    };

    if (update.password === undefined) {
      delete update.password;
    }

    const user = await storage.updateUser(id, update, getCurrentOrganizationId(req));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(sanitizeUser(user));
  }));

  app.delete("/api/admin/users/:id", requirePermission("manage_roles"), asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id);
    if (id === getCurrentUserId(req)) {
      return res.status(400).json({ error: "You cannot delete your own user" });
    }

    const success = await storage.deleteUser(id, getCurrentOrganizationId(req));
    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(204).send();
  }));
}
