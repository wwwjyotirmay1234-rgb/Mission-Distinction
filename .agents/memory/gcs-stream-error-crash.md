---
name: GCS stream errors crash the server
description: Object-storage file-serve routes that pipe a createReadStream() into the response must attach a stream-level .on("error") handler, or a missing/inaccessible file crashes the entire Node process.
---

## The problem

A pattern like this looks safe but is not:

```ts
router.get("/serve/:fileName", async (req, res) => {
  try {
    const fileRef = bucket.file(path);
    fileRef.createReadStream().pipe(res);
  } catch {
    res.status(404).end();
  }
});
```

`createReadStream()` itself doesn't throw when the object doesn't exist — the
underlying HTTP/GCS lookup happens asynchronously *after* the stream is
returned, and the failure is emitted as an `'error'` event on the stream. A
synchronous `try/catch` around `createReadStream().pipe(res)` never sees it.

If nothing listens for that `'error'` event, Node treats it as an **unhandled
error event**, which surfaces as an uncaught exception. If the app has a
global uncaught-exception handler that calls `process.exit()` (common for
"fail fast" monitoring setups), a single request for a missing/renamed/deleted
file takes down the *entire server* for every user — not just a 404 for one
request.

## Why this matters

This is a much worse failure mode than it looks: a stale URL, a manually
deleted storage object, or even a typo'd filename in a query string becomes a
full outage, not a scoped error.

## How to apply

Any route that pipes a cloud-storage read stream into `res` must attach an
explicit error handler on the stream (not just wrap the setup code in
try/catch):

```ts
const stream = fileRef.createReadStream();
stream.on("error", (err) => {
  if (!res.headersSent) res.status(err.code === 404 ? 404 : 500).end();
  else res.destroy();
});
stream.pipe(res);
```

When auditing a codebase for this bug class, grep for `createReadStream()` and
verify every call site has an `.on("error", ...)` handler before `.pipe(...)`.
