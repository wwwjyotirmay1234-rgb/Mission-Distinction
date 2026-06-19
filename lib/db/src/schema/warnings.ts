import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const studentWarningsTable = pgTable("student_warnings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  issuedBy: integer("issued_by").notNull(),
  issuedByName: text("issued_by_name").notNull(),
  reason: text("reason").notNull(),
  severity: text("severity").notNull().default("warning"),
  seenAt: timestamp("seen_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StudentWarning = typeof studentWarningsTable.$inferSelect;
