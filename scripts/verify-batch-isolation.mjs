/**
 * Batch Isolation Verification Script — Task #53
 *
 * Tests that students from different batches only see their own batch's
 * content + shared (NULL session_year) content.
 *
 * Usage (run from workspace root):
 *   node scripts/verify-batch-isolation.mjs
 *
 * Reads JWT_SECRET from the process environment (same secret the server uses).
 * Signs tokens using Node's built-in crypto — no external packages needed.
 */

import { createHmac } from "node:crypto";

const BASE = process.env.API_URL ?? "http://localhost:8080";
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.error("❌  JWT_SECRET env var is required.");
  process.exit(1);
}

// ── Minimal HS256 JWT signer (no dependencies) ────────────────────────────────

function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function makeToken(userId, role, sessionYear) {
  const header  = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now     = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({ userId, role, sessionYear: sessionYear ?? null, iat: now, exp: now + 3600 }));
  const sig     = b64url(createHmac("sha256", SECRET).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

// ── Request helper ────────────────────────────────────────────────────────────

async function fetchAs(token, path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${path} → ${res.status}: ${text.slice(0, 120)}`);
  }
  return res.json();
}

// ── Assertion helpers ─────────────────────────────────────────────────────────

let pass = 0;
let fail = 0;

function check(label, actual, expected) {
  if (actual === expected) {
    console.log(`  ✅  ${label}`);
    pass++;
  } else {
    console.error(`  ❌  ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    fail++;
  }
}

function checkNoLeakage(label, items, forbiddenBatch) {
  const leaked = (items ?? []).filter(
    (it) => (it.session_year ?? it.sessionYear) === forbiddenBatch
  );
  if (leaked.length === 0) {
    console.log(`  ✅  ${label}`);
    pass++;
  } else {
    console.error(`  ❌  ${label} — ${leaked.length} item(s) leaked:`, leaked.map(i => i.title ?? i.id));
    fail++;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  // Use fictional high user-IDs that won't exist in the DB.
  // Responses will be empty or shared-only — the key test is zero cross-batch leakage.
  const tok2526  = makeToken(99991, "student", "2025-26");
  const tok2627  = makeToken(99992, "student", "2026-27");
  const tokNone  = makeToken(99993, "student", null);      // fail-closed case
  const tokAdmin = makeToken(99994, "admin",   null);

  const ENDPOINTS = [
    { path: "/api/quizzes",     label: "Quizzes"     },
    { path: "/api/videos",      label: "Videos"      },
    { path: "/api/notes",       label: "Notes"       },
    { path: "/api/pyqs",        label: "PYQs"        },
    { path: "/api/grand-tests", label: "Grand Tests" },
  ];

  for (const { path, label } of ENDPOINTS) {
    console.log(`\n─── ${label} (${path}) ───`);
    try {
      const [d2526, d2627, dNone, dAdmin] = await Promise.all([
        fetchAs(tok2526, path),
        fetchAs(tok2627, path),
        fetchAs(tokNone, path),
        fetchAs(tokAdmin, path),
      ]);

      const toArr = (d) => Array.isArray(d) ? d : d?.tests ?? d?.items ?? [];
      const a2526  = toArr(d2526);
      const a2627  = toArr(d2627);
      const aNone  = toArr(dNone);
      const aAdmin = toArr(dAdmin);

      checkNoLeakage(`2025-26 student sees no 2026-27 ${label}`, a2526, "2026-27");
      checkNoLeakage(`2026-27 student sees no 2025-26 ${label}`, a2627, "2025-26");
      checkNoLeakage(`null-session student sees no 2025-26 ${label}`, aNone, "2025-26");
      checkNoLeakage(`null-session student sees no 2026-27 ${label}`, aNone, "2026-27");
      check(`Admin can list ${label} without error`, typeof aAdmin, "object");

      console.log(
        `     items: 2025-26→${a2526.length}  2026-27→${a2627.length}  none→${aNone.length}  admin→${aAdmin.length}`
      );
    } catch (err) {
      console.error(`  ⚠️  ${label} request failed: ${err.message}`);
      fail++;
    }
  }

  console.log(`\n${"─".repeat(56)}`);
  console.log(`Result: ${pass} checks passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

run();
