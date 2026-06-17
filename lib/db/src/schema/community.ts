import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communityGroupsTable = pgTable("community_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  description: text("description"),
  createdBy: integer("created_by"),
  isAdminCreated: boolean("is_admin_created").default(false),
  memberCount: integer("member_count").default(0).notNull(),
  lastMessage: text("last_message"),
  lastMessageTime: timestamp("last_message_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityPostsTable = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  author: text("author").notNull(),
  authorId: integer("author_id"),
  authorAvatarUrl: text("author_avatar_url"),
  groupName: text("group_name").notNull(),
  likeCount: integer("like_count").default(0).notNull(),
  replyCount: integer("reply_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityMessagesTable = pgTable("community_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  senderId: integer("sender_id"),
  senderName: text("sender_name").notNull(),
  senderAvatarUrl: text("sender_avatar_url"),
  content: text("content").notNull().default(""),
  fileUrl: text("file_url"),
  fileType: text("file_type"),
  fileName: text("file_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPostsTable).omit({ id: true, createdAt: true, likeCount: true });
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPostsTable.$inferSelect;
export type CommunityGroup = typeof communityGroupsTable.$inferSelect;
export type CommunityMessage = typeof communityMessagesTable.$inferSelect;
