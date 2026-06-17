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
    `);
  } finally {
    client.release();
  }
}
