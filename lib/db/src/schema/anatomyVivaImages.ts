import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

// Picture bank for the 5 image-based Anatomy viva stations (Histology, Bone,
// Visceral, Section Anatomy, Prosection). Each row is a single page extracted
// from an admin-uploaded PDF (see the shared `pdfs/` GCS prefix — reused
// as-is rather than requiring a separate re-upload flow) that AI vision
// classified as a real specimen/slide/plate and auto-labeled. Per the
// admin's choice, there is no manual review gate before publishing — rows
// are inserted as soon as extraction accepts a page, and can only be
// removed afterward via the admin gallery's delete action.
export const anatomyVivaImagesTable = pgTable("anatomy_viva_images", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  side: text("side"),
  region: text("region"),
  notes: text("notes"),
  objectName: text("object_name").notNull(),
  sourceFileName: text("source_file_name").notNull(),
  sourcePage: integer("source_page"),
  lastShownAt: timestamp("last_shown_at"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AnatomyVivaImage = typeof anatomyVivaImagesTable.$inferSelect;
