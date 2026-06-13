import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pdfsTable = pgTable("pdfs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  professor: text("professor"),
  year: text("year"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  downloadCount: integer("download_count").default(0).notNull(),
  pages: integer("pages"),
  size: text("size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPdfSchema = createInsertSchema(pdfsTable).omit({ id: true, createdAt: true, downloadCount: true });
export type InsertPdf = z.infer<typeof insertPdfSchema>;
export type Pdf = typeof pdfsTable.$inferSelect;
