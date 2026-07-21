import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { deviceEventsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import { adminMiddleware } from "../middlewares/auth";
import { logDeviceEvent } from "../lib/deviceEvents";

const router = Router();

// Public/optional-auth: called from the frontend when the PWA is installed
router.post("/device-event", async (req: Request, res: Response) => {
  try {
    const { type } = req.body;
    if (type !== "install") {
      res.status(400).json({ error: "Invalid event type" });
      return;
    }
    const userId = (req as any).user?.id ?? null;
    await logDeviceEvent(userId, "install", req.headers["user-agent"] as string | undefined);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("device-event error:", err);
    res.status(500).json({ error: "Failed to log event" });
  }
});

router.get("/admin/analytics/devices", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        type: deviceEventsTable.type,
        platform: deviceEventsTable.platform,
        count: sql<number>`count(*)::int`,
      })
      .from(deviceEventsTable)
      .groupBy(deviceEventsTable.type, deviceEventsTable.platform);

    const emptyBreakdown = { android_phone: 0, android_tablet: 0, ios: 0, desktop: 0, other: 0 };
    const logins = { ...emptyBreakdown };
    const installs = { ...emptyBreakdown };

    for (const row of rows) {
      const target = row.type === "install" ? installs : logins;
      if (row.platform in target) {
        (target as any)[row.platform] = row.count;
      } else {
        target.other += row.count;
      }
    }

    res.json({ logins, installs });
  } catch (err) {
    console.error("device analytics error:", err);
    res.status(500).json({ error: "Failed to fetch device analytics" });
  }
});

export { router as deviceAnalyticsRouter };
