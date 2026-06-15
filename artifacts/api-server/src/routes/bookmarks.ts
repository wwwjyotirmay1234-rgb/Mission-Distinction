import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { bookmarksTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const bookmarks = await db
      .select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.userId, user.id))
      .orderBy(desc(bookmarksTable.createdAt));
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { resourceType, resourceId, resourceTitle, subject } = req.body;
    if (!resourceType || !resourceId || !resourceTitle || !subject) {
      res.status(400).json({ error: "Missing fields" }); return;
    }
    const [bookmark] = await db.insert(bookmarksTable).values({
      userId: user.id,
      resourceType,
      resourceId,
      resourceTitle,
      subject,
    }).returning();
    res.status(201).json(bookmark);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid bookmark ID" }); return; }
    await db.delete(bookmarksTable).where(and(eq(bookmarksTable.id, id), eq(bookmarksTable.userId, user.id)));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
