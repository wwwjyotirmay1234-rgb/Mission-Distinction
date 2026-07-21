import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import { desc, gte, eq, and } from "drizzle-orm";
import { adminMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { days = "7", adminId, action } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    let query = db.select().from(auditLogsTable).where(gte(auditLogsTable.createdAt, since));

    const logs = await db.select().from(auditLogsTable)
      .where(gte(auditLogsTable.createdAt, since))
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(500);

    res.json(logs);
  } catch { res.status(500).json({ error: "Failed to load audit logs" }); }
});

export { router as auditLogsRouter };
