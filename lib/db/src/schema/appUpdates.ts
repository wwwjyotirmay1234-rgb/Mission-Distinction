import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appUpdatesTable = pgTable("app_updates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppUpdateSchema = createInsertSchema(appUpdatesTable).omit({ id: true, createdAt: true });
export type InsertAppUpdate = z.infer<typeof insertAppUpdateSchema>;
export type AppUpdate = typeof appUpdatesTable.$inferSelect;
