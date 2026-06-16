import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { booksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";

const router = Router();

const CLOUDINARY_REGEX = /^https:\/\/res\.cloudinary\.com\//;

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

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { title, subject, author, url, coverUrl } = req.body;
    if (!title || !subject || !url) { res.status(400).json({ error: "Missing fields" }); return; }
    if (!isValidHttpsUrl(url)) { res.status(400).json({ error: "url must be a valid HTTPS URL" }); return; }
    if (coverUrl && !CLOUDINARY_REGEX.test(coverUrl)) {
      res.status(400).json({ error: "coverUrl must be a Cloudinary URL" }); return;
    }
    const [book] = await db.insert(booksTable).values({
      title, subject, author, url, coverUrl,
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
    if (coverUrl && !CLOUDINARY_REGEX.test(coverUrl)) {
      res.status(400).json({ error: "coverUrl must be a Cloudinary URL" }); return;
    }
    const [book] = await db.update(booksTable)
      .set({ title, subject, author, url, coverUrl })
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
    if (existing.createdBy !== null && existing.createdBy !== admin.id) {
      res.status(403).json({ error: "You can only delete books you added" }); return;
    }
    await db.delete(booksTable).where(eq(booksTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
