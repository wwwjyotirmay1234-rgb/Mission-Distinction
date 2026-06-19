import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { mnemonicsTable, mnemonicUpvotesTable } from "@workspace/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";

const router = Router();

// List mnemonics
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const subject = req.query.subject as string | undefined;
    const rows = subject && subject !== "All"
      ? await db.select().from(mnemonicsTable).where(eq(mnemonicsTable.subject, subject)).orderBy(desc(mnemonicsTable.upvotes), desc(mnemonicsTable.createdAt))
      : await db.select().from(mnemonicsTable).orderBy(desc(mnemonicsTable.upvotes), desc(mnemonicsTable.createdAt));

    const upvoted = await db.select({ mnemonicId: mnemonicUpvotesTable.mnemonicId })
      .from(mnemonicUpvotesTable).where(eq(mnemonicUpvotesTable.userId, userId));
    const upvotedSet = new Set(upvoted.map(u => u.mnemonicId));

    res.json(rows.map(r => ({ ...r, hasUpvoted: upvotedSet.has(r.id) })));
  } catch { res.status(500).json({ error: "Failed to load mnemonics" }); }
});

// Create mnemonic
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const authorName = (req as any).user?.name || "Student";
    const { subject, topic, mnemonic, description } = req.body;
    if (!subject || !topic?.trim() || !mnemonic?.trim()) { res.status(400).json({ error: "subject, topic, and mnemonic required" }); return; }
    const [row] = await db.insert(mnemonicsTable).values({ userId, authorName, subject, topic: topic.trim(), mnemonic: mnemonic.trim(), description: description?.trim() || null }).returning();
    res.json(row);
  } catch { res.status(500).json({ error: "Failed to create mnemonic" }); }
});

// Delete mnemonic
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const id = parseId(req.params.id);
    const [row] = await db.select().from(mnemonicsTable).where(and(eq(mnemonicsTable.id, id), eq(mnemonicsTable.userId, userId))).limit(1);
    if (!row) { res.status(404).json({ error: "Mnemonic not found or not yours" }); return; }
    await db.delete(mnemonicUpvotesTable).where(eq(mnemonicUpvotesTable.mnemonicId, id));
    await db.delete(mnemonicsTable).where(eq(mnemonicsTable.id, id));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete mnemonic" }); }
});

// Toggle upvote
router.post("/:id/upvote", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const id = parseId(req.params.id);
    const [existing] = await db.select().from(mnemonicUpvotesTable).where(and(eq(mnemonicUpvotesTable.userId, userId), eq(mnemonicUpvotesTable.mnemonicId, id))).limit(1);
    if (existing) {
      await db.delete(mnemonicUpvotesTable).where(and(eq(mnemonicUpvotesTable.userId, userId), eq(mnemonicUpvotesTable.mnemonicId, id)));
      await db.update(mnemonicsTable).set({ upvotes: sql`GREATEST(upvotes - 1, 0)` }).where(eq(mnemonicsTable.id, id));
      res.json({ upvoted: false });
    } else {
      await db.insert(mnemonicUpvotesTable).values({ userId, mnemonicId: id });
      await db.update(mnemonicsTable).set({ upvotes: sql`upvotes + 1` }).where(eq(mnemonicsTable.id, id));
      res.json({ upvoted: true });
    }
  } catch { res.status(500).json({ error: "Failed to upvote" }); }
});

export { router as mnemonicsRouter };
