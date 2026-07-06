import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 8000,
  // Without a query-level timeout, a single stalled/half-dead connection to a
  // managed Postgres provider (e.g. a brief network blip or compute
  // suspend/resume) can hang a query for 30s+ instead of erroring out. Since
  // every route acquires a user row via authMiddleware first, one hung query
  // ties up a pool slot; enough of them in parallel exhaust all 20 slots and
  // every endpoint (even unrelated ones) starts timing out together, which is
  // exactly what happened in production on 2026-07-06 13:18-13:26 UTC. Failing
  // fast frees the slot for retry instead of cascading into a full outage.
  statement_timeout: 15000,
  query_timeout: 15000,
  keepAlive: true,
});

// Prevent idle-client errors from crashing the process.
// Neon (and other managed Postgres providers) may forcibly terminate
// idle connections (PG error code 57P01 — "terminating connection due
// to administrator command"). Without this handler the pg Pool emits
// an 'error' event with no listener, which Node treats as an uncaught
// exception and exits the process — taking down the server for everyone.
pool.on("error", (err: NodeJS.ErrnoException) => {
  console.error("[DB Pool] Idle client error (will reconnect automatically):", err.message, err.code ?? "");
});

export const db = drizzle(pool, { schema });

export * from "./schema";
