import { useState } from "react";
import { Outlet } from "react-router";
import { useAuth } from "../auth/auth.ts";

// The frame around every screen that needs a signed-in member: a header with the sign-out
// button, and the current screen below it.
export default function Layout() {
  const auth = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    setFailed(false);
    const ok = await auth.signOut();
    // On success the app redirects to /sign-in, so only a failure needs the button back.
    if (!ok) {
      setFailed(true);
      setSigningOut(false);
    }
  }

  return (
    <>
      <header>
        <strong>TT Ops App</strong>{" "}
        <button type="button" onClick={handleSignOut} disabled={signingOut}>
          Sign out
        </button>
        {failed && <p role="alert">Couldn't sign out. Try again.</p>}
      </header>
      <Outlet />
    </>
  );
}
