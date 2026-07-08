---
name: Cohort isolation pattern (batch/session-year "rooms")
description: How community/doubts/confessions/study-rooms/leaderboard are isolated per student batch (year+sessionYear), and how legacy pre-feature rows are grandfathered in.
---

When isolating social/community features by student cohort (year + sessionYear), add nullable `cohortYear`/`cohortSessionYear` columns to each content table rather than backfilling. Rows created before the feature shipped are left NULL.

**Why:** the existing live batch had years of community posts/doubts/confessions/study-rooms with no cohort concept. Backfilling them all to one cohort risks bugs; NULL + explicit legacy-cohort fallback is safer and reversible.

**How to apply:**
- A shared helper (`cohortWhere(table, user)`) returns a WHERE clause: `(cohortYear, cohortSessionYear) = (user.year, user.sessionYear) OR (cohortYear IS NULL AND user is in the designated LEGACY_COHORT)`. Returns `undefined` (no filter) if the user has no year/sessionYear yet (e.g. incomplete profile) — callers must handle that by skipping the filter, not treating it as "isolate to nothing."
- A shared `userCohort(user)` helper returns `{ cohortYear, cohortSessionYear }` to spread into every insert for that content type.
- Admin-created content (e.g. admin community groups) should stay global — bypass the cohort filter for admin-authored rows so admins can broadcast to every cohort.
- Leaderboards need TWO changes, not just a WHERE filter: the visible-student query must add cohort equality conditions, AND the cache key must be namespaced per cohort (e.g. `leaderboard:{year}:{sessionYear}`) — a single global cache key will leak one cohort's cached leaderboard to another.
- Verify with real JWTs for two different cohorts (mint via `jsonwebtoken.sign` locally, no login flow needed) rather than just typechecking — isolation bugs are functional, not type-level.
