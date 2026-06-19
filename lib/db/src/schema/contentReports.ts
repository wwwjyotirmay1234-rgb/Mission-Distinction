import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const contentReportsTable = pgTable("content_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull(),
  contentType: text("content_type").notNull(),
  contentId: integer("content_id").notNull(),
  contentPreview: text("content_preview"),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContentReport = typeof contentReportsTable.$inferSelect;
