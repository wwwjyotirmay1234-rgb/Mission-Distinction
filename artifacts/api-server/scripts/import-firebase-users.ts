import "dotenv/config";
import { getFirebaseAuth } from "../src/lib/firebase-admin";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function run() {
  const auth = getFirebaseAuth();

  let nextPageToken: string | undefined;
  let imported = 0;
  let skipped = 0;

  do {
    const page = await auth.listUsers(1000, nextPageToken);

    for (const fbUser of page.users) {
      const email = fbUser.email?.trim().toLowerCase();
      if (!email) continue;

      const existing = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      await db.insert(usersTable).values({
        fullName: fbUser.displayName || email.split("@")[0],
        email,
        mobileNumber: fbUser.phoneNumber || null,
        passwordHash: "",
        role: "student",
        year: null,
        sessionYear: null,
        college: null,
        studyStreak: 0,
        emailVerified: fbUser.emailVerified ?? true,
      });

      imported++;
      console.log(`Imported: ${email}`);
    }

    nextPageToken = page.pageToken;
  } while (nextPageToken);

  console.log(`\\nDone! Imported ${imported}, skipped ${skipped}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});