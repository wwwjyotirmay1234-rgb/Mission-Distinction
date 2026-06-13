import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { bookmarksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const bookmarks = await db.select().from(bookmarksTable).where(eq(bookmarksTable.userId, user.id));
    res.json(bookmarks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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
    const id = parseInt(req.params.id);
    await db.delete(bookmarksTable).where(and(eq(bookmarksTable.id, id), eq(bookmarksTable.userId, user.id)));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
