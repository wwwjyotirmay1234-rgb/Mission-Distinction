---
name: AuthContext lazy init
description: Why AuthContext must use lazy useState initializers, not useEffect
---

**Rule:** Initialize `token` and `user` state with lazy initializer functions that read localStorage synchronously:
```typescript
const [token, setToken] = useState<string | null>(() => localStorage.getItem("mission_token"));
const [user, setUser] = useState<User | null>(() => { try { const s = localStorage.getItem("mission_user"); return s ? JSON.parse(s) : null; } catch { return null; } });
```

**Why:** `useState(null)` + `useEffect` means the first render always has `token = null`. ProtectedRoute sees `isAuthenticated = false` and redirects to `/` before the effect can run. This causes: (a) a visible redirect flash for real users, (b) testing agents that set localStorage before navigation can never see authenticated pages.

**How to apply:** Never use a `useEffect` to hydrate auth state from localStorage in a SPA. Use the lazy initializer pattern above. Existing `login()` and `logout()` functions stay the same.
