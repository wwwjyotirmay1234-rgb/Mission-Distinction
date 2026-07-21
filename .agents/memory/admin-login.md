---
name: Admin login endpoint + test token caching
description: Admin login route, response shape, and how to share the token across test describe blocks.
---

# Admin login endpoint

- Route: `POST /api/auth/admin/login`
- Body: `{ email, password }`
- Response: `{ token, refreshToken, user }` — the JWT is in `data.token`
- Rate-limited via `loginLimiter` (500/15min in dev, 12/15min in prod)

# Test token caching pattern

In Playwright test files, cache the token at module level to avoid calling login for every describe block:

```typescript
let _cachedAdminToken: string | null = null;

async function getAdminToken(): Promise<string> {
  if (_cachedAdminToken) return _cachedAdminToken;
  const res = await fetch(`${API_BASE}/api/auth/admin/login`, { ... });
  if (!res.ok) throw new Error(`Admin login failed: ${res.status}`);
  const data = await res.json();
  _cachedAdminToken = data.token;
  return _cachedAdminToken!;
}
```

**Why:** Each describe block calling `getAdminToken()` separately burns through the rate limit quickly. Module-level caching means only 1 login call per test file run.
