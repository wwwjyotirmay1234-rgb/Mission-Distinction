import { and, eq, isNull, or, type SQL } from "drizzle-orm";

// The batch that was active before cohort isolation was introduced. Rows
// created before this feature shipped have no cohort recorded (NULL) — they
// are treated as belonging to this legacy cohort so the existing 1st Year
// batch keeps seeing all of its historical community/doubt/study-room data.
export const LEGACY_COHORT_YEAR = "1st Year";
export const LEGACY_COHORT_SESSION_YEAR = "2025-26";

export interface CohortUser {
  year?: string | null;
  sessionYear?: string | null;
}

export function userCohort(user: CohortUser) {
  return { cohortYear: user.year ?? null, cohortSessionYear: user.sessionYear ?? null };
}

/**
 * Builds a where-clause that scopes rows to the requesting user's own
 * (year, sessionYear) cohort — their isolated "room" — while still letting
 * pre-existing rows (created before cohort columns existed, so NULL) show up
 * for the legacy default cohort only. This keeps the current 1st Year /
 * 2025-26 batch's history intact while giving new batches (e.g. 2026-27) a
 * clean, separate space.
 */
export function cohortWhere<T extends { cohortYear: any; cohortSessionYear: any }>(
  table: T,
  user: CohortUser
): SQL | undefined {
  if (!user.year || !user.sessionYear) return undefined;

  const conditions = [and(eq(table.cohortYear, user.year), eq(table.cohortSessionYear, user.sessionYear))];

  if (user.year === LEGACY_COHORT_YEAR && user.sessionYear === LEGACY_COHORT_SESSION_YEAR) {
    conditions.push(isNull(table.cohortYear));
  }

  return or(...conditions);
}
