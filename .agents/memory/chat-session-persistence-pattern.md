---
name: Chat session persistence pattern
description: How persistent chat history (AI Doubt chat, Teach-Back, etc.) is stored and synced with the frontend in this app
---

Persisted chat/conversation features in this app store the **whole message array as one JSONB blob per session row** (id, userId, title, model, messagesJson, createdAt, updatedAt) rather than one row per message — matches the existing `teachBackSessions` table shape.

**Why:** Simpler upsert semantics (one row per conversation), cheap to load a full session in one query, and avoids N+1 message inserts on every AI streaming turn.

**How to apply:**
- Backend: `POST /sessions` upserts by `id` (create if null, else update); cap sessions per user (e.g. 100) and evict oldest on insert.
- Frontend: keep a `sessionIdRef` (ref, not state) so the save call inside async streaming callbacks always reads the latest id without stale-closure bugs.
- Save the session only once a streaming AI response is fully done (not on every token) — build the final message array explicitly from local variables accumulated during the stream (don't rely on `setMsgs` having flushed synchronously) to avoid races between React state and the save call.
- Title defaults to the first user message (truncated ~80 chars) when the client doesn't supply one.
- Every new schema file needs `tsc -b` in `lib/db` AND a matching raw-SQL `CREATE TABLE IF NOT EXISTS` block in `migrate.ts` (this app doesn't use drizzle-kit push) — see `drizzle-legacy-migration-drift.md` and `lib-db-dist-rebuild.md`.
