/**
 * find-visceral-images.mjs
 * Queries Wikimedia Commons API from bash (where network works) to find
 * real gross anatomy specimen image URLs for each visceral organ.
 * Writes /tmp/visceral_urls.json
 */

import fs from "node:fs/promises";

const UA = "MissionDistinction/1.0 (medical education; contact@example.com)";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function searchCommonsText(query, limit = 10) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=${limit}&format=json`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  const d = await r.json();
  return (d.query?.search || [])
    .map(h => h.title.replace(/^File:/, ""))
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f));
}

async function resolveUrl(filename) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|size|mime&format=json`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  const d = await r.json();
  const pages = Object.values(d.query?.pages || {});
  const info = pages[0]?.imageinfo?.[0];
  if (info?.url && info.size > 30000 && info.mime?.startsWith("image/")) {
    return info.url;
  }
  return null;
}

async function findOrganImages(organ, queries) {
  const urlSet = new Set();
  for (const q of queries) {
    const files = await searchCommonsText(q, 10);
    for (const f of files) {
      const imgUrl = await resolveUrl(f);
      if (imgUrl) urlSet.add(imgUrl);
      await sleep(200);
    }
    await sleep(500);
  }
  return [...urlSet];
}

const organs = [
  { name: "Heart",
    queries: ["human heart specimen anatomy", "heart gross anatomy photograph specimen"] },
  { name: "Right Lung",
    queries: ["human lung specimen anatomy photograph", "lung gross anatomy specimen"] },
  { name: "Left Lung",
    queries: ["lung lobe specimen anatomy photograph", "human lung anatomy specimen"] },
  { name: "Liver",
    queries: ["human liver specimen gross anatomy", "liver anatomy photograph specimen"] },
  { name: "Spleen",
    queries: ["human spleen specimen anatomy", "spleen gross anatomy photograph"] },
  { name: "Kidney",
    queries: ["human kidney specimen anatomy photograph", "kidney gross anatomy specimen"] },
  { name: "Suprarenal Gland",
    queries: ["adrenal gland specimen anatomy photograph", "suprarenal gland gross anatomy"] },
  { name: "Stomach",
    queries: ["human stomach specimen anatomy", "stomach gross anatomy photograph"] },
  { name: "Duodenum",
    queries: ["duodenum specimen anatomy photograph", "duodenum gross anatomy"] },
  { name: "Jejunum and Ileum",
    queries: ["small intestine specimen anatomy photograph", "jejunum ileum gross anatomy"] },
  { name: "Caecum and Appendix",
    queries: ["cecum appendix specimen anatomy photograph", "caecum gross anatomy specimen"] },
  { name: "Colon",
    queries: ["colon specimen anatomy photograph", "large intestine gross anatomy"] },
  { name: "Gallbladder",
    queries: ["gallbladder specimen anatomy photograph", "gallbladder gross anatomy"] },
  { name: "Pancreas",
    queries: ["pancreas specimen anatomy photograph", "pancreas gross anatomy specimen"] },
  { name: "Urinary Bladder",
    queries: ["urinary bladder specimen anatomy photograph", "bladder gross anatomy"] },
  { name: "Uterus",
    queries: ["uterus specimen anatomy photograph", "uterus gross anatomy specimen"] },
  { name: "Ovary and Uterine Tube",
    queries: ["ovary fallopian tube specimen anatomy", "uterine tube gross anatomy specimen"] },
  { name: "Testis and Epididymis",
    queries: ["testis epididymis specimen anatomy photograph", "testis gross anatomy specimen"] },
  { name: "Prostate Gland",
    queries: ["prostate gland specimen anatomy photograph", "prostate gross anatomy"] },
];

const results = {};
for (const { name, queries } of organs) {
  process.stdout.write(`[${name}] searching...`);
  const urls = await findOrganImages(name, queries);
  results[name] = urls;
  console.log(` ${urls.length} URLs found`);
  await sleep(800);
}

await fs.writeFile("/tmp/visceral_urls.json", JSON.stringify(results, null, 2));
console.log(`\nSaved /tmp/visceral_urls.json`);
console.log(`Total URLs: ${Object.values(results).flat().length}`);
console.log(`Organs with candidates: ${Object.values(results).filter(v => v.length > 0).length}/${organs.length}`);
