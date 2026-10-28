import type { MemberSummary, MembersResponse, Role } from "@ttapp/shared";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { requireLogin } from "../../common/auth.ts";
import { db } from "../../common/db/client.ts";
import { memberRoles, members, roles } from "../../common/db/schema.ts";
import { requirePermission } from "../../common/permissions.ts";

export const membersRouter = Router();

// GET /api/members: everyone ever added, active and removed, with their roles.
// Removed members are included (removedAt is set) so the page can show and restore them.
membersRouter.get(
  "/",
  requireLogin,
  requirePermission("members.manage"),
  async (_req, res) => {
    // Two small queries instead of one join, so a member with no roles still gets a row.
    const [memberRows, roleRows] = await Promise.all([
      db.select().from(members).orderBy(members.email),
      db
        .select({ memberId: memberRoles.memberId, name: roles.name })
        .from(memberRoles)
        .innerJoin(roles, eq(memberRoles.roleId, roles.id)),
    ]);

    // member_id -> the roles granted to that person (officer, president, admin).
    const grantedByMember = new Map<string, Role[]>();
    for (const row of roleRows) {
      if (row.name === "member") continue; // "member" is implicit, not stored per person
      const granted = grantedByMember.get(row.memberId) ?? [];
      granted.push(row.name as Role);
      grantedByMember.set(row.memberId, granted);
    }

    const body: MembersResponse = {
      members: memberRows.map((member): MemberSummary => {
        const granted = grantedByMember.get(member.id) ?? [];
        return {
          id: member.id,
          email: member.email,
          name: member.name,
          roles: member.removedAt ? granted : ["member", ...granted],
          removedAt: member.removedAt?.toISOString() ?? null,
        };
      }),
    };
    res.json(body);
  },
);
