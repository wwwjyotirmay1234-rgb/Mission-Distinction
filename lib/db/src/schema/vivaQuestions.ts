import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const vivaQuestionsTable = pgTable("viva_questions", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  questionText: text("question_text").notNull(),
  topic: text("topic"),
  difficulty: text("difficulty"),
  orderIndex: integer("order_index").notNull().default(0),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VivaQuestion = typeof vivaQuestionsTable.$inferSelect;
