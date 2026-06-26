import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { confessionsTable, confessionLikesTable } from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import rateLimit from "express-rate-limit";
import { awardXp, XP_VALUES } from "../lib/xp";

const router = Router();

const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many confessions. Please wait before posting again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// List confessions — userId is NEVER returned
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = ((req as any).user.id as number);
    const rows = await db.select({
      id: confessionsTable.id,
      content: confessionsTable.content,
      likes: confessionsTable.likes,
      createdAt: confessionsTable.createdAt,
    }).from(confessionsTable).orderBy(desc(confessionsTable.createdAt)).limit(100);

    const liked = await db.select({ confessionId: confessionLikesTable.confessionId })
      .from(confessionLikesTable).where(eq(confessionLikesTable.userId, userId));
    const likedSet = new Set(liked.map(l => l.confessionId));

    res.json(rows.map(r => ({ ...r, hasLiked: likedSet.has(r.id) })));
  } catch { res.status(500).json({ error: "Failed to load confessions" }); }
});

// Post confession
router.post("/", authMiddleware, postLimiter, async (req: Request, res: Response) => {
  try {
    const userId = ((req as any).user.id as number);
    const { content } = req.body;
    if (!content?.trim()) { res.status(400).json({ error: "content required" }); return; }
    const stripped = content.replace(/<[^>]*>/g, "").trim();
    if (!stripped) { res.status(400).json({ error: "content required" }); return; }
    if (stripped.length > 500) { res.status(400).json({ error: "Max 500 characters" }); return; }
    const [row] = await db.insert(confessionsTable).values({ userId, content: stripped }).returning();
    res.json({ id: row.id, content: row.content, likes: row.likes, createdAt: row.createdAt, hasLiked: false });
  } catch { res.status(500).json({ error: "Failed to post confession" }); }
});

// Toggle like
router.post("/:id/like", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = ((req as any).user.id as number);
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(confessionLikesTable).where(and(eq(confessionLikesTable.userId, userId), eq(confessionLikesTable.confessionId, id))).limit(1);
    if (existing) {
      await db.delete(confessionLikesTable).where(and(eq(confessionLikesTable.userId, userId), eq(confessionLikesTable.confessionId, id)));
      await db.update(confessionsTable).set({ likes: sql`GREATEST(likes - 1, 0)` }).where(eq(confessionsTable.id, id));
      res.json({ liked: false });
    } else {
      await db.insert(confessionLikesTable).values({ userId, confessionId: id });
      await db.update(confessionsTable).set({ likes: sql`likes + 1` }).where(eq(confessionsTable.id, id));
      res.json({ liked: true });
    }
  } catch { res.status(500).json({ error: "Failed to like" }); }
});

export { router as confessionsRouter };
