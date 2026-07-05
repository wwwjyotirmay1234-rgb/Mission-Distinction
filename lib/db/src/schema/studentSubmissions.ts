import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const studentSubmissionsTable = pgTable("student_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull(),
  userCollege: text("user_college"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  year: text("year"),
  url: text("url").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by"),
  reviewedByName: text("reviewed_by_name"),
  rejectionReason: text("rejection_reason"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StudentSubmission = typeof studentSubmissionsTable.$inferSelect;
