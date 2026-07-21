import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const emailTokensTable = pgTable("email_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  type: text("type").notNull(), // "verify" | "reset"
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
