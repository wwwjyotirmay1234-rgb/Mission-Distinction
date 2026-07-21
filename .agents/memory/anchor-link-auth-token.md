---
name: Auth token in plain <a href> links
description: Plain anchor-tag navigation to protected file-serve endpoints can't send an Authorization header — the endpoint must accept a token via query string, and every link that targets it must append the token.
---

## The problem

A common pattern for "let the user view/download a protected file" is:

```tsx
<a href={sub.url} target="_blank" rel="noopener noreferrer">View</a>
```

When the browser navigates via a plain `<a>` click (new tab, no JS
`fetch`/`XMLHttpRequest` involved), there is no way to attach custom headers
like `Authorization: Bearer <token>`. If the target route is protected by
middleware that only checks that header, the request 401s even though the
user viewing the page is fully authenticated — the UI *looks* broken
("Unauthorized" on click) even though the API and session are fine.

## How to apply

1. The protected serve route's auth middleware must accept the token via a
   `?token=` query parameter as a fallback when no `Authorization` header is
   present (many codebases already have a "pdf-serve"-style middleware that
   does this for iframe/anchor scenarios — check before writing a new one).
2. Every `<a href=...>` (or `window.open(...)`) that targets that internal
   serve endpoint must build the URL through a helper that appends
   `?token=<token from localStorage/session>` — but ONLY when the URL points
   at the app's own protected endpoint. External links (e.g. Google Drive,
   S3 presigned URLs already containing their own auth) must be left
   untouched, since appending an app token to a foreign domain does nothing
   useful and can leak the token.
3. This bug class recurs anywhere a list of user-submitted or admin-uploaded
   files renders "View"/"Download" links — audit all such lists, not just the
   one the user reported, since they usually share the same underlying
   upload/serve route.

## Why this matters

The failure only appears when clicking through the UI — it's invisible to a
plain `curl` test with an `Authorization` header, so backend-only sanity
checks ("the API works with a valid token") can miss it entirely.
