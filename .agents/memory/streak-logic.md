---
name: Streak logic
description: How study streak auto-increment works
---

## Location
`artifacts/api-server/src/lib/streak.ts` — `updateStreak(userId: number)`

## Logic
- Reads `user.lastStreakDate` (text column, format "YYYY-MM-DD")
- If `lastStreakDate === today`: no-op (already updated today)
- If `lastStreakDate === yesterday`: increment `studyStreak` by 1
- If null or older than yesterday: reset `studyStreak` to 1
- Always writes new `lastStreakDate = today`

## Where it's called
- `POST /api/quizzes/:id/attempt` — after saving quiz attempt
- `POST /api/pdfs/:id/download` — after incrementing download count

## DB column
`last_streak_date TEXT` on `users` table (added via drizzle push).

**Why:** Simple ISO date string comparison avoids timezone issues from timestamp columns. No need for complex date math.
