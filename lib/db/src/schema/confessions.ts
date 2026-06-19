import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const confessionsTable = pgTable("confessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const confessionLikesTable = pgTable("confession_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  confessionId: integer("confession_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Confession = typeof confessionsTable.$inferSelect;
