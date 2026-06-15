---
name: Auth token architecture
description: How access and refresh tokens are structured in Mission Distinction
---

Access token: JWT, 15 min expiry (`JWT_EXPIRES_IN = "15m"`), signed with JWT_SECRET.
Refresh token: `crypto.randomUUID()`, stored in `refresh_tokens` DB table, 30-day expiry.
Token rotation: each `/api/auth/refresh` call deletes the old row and inserts a new one.
Auto-refresh: `main.tsx` `setAuthTokenGetter` is async — parses JWT exp, refreshes if < 60s remaining.
Logout: sends refreshToken in body to `/api/auth/logout` which deletes it from DB.
Storage keys: `mission_token` (access), `mission_refresh_token` (refresh), `mission_user` (JSON user).

**Why:** Short-lived access tokens limit blast radius of token theft. Rotating refresh tokens give 30-day sessions without the security risk of long-lived JWTs.

**How to apply:** All login endpoints (student, admin, google, register) must insert a refresh_tokens row and include refreshToken in response. Never store JWT secret or raw passwords — those stay in env vars.
