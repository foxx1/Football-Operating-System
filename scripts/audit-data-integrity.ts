import { sql } from "drizzle-orm";
import { db, pool } from "../server/db";

type AuditCheck = {
  name: string;
  query: ReturnType<typeof sql>;
};

const checks: AuditCheck[] = [
  {
    name: "duplicate team-player assignments",
    query: sql`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT team_id, player_id
        FROM team_players
        GROUP BY team_id, player_id
        HAVING COUNT(*) > 1
      ) duplicates
    `,
  },
  {
    name: "orphan team-player rows",
    query: sql`
      SELECT COUNT(*)::int AS count
      FROM team_players tp
      LEFT JOIN teams t ON t.id = tp.team_id
      LEFT JOIN players p ON p.id = tp.player_id
      WHERE t.id IS NULL OR p.id IS NULL
    `,
  },
  {
    name: "duplicate team-staff assignments",
    query: sql`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT team_id, staff_id
        FROM team_staff
        GROUP BY team_id, staff_id
        HAVING COUNT(*) > 1
      ) duplicates
    `,
  },
  {
    name: "orphan team-staff rows",
    query: sql`
      SELECT COUNT(*)::int AS count
      FROM team_staff ts
      LEFT JOIN teams t ON t.id = ts.team_id
      LEFT JOIN staff s ON s.id = ts.staff_id
      WHERE t.id IS NULL OR s.id IS NULL
    `,
  },
  {
    name: "duplicate session attendance rows",
    query: sql`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT session_id, player_id
        FROM session_attendance
        GROUP BY session_id, player_id
        HAVING COUNT(*) > 1
      ) duplicates
    `,
  },
  {
    name: "orphan session attendance rows",
    query: sql`
      SELECT COUNT(*)::int AS count
      FROM session_attendance sa
      LEFT JOIN training_sessions ts ON ts.id = sa.session_id
      LEFT JOIN players p ON p.id = sa.player_id
      WHERE ts.id IS NULL OR p.id IS NULL
    `,
  },
  {
    name: "duplicate match squad rows",
    query: sql`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT match_id, player_id
        FROM match_squads
        GROUP BY match_id, player_id
        HAVING COUNT(*) > 1
      ) duplicates
    `,
  },
  {
    name: "orphan match squad rows",
    query: sql`
      SELECT COUNT(*)::int AS count
      FROM match_squads ms
      LEFT JOIN matches m ON m.id = ms.match_id
      LEFT JOIN players p ON p.id = ms.player_id
      WHERE m.id IS NULL OR p.id IS NULL
    `,
  },
  {
    name: "duplicate system settings",
    query: sql`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT category, setting_key
        FROM system_settings
        GROUP BY category, setting_key
        HAVING COUNT(*) > 1
      ) duplicates
    `,
  },
  {
    name: "duplicate player achievements",
    query: sql`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT player_id, achievement_type_id
        FROM player_achievements
        GROUP BY player_id, achievement_type_id
        HAVING COUNT(*) > 1
      ) duplicates
    `,
  },
];

async function main() {
  let failures = 0;

  for (const check of checks) {
    const result = await db.execute(check.query);
    const count = Number(result.rows[0]?.count ?? 0);

    if (count > 0) {
      failures++;
      console.log(`FAIL ${check.name}: ${count}`);
    } else {
      console.log(`OK   ${check.name}`);
    }
  }

  await pool.end();

  if (failures > 0) {
    console.error(`\nData integrity audit found ${failures} issue group(s). Fix these before applying stricter constraints.`);
    process.exit(1);
  }

  console.log("\nData integrity audit passed.");
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
