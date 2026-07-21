import { pgTable, serial, integer, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const clinicalCasesTable = pgTable("clinical_cases", {
  id: serial("id").primaryKey(),
  scenario: text("scenario").notNull(),
  subject: text("subject").notNull(),
  modelAnswer: text("model_answer").notNull(),
  explanation: text("explanation").notNull(),
  dateAssigned: text("date_assigned"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isGrandRound: boolean("is_grand_round").default(false).notNull(),
  grandRoundWeek: text("grand_round_week"),
  featuredAttemptId: integer("featured_attempt_id"),
  winnerAnnouncedAt: timestamp("winner_announced_at"),
});

export const clinicalCaseAttemptsTable = pgTable("clinical_case_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  caseId: integer("case_id").notNull(),
  dateKey: text("date_key").notNull().default(""),
  answerText: text("answer_text").notNull(),
  aiFeedback: jsonb("ai_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ClinicalCase = typeof clinicalCasesTable.$inferSelect;
export type ClinicalCaseAttempt = typeof clinicalCaseAttemptsTable.$inferSelect;
