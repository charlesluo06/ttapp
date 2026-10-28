import type { MeResponse } from "@ttapp/shared";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./auth.ts";
import type { AuthState } from "./auth.ts";

// Asks the backend who is signed in once, when the app loads, and shares the answer.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      let next: AuthState;
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          next = { status: "signedOut" };
        } else if (res.ok) {
          next = { status: "signedIn", me: (await res.json()) as MeResponse };
        } else {
          next = { status: "error" };
        }
      } catch {
        next = { status: "error" };
      }
      if (!cancelled) setState(next);
    }

    void loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  // Ends the session on the backend, then forgets the member here. If the request fails the
  // session is still alive, so the state is left alone rather than claiming to be signed out.
  async function signOut(): Promise<boolean> {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) return false;
    } catch {
      return false;
    }
    setState({ status: "signedOut" });
    return true;
  }

  return <AuthContext value={{ ...state, signOut }}>{children}</AuthContext>;
}
