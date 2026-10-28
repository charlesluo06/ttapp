import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import type { Response } from "express";
import { db } from "./db/client.ts";
import { members, sessions } from "./db/schema.ts";

export const SESSION_COOKIE = "session";
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

// Only the hash is stored, so reading the sessions table can't be used to sign in.
// SHA-256 is enough here: the token is long and random, unlike a password.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newExpiry(): Date {
  return new Date(Date.now() + SESSION_LIFETIME_MS);
}

// Makes a session for a member who just signed in. The returned token goes in the cookie.
export async function createSession(memberId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = newExpiry();
  await db
    .insert(sessions)
    .values({ tokenHash: hashToken(token), memberId, expiresAt });
  return { token, expiresAt };
}

// Finds the active member behind a token, or undefined if the token is unknown, expired,
// or belongs to a removed member. A valid session is extended on every request (sliding).
export async function findSession(token: string) {
  const tokenHash = hashToken(token);
  const [row] = await db
    .select({ member: members })
    .from(sessions)
    .innerJoin(members, eq(sessions.memberId, members.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, new Date()),
        isNull(members.removedAt),
      ),
    );
  if (!row) return undefined;

  const expiresAt = newExpiry();
  await db
    .update(sessions)
    .set({ expiresAt })
    .where(eq(sessions.tokenHash, tokenHash));
  return { member: row.member, expiresAt };
}

// Logout: ends one session.
export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

// Cutting someone off: ends every session a member has, on every device.
export async function deleteSessionsForMember(memberId: string) {
  await db.delete(sessions).where(eq(sessions.memberId, memberId));
}

// Housekeeping: removes sessions that have already expired and returns how many it removed.
// Expired rows can't be used to sign in anyway (findSession ignores them), so this only
// keeps the table from growing.
export async function deleteExpiredSessions(): Promise<number> {
  const removed = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date()))
    .returning({ id: sessions.id });
  return removed.length;
}

// Sets (or refreshes) the session cookie. Its lifetime matches the session's expiry.
export function setSessionCookie(
  res: Response,
  token: string,
  expiresAt: Date,
) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // localhost is plain http
    expires: expiresAt,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}
