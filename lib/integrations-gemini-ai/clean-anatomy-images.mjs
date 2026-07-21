import fs from "node:fs/promises";
const { Storage } = await import("/home/runner/workspace/node_modules/.pnpm/@google-cloud+storage@7.21.0/node_modules/@google-cloud/storage/build/cjs/src/index.js");
const pgMod = await import("/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js");
const { Pool } = pgMod.default;
import { GoogleGenAI, Modality } from "@google/genai";

const REPLIT_SIDECAR = "http://127.0.0.1:1106";

const gcsClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
const bucket = gcsClient.bucket(bucketId);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const IMAGE_PREFIX = "anatomy-viva-images/";

const auditResults = JSON.parse(await fs.readFile("/tmp/anatomy_upload/audit_results.json", "utf8"));
const flagged = auditResults.filter((r) => r.flagged);

let progress = [];
try {
  progress = JSON.parse(await fs.readFile("/tmp/anatomy_upload/clean_progress.json", "utf8"));
} catch {}
const doneIds = new Set(progress.filter((p) => p.status === "done").map((p) => p.id));

const limit = Number(process.env.CLEAN_LIMIT || "5");
let processed = 0;

function buildPrompt(retryHint) {
  return (
    "This is a real cadaveric anatomy dissection / histology / gross specimen photograph used for medical education. " +
    "It has digitally overlaid TEXT LABELS on top of the photo - these include short abbreviation codes (like 'AA', 'PT', 'RA', 'LV'), " +
    "full words naming structures, numbers, and arrows/lines pointing at structures. " +
    "Remove ALL of these overlaid text/letter/number/arrow annotations completely, no matter how small or subtle - " +
    "scan the ENTIRE image edge to edge including on top of the specimen, in empty background areas, and along any lines/arrows. " +
    "Do NOT alter, add, remove, or invent any anatomical structures, colors, textures or details of the actual " +
    "specimen underneath - reconstruct the exact area that was hidden behind each label/arrow to blend naturally " +
    "with the surrounding anatomy. Preserve the ORIGINAL background exactly as-is (same color, same lighting) - do not " +
    "replace the background with black or any other color. The output must look like a completely unlabeled version " +
    "of the same real photograph, not a redrawn, stylized, or re-lit image. Keep the same framing and resolution." +
    (retryHint ? " IMPORTANT: A previous attempt still left these labels visible: " + retryHint + ". Make sure to remove these too." : "")
  );
}

async function checkStillFlagged(buffer, mimeType) {
  const b64 = buffer.toString("base64");
  const checkPrompt =
    "Look at this medical/anatomy image. Does it have TEXT LABELS, LETTERS, NUMBERS, or ARROWS that were " +
    "digitally drawn/overlaid ON TOP of the photo/diagram, pointing to or naming structures (e.g. captions " +
    "like 'MEDIAN NERVE' or short codes like 'AA'/'PT' with an arrow, or letter/number annotations)? This does NOT include text that is " +
    "naturally part of a textbook page layout (like a figure caption below the image, unrelated header/footer text). " +
    "Answer with EXACTLY one word: YES or NO, then if YES list exactly which labels/letters remain visible.";
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: checkPrompt }, { inlineData: { data: b64, mimeType } }] }],
  });
  const text = response.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text || "";
  return { flagged: /^YES/i.test(text.trim()), raw: text.trim() };
}

const MAX_ATTEMPTS = 3;

for (const row of flagged) {
  if (doneIds.has(row.id)) continue;
  if (processed >= limit) {
    console.log("Hit batch limit, stopping for this run.");
    break;
  }
  processed++;
  try {
    const [originalBuffer] = await bucket.file(row.object_name).download();
    const mimeType = row.object_name.endsWith(".png") ? "image/png" : "image/jpeg";

    let currentBuffer = originalBuffer;
    let retryHint = null;
    let finalCheck = null;
    let attempts = 0;

    for (attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
      const b64 = currentBuffer.toString("base64");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(retryHint) }, { inlineData: { data: b64, mimeType } }],
          },
        ],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((p) => p.inlineData);

      if (!imagePart?.inlineData?.data) {
        console.log(row.id, `attempt ${attempts}`, "NO IMAGE RETURNED", JSON.stringify(candidate).slice(0, 300));
        break;
      }

      currentBuffer = Buffer.from(imagePart.inlineData.data, "base64");
      finalCheck = await checkStillFlagged(currentBuffer, "image/png");
      console.log(row.id, `attempt ${attempts}`, "-> verify:", finalCheck.flagged ? "STILL FLAGGED" : "CLEAN", "|", finalCheck.raw.split("\n")[0]);

      if (!finalCheck.flagged) break;
      retryHint = finalCheck.raw;
    }

    if (!finalCheck || finalCheck.flagged) {
      progress.push({ id: row.id, status: "needs_review", attempts, lastCheck: finalCheck?.raw || "no_image_returned" });
      await fs.writeFile("/tmp/anatomy_upload/clean_progress.json", JSON.stringify(progress, null, 2));
      console.log(row.id, "-> still needs manual review after", attempts, "attempts");
      continue;
    }

    const newObjectName = `${IMAGE_PREFIX}${Date.now()}_cleaned_${row.id}.png`;
    await bucket.file(newObjectName).save(currentBuffer, { metadata: { contentType: "image/png" } });

    const oldObjectName = row.object_name;
    await pool.query(
      `UPDATE anatomy_viva_images SET object_name = $1, notes = COALESCE(notes, '') || ' | AI-cleaned (labels removed)' WHERE id = $2`,
      [newObjectName, row.id]
    );

    await bucket.file(oldObjectName).delete({ ignoreNotFound: true });

    console.log(row.id, row.title, "-> cleaned & verified, new object:", newObjectName, `(${currentBuffer.length} bytes, ${attempts} attempt(s))`);
    progress.push({ id: row.id, status: "done", newObjectName, oldObjectName, attempts });
  } catch (e) {
    console.log(row.id, "ERROR", e.message);
    progress.push({ id: row.id, status: "error", error: e.message });
  }
  await fs.writeFile("/tmp/anatomy_upload/clean_progress.json", JSON.stringify(progress, null, 2));
}

await pool.end();
console.log(
  "\nBatch done. Total done:",
  progress.filter((p) => p.status === "done").length,
  "/ errors:",
  progress.filter((p) => p.status === "error").length,
  "/ total flagged:",
  flagged.length
);
