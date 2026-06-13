import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // quiz | note | pdf | video | bookmark
  description: text("description").notNull(),
  score: text("score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Activity = typeof activityTable.$inferSelect;
