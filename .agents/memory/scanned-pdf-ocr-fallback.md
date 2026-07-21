---
name: Scanned-PDF rejection vs OCR fallback
description: Any endpoint that extracts PDF text must check the images fallback, not just the text field, or scanned PDFs get wrongly 422-rejected.
---

`extractPdfBuffer()` (aiDoubt.ts) detects scanned/image-only PDFs (extracted text < 20 chars) and internally renders the pages to images via `renderPdfPagesToImages`/`renderPageRangeFromDoc`, returning `{ text: "", images, pages, warning }`. It does NOT do OCR itself — it just hands back page images for the caller to feed to a vision-capable model.

Several endpoints reuse this: `pyqs.ts` (repeated-questions analysis) and `aiDoubt.ts` (doubt-solving chat) already batch those images through `gpt-4o` vision calls (small page batches, bounded concurrency via a local `mapWithConcurrency`) to get real transcribed text/answers. `vivaSources.ts` (book-library uploads) originally did NOT — it only checked `cleaned` (the text) and rejected with a 422 "No extractable text" for any scanned PDF, which is a serious problem for large "book" uploads because scanned/photocopied textbooks are usually the largest files (raster images, no text layer) — i.e. exactly the uploads most likely to hit large-file code paths and repeatedly fail.

**Why:** A large-file-upload bug report ("book upload keeps failing") turned out not to be a storage/networking problem — the direct-to-GCS signed-URL flow worked fine — but a silent content-based rejection that disproportionately hits the largest uploads.

**How to apply:** When adding or debugging any PDF-ingestion endpoint, check whether it handles the scanned-PDF case by OCR'ing the `images` array (reuse the vision-batch pattern: batch N pages per vision call, bounded concurrency, concatenate results) rather than just rejecting when `text` is empty. Cap the number of OCR'd pages for cost/latency (books justify a much higher cap, e.g. ~150 pages, vs ~20 for short PYQ compilations) and surface a truncation warning if capped.
