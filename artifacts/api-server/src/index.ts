import * as Sentry from "@sentry/node";

// ── Transient DB error codes that should NOT create new Sentry issues ─────────
// These are infrastructure hiccups (pool exhaustion, idle-connection drops,
// statement timeouts) — expected under load, already mitigated by pool config.
const TRANSIENT_DB_CODES = new Set([
  "57014", // query_canceled — statement_timeout fired
  "57P01", // admin_shutdown — Neon/managed-PG kills idle connections
  "08006", // connection_failure
  "08001", // sqlclient_unable_to_establish_sqlconnection
  "08P01", // protocol_violation
]);

function isTransientDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  if (typeof e.code === "string" && TRANSIENT_DB_CODES.has(e.code)) return true;
  const cause = e.cause;
  if (cause && typeof cause === "object") {
    const c = cause as Record<string, unknown>;
    if (typeof c.code === "string" && TRANSIENT_DB_CODES.has(c.code)) return true;
  }
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  return (
    msg.includes("connection timeout") ||
    msg.includes("connection terminated") ||
    msg.includes("query timeout") ||
    msg.includes("idle connection") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused")
  );
}

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
    beforeSend(event, hint) {
      if (isTransientDbError(hint?.originalException)) return null;
      return event;
    },
  });
}

import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
//import { initSocketServer } from "./lib/socket-server";
import { runStartupMigrations } from "./lib/migrate";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
//initSocketServer(httpServer);

runStartupMigrations()
  .then(() => logger.info("[DB] Startup migrations applied ✓"))
  .catch((err) => logger.error({ err }, "[DB] Startup migration failed"));

// ─── Startup config validation ────────────────────────────────────────────────
if (!process.env.SENDGRID_API_KEY || !(process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_EMAIL)) {
  logger.warn(
    `[Email] Transactional email DISABLED — missing Replit Secret: SENDGRID_API_KEY and/or SENDGRID_FROM_EMAIL. ` +
    `Affected: registration verification, password reset. ` +
    `Fix: add SENDGRID_API_KEY and SENDGRID_FROM_EMAIL at Tools → Secrets, then restart the server.`
  );
} else {
  logger.info("[Email] SendGrid configured ✓ — transactional email enabled.");
}
// ─────────────────────────────────────────────────────────────────────────────

httpServer.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});

// ─── Structured monitoring — unhandled errors (A09) ──────────────────────────
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise: String(promise) }, "[Monitor] Unhandled Promise Rejection — review stack and fix root cause");
  Sentry.captureException(reason);
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "[Monitor] Uncaught Exception — server will exit");
  Sentry.captureException(err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info("[Monitor] SIGTERM received — graceful shutdown initiated");
  httpServer.close(() => {
    logger.info("[Monitor] All connections closed — process exiting");
    process.exit(0);
  });
});
