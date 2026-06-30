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
