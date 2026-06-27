import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const pyqsTable = pgTable("pyqs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  year: text("year").notNull(),
  url: text("url").notNull(),
  downloadCount: integer("download_count").default(0),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Pyq = typeof pyqsTable.$inferSelect;
