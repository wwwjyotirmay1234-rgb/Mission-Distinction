import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

function istDateString(offsetDays = 0): string {
  const d = new Date(Date.now() + IST_OFFSET_MS + offsetDays * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD" in IST
}

/**
 * Updates the study streak for a user and returns the new streak value.
 * Safe to call on any authenticated action (reading notes, viewing dashboard, etc.)
 * Returns the current streak (whether or not it was updated today).
 */
export async function updateStreak(userId: number): Promise<number> {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return 0;

    const today = istDateString(0);
    const yesterday = istDateString(-1);
    const last = user.lastStreakDate as string | null;

    // Already updated today — return current streak without touching DB
    if (last === today) return user.studyStreak ?? 0;

    let newStreak: number;
    if (!last || last < yesterday) {
      newStreak = 1; // streak broken or first time
    } else {
      newStreak = (user.studyStreak ?? 0) + 1; // last was yesterday — extend streak
    }

    await db
      .update(usersTable)
      .set({ studyStreak: newStreak, lastStreakDate: today })
      .where(eq(usersTable.id, userId));

    return newStreak;
  } catch (err) {
    console.error("[streak] update error:", err);
    return 0;
  }
}
