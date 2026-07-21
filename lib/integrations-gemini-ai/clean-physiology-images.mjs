import fs from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const BASE = "/home/runner/workspace/artifacts/mission-distinction/public/images";

const jobs = [
  {
    file: `${BASE}/physiology-clinical/auscultation-points.jpg`,
    prompt:
      "This is an educational diagram of a torso skeleton with 4 white text-label boxes (reading 'Aortic valve sounds', " +
      "'Pulmonary valve sounds', 'Tricuspid valve sounds', 'Mitral valve sounds') each connected by a thin line to a small " +
      "white dot marker on the chest. Remove ONLY the 4 white text-label boxes and their text completely (erase them fully, " +
      "reconstructing the dark background behind them naturally). KEEP the thin connector lines and the small white dot " +
      "markers on the chest exactly as they are, so the viewer can still see which 4 points are being indicated. Do not alter " +
      "the skeleton/body image itself, the lighting, or the background in any other way.",
  },
  {
    file: `${BASE}/physiology-clinical/pulse-sites.jpg`,
    prompt:
      "This is a black-and-white line diagram of a human body with artery names written as text (e.g. 'Temporal artery', " +
      "'Facial artery', 'Common carotid artery', 'Brachial artery', 'Radial artery', 'Femoral artery', 'Popliteal artery', " +
      "'Posterior tibial artery', 'Dorsalis pedis artery') each connected by a line to a black dot marker on the body. " +
      "Remove ONLY the text labels (the artery names) completely - erase the words fully, leaving blank white space where " +
      "the text was. KEEP the connector lines and the black dot markers on the body exactly as they are, so the viewer can " +
      "still see which points are being indicated without knowing their names. Do not alter the body outline drawing itself.",
  },
  {
    file: `${BASE}/physiology-clinical/spirometry-volumes.png`,
    prompt:
      "This is an educational line-graph diagram titled 'SPIROGRAM' (with a purple header bar and a 'BYJU'S' logo) showing a " +
      "pink wavy line (lung volume trace) with colored double-headed arrows (IRV, VC, VT, ERC, FRC, RV) alongside a grid of " +
      "labeled boxes on the right (Inspiratory Capacity/IC, Vital Capacity/VC, Total Lung Capacity/TLC, Inspiratory Reserve " +
      "Volume/IRV, Tidal Volume/TV, Functional Residual Capacity/FRC, Expiratory Reserve Volume/ERV, Residual Volume/RV). " +
      "Remove ALL text characters everywhere in the image - the title text, the 'BYJU'S' logo/text, every abbreviation " +
      "label (IRV, VC, VT, ERC, FRC, RV, IC, TV, TLC), and all the words inside the boxes on the right (Inspiratory Capacity, " +
      "Vital Capacity, etc). Leave the boxes as empty outlined boxes (same grid layout, same colors, same borders) with no " +
      "text inside. KEEP the pink wavy line trace, the colored double-headed arrows, the box grid layout/borders/background " +
      "colors, and the purple header bar shape exactly as they are - just make all text invisible/removed.",
  },
  {
    file: `${BASE}/physiology-clinical/bp-measurement.png`,
    prompt:
      "This is an educational diagram of a sphygmomanometer (blood pressure) measurement setup on an arm, with a small blue " +
      "'testbook' logo/watermark in the top-left corner, a title 'Sphygmomanometer', a mercury column with a numeric scale " +
      "(300 down to 0), and text labels: 'column of mercury indicating pressure in mm Hg', 'systole', 'diastole', 'No sounds " +
      "(artery is closed)', 'Sounds heard (artery is opening and closing)', 'No sounds (artery is open)', 'inflatable rubber " +
      "cuff', 'artery', 'air valve', 'squeezable bulb inflates cuff with air', 'sounds are heard with stethoscope'. " +
      "Remove ALL text words/labels/logo/watermark completely (the 'testbook' logo, the title, and every text label listed " +
      "above) - erase them fully, reconstructing the background naturally where they were. KEEP the numeric mercury scale " +
      "numbers (300, 280, 260... 0) as-is since that's part of the instrument itself, not an answer label. KEEP the arm, " +
      "cuff, mercury gauge illustration, tubing, bulb, valve, dashed leader lines, and the small red/pink circle icons " +
      "exactly as they are - just remove the descriptive text words next to them.",
  },
  {
    file: `${BASE}/physiology-hematology/hemocytometer.webp`,
    prompt:
      "This is a diagram of a Neubauer counting chamber (hemocytometer) grid, split into two halves. It has colored label " +
      "boxes with text: '1 mm' (blue box), '0.2 mm' (yellow box), '0.05 mm' (red box), 'RBC' (red box), 'Yeast' (yellow box), " +
      "'Sperm' (gray box) on the left half, and '0.04 mm²' (yellow box), '2500 µm²' (white box), '1 mm²' (white text) on the " +
      "right half. Remove ALL of these colored label boxes and their text completely - erase them fully so only the plain " +
      "black grid lines (or blue grid lines on the right) remain, reconstructing the grid/background naturally where the " +
      "boxes were. KEEP the small illustrative dot/oval icon (representing an RBC), the small round icon (yeast), and the " +
      "small tadpole-shaped icon (sperm) that appear at the bottom-left corner of the grid - just remove their text labels, " +
      "not the icons themselves. Do not alter the grid lines, grid squares, or background colors in any other way.",
  },
  {
    file: `${BASE}/physiology-clinical/knee-jerk-reflex.png`,
    prompt:
      "This is an educational diagram of the patellar (knee-jerk) reflex arc, showing a muscle/leg cross-section on the left " +
      "connected via blue (afferent) and red (efferent) nerve pathways to a spinal cord cross-section on the right, with a " +
      "'To brain' arrow at the top. The image currently has several ugly gray/blue blurred rectangle patches (clumsy " +
      "redaction boxes) scattered across it, plus visible remaining text labels including 'Spinal Nerve' and 'To brain', " +
      "and thin black leader lines pointing to now-blurred areas. Completely reconstruct this image as a clean, fully " +
      "unlabeled version: remove ALL text labels (including 'To brain' and 'Spinal Nerve'), remove ALL the gray/blurred " +
      "redaction rectangles entirely, and remove the black leader lines that pointed to text (since the text is gone). " +
      "Reconstruct the anatomy/diagram artwork underneath the blurred patches and lines naturally and seamlessly, matching " +
      "the surrounding illustration style, colors, and shading. KEEP the actual diagram artwork - the muscle/leg cross-" +
      "section, the blue and red nerve pathway lines/curves, the dotted red reflex arc line, the spinal cord cross-section, " +
      "the small hammer/reflex-testing tool illustration, and the small +/- synapse symbols - exactly as they are. The final " +
      "image should look like a professional, fully clean anatomical diagram with zero text and zero redaction artifacts.",
  },
];

const results = [];
for (const job of jobs) {
  const name = path.basename(job.file);
  try {
    const buf = await fs.readFile(job.file);
    const ext = path.extname(job.file).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    const b64 = buf.toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: job.prompt }, { inlineData: { data: b64, mimeType } }] }],
      config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    });

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((p) => p.inlineData);
    if (!imagePart?.inlineData?.data) {
      console.log(name, "NO IMAGE RETURNED. finishReason:", candidate?.finishReason, "promptFeedback:", JSON.stringify(response.promptFeedback));
      results.push({ file: job.file, status: "error", finishReason: candidate?.finishReason });
      continue;
    }
    const outBuf = Buffer.from(imagePart.inlineData.data, "base64");
    const outPath = path.join("/tmp/physiology_cleaned", name.replace(/\.(webp|jpg|jpeg)$/i, ".png"));
    await fs.mkdir("/tmp/physiology_cleaned", { recursive: true });
    await fs.writeFile(outPath, outBuf);
    console.log(name, "-> saved", outPath, outBuf.length, "bytes");
    results.push({ file: job.file, outPath, status: "done" });
  } catch (e) {
    console.log(name, "ERROR", e.message);
    results.push({ file: job.file, status: "error", error: e.message });
  }
}

await fs.writeFile("/tmp/physiology_cleaned/results.json", JSON.stringify(results, null, 2));
console.log("\nDone:", results.filter((r) => r.status === "done").length, "/", jobs.length);
