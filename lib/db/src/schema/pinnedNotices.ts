import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const pinnedNoticesTable = pgTable("pinned_notices", {
  id: serial("id").primaryKey(),
  createdBy: integer("created_by").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PinnedNotice = typeof pinnedNoticesTable.$inferSelect;
