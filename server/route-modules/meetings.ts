import type { Express } from "express";
import { insertMeetingSchema } from "@shared/schema";
import { asyncHandler, getPagination, parseIdParam, validateBody } from "../api-contracts";
import { requirePermission } from "../auth";
import { storage } from "../storage";

export function registerMeetingRoutes(app: Express) {
  app.get("/api/meetings", asyncHandler(async (req, res) => {
    const { limit, offset, search } = getPagination(req.query);
    const meetings = await storage.getMeetings();
    const filtered = search
      ? meetings.filter((meeting) =>
        [meeting.title, meeting.description, meeting.meetingType, meeting.location, meeting.status, meeting.priority]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search.toLowerCase())))
      : meetings;

    res.json({
      data: filtered.slice(offset, offset + limit),
      meta: { total: filtered.length, limit, offset },
    });
  }));

  app.get("/api/meetings/:id", asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id);
    const meeting = await storage.getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    res.json(meeting);
  }));

  app.post(
    "/api/meetings",
    requirePermission("schedule_training"),
    validateBody(insertMeetingSchema),
    asyncHandler(async (req, res) => {
      const meeting = await storage.createMeeting(req.body);
      res.status(201).json(meeting);
    }),
  );

  app.patch(
    "/api/meetings/:id",
    requirePermission("schedule_training"),
    validateBody(insertMeetingSchema.partial()),
    asyncHandler(async (req, res) => {
      const id = parseIdParam(req.params.id);
      const meeting = await storage.updateMeeting(id, req.body);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    }),
  );

  app.delete("/api/meetings/:id", requirePermission("schedule_training"), asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id);
    const success = await storage.deleteMeeting(id);
    if (!success) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    res.status(204).send();
  }));
}
