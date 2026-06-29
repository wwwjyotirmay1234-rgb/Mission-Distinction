import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { mnemonicsTable, mnemonicUpvotesTable, flashcardDecksTable, flashcardsTable } from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { logAudit } from "../lib/auditLog";

const router = Router();

router.use(authMiddleware, adminMiddleware);

// ── Shared Mnemonics ────────────────────────────────────────────────

router.get("/mnemonics", async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(mnemonicsTable)
      .where(eq(mnemonicsTable.isAdminShared, true))
      .orderBy(desc(mnemonicsTable.createdAt));
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed to load mnemonics" }); }
});

router.post("/mnemonics", async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id as number;
    const adminName = (req as any).user?.fullName || "Admin";
    const { subject, topic, mnemonic, description } = req.body;
    if (!subject || !topic?.trim() || !mnemonic?.trim()) {
      res.status(400).json({ error: "subject, topic, and mnemonic required" }); return;
    }
    const [row] = await db.insert(mnemonicsTable).values({
      userId: adminId,
      authorName: "Mission Distinction",
      subject,
      topic: topic.trim(),
      mnemonic: mnemonic.trim(),
      description: description?.trim() || null,
      isAdminShared: true,
    }).returning();
    await logAudit(adminId, adminName, "create_admin_mnemonic", "mnemonic", row.id, { topic });
    res.json(row);
  } catch { res.status(500).json({ error: "Failed to create mnemonic" }); }
});

router.delete("/mnemonics/:id", async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id as number;
    const adminName = (req as any).user?.fullName || "Admin";
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(mnemonicUpvotesTable).where(eq(mnemonicUpvotesTable.mnemonicId, id));
    await db.delete(mnemonicsTable).where(eq(mnemonicsTable.id, id));
    await logAudit(adminId, adminName, "delete_mnemonic", "mnemonic", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete mnemonic" }); }
});

// ── Shared Flashcard Decks ──────────────────────────────────────────

router.get("/flashcard-decks", async (req: Request, res: Response) => {
  try {
    const decks = await db.select().from(flashcardDecksTable)
      .where(eq(flashcardDecksTable.isAdminShared, true))
      .orderBy(desc(flashcardDecksTable.createdAt));
    res.json(decks);
  } catch { res.status(500).json({ error: "Failed to load decks" }); }
});

router.post("/flashcard-decks", async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id as number;
    const adminName = (req as any).user?.fullName || "Admin";
    const { subject, title } = req.body;
    if (!subject || !title?.trim()) { res.status(400).json({ error: "subject and title required" }); return; }
    const [deck] = await db.insert(flashcardDecksTable).values({
      userId: adminId,
      subject,
      title: title.trim(),
      isAdminShared: true,
    }).returning();
    await logAudit(adminId, adminName, "create_admin_flashcard_deck", "flashcard_deck", deck.id, { title });
    res.json(deck);
  } catch { res.status(500).json({ error: "Failed to create deck" }); }
});

router.delete("/flashcard-decks/:id", async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id as number;
    const adminName = (req as any).user?.fullName || "Admin";
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(flashcardsTable).where(eq(flashcardsTable.deckId, id));
    await db.delete(flashcardDecksTable).where(eq(flashcardDecksTable.id, id));
    await logAudit(adminId, adminName, "delete_admin_flashcard_deck", "flashcard_deck", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete deck" }); }
});

router.get("/flashcard-decks/:id/cards", async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [deck] = await db.select().from(flashcardDecksTable)
      .where(and(eq(flashcardDecksTable.id, id), eq(flashcardDecksTable.isAdminShared, true))).limit(1);
    if (!deck) { res.status(404).json({ error: "Deck not found" }); return; }
    const cards = await db.select().from(flashcardsTable).where(eq(flashcardsTable.deckId, id));
    res.json({ deck, cards });
  } catch { res.status(500).json({ error: "Failed to load cards" }); }
});

router.post("/flashcard-decks/:id/cards", async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id as number;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { front, back } = req.body;
    if (!front?.trim() || !back?.trim()) { res.status(400).json({ error: "front and back required" }); return; }
    const [card] = await db.insert(flashcardsTable).values({
      deckId: id, userId: adminId, front: front.trim(), back: back.trim(),
    }).returning();
    await db.update(flashcardDecksTable).set({ cardCount: sql`card_count + 1` }).where(eq(flashcardDecksTable.id, id));
    res.json(card);
  } catch { res.status(500).json({ error: "Failed to add card" }); }
});

router.delete("/flashcard-cards/:cardId", async (req: Request, res: Response) => {
  try {
    const cardId = parseId(req.params.cardId);
    if (!cardId) { res.status(400).json({ error: "Invalid card ID" }); return; }
    const [card] = await db.select().from(flashcardsTable).where(eq(flashcardsTable.id, cardId)).limit(1);
    if (!card) { res.status(404).json({ error: "Card not found" }); return; }
    await db.delete(flashcardsTable).where(eq(flashcardsTable.id, cardId));
    await db.update(flashcardDecksTable).set({ cardCount: sql`GREATEST(card_count - 1, 0)` }).where(eq(flashcardDecksTable.id, card.deckId));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete card" }); }
});

export { router as adminContentRouter };
