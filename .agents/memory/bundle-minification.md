---
name: API Bundle Minification
description: esbuild config that reduced server bundle from 4.4MB to 2.3MB
---

## Rule
The api-server build.mjs uses esbuild. Adding `minify: true` and `treeShaking: true` cut the bundle from 4.4MB to 2.3MB (-48%) with no behavioural change. The sourcemap (7.9MB) is linked (not inline) so it does not affect runtime.

**Why:** The audit flagged the 4.4MB bundle. The fix is in `artifacts/api-server/build.mjs`. firebase-admin is already external. Heavy deps like drizzle/sendgrid/socket.io are bundled but shrink well with minification.

**How to apply:** If bundle grows again, check the externals list and consider externalising packages that are not tree-shakeable and are large (check with `--analyze`).
