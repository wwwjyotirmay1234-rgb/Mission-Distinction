import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

function istDateString(offsetDays = 0): string {
  const d = new Date(Date.now() + IST_OFFSET_MS + offsetDays * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD" in IST
}

export async function updateStreak(userId: number): Promise<void> {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return;

    const today = istDateString(0);
    const yesterday = istDateString(-1);
    const last = (user as any).lastStreakDate as string | null;

    if (last === today) return; // already updated today (IST)

    let newStreak: number;
    if (!last || last < yesterday) {
      newStreak = 1; // streak broken or first time
    } else {
      newStreak = (user.studyStreak || 0) + 1; // last was yesterday
    }

    await db
      .update(usersTable)
      .set({ studyStreak: newStreak, lastStreakDate: today } as any)
      .where(eq(usersTable.id, userId));
  } catch (err) {
    console.error("[streak] update error:", err);
  }
}
