import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const examsTable = pgTable("exams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  examDate: timestamp("exam_date").notNull(),
  description: text("description"),
  isGlobal: boolean("is_global").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Exam = typeof examsTable.$inferSelect;
