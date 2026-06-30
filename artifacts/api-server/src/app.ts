import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { logger } from "./lib/logger";
import { csrfDefense } from "./middlewares/csrf";
import * as Sentry from "@sentry/node";

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
app.use("/api", csrfDefense);

app.use("/api", router);

Sentry.setupExpressErrorHandler(app);

export default app;
