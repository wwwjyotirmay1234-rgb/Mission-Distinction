---
name: Refresh token race condition fix
description: Why multiple parallel 401s cause cascade logout and how to fix it with a Promise lock.
---

## Rule
In `AuthContext.setTokenRefresher`, wrap the refresh fetch in a shared `refreshPromise` variable. If a refresh is already in-flight, return the same promise instead of starting a new one. Reset to `null` in the `finally` block.

## Why
The server uses single-use refresh token rotation — each refresh token is deleted and a new one issued. When the JWT expires and multiple API calls fire simultaneously, each gets a 401 and each independently calls `_tokenRefresher()`. The first call rotates the token successfully. All subsequent calls send the now-invalidated old token → server returns 401 → `auth:logout` is dispatched → user is kicked out. This is the root cause of "login again and again on mobile" when the device sits idle (token expires, app resumes, multiple components fetch simultaneously).

## How to apply
```typescript
let refreshPromise: Promise<string | null> | null = null;
setTokenRefresher(async () => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try { /* fetch /api/auth/refresh ... */ }
    finally { refreshPromise = null; }
  })();
  return refreshPromise;
});
```
