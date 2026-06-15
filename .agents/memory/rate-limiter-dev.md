---
name: Rate limiter dev mode
description: loginLimiter is set to 500 in dev mode so test runs don't trip the 12/15min limit.
---

# Rate limiter dev mode

`loginLimiter` in `artifacts/api-server/src/routes/auth.ts` uses:

```
max: process.env.NODE_ENV === "development" ? 500 : 12
```

**Why:** The test suite calls `getAdminToken()` multiple times per run (each describe block, retries). With max=12, the IP gets blocked within 1-2 full test runs. In development the server sets `NODE_ENV=development`, so the limit is 500.

**How to apply:** The in-memory rate limit state resets on server restart. If tests fail with 429, restart `artifacts/api-server: API Server` workflow. The `NODE_ENV` check ensures prod safety is unchanged (max=12).
