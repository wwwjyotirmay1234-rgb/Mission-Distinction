import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  mobileNumber: text("mobile_number"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("student"), // student | admin
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
  year: text("year"),
  college: text("college"),
  avatarUrl: text("avatar_url"),
  studyStreak: integer("study_streak").default(0),
  lastStreakDate: text("last_streak_date"),
  totalXp: integer("total_xp").default(0).notNull(),
  currentRank: integer("current_rank").default(1).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  bannedAt: timestamp("banned_at"),
  banReason: text("ban_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
