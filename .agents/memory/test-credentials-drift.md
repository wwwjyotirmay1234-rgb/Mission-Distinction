---
name: Test/seed account credentials can drift from documented password
description: The documented master test account password may no longer match the DB password_hash; verify before assuming a login bug.
---

The e2e test suite and docs reference a fixed master test account (e.g. `missiondistinction108@gmail.com` / `Mastermind@2004`), but the actual `password_hash` in the `users` table can drift out of sync (e.g. from a prior manual password change) without any code change.

**Why:** A 401 "Invalid credentials" on the documented test account looks like an auth bug, but is often just a stale hash — the account and role are otherwise correct in the DB.

**How to apply:** Before debugging the login code path, check whether the account exists with the expected role via a DB query. If it does, and login still 401s, re-hash the documented password with bcryptjs (same lib the server uses) and update `password_hash` directly rather than assuming the login endpoint is broken.
