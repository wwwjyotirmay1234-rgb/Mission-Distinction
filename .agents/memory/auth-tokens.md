---
name: Auth token system
description: JWT token generation/verification using jsonwebtoken package
---
Tokens are signed JWTs using jsonwebtoken. Secret is process.env.JWT_SECRET with fallback "mission_distinction_jwt_2025_changeme_in_production". Expiry is 30d. parseToken() calls jwt.verify() — forged tokens are rejected. generateToken() calls jwt.sign().

**Why:** Previous base64 "tokens" were completely forgeable by anyone — attacker could impersonate any user including admins.

**How to apply:** Any new auth mechanism must use generateToken/parseToken from lib/auth.ts. Never encode userId/role directly without signing.
