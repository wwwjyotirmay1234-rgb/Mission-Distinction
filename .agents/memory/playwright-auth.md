---
name: Playwright test authentication
description: How to authenticate in Playwright tests against this React SPA
---

## Rule
Use `page.addInitScript()` to inject `localStorage` auth token BEFORE the page loads (not after). Direct form fill doesn't work reliably because:
1. The landing page uses React Hook Form with controlled inputs — browser autofill interferes
2. The AuthContext reads `localStorage.getItem("mission_token")` only during mount

**Why:** `page.addInitScript()` runs before any page scripts, so the AuthContext's `useEffect` picks up the token correctly on first mount.

**How to apply:**
```typescript
await page.addInitScript(({ token, user }) => {
  localStorage.setItem("mission_token", token);
  localStorage.setItem("mission_user", JSON.stringify(user));
}, { token: adminToken, user: adminUser });
await page.goto("/admin/dashboard");
```
Get the token first from `POST /api/auth/admin/login` via a direct fetch in the test.
