---
name: JWT Timing Test
description: Why refresh-rotation tests need a 1100ms sleep
---

## Rule
JWT `iat` (issued-at) is second-precision. If login and refresh happen within the same wall-clock second, the signed output will be byte-identical (same payload, same secret, same timestamp = same HMAC).

**Why:** Playwright test "refresh token rotation issues a new token pair" was checking `expect(newToken).not.toBe(oldToken)` and failing intermittently when both calls fell within the same second.

**How to apply:** Any test that needs to assert two JWTs are different must either: (a) sleep ≥1100ms between generations, or (b) decode and compare a mutable claim like `iat` rather than the raw token string.
