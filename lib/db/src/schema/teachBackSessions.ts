import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const teachBackSessionsTable = pgTable("teach_back_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topic: text("topic").notNull(),
  subject: text("subject").notNull(),
  transcript: text("transcript"),
  score: integer("score"),
  feedbackJson: jsonb("feedback_json").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TeachBackSession = typeof teachBackSessionsTable.$inferSelect;
