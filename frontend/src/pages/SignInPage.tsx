// Shown when nobody is signed in. The button is a normal link, not fetch, because the
// browser has to leave the app, go to Google, and come back through the backend callback.
export default function SignInPage() {
  return (
    <main>
      <h1>Chapter Ops</h1>
      <p>Sign in with the Google account your chapter has on file.</p>
      <a href="/api/auth/google">Sign in with Google</a>
    </main>
  );
}
