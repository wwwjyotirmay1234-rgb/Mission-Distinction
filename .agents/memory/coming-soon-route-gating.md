---
name: Post-login route gating must treat missing year/sessionYear as "needs profile", not "coming soon"
description: Why students with null year/sessionYear (e.g. Google sign-ins) got stuck unable to interact with anything after login
---

Any function that decides where to route a student right after login/register based on `year`/`sessionYear` must check for missing/null values FIRST and send them to `/student/dashboard` (where `CompleteProfileModal` lives), never fall through to the "wrong cohort" branch (`/coming-soon`).

**Why:** Google-auth-created accounts (and any other flow that doesn't collect year/college up front) start with `year`/`sessionYear`/`college` all null. A `getRoute(year, sessionYear)` helper compared these directly against `ACTIVE_MBBS_YEAR`/`ACTIVE_SESSION_YEAR` with no null check, so `undefined === ACTIVE_MBBS_YEAR` was false and it silently routed to `/coming-soon` — a page with no dropdowns, no profile form, nothing. The user saw a "Complete Your Profile" screen with dropdowns in one flow (page reload while authenticated, which had a separate correct null-check) but got dumped on a dead-end ComingSoon page on fresh login (which used the buggy helper). This inconsistency between two code paths encoding the same "which page should this user land on" decision is what caused the bug — always route through ONE shared helper function.

**How to apply:** When adding/reviewing any post-auth redirect logic keyed on profile-completeness or cohort fields, grep for all call sites of the routing helper and confirm the null/missing-field case is handled identically everywhere, not just in the code path you're currently touching. Reproduce report by inserting a DB user with the same null fields and running a real mobile e2e login test — curl-testing the API alone won't catch frontend routing bugs like this.
