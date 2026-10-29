import type { MeResponse, MemberSummary } from "@ttapp/shared";
import { useState } from "react";
import { useAuth } from "../auth/auth.ts";
import { canManageMembers, canRemoveMember } from "../members/access.ts";
import AddMemberForm from "../members/AddMemberForm.tsx";
import { addMember, removeMember } from "../members/api.ts";
import { useMembers } from "../members/useMembers.ts";
import type { MembersState } from "../members/useMembers.ts";

type ActionResult = { ok: true } | { ok: false; message: string };

const smallButton = "rounded border px-3 py-1 text-sm disabled:opacity-60";

function MemberList({
  state,
  viewer,
  onChanged,
}: {
  state: MembersState;
  viewer: MeResponse;
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (state.status === "loading") return <p>Loading members…</p>;
  if (state.status === "error") return <p role="alert">{state.message}</p>;

  const active = state.members.filter((member) => !member.removedAt);
  const removed = state.members.filter((member) => member.removedAt);

  // Runs one remove or restore. Success reloads the list; failure shows the server's message.
  async function run(
    member: MemberSummary,
    action: () => Promise<ActionResult>,
  ) {
    setBusyId(member.id);
    setError(null);
    const result = await action();
    setBusyId(null);
    if (result.ok) onChanged();
    else setError(result.message);
  }

  function handleRemove(member: MemberSummary) {
    const label = member.name ?? member.email;
    if (!window.confirm(`Remove ${label}? They'll be signed out right away.`)) {
      return;
    }
    void run(member, () => removeMember(member.id));
  }

  // Restoring is adding the same email again. The backend brings the person back.
  function handleRestore(member: MemberSummary) {
    void run(member, () => addMember(member.email));
  }

  return (
    <>
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {active.length === 0 ? (
        <p>No members yet.</p>
      ) : (
        <ul className="space-y-2">
          {active.map((member) => (
            <li key={member.id} className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-white px-4 py-3">
                <div>
                  <p className="font-medium text-ink">
                    {member.name ?? member.email}
                  </p>
                  <p className="text-sm text-ink/60">
                    {member.name ? member.email : "Hasn't signed in yet"}
                  </p>
                </div>
                <ul className="flex gap-2">
                  {member.roles.map((role) => (
                    <li
                      key={role}
                      className="rounded-full bg-gold-tint px-2.5 py-0.5 text-xs font-medium text-maroon-500 ring-1 ring-gold-400"
                    >
                      {role}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Fixed width, so the cards line up whether or not there is a button. */}
              <div className="w-20 shrink-0">
                {canRemoveMember(viewer, member) && (
                  <button
                    type="button"
                    onClick={() => handleRemove(member)}
                    disabled={busyId !== null}
                    className={`${smallButton} w-full border-line text-red-800 hover:bg-red-50`}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {removed.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer font-medium text-ink">
            Removed ({removed.length})
          </summary>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-white">
            {removed.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">
                    {member.name ?? member.email}
                  </p>
                  <p className="text-sm text-ink/60">
                    {member.name ? `${member.email} · ` : ""}
                    Removed{" "}
                    {member.removedAt &&
                      new Date(member.removedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestore(member)}
                  disabled={busyId !== null}
                  className={`${smallButton} border-maroon-500 text-maroon-500 hover:bg-gold-tint`}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

// The form and the list share one loaded list. This is its own component so the request
// only goes out for people allowed to see it.
function MembersAdmin({ viewer }: { viewer: MeResponse }) {
  const { state, reload } = useMembers();
  return (
    <>
      <AddMemberForm onChanged={reload} />
      <MemberList state={state} viewer={viewer} onChanged={reload} />
    </>
  );
}

// /admin/members: the chapter's member list. Officers and admins only.
export default function MembersPage() {
  const auth = useAuth();
  const me = auth.status === "signedIn" ? auth.me : null;

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-maroon-500">Members</h1>
      {me && canManageMembers(me.roles) ? (
        <MembersAdmin viewer={me} />
      ) : (
        <p>You don't have access to this page.</p>
      )}
    </main>
  );
}
