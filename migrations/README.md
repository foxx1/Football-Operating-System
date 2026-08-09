# Database Migrations

Schema source lives in `shared/schema.ts`.

Use these commands:

- `npm run db:generate` to create migration files from schema changes.
- `npm run db:migrate` to apply generated migrations.
- `npm run db:audit` to check existing data before applying stricter constraints.
- `npm run db:seed` to create/update the default admin user and baseline settings.
- `npm run db:push` only for local/prototype database synchronization.

Before applying new foreign keys or unique indexes to an existing database, run a
data audit for orphaned rows and duplicate relationships. The Phase 2 schema now
expects core relationships such as team-player, attendance, squads, budgets,
wearables, and achievements to be referentially valid.
