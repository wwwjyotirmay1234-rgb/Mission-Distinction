---
name: Signed upload URL expiry vs large file size
description: Large file uploads via browser->GCS signed PUT URLs fail once transfer time exceeds the signed URL's expiry window, surfacing as a false "file too big" limit
---
Direct browser-to-GCS uploads (signed PUT URL, bypassing the Node proxy for large files) will fail partway through if the upload takes longer than the signed URL's `expires_at` window — GCS just rejects the PUT once it's expired. This has nothing to do with multer limits or GCS object size caps; it's purely upload duration vs. connection speed.

**Why:** A short expiry (e.g. 15 minutes) works fine for small/medium files but fails for large ones (~200MB+) on anything but a fast connection, and the failure looks to the user like an arbitrary size limit ("can't upload more than 200MB") rather than a timeout.

**How to apply:** Any new signed-PUT-URL upload flow for large files (books, PDFs, media) should use a generous expiry (60+ minutes), matching the pattern in `upload.ts`'s `signPdfUploadURL` and `vivaSources.ts`'s `signBookUploadURL`. If a user reports an upload failing above some specific size threshold on a signed-URL flow, check the expiry window first before assuming it's a size cap.
