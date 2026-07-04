---
name: No dedicated login/register routes
description: Where student/admin auth UI actually lives, for e2e tests and future auth-flow work
---

Mission Distinction has no `/login` or `/register` route in the router. Auth (both student and admin, login and register) is rendered directly on the landing page (`/`), inside `pages/auth/LandingPage.tsx`, as a card with `Tabs` ("Login" / "Register") and a role toggle (student/admin, student is default).

**Why:** Discovered while writing e2e test plans that assumed conventional `/login` and `/register` paths — navigating to `/login` returns the app's 404 page ("Did you forget to add the page to the router?").

**How to apply:** For any e2e test or manual QA flow that needs to log in or register, navigate to `/` first, then interact with the Login/Register tabs there — never assume a standalone auth route exists.
