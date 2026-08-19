import { describe, expect, it, beforeEach } from "vitest";
import { MemStorage } from "../storage";
import { provisionOrganization, ProvisionError } from "./organization-provisioning";

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Aspire Academy",
    slug: "aspire-academy",
    type: "academy",
    admin: {
      username: "aspire_admin",
      email: "admin@aspire.example",
      password: "AspirePass123",
      firstName: "Aspire",
      lastName: "Admin",
    },
    ...overrides,
  };
}

describe("provisionOrganization", () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  it("creates an organization, its super-admin, settings, and a default team", async () => {
    const result = await provisionOrganization(validInput(), { storage });

    expect(result.organization.slug).toBe("aspire-academy");
    expect(result.organization.type).toBe("academy");
    expect(result.admin.role).toBe("club_super_admin");
    expect(result.admin.organizationId).toBe(result.organization.id);

    // default team exists in the NEW org
    const teams = await storage.getTeams(result.organization.id);
    expect(teams.some((t) => t.name === "First Team")).toBe(true);
    expect(teams.every((t) => t.organizationId === result.organization.id)).toBe(true);

    // settings seeded for the new org
    const settings = await storage.getSystemSettings(result.organization.id);
    expect(settings.some((s) => s.settingKey === "org_name")).toBe(true);
    expect(settings.every((s) => s.organizationId === result.organization.id)).toBe(true);
  });

  it("never returns the admin password", async () => {
    const result = await provisionOrganization(validInput(), { storage });
    expect((result.admin as Record<string, unknown>).password).toBeUndefined();
  });

  it("isolates the new org from an existing one", async () => {
    const a = await provisionOrganization(validInput(), { storage });
    const b = await provisionOrganization(
      validInput({ slug: "rival-club", admin: { ...validInput().admin, username: "rival_admin", email: "admin@rival.example" } }),
      { storage },
    );
    // a player created in A must not be visible to B
    await storage.createPlayer(
      { firstName: "Secret", lastName: "Star", position: "forward", dateOfBirth: "2000-01-01", nationality: "BH" },
      a.organization.id,
    );
    const aPlayers = await storage.getPlayers(a.organization.id);
    const bPlayers = await storage.getPlayers(b.organization.id);
    expect(aPlayers.some((p) => p.firstName === "Secret")).toBe(true);
    expect(bPlayers.some((p) => p.firstName === "Secret")).toBe(false);
    expect(a.organization.id).not.toBe(b.organization.id);
  });

  it("rejects a duplicate slug", async () => {
    await provisionOrganization(validInput(), { storage });
    await expect(
      provisionOrganization(
        validInput({ admin: { ...validInput().admin, username: "other", email: "other@x.example" } }),
        { storage },
      ),
    ).rejects.toMatchObject({ code: "slug_taken" });
  });

  it("rejects a duplicate username across organizations", async () => {
    await provisionOrganization(validInput(), { storage });
    await expect(
      provisionOrganization(validInput({ slug: "another-club" }), { storage }),
    ).rejects.toBeInstanceOf(ProvisionError);
  });

  it("rejects a weak admin password", async () => {
    await expect(
      provisionOrganization(validInput({ admin: { ...validInput().admin, password: "short" } }), { storage }),
    ).rejects.toMatchObject({ code: "weak_password" });
  });
});
