import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const studySessionsTable = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull().default("General"),
  durationMinutes: integer("duration_minutes").notNull(),
  sessionType: text("session_type").notNull().default("pomodoro"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StudySession = typeof studySessionsTable.$inferSelect;
