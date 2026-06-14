import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const doubtsTable = pgTable("doubts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  authorName: text("author_name").notNull(),
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  question: text("question").notNull(),
  answerCount: integer("answer_count").default(0).notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doubtAnswersTable = pgTable("doubt_answers", {
  id: serial("id").primaryKey(),
  doubtId: integer("doubt_id").notNull(),
  userId: integer("user_id").notNull(),
  authorName: text("author_name").notNull(),
  answer: text("answer").notNull(),
  isAccepted: boolean("is_accepted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Doubt = typeof doubtsTable.$inferSelect;
export type DoubtAnswer = typeof doubtAnswersTable.$inferSelect;
