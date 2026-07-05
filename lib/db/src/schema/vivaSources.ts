import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const vivaSourcesTable = pgTable("viva_sources", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull().unique(),
  sourceText: text("source_text"),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type VivaSource = typeof vivaSourcesTable.$inferSelect;
