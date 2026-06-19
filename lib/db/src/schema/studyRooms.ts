import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const studyRoomsTable = pgTable("study_rooms", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").notNull(),
  hostName: text("host_name").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  timerMinutes: integer("timer_minutes").default(25).notNull(),
  status: text("status").notNull().default("waiting"),
  startedAt: timestamp("started_at"),
  endsAt: timestamp("ends_at"),
  memberCount: integer("member_count").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studyRoomMembersTable = pgTable("study_room_members", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull(),
  lastHeartbeat: timestamp("last_heartbeat").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StudyRoom = typeof studyRoomsTable.$inferSelect;
export type StudyRoomMember = typeof studyRoomMembersTable.$inferSelect;
