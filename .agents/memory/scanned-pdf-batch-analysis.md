---
name: Scanned multi-page PDF AI analysis pattern
description: How to run AI analysis (topic search, repetition ranking) over scanned/image-only PDFs of arbitrary length without silently dropping pages.
---

Scanned (image-only, no extractable text) PDFs cannot be sent to a vision model in one call once they exceed a handful of pages — context/token limits force an arbitrary page cap, which silently drops content (e.g. a 78-page PYQ compilation capped at 20 pages misses most of the years/questions and can even return "AI returned no content" for the excluded pages).

**Why:** Capping page count is a silent correctness bug, not a performance optimization — the user has no way to know pages 21-78 were never read, and "most repeated question" analysis is meaningless if most of the source pages were skipped.

**How to apply:**
1. Detect scanned vs text-based PDFs by attempting real text extraction first (not just checking for a text layer that might just be noise) — if extracted text is negligible, treat as scanned.
2. For scanned mode, walk ALL pages in small batches (e.g. 10 pages/vision-call) so each individual call reliably returns content instead of timing out or truncating.
3. If the task just needs matches/excerpts (e.g. "find questions about topic X"), each batch's output can be merged directly.
4. If the task needs cross-document reasoning (e.g. "rank by repetition across the whole document"), don't try to do that reasoning per-batch — instead have each batch only *transcribe* raw content, then run ONE final cheap text-only synthesis call over the concatenated transcripts. This keeps the final reasoning call cheap/reliable regardless of document length.
5. Always report back exactly how many pages/batches were actually read (and which batches had issues), so an incomplete result is never silently mistaken for a complete one.
