import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const xpTransactionsTable = pgTable("xp_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rankUnlocksTable = pgTable("rank_unlocks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rankName: text("rank_name").notNull(),
  level: integer("level").notNull(),
  xpAtUnlock: integer("xp_at_unlock").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});
