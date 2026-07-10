import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const aiChatSessionsTable = pgTable("ai_chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  model: text("model").notNull().default("gpt-4o"),
  messagesJson: jsonb("messages_json").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AiChatSession = typeof aiChatSessionsTable.$inferSelect;
