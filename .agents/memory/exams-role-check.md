---
name: Exams route role check pattern
description: The user object from DB has role: string ("admin"/"student"), NOT an isAdmin boolean. Always check user.role === "admin".
---

# Exams Route — Role Check Pattern

The rule: **Always use `user?.role === "admin"` to check admin status. Never use `user?.isAdmin`.**

**Why:** The user object is fetched directly from the `usersTable` via Drizzle ORM. It has a `role: string` field ("admin" or "student") and an `isSuperAdmin: boolean`. There is no `isAdmin` boolean property. Using `user?.isAdmin` always evaluates to `undefined` (falsy), which completely breaks the auth check — either always blocking or always allowing depending on the logic.

**How to apply:** Whenever writing a route-level admin check (not using `adminMiddleware`), use `(req as any).user?.role === "admin"`. The `adminMiddleware` itself is correct and uses `user?.role !== "admin"`, so middleware-guarded routes are safe.
