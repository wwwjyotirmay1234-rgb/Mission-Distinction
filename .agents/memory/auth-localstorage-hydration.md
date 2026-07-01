---
name: AuthContext localStorage-only hydration
description: Mission Distinction's AuthContext never calls /api/auth/me on mount — user state comes purely from a cached localStorage blob, which matters for any programmatic/test login bypass.
---

`AuthProvider` (artifacts/mission-distinction/src/contexts/AuthContext.tsx) initializes both `token` and `user` state directly from `localStorage.getItem("mission_token")` / `localStorage.getItem("mission_user")` on mount. There is no `useEffect` that fetches the current user from the server (e.g. `/api/auth/me`) to hydrate or validate `user`.

`isAuthenticated` is simply `!!token`, but `isAdmin` is `user?.role === "admin"`. If you set `mission_token` alone (e.g. to bypass the login UI for testing), `isAuthenticated` becomes true immediately but `user` stays `null` forever, so `isAdmin` stays `false` — `ProtectedRoute` will then redirect admin routes to `/student/dashboard` even with a perfectly valid admin JWT.

**Why:** Discovered while e2e-testing a new admin-only feature by injecting a JWT into localStorage to skip a flaky login form. The redirect looked like an auth bug at first, but the server-side `/api/auth/me` and the protected endpoint both returned the correct admin role for the same token — the gap was purely client-side state never being populated.

**How to apply:** To simulate a logged-in session for testing (without going through the real login form), set BOTH `localStorage.mission_token` (JWT) and `localStorage.mission_user` (JSON-serialized user object matching the `User` type, including `role`) before navigating. Setting only the token is not enough.
