---
name: Generic roomKey-based socket.io call pattern
description: The Study Rooms real-time call feature (heartbeat presence + call:* socket events) is fully generic and reusable for any new live-room feature without touching socket-server.ts.
---

The `call:*` socket.io events (`call:request-join`, `call:approve`, `call:deny`, `call:join-request`, `call:approved`, `call:denied`, etc.) used by Study Rooms are keyed purely by an arbitrary `roomKey` string, not by a hardcoded "study room" concept. The backend socket server has no knowledge of which feature a room belongs to.

**Why:** Discovered while building a second live-room feature (Viva Rooms) that needed the same host-approval video/voice call flow. No changes to the shared socket server were needed — only a new DB table + REST routes (list/get/create/join/heartbeat/leave/delete) mirroring the Study Rooms pattern, plus a frontend page picking a distinct `roomKey` prefix (e.g. `viva-room-${id}` vs `study-room-${id}`) to avoid collisions.

**How to apply:** When adding any new "live/multiplayer room" feature to this app, reuse the existing heartbeat-presence + `call:*` event pattern verbatim. Only build: (1) a new schema/table mirroring `studyRooms`, (2) REST routes mirroring `studyRooms.ts`, (3) a frontend page reusing the `VideoCall` component with a unique `roomKey` prefix. Do not touch the socket server.
