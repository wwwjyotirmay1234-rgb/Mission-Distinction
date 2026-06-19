import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const mnemonicsTable = pgTable("mnemonics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  authorName: text("author_name").notNull(),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  mnemonic: text("mnemonic").notNull(),
  description: text("description"),
  upvotes: integer("upvotes").default(0).notNull(),
  isAdminShared: boolean("is_admin_shared").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mnemonicUpvotesTable = pgTable("mnemonic_upvotes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mnemonicId: integer("mnemonic_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Mnemonic = typeof mnemonicsTable.$inferSelect;
