import { db } from "@workspace/db";
import { anatomyVivaImagesTable, type AnatomyVivaImage } from "@workspace/db";
import { eq, asc, sql } from "drizzle-orm";

// The 5 image-based Anatomy viva stations. Kept here (rather than only in
// practicalHub.ts) so both the admin extraction/gallery routes and the viva
// session routes share a single source of truth for valid category names.
export const ANATOMY_IMAGE_CATEGORIES = [
  "Histology",
  "Bone",
  "Visceral",
  "Section Anatomy",
  "Prosection",
] as const;
export type AnatomyImageCategory = (typeof ANATOMY_IMAGE_CATEGORIES)[number];

export function isAnatomyImageCategory(value: unknown): value is AnatomyImageCategory {
  return typeof value === "string" && (ANATOMY_IMAGE_CATEGORIES as readonly string[]).includes(value);
}

// Picks the least-recently-shown image in a category (rows never shown yet —
// lastShownAt is null — are treated as oldest) and stamps it as shown now, so
// repeated vivas cycle through the whole bank instead of always surfacing the
// same handful of images.
export async function selectAnatomyImageForCategory(category: AnatomyImageCategory): Promise<AnatomyVivaImage | null> {
  const [row] = await db
    .select()
    .from(anatomyVivaImagesTable)
    .where(eq(anatomyVivaImagesTable.category, category))
    .orderBy(sql`${anatomyVivaImagesTable.lastShownAt} asc nulls first`, asc(anatomyVivaImagesTable.id))
    .limit(1);
  if (!row) return null;
  await db
    .update(anatomyVivaImagesTable)
    .set({ lastShownAt: new Date() })
    .where(eq(anatomyVivaImagesTable.id, row.id));
  return row;
}

export async function getAnatomyImageById(id: number): Promise<AnatomyVivaImage | null> {
  const [row] = await db.select().from(anatomyVivaImagesTable).where(eq(anatomyVivaImagesTable.id, id));
  return row ?? null;
}

// Builds the hidden ground-truth string injected into the examiner's system
// prompt only — never shown to the student — so the AI knows exactly what the
// displayed image is and can judge the student's identification answer.
export function buildAnatomyImageGroundTruth(row: AnatomyVivaImage): string {
  const parts = [`Identity: ${row.title}`];
  if (row.side) parts.push(`Side: ${row.side}`);
  if (row.region) parts.push(`Region: ${row.region}`);
  if (row.notes) parts.push(`Notes: ${row.notes}`);
  return parts.join(" | ");
}
