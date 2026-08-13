import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const videosTable = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  description: text("description"),
  cloudinaryPublicId: text("cloudinary_public_id"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  durationSeconds: integer("duration_seconds"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videoConceptsTable = pgTable("video_concepts", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull(),
  heading: text("heading").notNull(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const videoQuestionsTable = pgTable("video_questions", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull(),
  text: text("text").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctOption: integer("correct_option").notNull(),
  explanation: text("explanation"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const videoProgressTable = pgTable("video_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  videoId: integer("video_id").notNull(),
  watchedPercent: integer("watched_percent").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  quizScore: integer("quiz_score"),
  quizTotal: integer("quiz_total"),
  xpAwarded: boolean("xp_awarded").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Video = typeof videosTable.$inferSelect;
export type VideoConcept = typeof videoConceptsTable.$inferSelect;
export type VideoQuestion = typeof videoQuestionsTable.$inferSelect;
export type VideoProgress = typeof videoProgressTable.$inferSelect;
