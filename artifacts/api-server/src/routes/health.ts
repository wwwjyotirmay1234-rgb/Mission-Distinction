import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Root /api ping — used by deployment healthcheck
router.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

// Maintenance status — always reachable, even in maintenance mode
// (the maintenance middleware explicitly passes GET /api/health through)
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    maintenance: process.env.MAINTENANCE_MODE === "true",
  });
});

export default router;
