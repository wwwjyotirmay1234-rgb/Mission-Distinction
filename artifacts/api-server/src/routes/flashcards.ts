import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { flashcardDecksTable, flashcardsTable } from "@workspace/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";

const router = Router();

// SM-2 simplified algorithm
function sm2(ease: number, interval: number, repetitions: number, quality: number) {
  if (quality < 2) {
    return { ease: Math.max(1.3, ease - 0.2), interval: 1, repetitions: 0 };
  }
  const newEase = Math.max(1.3, ease + 0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
  let newInterval: number;
  if (repetitions === 0) newInterval = 1;
  else if (repetitions === 1) newInterval = 6;
  else newInterval = Math.round(interval * ease);
  return { ease: newEase, interval: newInterval, repetitions: repetitions + 1 };
}

function nextReviewDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// List decks (own + admin-shared)
router.get("/decks", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const { or } = await import("drizzle-orm");
    const decks = await db.select().from(flashcardDecksTable)
      .where(or(eq(flashcardDecksTable.userId, userId), eq(flashcardDecksTable.isAdminShared, true)));
    res.json(decks);
  } catch { res.status(500).json({ error: "Failed to load decks" }); }
});

// Create deck
router.post("/decks", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const { subject, title } = req.body;
    if (!subject || !title?.trim()) { res.status(400).json({ error: "subject and title required" }); return; }
    const [deck] = await db.insert(flashcardDecksTable).values({ userId, subject, title: title.trim() }).returning();
    res.json(deck);
  } catch { res.status(500).json({ error: "Failed to create deck" }); }
});

// Delete deck
router.delete("/decks/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const id = parseId(req.params.id);
    await db.delete(flashcardsTable).where(eq(flashcardsTable.deckId, id));
    await db.delete(flashcardDecksTable).where(and(eq(flashcardDecksTable.id, id), eq(flashcardDecksTable.userId, userId)));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete deck" }); }
});

// Get cards in deck (own or admin-shared)
router.get("/decks/:id/cards", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const deckId = parseId(req.params.id);
    const { or } = await import("drizzle-orm");
    const [deck] = await db.select().from(flashcardDecksTable)
      .where(and(eq(flashcardDecksTable.id, deckId), or(eq(flashcardDecksTable.userId, userId), eq(flashcardDecksTable.isAdminShared, true))))
      .limit(1);
    if (!deck) { res.status(404).json({ error: "Deck not found" }); return; }
    const cards = await db.select().from(flashcardsTable).where(eq(flashcardsTable.deckId, deckId));
    res.json({ deck, cards });
  } catch { res.status(500).json({ error: "Failed to load cards" }); }
});

// Get cards due for review
router.get("/decks/:id/review", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const deckId = parseId(req.params.id);
    const now = new Date();
    const cards = await db.select().from(flashcardsTable)
      .where(and(eq(flashcardsTable.deckId, deckId), eq(flashcardsTable.userId, userId), lte(flashcardsTable.nextReview, now)));
    res.json(cards);
  } catch { res.status(500).json({ error: "Failed to load review cards" }); }
});

// Add card to deck
router.post("/decks/:id/cards", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const deckId = parseId(req.params.id);
    const { front, back } = req.body;
    if (!front?.trim() || !back?.trim()) { res.status(400).json({ error: "front and back required" }); return; }
    const [card] = await db.insert(flashcardsTable).values({ deckId, userId, front: front.trim(), back: back.trim() }).returning();
    await db.update(flashcardDecksTable).set({ cardCount: sql`card_count + 1` }).where(eq(flashcardDecksTable.id, deckId));
    res.json(card);
  } catch { res.status(500).json({ error: "Failed to add card" }); }
});

// Delete card
router.delete("/cards/:cardId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const cardId = parseId(req.params.cardId);
    const [card] = await db.select().from(flashcardsTable).where(and(eq(flashcardsTable.id, cardId), eq(flashcardsTable.userId, userId))).limit(1);
    if (!card) { res.status(404).json({ error: "Card not found" }); return; }
    await db.delete(flashcardsTable).where(eq(flashcardsTable.id, cardId));
    await db.update(flashcardDecksTable).set({ cardCount: sql`GREATEST(card_count - 1, 0)` }).where(eq(flashcardDecksTable.id, card.deckId));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete card" }); }
});

// Review a card (SM-2)
router.post("/cards/:cardId/review", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId((req as any).user?.id);
    const cardId = parseId(req.params.cardId);
    const quality = parseInt(req.body.quality); // 0=Again, 1=Hard, 2=Good, 3=Easy
    if (isNaN(quality) || quality < 0 || quality > 3) { res.status(400).json({ error: "quality must be 0-3" }); return; }
    const [card] = await db.select().from(flashcardsTable).where(and(eq(flashcardsTable.id, cardId), eq(flashcardsTable.userId, userId))).limit(1);
    if (!card) { res.status(404).json({ error: "Card not found" }); return; }
    const { ease, interval, repetitions } = sm2(card.ease, card.interval, card.repetitions, quality);
    const [updated] = await db.update(flashcardsTable).set({ ease, interval, repetitions, nextReview: nextReviewDate(interval) }).where(eq(flashcardsTable.id, cardId)).returning();
    res.json(updated);
  } catch { res.status(500).json({ error: "Failed to review card" }); }
});

export { router as flashcardsRouter };
