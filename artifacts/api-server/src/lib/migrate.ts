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
    `);
  } finally {
    client.release();
  }
}
