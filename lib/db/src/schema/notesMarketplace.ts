import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const studentNoteSubmissionsTable = pgTable("student_note_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull().default("pdf"),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  xpAwarded: boolean("xp_awarded").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StudentNoteSubmission = typeof studentNoteSubmissionsTable.$inferSelect;
