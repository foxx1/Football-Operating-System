import { storage, type IStorage } from "../storage";
import { hashPassword } from "../auth";
import type { Organization, User } from "@shared/schema";

export interface ProvisionOrganizationInput {
  name: string;
  nameAr?: string;
  slug: string;
  type?: string; // club | academy | association
  country?: string;
  admin: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
}

export interface ProvisionOrganizationResult {
  organization: Organization;
  admin: Omit<User, "password">;
}

const DEFAULT_SETTINGS = (orgName: string) => [
  { category: "general", settingKey: "org_name", settingValue: orgName, description: "Organization display name" },
  { category: "general", settingKey: "current_season", settingValue: "2025-26", description: "Current active season" },
  { category: "general", settingKey: "timezone", settingValue: "Asia/Bahrain", description: "Default timezone" },
  { category: "general", settingKey: "currency", settingValue: "BHD", description: "Default currency" },
  { category: "security", settingKey: "session_timeout", settingValue: "480", description: "Session timeout in minutes" },
];

/**
 * Creates a new organization and everything it needs to be usable: its first
 * club_super_admin, a default set of system settings, and a default team.
 *
 * Uniqueness (slug, username, email) is checked up front. Username and email
 * are globally unique because login has no organization selector — a member
 * signs in with just their credentials, so those must be unambiguous platform-wide.
 *
 * NOTE ON ATOMICITY: this performs several storage writes in sequence. The
 * cleanest version wraps them in a single DB transaction so a mid-way failure
 * can't leave a half-created organization. The current storage layer doesn't
 * expose a transaction handle, so this checks preconditions first (the common
 * failure — a name clash — happens before any write) and creates the org last-
 * recoverable-first. Wrapping storage in a transaction is a worthwhile T2.1
 * follow-up; flagged in decisions.md rather than silently pretended-away.
 */
export async function provisionOrganization(
  input: ProvisionOrganizationInput,
  deps: { storage: IStorage } = { storage },
): Promise<ProvisionOrganizationResult> {
  const { storage: store } = deps;

  const slug = input.slug.trim().toLowerCase();
  const username = input.admin.username.trim();
  const email = input.admin.email.trim().toLowerCase();

  // ── Preconditions (all before any write) ──
  const existingSlug = await store.getOrganizationBySlug(slug);
  if (existingSlug) {
    throw new ProvisionError("slug_taken", `An organization with slug "${slug}" already exists`);
  }

  const existingUsername = await store.getUserByUsername(username);
  if (existingUsername) {
    throw new ProvisionError("username_taken", `Username "${username}" is already taken`);
  }

  const allUsers = await store.getUsers();
  if (allUsers.some((u: { email: string }) => u.email.toLowerCase() === email)) {
    throw new ProvisionError("email_taken", `Email "${email}" is already registered`);
  }

  if (input.admin.password.length < 8) {
    throw new ProvisionError("weak_password", "Admin password must be at least 8 characters");
  }

  // ── Create org ──
  const organization = await store.createOrganization({
    name: input.name.trim(),
    nameAr: input.nameAr?.trim() || null,
    slug,
    type: input.type ?? "club",
    country: input.country ?? "BH",
    isActive: true,
  });

  // ── First admin ──
  const hashed = await hashPassword(input.admin.password);
  const admin = await store.createUser(
    {
      username,
      email,
      password: hashed,
      role: "club_super_admin",
      firstName: input.admin.firstName.trim(),
      lastName: input.admin.lastName.trim(),
    },
    organization.id,
  );

  // ── Default settings ──
  for (const setting of DEFAULT_SETTINGS(organization.name)) {
    await store.createSystemSetting({ ...setting, isActive: true, updatedBy: admin.id }, organization.id);
  }

  // ── Default team ──
  await store.createTeam(
    { name: "First Team", category: "first_team", description: "Senior squad", isActive: true },
    organization.id,
  );

  const { password: _omit, ...safeAdmin } = admin;
  return { organization, admin: safeAdmin };
}

export class ProvisionError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "ProvisionError";
  }
}
