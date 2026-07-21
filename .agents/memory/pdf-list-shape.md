---
name: PDF list shape
description: API response shape quirks for list endpoints
---

## PDFs
`listPdfs` orval function returns `Promise<Pdf[]>` (plain array per generated code).
But the existing PDFs.tsx used `pdfsData?.pdfs` — likely stale from an older spec.
Use `Array.isArray(pdfsData) ? pdfsData : (pdfsData as any).pdfs ?? []` as a safe guard.

## Quizzes
`listQuizzes` returns `Quiz[]` directly. Old code used `quizzesData?.quizzes` which was always undefined (bug). Fixed in Quiz.tsx rewrite to use `Array.isArray(quizzesData) ? quizzesData : []`.

**Why:** The api-spec and orval-generated client may drift from backend response shapes over time. Always check the generated `api.ts` function signature, not the component code.
