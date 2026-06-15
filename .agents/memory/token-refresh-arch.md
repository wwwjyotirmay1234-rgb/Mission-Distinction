---
name: Auto token refresh architecture
description: How 401 responses are intercepted, tokens refreshed, and components notified
---

## Two-layer architecture

### Layer 1: customFetch (lib/api-client-react/src/custom-fetch.ts)
- Covers all TanStack Query hooks (useStudentLogin, useListPdfs, etc.)
- `setTokenRefresher(fn)` — register an async `() => Promise<string | null>` callback
- On 401: calls refresher; if it returns a token, retries the original request once
- If refresher returns null → normal ApiError(401) is thrown

### Layer 2: apiFetch (artifacts/mission-distinction/src/lib/apiFetch.ts)
- Covers pages that use raw `fetch()` with Authorization headers
- Drop-in replacement for fetch; auto-adds Authorization from localStorage
- On 401: reads refresh token from localStorage, calls POST /api/auth/refresh, retries once
- On refresh failure: dispatches `auth:logout` window event

### AuthContext wires everything together
- On mount: calls `setAuthTokenGetter(() => localStorage.getItem("mission_token"))` and `setTokenRefresher(refresherFn)`
- Refresher: calls POST /api/auth/refresh, on success updates localStorage + dispatches `auth:tokenRefreshed` CustomEvent
- Listens to `auth:logout` → clears React state + localStorage (does NOT call server logout since refresh token is already invalid)
- Listens to `auth:tokenRefreshed` → syncs React state (setToken, setUser)

**Why:** Decoupled via window events so apiFetch (a plain module, no React context) can still update React state without circular imports.

**How to apply:** New pages with raw fetch calls that need auth → import apiFetch from @/lib/apiFetch and use instead of fetch. New TanStack Query hooks → automatically covered by customFetch interceptor.
