import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { logger } from "./lib/logger";
import { csrfDefense } from "./middlewares/csrf";
import * as Sentry from "@sentry/node";

// Transient DB / infrastructure error codes — not code bugs, not worth alerting
const TRANSIENT_DB_CODES = new Set(["57014", "57P01", "08006", "08001", "08P01"]);

function isTransientDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  if (typeof e.code === "string" && TRANSIENT_DB_CODES.has(e.code)) return true;
  const cause = (e.cause ?? (e as any).originalError) as Record<string, unknown> | undefined;
  if (cause && typeof cause.code === "string" && TRANSIENT_DB_CODES.has(cause.code)) return true;
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  return (
    msg.includes("connection timeout") ||
    msg.includes("connection terminated") ||
    msg.includes("query timeout") ||
    msg.includes("idle connection") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("canceling statement") ||
    msg.includes("terminating connection")
  );
}

const app: Express = express();

// Trust the first proxy hop (Replit's reverse proxy) so that express-rate-limit
// can correctly identify client IPs from the X-Forwarded-For header.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: process.env.NODE_ENV === "production",
    },
    permittedCrossDomainPolicies: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://lh3.googleusercontent.com"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
  }),
);

const allowedOrigins: string[] | boolean =
  process.env.NODE_ENV === "production"
    ? (process.env.REPLIT_DOMAINS || "")
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => `https://${d}`)
    : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
// ── Maintenance mode gate ─────────────────────────────────────────────────────
// Set MAINTENANCE_MODE=true to block all write traffic while migrating DB.
// GET /api/health always passes through so the frontend can detect the state.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.MAINTENANCE_MODE !== "true") return next();
  if (req.method === "GET" && (req.url.startsWith("/api/health") || req.url.startsWith("/api/migration-download"))) return next();
  res.status(503).json({
    maintenance: true,
    message: "Mission Distinction is under maintenance. We'll be back in a few minutes.",
  });
});

app.use("/api", csrfDefense);

app.use("/api", router);

Sentry.setupExpressErrorHandler(app);

// ── Global error handler ───────────────────────────────────────────────────────
// Must be defined AFTER Sentry's handler so Sentry captures real bugs first.
// Transient DB errors (pool exhaustion, statement timeout, idle-connection drop)
// return 503 — not a 500 — so clients can retry without flooding error dashboards.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (isTransientDbError(err)) {
    logger.warn({ err }, "[DB] Transient connection/timeout error (503)");
    res.status(503).json({ error: "Service temporarily unavailable. Please try again." });
    return;
  }
  logger.error({ err }, "[App] Unhandled error (500)");
  res.status(500).json({ error: "Internal server error." });
});

export default app;
