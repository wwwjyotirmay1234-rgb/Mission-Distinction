---
name: Route ID validation
description: All routes must use parseId() not parseInt() for :id params
---
parseId() is exported from artifacts/api-server/src/lib/auth.ts. It returns null if the param is NaN or <= 0, and the caller returns 400. All current routes (notes, pdfs, books, announcements, users, quizzes) use this.

**Why:** parseInt("abc") returns NaN which Drizzle passes to the DB, causing unpredictable behavior.

**How to apply:** Any new route with :id must import parseId from ../lib/auth and guard with: const id = parseId(req.params.id); if (!id) { res.status(400)... }
