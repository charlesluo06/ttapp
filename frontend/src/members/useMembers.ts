import type { MemberSummary, MembersResponse } from "@ttapp/shared";
import { useCallback, useEffect, useState } from "react";

export type MembersState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; members: MemberSummary[] };

// Loads the member list when the screen opens, and again whenever reload() is called (after
// adding or removing someone). The old list stays on screen until the new one arrives.
// Includes removed members; the screen decides which to show.
export function useMembers(): { state: MembersState; reload: () => void } {
  const [state, setState] = useState<MembersState>({ status: "loading" });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let next: MembersState;
      try {
        const res = await fetch("/api/members");
        if (res.ok) {
          const body = (await res.json()) as MembersResponse;
          next = { status: "loaded", members: body.members };
        } else if (res.status === 403) {
          next = { status: "error", message: "You don't have access to this." };
        } else {
          next = { status: "error", message: "Couldn't load the member list." };
        }
      } catch {
        next = { status: "error", message: "Can't reach the server." };
      }
      if (!cancelled) setState(next);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { state, reload };
}
