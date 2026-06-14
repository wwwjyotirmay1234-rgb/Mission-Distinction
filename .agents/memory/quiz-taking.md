---
name: Quiz taking flow
description: How quiz submission works and orval type quirks for quiz endpoints
---

## Quiz list shape
`listQuizzes` returns `Quiz[]` (plain array), NOT `{ quizzes: Quiz[] }`.
The old Quiz.tsx had a bug accessing `.quizzes` — fixed in rewrite.

## Quiz submission
Used direct `fetch()` instead of `useSubmitQuizAttempt` orval hook because the generated mutation parameter names were uncertain. Pattern:
```typescript
const res = await fetch(`/api/quizzes/${quizId}/attempt`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ answers: answerList }),
});
```

## Quiz taking state machine
Three modes: `"browse" | "taking" | "results"`. Timer uses `useEffect` + `setInterval` ref stored in `timerRef`. Auto-submits on timeout. `submittedRef` prevents double-submit.

**Why:** orval mutations require knowing the exact generated body type name; direct fetch is safer for new endpoints not yet in the api-spec.
