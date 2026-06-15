import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { notesTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { updateStreak } from "../lib/streak";

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
    const admin = (req as any).user;
    const { title, subject, content, fileUrl, fileType } = req.body;
    if (!title || !subject) { res.status(400).json({ error: "Title and subject are required." }); return; }
    if (!content && !fileUrl) { res.status(400).json({ error: "Either text content or a file upload is required." }); return; }
    const [note] = await db.insert(notesTable).values({
      title,
      subject,
      content: content || null,
      fileUrl: fileUrl || null,
      fileType: fileType || (content ? "text" : null),
      createdBy: admin.id,
    }).returning();
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
    const admin = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(notesTable).where(eq(notesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.createdBy !== null && existing.createdBy !== admin.id) {
      res.status(403).json({ error: "You can only edit notes you created" }); return;
    }
    const { title, subject, content, fileUrl, fileType } = req.body;
    const [note] = await db.update(notesTable)
      .set({
        title,
        subject,
        content: content !== undefined ? (content || null) : existing.content,
        fileUrl: fileUrl !== undefined ? (fileUrl || null) : existing.fileUrl,
        fileType: fileType !== undefined ? (fileType || null) : existing.fileType,
        updatedAt: new Date(),
      })
      .where(eq(notesTable.id, id))
      .returning();
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(notesTable).where(eq(notesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.createdBy !== null && existing.createdBy !== admin.id) {
      res.status(403).json({ error: "You can only delete notes you created" }); return;
    }
    await db.delete(notesTable).where(eq(notesTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/read", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const user = (req as any).user;
    const [note] = await db.select().from(notesTable).where(eq(notesTable.id, id));
    if (!note) { res.status(404).json({ error: "Not found" }); return; }
    await db.insert(activityTable).values({
      userId: user.id,
      type: "note",
      description: `Read note: ${note.title}`,
    });
    await updateStreak(user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
