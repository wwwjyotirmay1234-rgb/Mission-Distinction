---
name: Viva examiner full-book grounding (RAG-lite)
description: How full textbooks are stored and fed to the AI viva examiner without blowing up prompt size/cost.
---

Admins can upload entire textbooks (not just short notes) per subject as reference material for the AI viva examiner. Full text is stored untruncated in a separate `viva_source_documents` table (one row per uploaded PDF), distinct from the short manual "focus notes" in `viva_sources` (still capped small since those are embedded in full every time).

**Why:** embedding a whole book into every single AI prompt call doesn't scale — token cost/latency blow up and it can exceed model context limits, even though some models (gemini-2.5-flash, claude-sonnet) have huge context windows. The user explicitly rejected truncating to a short excerpt; they wanted the AI to have "full access to every aspect of the book."

**How it works:** at viva-question time, the full book text is chunked into ~1400-char paragraph-aligned chunks, then simple keyword-overlap scoring (no embeddings/vector DB) ranks chunks against the current topic/vivaType/recent transcript. Top chunks up to a ~6000-char budget are injected into that turn's system prompt. If no topic hint exists yet (very first question), a time-bucket rotation samples different sections of the book across sessions so coverage isn't always page 1. This means every part of the book is reachable over the course of many questions/sessions, but never all injected at once.

**How to apply:** if extending this pattern to another AI feature that needs "full document" grounding, follow the same split — unbounded raw storage in its own table + a lightweight per-call retrieval/chunking step — rather than raising a flat truncation cap on the field that gets embedded into every prompt.
