import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const deviceEventsTable = pgTable("device_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  type: text("type").notNull(), // 'login' | 'install'
  platform: text("platform").notNull(), // 'android_phone' | 'android_tablet' | 'ios' | 'desktop' | 'other'
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DeviceEvent = typeof deviceEventsTable.$inferSelect;
