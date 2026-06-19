import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { examsTable } from "@workspace/db/schema";
import { eq, and, or, gte, asc, isNull } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";

const router = Router();

// List exams (global + user's own, upcoming only unless ?all=1)
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const showAll = req.query.all === "1";
    const now = new Date();

    const rows = await db.select().from(examsTable)
      .where(and(
        showAll ? undefined : gte(examsTable.examDate, now),
        or(eq(examsTable.isGlobal, true), eq(examsTable.userId, userId))
      ))
      .orderBy(asc(examsTable.examDate));

    res.json(rows);
  } catch { res.status(500).json({ error: "Failed to load exams" }); }
});

// Create personal exam
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const { title, subject, examDate, description } = req.body;
    if (!title?.trim() || !subject || !examDate) { res.status(400).json({ error: "title, subject, examDate required" }); return; }
    const [row] = await db.insert(examsTable).values({
      userId,
      title: title.trim(),
      subject,
      examDate: new Date(examDate),
      description: description?.trim() || null,
      isGlobal: false,
    }).returning();
    res.json(row);
  } catch { res.status(500).json({ error: "Failed to create exam" }); }
});

// Create global exam (admin only)
router.post("/global", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!(req as any).user?.isAdmin) { res.status(403).json({ error: "Admin only" }); return; }
    const { title, subject, examDate, description } = req.body;
    if (!title?.trim() || !subject || !examDate) { res.status(400).json({ error: "title, subject, examDate required" }); return; }
    const [row] = await db.insert(examsTable).values({
      userId: null,
      title: title.trim(),
      subject,
      examDate: new Date(examDate),
      description: description?.trim() || null,
      isGlobal: true,
    }).returning();
    res.json(row);
  } catch { res.status(500).json({ error: "Failed to create global exam" }); }
});

// Delete exam
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const id = parseId(req.params.id);
    const isAdmin = (req as any).user?.isAdmin;
    const [row] = await db.select().from(examsTable).where(eq(examsTable.id, id)).limit(1);
    if (!row) { res.status(404).json({ error: "Exam not found" }); return; }
    if (!isAdmin && row.userId !== userId) { res.status(403).json({ error: "Not yours" }); return; }
    await db.delete(examsTable).where(eq(examsTable.id, id));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete exam" }); }
});

export { router as examsRouter };
