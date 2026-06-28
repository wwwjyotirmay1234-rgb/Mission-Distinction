import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });
}

import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { initSocketServer } from "./lib/socket-server";
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
initSocketServer(httpServer);

runStartupMigrations()
  .then(() => logger.info("[DB] Startup migrations applied ✓"))
  .catch((err) => logger.error({ err }, "[DB] Startup migration failed"));

// ─── Startup config validation ────────────────────────────────────────────────
const missingEmail: string[] = [];
if (!process.env.SENDGRID_API_KEY) missingEmail.push("SENDGRID_API_KEY");
if (!process.env.SENDGRID_FROM_EMAIL) missingEmail.push("SENDGRID_FROM_EMAIL");

if (missingEmail.length > 0) {
  logger.warn(
    `[Email] Transactional email DISABLED — missing Replit Secrets: ${missingEmail.join(", ")}. ` +
    `Affected: registration verification, password reset. ` +
    `Fix: add these secrets at Tools → Secrets, then restart the server.`
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
