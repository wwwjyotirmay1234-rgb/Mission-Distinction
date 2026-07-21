import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { booksTable } from "@workspace/db";
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
    const { subject, search } = req.query;
    let books = await db.select().from(booksTable).limit(500);
    if (subject) books = books.filter(b => b.subject.toLowerCase() === (subject as string).toLowerCase());
    if (search) books = books.filter(b => b.title.toLowerCase().includes((search as string).toLowerCase()));
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Track book read — awards XP once per book per day per student
router.post("/:id/read", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [book] = await db.select().from(booksTable).where(eq(booksTable.id, id));
    if (!book) { res.status(404).json({ error: "Book not found" }); return; }

    // Only award XP once per book per day
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const type = `book_read_${id}`;
    const [{ total }] = await db
      .select({ total: count() })
      .from(xpTransactionsTable)
      .where(and(
        eq(xpTransactionsTable.userId, user.id),
        eq(xpTransactionsTable.type, type),
        gte(xpTransactionsTable.createdAt, dayStart),
      ));

    if (Number(total) === 0) {
      awardXp(user.id, XP_VALUES.BOOK_READ, type, `Read book: ${book.title.slice(0, 60)}`).catch(() => {});
    }

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { title, subject, author, url, coverUrl } = req.body;
    if (!title || !subject || !url) { res.status(400).json({ error: "Missing fields" }); return; }
    if (!isValidHttpsUrl(url)) { res.status(400).json({ error: "url must be a valid HTTPS URL" }); return; }
    if (coverUrl && !isValidHttpsUrl(coverUrl)) {
      res.status(400).json({ error: "coverUrl must be a valid HTTPS URL" }); return;
    }
    const safeTitle = stripHtml(String(title));
    const safeSubject = stripHtml(String(subject));
    const safeAuthor = author ? stripHtml(String(author)) : null;
    if (!safeTitle) { res.status(400).json({ error: "Invalid title" }); return; }
    if (!safeSubject) { res.status(400).json({ error: "Invalid subject" }); return; }
    const [book] = await db.insert(booksTable).values({
      title: safeTitle, subject: safeSubject, author: safeAuthor, url, coverUrl,
      createdBy: admin.id,
    }).returning();
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(booksTable).where(eq(booksTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.createdBy !== null && existing.createdBy !== admin.id) {
      res.status(403).json({ error: "You can only edit books you added" }); return;
    }
    const { title, subject, author, url, coverUrl } = req.body;
    if (url && !isValidHttpsUrl(url)) { res.status(400).json({ error: "url must be a valid HTTPS URL" }); return; }
    if (coverUrl && !isValidHttpsUrl(coverUrl)) {
      res.status(400).json({ error: "coverUrl must be a valid HTTPS URL" }); return;
    }
    const safeTitle = title !== undefined ? stripHtml(String(title)) : undefined;
    const safeSubject = subject !== undefined ? stripHtml(String(subject)) : undefined;
    const safeAuthor = author !== undefined ? (author ? stripHtml(String(author)) : null) : undefined;
    if (safeTitle !== undefined && !safeTitle) { res.status(400).json({ error: "Invalid title" }); return; }
    if (safeSubject !== undefined && !safeSubject) { res.status(400).json({ error: "Invalid subject" }); return; }
    const [book] = await db.update(booksTable)
      .set({ title: safeTitle, subject: safeSubject, author: safeAuthor, url, coverUrl })
      .where(eq(booksTable.id, id))
      .returning();
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(booksTable).where(eq(booksTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (!admin.isSuperAdmin && existing.createdBy !== null && existing.createdBy !== admin.id) {
      res.status(403).json({ error: "You can only delete books you added" }); return;
    }
    await db.delete(booksTable).where(eq(booksTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
