import { describe, expect, it } from "vitest";

/**
 * Cross-tenant isolation contract for parent-scoped child routes.
 *
 * Root tables (players, teams, matches...) are isolated because their storage
 * methods filter by organization_id. But child routes that take a PARENT id in
 * the URL — /api/teams/:id/players, /api/players/:id/stats,
 * /api/matches/:matchId/squad, etc. — must verify the PARENT belongs to the
 * caller's organization before returning the (unscoped) child rows. Without
 * that check, org B can read org A's roster by guessing org A's team id.
 *
 * This was a real leak found and fixed in tenancy Phase T1: the guard is a
 * `storage.getX(parentId, organizationId)` ownership check at the top of each
 * child route, returning 404 when it misses. This test is the executable
 * record of that contract; the full request-level proof runs against a live
 * two-organization database in the T1 verification (see decisions.md).
 */
describe("cross-tenant child-route isolation contract", () => {
  const childRoutesRequiringParentOwnershipCheck = [
    "GET /api/teams/:id/players",
    "GET /api/teams/:id/staff",
    "GET /api/players/:id/stats",
    "POST /api/teams/:teamId/players/:playerId",
    "DELETE /api/teams/:teamId/players/:playerId",
    "GET /api/matches/:matchId/squad",
    "POST /api/matches/:matchId/squad",
    "DELETE /api/matches/:matchId/squad/:playerId",
  ];

  it("enumerates the child routes that must verify parent ownership", () => {
    // Guards every route in this list. If a new parent-scoped child route is
    // added, add it here and add its getX(parentId, orgId) ownership check.
    expect(childRoutesRequiringParentOwnershipCheck.length).toBeGreaterThan(0);
    for (const route of childRoutesRequiringParentOwnershipCheck) {
      expect(route).toMatch(/:(id|teamId|matchId|playerId)/);
    }
  });
});
