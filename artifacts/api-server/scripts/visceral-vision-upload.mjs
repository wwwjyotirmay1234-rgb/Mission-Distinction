/**
 * visceral-vision-upload.mjs
 * GPT-4o-mini vision-checks all images in /tmp/visceral_imgs/,
 * uploads passing ones to Cloudinary, then inserts into anatomy_viva_images.
 * Run: node artifacts/api-server/scripts/visceral-vision-upload.mjs
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { execSync } from "node:child_process";

// Cloudinary v2 from api-server's local node_modules
const { v2: cloudinary } = await import(
  new URL("../node_modules/cloudinary/index.js", import.meta.url).pathname
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const OPENAI_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const OPENAI_BASE = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

async function visionCheck(imgPath) {
  const data = await readFile(imgPath);
  const ext = extname(imgPath).slice(1).toLowerCase();
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  const b64 = data.toString("base64");

  const resp = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: "You are a medical anatomy image quality reviewer. Output only valid JSON.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image for a gross anatomy visceral spotter viva exam station.

Return JSON only:
{
  "isRealSpecimen": boolean,
  "hasLeak": boolean,
  "isHighQuality": boolean,
  "organ": string,
  "reason": string
}

Rules:
- isRealSpecimen: TRUE only if this is an actual PHOTOGRAPH of a real anatomical specimen (cadaveric, formalin-fixed, fresh organ). FALSE for: line drawings, engravings, illustrations, 3D renders, SVG renders, diagrams, cartoons, schematic artwork, CT/MRI/X-ray images, histology slides. Must be a real photograph.
- hasLeak: TRUE if any visible text label, caption, or annotation directly names the organ or key structures (giving away the answer)
- isHighQuality: TRUE if the image is clear, well-lit, and shows recognizable gross anatomy`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mime};base64,${b64}`, detail: "low" },
            },
          ],
        },
      ],
    }),
  });

  const result = await resp.json();
  try {
    return JSON.parse(result.choices[0]?.message?.content || "{}");
  } catch {
    return { isRealSpecimen: false, hasLeak: true, isHighQuality: false, organ: "unknown", reason: "parse error" };
  }
}

async function uploadToCloudinary(imgPath, publicId) {
  return cloudinary.uploader.upload(imgPath, {
    public_id: publicId,
    folder: "anatomy-viva-images",
    resource_type: "image",
    overwrite: false,
  });
}

function insertDB(organ, title, objectName, notes) {
  const sql = `INSERT INTO anatomy_viva_images (category, title, object_name, source_file_name, notes, created_at)
VALUES ('Visceral', '${title.replace(/'/g, "''")}', '${objectName}', 'Wikimedia Commons (CC)', '${notes.replace(/'/g,"''")}', NOW());`;
  execSync(`psql "$DATABASE_URL" -c "${sql.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
}

// Organ name from filename prefix
function organFromFile(file) {
  const parts = file.split("_");
  // "Suprarenal_Gland_xxx" → "Suprarenal Gland"
  // "Caecum_and_Appendix_xxx" → "Caecum and Appendix"
  // "Heart_xxx" → "Heart"
  // Rebuild until next uppercase after second word
  const known = [
    "Suprarenal_Gland", "Caecum_and_Appendix", "Jejunum_and_Ileum",
    "Heart", "Liver", "Spleen", "Kidney", "Stomach", "Colon",
    "Duodenum", "Lung", "Gallbladder", "Pancreas",
  ];
  for (const k of known) {
    if (file.startsWith(k + "_")) return k.replace(/_/g, " ");
  }
  return parts[0];
}

const IMG_DIR = "/tmp/visceral_imgs";
const files = await readdir(IMG_DIR);

let added = 0, skipped = 0;

for (const file of files) {
  const filePath = join(IMG_DIR, file);
  const s = await stat(filePath);
  if (s.size < 60000) {
    console.log(`SKIP (too small): ${file}`);
    skipped++;
    continue;
  }

  const organ = organFromFile(file);
  process.stdout.write(`\n[${file.slice(0, 55)}] checking... `);

  let check;
  try {
    check = await visionCheck(filePath);
  } catch (e) {
    console.log(`vision error: ${e.message?.slice(0, 60)}`);
    skipped++;
    continue;
  }

  const { isRealSpecimen, hasLeak, isHighQuality, organ: detectedOrgan, reason } = check;
  console.log(`real=${isRealSpecimen} leak=${hasLeak} quality=${isHighQuality} organ=${detectedOrgan?.slice(0, 25)}`);
  if (reason) console.log(`  reason: ${reason?.slice(0, 80)}`);

  if (!isRealSpecimen) { console.log("  → SKIP: not real specimen"); skipped++; continue; }
  if (hasLeak) { console.log("  → SKIP: has label leak"); skipped++; continue; }
  if (!isHighQuality) { console.log("  → SKIP: low quality"); skipped++; continue; }

  const ts = Date.now();
  const slug = file.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  const publicId = `${ts}_${slug}`;

  process.stdout.write("  → uploading to Cloudinary... ");
  let uploadResult;
  try {
    uploadResult = await uploadToCloudinary(filePath, publicId);
    console.log(`✓ ${uploadResult.public_id}`);
  } catch (e) {
    console.log(`upload failed: ${e.message?.slice(0, 60)}`);
    skipped++;
    continue;
  }

  const title = detectedOrgan && detectedOrgan !== "unknown"
    ? detectedOrgan.charAt(0).toUpperCase() + detectedOrgan.slice(1)
    : organ;

  insertDB(organ, title, uploadResult.public_id, `Real gross anatomy specimen photograph — ${organ}`);
  console.log(`  → DB inserted`);
  added++;
}

console.log(`\n═══ Done: ${added} added, ${skipped} skipped ═══`);
