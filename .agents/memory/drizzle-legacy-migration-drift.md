---
name: Drizzle schema drift vs legacy raw-SQL migrations
description: Two parallel migration systems in this codebase cause the deployment tool to propose destructive drops of live tables/columns.
---

This project has two independent, out-of-sync migration systems:
1. Drizzle (`lib/db/src/schema/*.ts`) — used by `drizzle-kit push` and by Replit's deployment migration-diff tool.
2. A legacy raw-SQL `runStartupMigrations()` (`artifacts/api-server/src/lib/migrate.ts`) — runs on every server boot via a raw pg pool, and is the *actual* source of truth for several tables/columns that were never added to Drizzle schema files.

**Why it matters:** Any table/column that exists only via the raw-SQL file is invisible to Drizzle. When generating a deploy migration, Drizzle's diff sees the "missing" column/table in its own schema and proposes `DROP` — destroying real production data on approval, even though the column is actively used in code.

**How to apply:** Before approving any Replit deployment migration that shows `DROP TABLE`/`DROP COLUMN` for tables that sound real/used, cross-check `artifacts/api-server/src/lib/migrate.ts` — if it's created there via raw SQL, add a matching Drizzle schema definition (same column names/types/defaults) instead of approving the drop. Verify with `cd lib/db && npx drizzle-kit push --strict --verbose` (shows pending diff) then `--force` to apply, and confirm "No changes detected" on a second run. Remember to rebuild `lib/db` (`npx tsc -b`) after schema file edits so api-server picks up the change.
