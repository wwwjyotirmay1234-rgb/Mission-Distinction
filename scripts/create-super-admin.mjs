import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const bcrypt = require("/home/runner/workspace/node_modules/.pnpm/bcryptjs@3.0.3/node_modules/bcryptjs");
const { Client } = require("/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg");

const EMAIL = "missiondistinction108@gmail.com";
const PASSWORD = "Mastermind@2004";

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 12);
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const existing = await client.query(
    "SELECT id FROM users WHERE email = $1",
    [EMAIL]
  );

  if (existing.rows.length > 0) {
    await client.query(
      "UPDATE users SET password_hash=$1, role='admin', is_super_admin=true, email_verified=true, full_name='Mission Distinction' WHERE email=$2",
      [hash, EMAIL]
    );
    console.log("✅ Existing account upgraded to Super Admin");
  } else {
    await client.query(
      "INSERT INTO users (full_name, email, password_hash, role, is_super_admin, email_verified) VALUES ('Mission Distinction', $1, $2, 'admin', true, true)",
      [EMAIL, hash]
    );
    console.log("✅ Super Admin account created");
  }

  const row = await client.query(
    "SELECT id, full_name, email, role, is_super_admin, email_verified FROM users WHERE email=$1",
    [EMAIL]
  );
  console.log("Account:", row.rows[0]);
  await client.end();
}

main().catch((err) => { console.error("❌", err.message); process.exit(1); });
