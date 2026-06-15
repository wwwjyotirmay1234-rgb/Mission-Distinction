---
name: Auth localStorage keys
description: The correct keys for auth tokens in localStorage — several old files used the wrong key "token"
---

The app stores auth data under these localStorage keys:
- `mission_token` — JWT access token (15 min expiry)
- `mission_refresh_token` — rotating refresh token (30 day expiry)
- `mission_user` — JSON-serialised user object

**Why:** Several student page files (Doubts, PDFs, Leaderboard) were reading from `"token"` (wrong key) — those calls silently returned null and sent requests with `Authorization: Bearer null`. Fixed when migrating to apiFetch.

**How to apply:** Any new code reading the access token must use `localStorage.getItem("mission_token")`, or better, use `apiFetch` / `customFetch` which handle this automatically.
