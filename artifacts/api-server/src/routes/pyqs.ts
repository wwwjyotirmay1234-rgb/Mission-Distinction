import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { pyqsTable } from "@workspace/db";
import { eq, and, gte, count } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";
import { awardXp, XP_VALUES } from "../lib/xp";
import { xpTransactionsTable } from "@workspace/db";

const router = Router();

function isValidHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch { return false; }
}

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject, year, search, college } = req.query;
    let pyqs = await db.select().from(pyqsTable).orderBy(pyqsTable.createdAt).limit(500);
    if (subject) pyqs = pyqs.filter(p => p.subject.toLowerCase() === (subject as string).toLowerCase());
    if (year) pyqs = pyqs.filter(p => p.year === (year as string));
    if (college) pyqs = pyqs.filter(p => (p as any).college === (college as string));
    if (search) pyqs = pyqs.filter(p => p.title.toLowerCase().includes((search as string).toLowerCase()));
    res.json(pyqs);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/read", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [pyq] = await db.select().from(pyqsTable).where(eq(pyqsTable.id, id));
    if (!pyq) { res.status(404).json({ error: "PYQ not found" }); return; }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const type = `pyq_read_${id}`;
    const [{ total }] = await db
      .select({ total: count() })
      .from(xpTransactionsTable)
      .where(and(
        eq(xpTransactionsTable.userId, user.id),
        eq(xpTransactionsTable.type, type),
        gte(xpTransactionsTable.createdAt, dayStart),
      ));

    if (Number(total) === 0) {
      awardXp(user.id, XP_VALUES.BOOK_READ, type, `Opened PYQ: ${pyq.title.slice(0, 60)}`).catch(() => {});
    }

    await db.update(pyqsTable)
      .set({ downloadCount: (pyq.downloadCount ?? 0) + 1 })
      .where(eq(pyqsTable.id, id));

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { title, subject, year, url, college } = req.body;
    if (!title || !subject || !year || !url) { res.status(400).json({ error: "Missing fields" }); return; }
    if (!isValidHttpsUrl(url)) { res.status(400).json({ error: "url must be a valid HTTPS URL" }); return; }
    const safeTitle = stripHtml(String(title));
    const safeSubject = stripHtml(String(subject));
    const safeYear = stripHtml(String(year));
    const safeCollege = college ? stripHtml(String(college)) : "VIMSAR";
    if (!safeTitle || !safeSubject || !safeYear) { res.status(400).json({ error: "Invalid fields" }); return; }
    const [pyq] = await db.insert(pyqsTable).values({
      title: safeTitle, subject: safeSubject, year: safeYear, url,
      college: safeCollege,
      createdBy: admin.id,
    } as any).returning();
    res.status(201).json(pyq);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(pyqsTable).where(eq(pyqsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const { title, subject, year, url, college } = req.body;
    if (url && !isValidHttpsUrl(url)) { res.status(400).json({ error: "url must be a valid HTTPS URL" }); return; }
    const updates: any = {};
    if (title !== undefined) updates.title = stripHtml(String(title));
    if (subject !== undefined) updates.subject = stripHtml(String(subject));
    if (year !== undefined) updates.year = stripHtml(String(year));
    if (url !== undefined) updates.url = url;
    if (college !== undefined) updates.college = stripHtml(String(college));
    const [pyq] = await db.update(pyqsTable).set(updates).where(eq(pyqsTable.id, id)).returning();
    res.json(pyq);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(pyqsTable).where(eq(pyqsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    await db.delete(pyqsTable).where(eq(pyqsTable.id, id));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
