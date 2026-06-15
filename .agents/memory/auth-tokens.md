---
name: Auth token architecture
description: Access/refresh token strategy — why short-lived access + rotating refresh
---

Mission Distinction uses two-token auth: short-lived access JWTs (15 min) + long-lived rotating refresh UUIDs (30 days, DB-stored, one-use).

**Why:** Short-lived access tokens limit blast radius of theft. Rotating refresh tokens allow persistent sessions without long-lived JWT risk. Server-side DB storage enables real invalidation on logout or ban.

**How to apply:** Every login endpoint must issue both tokens. The `setAuthTokenGetter` in the frontend is async and must auto-refresh when the access token is near expiry (< 60s). Logout must clean up the refresh token row in DB. Any change to this flow must keep the `refresh_tokens` table in sync — expired rows accumulate if not pruned.
