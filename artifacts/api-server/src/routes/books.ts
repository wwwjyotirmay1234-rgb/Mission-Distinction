import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { booksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject, search } = req.query;
    let books = await db.select().from(booksTable);
    if (subject) books = books.filter(b => b.subject.toLowerCase() === (subject as string).toLowerCase());
    if (search) books = books.filter(b => b.title.toLowerCase().includes((search as string).toLowerCase()));
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, subject, author, url, coverUrl } = req.body;
    if (!title || !subject || !url) { res.status(400).json({ error: "Missing fields" }); return; }
    const [book] = await db.insert(booksTable).values({ title, subject, author, url, coverUrl }).returning();
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(booksTable).where(eq(booksTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
