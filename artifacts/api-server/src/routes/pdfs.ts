import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { pdfsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject, professor, search } = req.query;
    let pdfs = await db.select().from(pdfsTable);
    if (subject) pdfs = pdfs.filter(p => p.subject.toLowerCase() === (subject as string).toLowerCase());
    if (professor) pdfs = pdfs.filter(p => p.professor?.toLowerCase().includes((professor as string).toLowerCase()));
    if (search) pdfs = pdfs.filter(p => p.title.toLowerCase().includes((search as string).toLowerCase()));
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, subject, professor, year, url, thumbnailUrl, pages, size } = req.body;
    if (!title || !subject || !url) { res.status(400).json({ error: "Missing fields" }); return; }
    const [pdf] = await db.insert(pdfsTable).values({ title, subject, professor, year, url, thumbnailUrl, pages, size }).returning();
    res.status(201).json(pdf);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [pdf] = await db.select().from(pdfsTable).where(eq(pdfsTable.id, id));
    if (!pdf) { res.status(404).json({ error: "Not found" }); return; }
    res.json(pdf);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { title, subject, professor, year, url, pages, size } = req.body;
    const [pdf] = await db.update(pdfsTable).set({ title, subject, professor, year, url, pages, size }).where(eq(pdfsTable.id, id)).returning();
    if (!pdf) { res.status(404).json({ error: "Not found" }); return; }
    res.json(pdf);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(pdfsTable).where(eq(pdfsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
