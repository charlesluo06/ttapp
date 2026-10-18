import type { Role } from "@ttapp/shared";
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db } from "./db/client.ts";
import { memberRoles, members, roles } from "./db/schema.ts";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  findSession,
  setSessionCookie,
} from "./sessions.ts";

export type AuthContext = {
  member: typeof members.$inferSelect;
  roles: Role[];
};

// After requireLogin, a route can read who is asking from req.auth.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

// Every active member is a "member". Officer, president and admin come from member_roles.
async function loadRoles(memberId: string): Promise<Role[]> {
  const rows = await db
    .select({ name: roles.name })
    .from(memberRoles)
    .innerJoin(roles, eq(memberRoles.roleId, roles.id))
    .where(eq(memberRoles.memberId, memberId));
  // The role names are the four seeded ones, so the cast is safe.
  const granted = rows.map((row) => row.name as Role);
  return ["member", ...granted.filter((role) => role !== "member")];
}

function rejectNotSignedIn(res: Response) {
  clearSessionCookie(res); // drop a stale cookie so the browser stops sending it
  res.status(401).json({ error: "Not signed in" });
}

// Put this in front of any route that needs a signed-in member. It finds the session from
// the cookie, extends it, loads the member's roles, and passes them on as req.auth.
export async function requireLogin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token: unknown = req.cookies[SESSION_COOKIE];
  if (typeof token !== "string") {
    rejectNotSignedIn(res);
    return;
  }

  const session = await findSession(token);
  if (!session) {
    rejectNotSignedIn(res);
    return;
  }

  // findSession pushed the expiry out, so the cookie's lifetime has to follow.
  setSessionCookie(res, token, session.expiresAt);
  req.auth = {
    member: session.member,
    roles: await loadRoles(session.member.id),
  };
  next();
}
