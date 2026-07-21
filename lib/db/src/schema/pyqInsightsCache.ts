import { pgTable, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const pyqInsightsCacheTable = pgTable("pyq_insights_cache", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  insightsJson: jsonb("insights_json").notNull().default([]),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export type PyqInsightsCache = typeof pyqInsightsCacheTable.$inferSelect;
