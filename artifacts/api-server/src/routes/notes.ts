import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { notesTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject, search } = req.query;
    let notes = await db.select().from(notesTable);
    if (subject) notes = notes.filter(n => n.subject.toLowerCase() === (subject as string).toLowerCase());
    if (search) notes = notes.filter(n => n.title.toLowerCase().includes((search as string).toLowerCase()));
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, subject, content, author } = req.body;
    if (!title || !subject || !content) { res.status(400).json({ error: "Missing fields" }); return; }
    const [note] = await db.insert(notesTable).values({ title, subject, content, author }).returning();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [note] = await db.select().from(notesTable).where(eq(notesTable.id, id));
    if (!note) { res.status(404).json({ error: "Not found" }); return; }
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { title, subject, content } = req.body;
    const [note] = await db.update(notesTable).set({ title, subject, content, updatedAt: new Date() }).where(eq(notesTable.id, id)).returning();
    if (!note) { res.status(404).json({ error: "Not found" }); return; }
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(notesTable).where(eq(notesTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
