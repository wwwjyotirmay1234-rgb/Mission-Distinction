import fs from "node:fs/promises";
const { Storage } = await import("/home/runner/workspace/node_modules/.pnpm/@google-cloud+storage@7.21.0/node_modules/@google-cloud/storage/build/cjs/src/index.js");
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

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const rows = JSON.parse(await fs.readFile("/tmp/anatomy_upload/rows.json", "utf8"));

let results = [];
try {
  results = JSON.parse(await fs.readFile("/tmp/anatomy_upload/audit_results.json", "utf8"));
} catch {}
const doneIds = new Set(results.map((r) => r.id));
const limit = Number(process.env.AUDIT_LIMIT || "8");
let processed = 0;

for (const row of rows) {
  if (doneIds.has(row.id)) {
    continue;
  }
  if (processed >= limit) {
    console.log("Hit batch limit, stopping for this run.");
    break;
  }
  processed++;
  try {
    const [buffer] = await bucket.file(row.object_name).download();
    const b64 = buffer.toString("base64");
    const mimeType = row.object_name.endsWith(".png") ? "image/png" : "image/jpeg";

    const prompt =
      "Look at this medical/anatomy image. Does it have TEXT LABELS, LETTERS, NUMBERS, or ARROWS that were " +
      "digitally drawn/overlaid ON TOP of the photo/diagram, pointing to or naming structures (e.g. captions " +
      "like 'MEDIAN NERVE' with an arrow, or letter/number annotations)? This does NOT include text that is " +
      "naturally part of a textbook page layout (like a figure caption below the image, unrelated header/footer text). " +
      "Answer with EXACTLY one word: YES or NO, then a short reason on the next line.";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, { inlineData: { data: b64, mimeType } }],
        },
      ],
    });

    const text = response.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text || "";
    const flagged = /^YES/i.test(text.trim());
    results.push({ id: row.id, title: row.title, category: row.category, object_name: row.object_name, flagged, raw: text.trim() });
    console.log(row.id, row.title, "->", flagged ? "FLAGGED" : "clean", "|", text.trim().split("\n")[0]);
  } catch (e) {
    console.log(row.id, "ERROR", e.message);
    results.push({ id: row.id, title: row.title, category: row.category, object_name: row.object_name, error: e.message });
  }
  await fs.writeFile("/tmp/anatomy_upload/audit_results.json", JSON.stringify(results, null, 2));
}

console.log("\nDone. Flagged:", results.filter((r) => r.flagged).length, "of", results.length);
