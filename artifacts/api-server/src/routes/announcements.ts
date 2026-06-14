import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { announcementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    let announcements = await db.select().from(announcementsTable);
    if (type) announcements = announcements.filter(a => a.type === type);
    res.json(announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, content, type } = req.body;
    if (!title || !content || !type) { res.status(400).json({ error: "Missing fields" }); return; }
    const [announcement] = await db.insert(announcementsTable).values({ title, content, type }).returning();
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
