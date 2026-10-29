import type { Role } from "@ttapp/shared";

// Who may open the members screen. This mirrors the backend (members.manage in
// backend/src/common/permissions.ts: officers, and admins who inherit it). It only decides
// what to show; the backend is what actually refuses everyone else.
export function canManageMembers(roles: Role[]): boolean {
  return roles.includes("officer") || roles.includes("admin");
}
