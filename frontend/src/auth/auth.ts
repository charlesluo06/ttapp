import type { MeResponse } from "@ttapp/shared";
import { createContext, useContext } from "react";

// What the app knows about who is using it. "error" means the backend could not be reached
// or failed, which is different from "signedOut" (the backend answered: nobody is signed in).
export type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; me: MeResponse }
  | { status: "error" };

export const AuthContext = createContext<AuthState>({ status: "loading" });

// Any screen calls this to read the auth state.
export function useAuth(): AuthState {
  return useContext(AuthContext);
}
