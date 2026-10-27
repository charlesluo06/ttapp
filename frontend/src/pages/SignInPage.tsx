import type { SignInError } from "@ttapp/shared";
import { useSearchParams } from "react-router";

// One message per code the backend callback can send in /sign-in?error=<code>.
const errorMessages: Record<SignInError, string> = {
  cancelled: "Sign-in was cancelled.",
  failed: "Sign-in failed. Please try again.",
  not_member: "This email isn't on the member list. Ask an officer to add you.",
  server_error: "Something went wrong on our side. Try again in a few minutes.",
};

function isSignInError(code: string): code is SignInError {
  return Object.hasOwn(errorMessages, code);
}

// Shown when nobody is signed in. The button is a normal link, not fetch, because the
// browser has to leave the app, go to Google, and come back through the backend callback.
export default function SignInPage() {
  const [params] = useSearchParams();
  const code = params.get("error");
  // An unknown code (for example a hand-edited address) gets the generic failure message.
  const message =
    code === null
      ? null
      : isSignInError(code)
        ? errorMessages[code]
        : errorMessages.failed;

  return (
    <main>
      <h1>Chapter Ops</h1>
      {message && <p role="alert">{message}</p>}
      <p>Sign in with the Google account your chapter has on file.</p>
      <a href="/api/auth/google">Sign in with Google</a>
    </main>
  );
}
