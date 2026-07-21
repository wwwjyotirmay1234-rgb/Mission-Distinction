---
name: LandingPage hooks order
description: React hooks must all be called before any conditional return in LandingPage — violation caused Google login crash
---

**Rule:** In LandingPage (and any React component), ALL hook calls must come before any conditional `return`. Putting `useStudentLogin`, `useStudentRegister`, `useAdminLogin`, `useAdminRegister`, `useForm` ×4, or `useEffect` after an early `if (isAuthenticated) return` is a Rules of Hooks violation.

**Why:** When `isAuthenticated` flips from `false` to `true` (e.g., after Google sign-in completes), React re-renders the component. If the early return fires, hooks below it are skipped → React detects fewer hooks than the previous render → throws an error → ErrorBoundary catches it → user sees the login page again. This was the root cause of "Google login comes back to login page" on all device types.

**How to apply:** Always call every hook at the top of the component unconditionally. Move all `if (isAuthenticated)` and `if (googleLoading)` early returns to AFTER the last hook call. Also fixed: the isAuthenticated redirect now routes users without year/session to `/student/dashboard` (not `/coming-soon`) to avoid racing with `finishGoogleAuth`'s `setLocation` call for new Google users.
