import type { Express } from "express";
import { insertMatchSquadSchema } from "@shared/schema";
import { asyncHandler, parseBody, parseIdParam, validateBody } from "../api-contracts";
import { requireAuth, requirePermission, getCurrentOrganizationId } from "../auth";
import { storage } from "../storage";

export function registerMatchSquadRoutes(app: Express) {
  app.get("/api/matches/:matchId/squad", requireAuth, asyncHandler(async (req, res) => {
    const matchId = parseIdParam(req.params.matchId, "matchId");
    const match = await storage.getMatch(matchId, getCurrentOrganizationId(req));
    if (!match) return res.status(404).json({ error: "Match not found" });
    const squad = await storage.getMatchSquad(matchId);
    res.json(squad);
  }));

  app.post("/api/matches/:matchId/squad", requirePermission("manage_teams"), asyncHandler(async (req, res) => {
    const matchId = parseIdParam(req.params.matchId, "matchId");
    const match = await storage.getMatch(matchId, getCurrentOrganizationId(req));
    if (!match) return res.status(404).json({ error: "Match not found" });
    const validatedData = parseBody(insertMatchSquadSchema, {
      ...req.body,
      matchId,
    });
    const squadMember = await storage.addPlayerToMatchSquad(validatedData);
    res.status(201).json(squadMember);
  }));

  app.patch(
    "/api/match-squad/:id",
    requirePermission("manage_teams"),
    validateBody(insertMatchSquadSchema.partial()),
    asyncHandler(async (req, res) => {
      const id = parseIdParam(req.params.id);
      const squadMember = await storage.updateMatchSquad(id, req.body);
      if (!squadMember) {
        return res.status(404).json({ error: "Match squad member not found" });
      }
      res.json(squadMember);
    }),
  );

  app.delete("/api/match-squad/:id", requirePermission("manage_teams"), asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id);
    const success = await storage.deleteMatchSquad(id);
    if (!success) {
      return res.status(404).json({ error: "Match squad member not found" });
    }
    res.status(204).send();
  }));

  app.delete("/api/matches/:matchId/squad/:playerId", requirePermission("manage_teams"), asyncHandler(async (req, res) => {
    const matchId = parseIdParam(req.params.matchId, "matchId");
    const playerId = parseIdParam(req.params.playerId, "playerId");
    const match = await storage.getMatch(matchId, getCurrentOrganizationId(req));
    if (!match) return res.status(404).json({ error: "Match not found" });
    const success = await storage.removePlayerFromMatchSquad(matchId, playerId);
    if (!success) {
      return res.status(404).json({ error: "Match squad member not found" });
    }
    res.status(204).send();
  }));
}
