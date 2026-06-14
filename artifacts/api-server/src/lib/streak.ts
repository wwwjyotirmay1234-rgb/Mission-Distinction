import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

function todayString(): string {
  return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export async function updateStreak(userId: number): Promise<void> {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return;

    const today = todayString();
    const yesterday = yesterdayString();
    const last = (user as any).lastStreakDate as string | null;

    if (last === today) return; // already updated today

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
