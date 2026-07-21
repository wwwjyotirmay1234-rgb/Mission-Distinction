import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { appUpdatesTable, usersTable } from "@workspace/db";
import { eq, gt } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// Student/any logged-in user: get updates published since they last checked
router.get("/unseen", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const since = user.lastSeenAppUpdateAt ?? user.createdAt;
    const updates = await db.select().from(appUpdatesTable)
      .where(gt(appUpdatesTable.createdAt, since))
      .orderBy(appUpdatesTable.createdAt)
      .limit(20);
    res.json(updates);
  } catch { res.status(500).json({ error: "Failed to load updates" }); }
});

// Student/any logged-in user: mark all current updates as seen
router.post("/seen", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await db.update(usersTable).set({ lastSeenAppUpdateAt: new Date() }).where(eq(usersTable.id, user.id));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to mark updates seen" }); }
});

export { router as appUpdatesRouter };
