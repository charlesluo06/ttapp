import type { MeResponse } from "@ttapp/shared";
import { createContext, useContext } from "react";

// What the app knows about who is using it. "error" means the backend could not be reached
// or failed, which is different from "signedOut" (the backend answered: nobody is signed in).
export type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; me: MeResponse }
  | { status: "error" };

// What a screen gets from useAuth(): the state, plus signOut(). signOut returns true when
// the backend ended the session, and false if the request failed (still signed in).
export type Auth = AuthState & { signOut: () => Promise<boolean> };

export const AuthContext = createContext<Auth>({
  status: "loading",
  signOut: () => Promise.resolve(false),
});

// Any screen calls this to read the auth state.
export function useAuth(): Auth {
  return useContext(AuthContext);
}
