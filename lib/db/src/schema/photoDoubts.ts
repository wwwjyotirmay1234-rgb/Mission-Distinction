import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const photoDoubtsTable = pgTable("photo_doubts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  question: text("question"),
  aiExplanation: text("ai_explanation").notNull(),
  subject: text("subject"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PhotoDoubt = typeof photoDoubtsTable.$inferSelect;
