import { OAuth2Client } from "google-auth-library";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy backend/.env.example to backend/.env and fill it in.`,
    );
  }
  return value;
}

// Built on first use, not at startup, so teammates without the Google secret can still
// run the backend for work that has nothing to do with login.
let client: OAuth2Client | undefined;

export function getGoogleClient(): OAuth2Client {
  client ??= new OAuth2Client({
    clientId: requireEnv("GOOGLE_CLIENT_ID"),
    clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri: requireEnv("GOOGLE_REDIRECT_URI"),
  });
  return client;
}
