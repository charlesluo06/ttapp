import { useState } from "react";
import { Link, Outlet } from "react-router";
import { useAuth } from "../auth/auth.ts";
import { canManageMembers } from "../members/access.ts";

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

  const showAdmin =
    auth.status === "signedIn" && canManageMembers(auth.me.roles);

  return (
    <>
      <header className="flex flex-wrap items-center gap-4 bg-maroon-700 px-4 py-3 text-gold-300">
        <Link to="/" className="font-bold text-gold-300">
          Theta Tau Hub
        </Link>
        {showAdmin && (
          <Link to="/admin/members" className="hover:text-white">
            Admin
          </Link>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="ml-auto rounded border border-gold-400 px-3 py-1 text-sm hover:bg-maroon-500 disabled:opacity-60"
        >
          Sign out
        </button>
        {failed && (
          <p role="alert" className="basis-full text-sm">
            Couldn't sign out. Try again.
          </p>
        )}
      </header>
      <Outlet />
    </>
  );
}
