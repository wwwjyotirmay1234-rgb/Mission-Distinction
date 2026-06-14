---
name: Upload auth requirement
description: Upload endpoints require admin role, not just authenticated user
---
/api/upload/pdf and /api/upload/book-cover both use adminMiddleware. File types are validated server-side (PDF for /pdf, images for /book-cover). Filenames are sanitized with regex. Error messages are sanitized (no err.message exposed).

**Why:** Any authenticated student could previously upload arbitrary files to Firebase Storage, filling the bucket.
