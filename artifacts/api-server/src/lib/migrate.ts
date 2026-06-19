import { pool } from "@workspace/db";

export async function runStartupMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE community_groups
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS created_by INTEGER,
        ADD COLUMN IF NOT EXISTS is_admin_created BOOLEAN DEFAULT FALSE;

      ALTER TABLE community_messages
        ADD COLUMN IF NOT EXISTS sender_id INTEGER,
        ADD COLUMN IF NOT EXISTS file_url TEXT,
        ADD COLUMN IF NOT EXISTS file_type TEXT,
        ADD COLUMN IF NOT EXISTS file_name TEXT;

      CREATE TABLE IF NOT EXISTS group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS group_members_unique
        ON group_members(group_id, user_id);

      CREATE TABLE IF NOT EXISTS flashcard_decks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        title TEXT NOT NULL,
        card_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS flashcards (
        id SERIAL PRIMARY KEY,
        deck_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        next_review TIMESTAMP NOT NULL DEFAULT NOW(),
        ease REAL NOT NULL DEFAULT 2.5,
        interval INTEGER NOT NULL DEFAULT 1,
        repetitions INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS mnemonics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        author_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        mnemonic TEXT NOT NULL,
        description TEXT,
        upvotes INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS mnemonic_upvotes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        mnemonic_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS mnemonic_upvotes_unique
        ON mnemonic_upvotes(user_id, mnemonic_id);

      CREATE TABLE IF NOT EXISTS study_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL DEFAULT 'General',
        duration_minutes INTEGER NOT NULL,
        session_type TEXT NOT NULL DEFAULT 'pomodoro',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        exam_date TIMESTAMP NOT NULL,
        description TEXT,
        is_global BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS confessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        likes INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS confession_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        confession_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS confession_likes_unique
        ON confession_likes(user_id, confession_id);

      CREATE TABLE IF NOT EXISTS study_rooms (
        id SERIAL PRIMARY KEY,
        host_id INTEGER NOT NULL,
        host_name TEXT NOT NULL,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        timer_minutes INTEGER NOT NULL DEFAULT 25,
        status TEXT NOT NULL DEFAULT 'waiting',
        started_at TIMESTAMP,
        ends_at TIMESTAMP,
        member_count INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS study_room_members (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        last_heartbeat TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS study_room_members_unique
        ON study_room_members(room_id, user_id);
    `);
  } finally {
    client.release();
  }
}
