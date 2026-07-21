---
name: JWT UA Fingerprinting
description: How user-agent token binding works in this project (A07 mitigation)
---

## Rule
All login/register/refresh endpoints call `generateToken(userId, role, req.headers["user-agent"])`.
The lib function hashes the UA string with SHA-256, takes first 16 hex chars, stores as `uah` JWT claim.
`authMiddleware` re-hashes the current request UA and logs a warning if it differs from `uah`.

**Why:** Soft binding deters trivial token theft without breaking legitimate clients who change browsers, update their browser version, or use multiple devices. Hard rejection would create false positives.

**How to apply:** If you add a new login endpoint, pass the user-agent as the third argument to `generateToken`. Do NOT hard-reject in middleware on mismatch — log only.
