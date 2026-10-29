import type { MeResponse, MemberSummary, Role } from "@ttapp/shared";

// Who may open the members screen. This mirrors the backend (members.manage in
// backend/src/common/permissions.ts: officers, and admins who inherit it). It only decides
// what to show; the backend is what actually refuses everyone else.
export function canManageMembers(roles: Role[]): boolean {
  return roles.includes("officer") || roles.includes("admin");
}

// Mirrors the removal rules in DELETE /api/members/:id: nobody removes themselves, officers
// remove plain members only, and removing an officer, president or admin takes an admin.
// It only decides whether to show the Remove button; the backend enforces the rules.
export function canRemoveMember(
  viewer: MeResponse,
  target: MemberSummary,
): boolean {
  if (target.email === viewer.email) return false;
  const holdsRole = target.roles.some((role) => role !== "member");
  return holdsRole
    ? viewer.roles.includes("admin")
    : canManageMembers(viewer.roles);
}
