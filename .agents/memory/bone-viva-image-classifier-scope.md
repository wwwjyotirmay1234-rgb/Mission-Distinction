---
name: Bone viva image classifier scope
description: Vision classifiers for anatomy viva "spotter" images must accept labeled illustrations/X-rays, not just raw cadaveric photos
---

When classifying PDF pages as candidate specimen images for a viva "spotter" category (e.g. Bone), a prompt that only accepts "genuine photographs of an isolated bone specimen" will reject 100% of pages from typical MBBS study PDFs — those are dominated by colored anatomical illustrations, labeled X-rays, and diagram+bullet-notes layouts, not raw photography.

**Why:** A real extraction run against two full study PDFs returned 0/60 accepted pages with a photo-only prompt; broadening the prompt to accept "illustration, diagram, photograph, or X-ray" as long as one bone/joint is the dominant visual subject (rejecting only cover pages, icon collages, pure text pages, and soft-tissue-only pages) raised acceptance to 43/60 with correct, specific titles.

**How to apply:** For any new viva-image-extraction category sourced from real student study PDFs, write the classifier prompt to explicitly accept diagrams/X-rays with labels (never reject for "has labels" — that's what the separate erase-labels step is for), and only reject on page *type* (cover/collage/text-only/wrong-anatomy), not image *style*.

Separately: an AI label-erasure pass (gpt-image-1 edit) on such labeled diagram pages is highly reliable (~85-90% fully clean in one sample) but not perfect — a minority of pages with dense bullet-point text blocks surrounding the diagram can leave garbled, illegible (but not readable) text remnants. This is functionally acceptable for hiding the answer even when not pixel-perfect; spot-check ~15-20 random outputs rather than assuming uniform quality.
