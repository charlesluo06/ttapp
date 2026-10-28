import type {
  AddMemberResponse,
  MemberSummary,
  MembersResponse,
  Role,
} from "@ttapp/shared";
import { and, eq, isNotNull } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { requireLogin } from "../../common/auth.ts";
import { db } from "../../common/db/client.ts";
import { memberRoles, members, roles } from "../../common/db/schema.ts";
import { requirePermission } from "../../common/permissions.ts";
import { validateBody } from "../../common/validate.ts";

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

// The email is trimmed and lowercased first because the database only accepts that form
// (members_email_normalized), then checked for a valid address like "name@example.com".
const addMemberBody = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address")),
});

// POST /api/members: adds an email to the allowlist so that person can sign in.
// Adding someone who was removed brings them back (that is how restore works).
membersRouter.post(
  "/",
  requireLogin,
  requirePermission("members.manage"),
  validateBody(addMemberBody),
  async (req, res) => {
    const { email } = req.body as z.infer<typeof addMemberBody>;

    // Insert first and let the unique email decide, so two officers adding the same
    // address at the same moment can't both succeed.
    const [created] = await db
      .insert(members)
      .values({ email })
      .onConflictDoNothing()
      .returning();
    if (created) {
      const body: AddMemberResponse = {
        id: created.id,
        email: created.email,
        restored: false,
      };
      res.status(201).json(body);
      return;
    }

    // The email already exists. If that person was removed, bring them back.
    const [restored] = await db
      .update(members)
      .set({ removedAt: null })
      .where(and(eq(members.email, email), isNotNull(members.removedAt)))
      .returning();
    if (restored) {
      const body: AddMemberResponse = {
        id: restored.id,
        email: restored.email,
        restored: true,
      };
      res.status(200).json(body);
      return;
    }

    res.status(409).json({ error: "That person is already a member" });
  },
);
