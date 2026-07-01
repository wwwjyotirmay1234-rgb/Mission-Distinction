---
name: lib/db dist must be rebuilt after schema changes
description: This monorepo uses TS project references; api-server (and other consumers) resolve @workspace/db/schema against lib/db/dist, not the live source, so new schema exports silently 404 in tsc until lib/db is rebuilt.
---

`lib/db`'s package exports point at source (`./src/schema/index.ts`), but consuming packages like `artifacts/api-server` declare it as a TS project reference (`references: [{ path: "../../lib/db" }]`) and resolve its declaration files from `lib/db/dist/**/*.d.ts`.

Adding a new schema file and exporting it from `lib/db/src/schema/index.ts` is not enough — `tsc --noEmit` in a consumer package will report `Module '"@workspace/db/schema"' has no exported member 'xTable'` even though the source is correct, because `dist/schema/index.d.ts` is stale.

**Why:** Hit this while adding a `deviceEvents` table — the schema and route code were correct, but api-server's type-check failed until `lib/db`'s dist was regenerated.

**How to apply:** After adding/changing anything in `lib/db/src/schema/`, run `cd lib/db && npx tsc -b` (or the package's build script) before re-running `tsc --noEmit` in consumers. If drizzle-kit push also fails with a TTY-prompt error in this non-interactive environment, fall back to creating/altering the table directly via `psql "$DATABASE_URL" -c "..."` matching the schema exactly.
