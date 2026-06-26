import { db } from "@workspace/db";
import { xpTransactionsTable, rankUnlocksTable, usersTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

export const XP_RANKS = [
  { level: 1, name: "Novice Scholar", min: 0 },
  { level: 2, name: "Foundation Learner", min: 500 },
  { level: 3, name: "Clinical Aspirant", min: 1500 },
  { level: 4, name: "Distinction Achiever", min: 3500 },
  { level: 5, name: "Mission Master", min: 7000 },
  { level: 6, name: "Legend of Distinction", min: 15000 },
];

export const XP_VALUES = {
  QUIZ_COMPLETE: 50,
  CORRECT_ANSWER: 5,
  DAILY_LOGIN: 30,
  STREAK_BONUS_PER_DAY: 3,
  STREAK_BONUS_MAX: 30,
  NOTE_READ: 15,
  PDF_DOWNLOAD: 10,
  DOUBT_ASKED: 20,
  STOPWATCH_SESSION: 10,
  ALARM_USED: 5,
  // Feature usage (5-10 XP)
  BOOK_READ: 10,
  BOOKMARK_ADDED: 5,
  FLASHCARD_SESSION: 5,
  // Student interactions (5-10 XP)
  COMMUNITY_POST: 8,
  COMMUNITY_MESSAGE: 5,
  DOUBT_ANSWERED: 8,
  CONFESSION_POSTED: 5,
  STUDY_ROOM_JOINED: 5,
  MNEMONIC_UPVOTED: 5,
} as const;

export function getRankForXp(xp: number) {
  let rank = XP_RANKS[0];
  for (const r of XP_RANKS) {
    if (xp >= r.min) rank = r;
    else break;
  }
  return rank;
}

export function getNextRank(xp: number) {
  return XP_RANKS.find(r => r.min > xp) ?? null;
}

export async function awardXp(
  userId: number,
  amount: number,
  type: string,
  description: string
): Promise<{ rankUp: boolean; newRankName: string; newXp: number }> {
  try {
    await db.insert(xpTransactionsTable).values({ userId, amount, type, description });

    const [updated] = await db
      .update(usersTable)
      .set({ totalXp: sql`COALESCE(total_xp, 0) + ${amount}` })
      .where(eq(usersTable.id, userId))
      .returning({ totalXp: usersTable.totalXp, currentRank: usersTable.currentRank });

    const newXp = updated?.totalXp ?? 0;
    const oldRankLevel = updated?.currentRank ?? 1;
    const newRank = getRankForXp(newXp);

    if (newRank.level > oldRankLevel) {
      await db
        .update(usersTable)
        .set({ currentRank: newRank.level })
        .where(eq(usersTable.id, userId));

      await db.insert(rankUnlocksTable).values({
        userId,
        rankName: newRank.name,
        level: newRank.level,
        xpAtUnlock: newXp,
      }).onConflictDoNothing();

      return { rankUp: true, newRankName: newRank.name, newXp };
    }

    return { rankUp: false, newRankName: newRank.name, newXp };
  } catch (err) {
    console.error("[xp] awardXp error:", err);
    // Return neutral failure — caller should not treat this as a rank/XP state
    return { rankUp: false, newRankName: "", newXp: -1 };
  }
}
