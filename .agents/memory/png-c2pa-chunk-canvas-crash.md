---
name: PNG C2PA chunk crashes @napi-rs/canvas
description: Non-standard ancillary PNG chunks (e.g. caBX/C2PA provenance) crash @napi-rs/canvas loadImage with "Unsupported image type" even on otherwise-valid PNGs
---

Some PNGs served by this app (e.g. AI-generated or provenance-tagged images) carry non-standard ancillary chunks such as `caBX` (C2PA content-provenance metadata). `@napi-rs/canvas`'s `loadImage()` throws `"Unsupported image type"` on these files even though the image itself decodes fine everywhere else (browsers, other PNG libraries).

**Why:** `@napi-rs/canvas`'s PNG decoder is stricter about chunk types than typical PNG consumers and aborts on chunks it doesn't recognize, rather than skipping them per spec.

**How to apply:** Before passing PNG bytes to `@napi-rs/canvas` `loadImage()`, strip any chunk whose 4-byte type isn't a well-known PNG chunk (keep `IHDR`, `PLTE`, `IDAT`, `IEND`, `tRNS`, `gAMA`, `cHRM`, `sRGB`, `iCCP`, `tEXt`, `zTXt`, `iTXt`, `bKGD`, `pHYs`, `sBIT`, `hIST`, `tIME`, `sPLT`; drop everything else including `caBX`). Recompute nothing else — chunk removal doesn't require CRC/length recalculation of surrounding chunks since each chunk is self-contained with its own length+CRC.
