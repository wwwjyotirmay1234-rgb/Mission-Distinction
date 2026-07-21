---
name: Socket.io path routing
description: How Socket.io is configured to work with Replit's path-based proxy
---

## Rule
Set `path: "/api/socket.io/"` on BOTH the server (`new Server(httpServer, { path })`) and client (`io(origin, { path })`).

**Why:** Replit routes `/api/*` to port 8080 (the API server). Without the `/api/` prefix in the Socket.io path, WebSocket connections go to port 19257 (the frontend), which doesn't serve Socket.io.

**How to apply:** Any new WebSocket feature that needs to go through the Replit proxy must use a path that starts with the artifact's proxy prefix (e.g. `/api/`).
