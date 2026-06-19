import { pgTable, serial, integer, text, timestamp, real, boolean } from "drizzle-orm/pg-core";

export const flashcardDecksTable = pgTable("flashcard_decks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  cardCount: integer("card_count").default(0).notNull(),
  isAdminShared: boolean("is_admin_shared").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const flashcardsTable = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull(),
  userId: integer("user_id").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  nextReview: timestamp("next_review").defaultNow().notNull(),
  ease: real("ease").default(2.5).notNull(),
  interval: integer("interval").default(1).notNull(),
  repetitions: integer("repetitions").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FlashcardDeck = typeof flashcardDecksTable.$inferSelect;
export type Flashcard = typeof flashcardsTable.$inferSelect;
