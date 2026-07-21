---
name: Server-side Google Drive PDF fetch
description: Backend routes that fetch() a stored Google Drive share URL to read PDF bytes must convert it to a direct-download URL first, or they get an HTML page instead of a PDF.
---

## The problem

Content records (PYQs, notes, PDFs) sometimes store a user-facing Google Drive
**share link**, e.g. `https://drive.google.com/file/d/<ID>/view`. That URL is
meant to be opened in a browser — it serves an HTML viewer page, not the raw
file bytes.

If a backend route does `fetch(url)` on that share link directly (e.g. to run
AI text extraction over the PDF), it gets back HTML. Passing that buffer to a
PDF parser fails the `%PDF` magic-byte check with an error like:

`File does not appear to be a valid PDF.`

The failure surfaces as a generic HTTP 500 in the UI, which is misleading
since the actual file is fine — it's the fetch source that's wrong.

## The fix

Before fetching, detect the Drive share-link pattern and rewrite it to the
direct-download endpoint:

```
/file/d/([a-zA-Z0-9_-]+)/  →  https://drive.usercontent.google.com/download?id=<ID>&export=download&authuser=0&confirm=t
```

Also send a realistic `User-Agent` / `Accept: application/pdf,*/*` header —
some hosts vary behavior for bots/no-UA requests.

**Why:** This bug pattern already existed once (fixed in the PDF proxy route)
and reappeared in a different route (PYQ AI search/analysis) that fetches PDF
content server-side independently. The conversion logic is small and easy to
forget to copy when adding a new "fetch this stored document URL" code path.

**How to apply:** Any time you add a new backend route that does
`fetch(someStoredUrl)` to read file bytes (not just redirect/proxy the user's
browser to it), check whether `someStoredUrl` could be a Google Drive share
link and apply this conversion first. Grep for existing implementations
(`driveMatch`, `usercontent.google.com`) before writing a new one — reuse
rather than reimplementing.
