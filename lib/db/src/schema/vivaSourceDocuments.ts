import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

// Full-text storage for admin-uploaded reference books/PDFs per viva subject.
// Unlike viva_sources.source_text (short manual notes, capped at 8000 chars),
// full_text here is NOT truncated — an entire textbook can be stored. The
// examiner prompt never embeds this whole column; instead, relevant chunks
// are retrieved per-question (see practicalHub.ts retrieval helper) so token
// cost stays bounded while every part of the book remains reachable.
export const vivaSourceDocumentsTable = pgTable("viva_source_documents", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  fileName: text("file_name").notNull(),
  fullText: text("full_text").notNull(),
  charCount: integer("char_count").notNull(),
  pages: integer("pages"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VivaSourceDocument = typeof vivaSourceDocumentsTable.$inferSelect;
