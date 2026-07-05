import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const vivaRoomsTable = pgTable("viva_rooms", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").notNull(),
  hostName: text("host_name").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  memberCount: integer("member_count").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vivaRoomMembersTable = pgTable("viva_room_members", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull(),
  lastHeartbeat: timestamp("last_heartbeat").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VivaRoom = typeof vivaRoomsTable.$inferSelect;
export type VivaRoomMember = typeof vivaRoomMembersTable.$inferSelect;
