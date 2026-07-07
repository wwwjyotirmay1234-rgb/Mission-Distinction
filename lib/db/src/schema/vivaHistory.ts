import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const vivaHistoryTable = pgTable("viva_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  vivaType: text("viva_type"),
  imageId: integer("image_id"),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type VivaHistory = typeof vivaHistoryTable.$inferSelect;
