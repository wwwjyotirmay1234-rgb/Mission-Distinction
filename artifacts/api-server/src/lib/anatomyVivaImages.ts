import { db } from "@workspace/db";
import { anatomyVivaImagesTable, vivaHistoryTable, type AnatomyVivaImage } from "@workspace/db";
import { eq, asc, sql, and } from "drizzle-orm";

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

// Picks the least-recently-shown image in a category.
// If userId is provided, images the student has scored low on (avg < 60) are
// weighted to the front so weak areas get more practice.
// If regionFilter is provided, only images whose region matches one of the
// filter values (case-insensitive) are considered.
export async function selectAnatomyImageForCategory(
  category: AnatomyImageCategory,
  options?: { userId?: number; regionFilter?: string[] },
): Promise<AnatomyVivaImage | null> {
  const { userId, regionFilter } = options ?? {};

  // Build the WHERE clause
  const regionCondition =
    regionFilter && regionFilter.length > 0
      ? sql`AND lower(${anatomyVivaImagesTable.region}) = ANY(ARRAY[${sql.join(
          regionFilter.map((r) => sql`lower(${r})`),
          sql`, `,
        )}])`
      : sql``;

  if (userId) {
    // Use raw SQL to join with viva_history and weight weak images to the front.
    // Images with no history default to avg_score = 50 (neutral priority).
    const rows = await db.execute(sql`
      SELECT avi.*,
             COALESCE(AVG(vh.score)::int, 50) AS avg_score
        FROM anatomy_viva_images avi
        LEFT JOIN viva_history vh
               ON vh.image_id = avi.id
              AND vh.user_id = ${userId}
       WHERE avi.category = ${category}
             ${regionCondition}
       GROUP BY avi.id
       ORDER BY
         COALESCE(AVG(vh.score)::int, 50) ASC,
         avi.last_shown_at ASC NULLS FIRST,
         avi.id ASC
       LIMIT 1
    `);
    const row = (rows as any[])[0] as AnatomyVivaImage | undefined;
    if (!row) return null;
    await db
      .update(anatomyVivaImagesTable)
      .set({ lastShownAt: new Date() })
      .where(eq(anatomyVivaImagesTable.id, row.id));
    return row;
  }

  // No userId — simple round-robin with optional region filter
  const conditions = [eq(anatomyVivaImagesTable.category, category)];
  if (regionFilter && regionFilter.length > 0) {
    const lower = regionFilter.map((r) => r.toLowerCase());
    conditions.push(sql`lower(${anatomyVivaImagesTable.region}) = ANY(${lower})`);
  }

  const [row] = await db
    .select()
    .from(anatomyVivaImagesTable)
    .where(and(...conditions))
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

export function buildAnatomyImageGroundTruth(row: AnatomyVivaImage): string {
  const parts = [`Identity: ${row.title}`];
  if (row.side) parts.push(`Side: ${row.side}`);
  if (row.region) parts.push(`Region: ${row.region}`);
  if (row.notes) parts.push(`Notes: ${row.notes}`);
  return parts.join(" | ");
}

// Returns public-safe metadata (no GCS path) for the labeled-reveal feature.
export function getAnatomyImagePublicMeta(row: AnatomyVivaImage) {
  return {
    id: row.id,
    title: row.title,
    side: row.side,
    region: row.region,
    notes: row.notes,
    category: row.category,
  };
}
