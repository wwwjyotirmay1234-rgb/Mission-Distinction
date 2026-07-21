---
name: AuthContext lazy init
description: Why lazy useState initializers are required — useEffect causes a ProtectedRoute redirect flash
---

**Rule:** Auth state (token, user) must be initialized synchronously from localStorage using lazy `useState` initializers, not a `useEffect`.

**Why:** With `useEffect`, the first React render always sees `token = null`, so `ProtectedRoute` immediately redirects to `/` before the effect fires. This breaks: (a) real users who see a flash/redirect on page reload, and (b) any automated test or tool that sets localStorage before navigation and expects to land on a protected route.

**How to apply:** When touching AuthContext, keep the lazy initializer pattern. If the pattern is lost and tests/screenshots show unexpected redirects to the landing page from protected routes, this is almost certainly the cause.
