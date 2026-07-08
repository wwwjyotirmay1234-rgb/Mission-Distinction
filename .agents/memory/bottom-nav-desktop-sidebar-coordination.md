---
name: Bottom nav + sidebar + persistent player coordination
description: BottomNav was originally mobile-only (md:hidden); making it show on all device sizes requires coordinating fixed-position insets with the desktop sidebar and the persistent music player.
---

Mission Distinction's `BottomNav` (Home/Learn/Quiz/Community/Profile tab bar) was originally
rendered with `md:hidden`, i.e. mobile-only. `StudentSidebar` (desktop) and `BottomNav` (mobile)
were two separate, non-overlapping nav surfaces.

When making the bottom nav appear on all device sizes (desktop/tablet too), the tricky part
isn't the nav itself — it's the other `position: fixed` elements that assumed the bottom nav
only existed below the `md` breakpoint:

- `PersistentPlayer.tsx`'s mini-bar and full-player bar previously used `md:bottom-0` /
  `md:left-64` to sit flush with the screen edge on desktop (since nothing else was there).
  Once the bottom nav is universal, these need to stay above it (`bottom-16`) on every
  screen size, not just mobile.
- Fixed-position elements don't inherit the sidebar's `marginLeft` from their parent (no
  transform on the layout wrapper), so anything meant to avoid the desktop sidebar needs its
  own left-inset logic mirroring `useSidebar()`'s `collapsed`/`hidden` state (0 / 60px / 220px),
  not just a static `md:left-64`.
- `StudentLayout.tsx`'s `<main>` bottom padding was conditioned on `isMobile` to leave room for
  the bottom nav + player; once the nav is universal, that padding must apply unconditionally.

**Why:** these three components silently assumed "bottom nav = mobile-only" as a shared
contract; changing that assumption in one file without updating the others causes overlapping
UI on desktop that's easy to miss without a real logged-in screenshot check.

**How to apply:** if the mobile-only nav assumption changes again (e.g. reverting to
desktop-sidebar-only, or adding another fixed bottom element), grep for `BottomNav`,
`md:left-64`, `md:bottom-0`, and `isMobile` across `StudentLayout.tsx` / `PersistentPlayer.tsx`
together — they must move as a unit.
