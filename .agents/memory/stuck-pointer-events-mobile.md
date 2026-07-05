---
name: Stuck pointer-events:none on body (mobile Radix)
description: Root cause and fix for "can't type in any field, random, mobile only" reports on pages using Radix Select/Dialog/Popover
---

## Symptom
User reports being unable to type in form fields on mobile — happens "randomly", across unrelated fields/tabs on the same page, but never reproduces reliably on desktop or in a single-field isolated test.

## Root cause
Radix UI primitives (Select, Dialog, Popover, DropdownMenu) set `document.body.style.pointerEvents = "none"` while open and restore it on close/unmount. On mobile browsers this restore can fail to run if the close animation is interrupted (app backgrounded, OS back-gesture, quick tab/role switch, orientation change mid-close). The lock is page-wide, not field-specific — so once stuck, EVERY input on the page (including a completely different tab/form that has no Select at all) becomes untappable/untypeable until a full reload.

**Why:** This matches "random field" + "mobile only" + "affects unrelated forms" reports exactly, because the bug has nothing to do with the specific field — it's a leftover CSS lock on `<body>` from an earlier Select/Dialog interaction elsewhere on the same page.

## Fix
Add a global guard component (mounted once near the app root, e.g. in `App.tsx`) that periodically (interval + MutationObserver on `document.body`'s `style` attribute) checks: if `body.style.pointerEvents === "none"` AND no Radix overlay is actually open (`[data-radix-popper-content-wrapper]`, `[role="dialog"][data-state="open"]`, `[data-state="open"][data-radix-select-content]`, etc. not found), clear the inline style.

**How to apply:** See `StuckOverlayGuard` in Mission Distinction's `App.tsx`. Mount it once at the top level, unconditionally, before any route-specific content.
