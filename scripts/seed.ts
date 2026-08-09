import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";
import { pool } from "../server/db";

async function ensureAdmin() {
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const passwordValue = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const email = process.env.SEED_ADMIN_EMAIL || "admin@procoach.local";
  const password = await hashPassword(passwordValue);

  const existing = await storage.getUserByUsername(username);

  if (existing) {
    await storage.updateUser(existing.id, {
      password,
      role: "club_super_admin",
      firstName: existing.firstName || "System",
      lastName: existing.lastName || "Admin",
      email: existing.email || email,
    });
    console.log(`Updated admin user: ${username}`);
    return existing.id;
  }

  const created = await storage.createUser({
    username,
    password,
    role: "club_super_admin",
    firstName: "System",
    lastName: "Admin",
    email,
  });

  console.log(`Created admin user: ${username}`);
  return created.id;
}

async function ensureDefaultSettings(updatedBy: number) {
  const settings = [
    { category: "general", settingKey: "org_name", settingValue: "ProCoach Team", description: "Organization display name" },
    { category: "general", settingKey: "current_season", settingValue: "2025-26", description: "Current active season" },
    { category: "general", settingKey: "timezone", settingValue: "Asia/Bahrain", description: "Default timezone" },
    { category: "general", settingKey: "currency", settingValue: "BHD", description: "Default currency" },
    { category: "security", settingKey: "session_timeout", settingValue: "480", description: "Session timeout in minutes" },
  ];

  for (const setting of settings) {
    await storage.createSystemSetting({
      ...setting,
      isActive: true,
      updatedBy,
    });
  }

  console.log(`Seeded ${settings.length} default settings`);
}

async function ensureDefaultTeam() {
  const teams = await storage.getTeams();
  const existing = teams.find((team) => team.name === "First Team");

  if (existing) {
    console.log("Default team already exists");
    return;
  }

  await storage.createTeam({
    name: "First Team",
    category: "first_team",
    description: "Senior squad",
    isActive: true,
  });

  console.log("Created default team");
}

async function main() {
  const adminId = await ensureAdmin();
  await ensureDefaultSettings(adminId);
  await ensureDefaultTeam();
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
