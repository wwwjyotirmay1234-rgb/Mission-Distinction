---
name: integrations-openai-ai-react lib needs its own devDependencies + prebuild
description: Composite TS project references fail with "output file has not been built from source" or "Cannot find module 'react'" until the lib package declares its own react/@types-react devDependencies and is built with tsc -b.
---

`lib/integrations-openai-ai-react` (voice hooks: useVoiceRecorder, useAudioPlayback, useVoiceStream) is a `composite: true` TS project referenced by consuming artifacts (e.g. mission-distinction). Two things are easy to miss when first wiring it into an app:

1. The lib's own `package.json` needs explicit `devDependencies` on `react` and `@types/react` (catalog: versions) — without them, `tsc -b` on the lib itself fails with `Cannot find module 'react'`, even though react is present elsewhere in the monorepo.
2. Before a consuming app's `tsc -p ... --noEmit` will succeed, the lib's `dist/` must actually be built (`pnpm --filter @workspace/integrations-openai-ai-react exec tsc -b`) — referencing the lib in `tsconfig.json` + running `pnpm install` is not enough; TS project references resolve against the emitted `.d.ts` files, not source.

**Why:** Hit both errors back-to-back when adding the Practical Hub voice viva feature — first `TS6305` (dist not built), then after building, `TS2307 Cannot find module 'react'` inside the lib itself.

**How to apply:** Whenever consuming a new/updated composite lib package for the first time, run its own `tsc -b` first and fix any missing devDependencies there, then rerun the consumer's typecheck.
