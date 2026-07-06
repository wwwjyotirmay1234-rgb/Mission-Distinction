---
name: Viva image answer-leak audit pattern
description: How to audit and fix "spot the structure" exam images for hidden answer-revealing text/labels
---

For any exam-style image where the student must identify a structure from a photo (anatomy/histology/pathology viva specimens, etc.), an AI vision leak-checker running on the final cropped image is necessary but not sufficient at low resolution — it can miss tiny overlay labels or thin pointer-lines that are baked directly onto the specimen photo itself (not just page captions/headers around it).

**Why:** Several bulk-extracted textbook images passed an initial low-res leak check as "clean" but turned out, on closer high-res inspection, to have permanent label text with leader lines drawn right on the microscope/specimen photo (e.g. "Haversian canal →", "Umbilical cyst →"). These are architecturally different from a caption-bleed issue — no amount of cropping removes them, since the label is fused into the image content itself.

**How to apply:**
1. When a leak audit flags an image, don't assume it's a simple crop-margin issue. Re-render the source PDF page at high resolution (scale 3-4x) and visually inspect the full specimen region, not just the audit's cropped output.
2. Two distinct fix categories exist:
   - **Crop-fixable**: identifying text is in the page margin/caption/header, outside the actual photo — tighten the bounding box (iteratively shrink if a strict prompt doesn't get it in one pass) to exclude it.
   - **Unsalvageable**: identifying labels/pointer-lines are drawn onto the photo itself, or the "photo" on the page is actually a broken/placeholder image block — delete the row entirely rather than trying to crop around it.
3. Run the full leak-check audit a second time after any batch of fixes — new true-positives can surface on later chunks that weren't caught in the first pass (the checker's judgment isn't perfectly deterministic and reprocessing at different times/temperatures can catch things missed once).
