import { useAuth } from "../auth/auth.ts";
import { canManageMembers } from "../members/access.ts";
import { useMembers } from "../members/useMembers.ts";

// The list is its own component so the request only goes out for people allowed to see it.
function MemberList() {
  const state = useMembers();

  if (state.status === "loading") return <p>Loading members…</p>;
  if (state.status === "error") return <p role="alert">{state.message}</p>;

  const active = state.members.filter((member) => !member.removedAt);
  if (active.length === 0) return <p>No members yet.</p>;

  return (
    <ul className="divide-y divide-line rounded-lg border border-line bg-white">
      {active.map((member) => {
        const granted = member.roles.filter((role) => role !== "member");
        return (
          <li
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
          >
            <div>
              <p className="font-medium text-ink">
                {member.name ?? member.email}
              </p>
              <p className="text-sm text-ink/60">
                {member.name ? member.email : "Hasn't signed in yet"}
              </p>
            </div>
            <ul className="flex gap-2">
              {granted.map((role) => (
                <li
                  key={role}
                  className="rounded-full bg-gold-tint px-2.5 py-0.5 text-xs font-medium text-maroon-500 ring-1 ring-gold-400"
                >
                  {role}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

// /admin/members: the chapter's member list. Officers and admins only.
export default function MembersPage() {
  const auth = useAuth();
  const allowed = auth.status === "signedIn" && canManageMembers(auth.me.roles);

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-maroon-500">Members</h1>
      {allowed ? <MemberList /> : <p>You don't have access to this page.</p>}
    </main>
  );
}
