import type { Express } from "express";
import { asyncHandler, parseIdParam } from "../api-contracts";
import { getCurrentUserId, requireAuth } from "../auth";
import { storage } from "../storage";

export function registerNotificationRoutes(app: Express) {
  app.get("/api/notifications", requireAuth, asyncHandler(async (req, res) => {
    const notifications = await storage.getNotificationsForUser(getCurrentUserId(req));
    res.json(notifications);
  }));

  app.patch("/api/notifications/:id/read", requireAuth, asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id);
    const notification = await storage.markNotificationRead(id, getCurrentUserId(req));
    if (!notification) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notification not found" } });
    }
    res.json(notification);
  }));

  app.post("/api/notifications/read-all", requireAuth, asyncHandler(async (req, res) => {
    await storage.markAllNotificationsRead(getCurrentUserId(req));
    res.status(204).send();
  }));
}
