import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../common/db/client.ts";
import { members } from "../../common/db/schema.ts";

// A removed member counts as not on the list. `email` must already be normalized.
export async function findActiveMemberByEmail(email: string) {
  const [member] = await db
    .select()
    .from(members)
    .where(and(eq(members.email, email), isNull(members.removedAt)));
  return member;
}

// The name and first-login time stay empty until someone signs in for the first time.
export async function recordFirstLogin(
  memberId: string,
  name: string | undefined,
) {
  await db
    .update(members)
    .set({ name: name ?? null, firstLoginAt: new Date() })
    .where(and(eq(members.id, memberId), isNull(members.firstLoginAt)));
}
