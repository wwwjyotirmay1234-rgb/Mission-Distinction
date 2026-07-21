import { Router, type IRouter } from "express";
import { createReadStream, existsSync } from "fs";
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

// Temporary migration dump download — bypasses maintenance mode
// Remove this route after migration is complete
router.get("/migration-download", (_req, res) => {
  const filePath = "/tmp/md_migration.sql.gz";
  if (!existsSync(filePath)) {
    res.status(404).json({ error: "Dump not ready. Ask agent to regenerate it." });
    return;
  }
  res.setHeader("Content-Type", "application/gzip");
  res.setHeader("Content-Disposition", 'attachment; filename="mission_distinction_db.sql.gz"');
  createReadStream(filePath).pipe(res);
});

export default router;
