---
name: 3D Anatomy Hub architecture
description: Key decisions for the React Three Fiber anatomy hub in Mission Distinction
---

# 3D Anatomy Hub — Architecture Decisions

## JSX.Element → React.ReactElement
In files using @react-three/fiber, `JSX.Element` causes `Cannot find namespace 'JSX'` TS errors (even with React 17 JSX transform). Fix: import React explicitly and use `React.ReactElement` for component map return types.

**Why:** The global JSX namespace isn't available in all files with the project's TS config.

## Lazy loading Three.js
`ModelViewer3D.tsx` is dynamically imported via `React.lazy()` in `AnatomyHub.tsx`. Wrap in `<Suspense>` with a spinner fallback. This keeps Three.js out of the initial bundle (saves ~900KB).

**Why:** Three.js + R3F + drei add ~900KB to the bundle. Only load when the user navigates to Anatomy Hub.

## OrbitControls auto-rotate
Uses `autoRotate` prop on `<OrbitControls>`. Pass `autoRotate={!isInteracting}` tracked via `onPointerDown/Up` on the canvas wrapper so rotation pauses while user drags.

## Label placement
`<Html>` from @react-three/drei anchors HTML elements in 3D space. Use `distanceFactor={6}` and `center`. Labels are driven by `StructureLabel.pos: [x, y, z]` in anatomyData.ts.

## Data location
All anatomy content: `artifacts/mission-distinction/src/data/anatomyData.ts`
Route: `/student/anatomy` in App.tsx
Nav: first item in StudentSidebar.tsx navItems array (Microscope icon)
