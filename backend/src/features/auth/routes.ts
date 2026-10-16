import { randomBytes } from "node:crypto";
import { Router } from "express";
import { getGoogleClient, redeemCode } from "./google.ts";
import { findActiveMemberByEmail, recordFirstLogin } from "./members.ts";

// The state cookie only needs to live long enough to go to Google and come back.
export const STATE_COOKIE = "oauth_state";
const STATE_COOKIE_PATH = "/api/auth";
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

export const authRouter = Router();

// GET /api/auth/google: start sign-in. Remembers a random `state` in a short-lived cookie,
// then sends the browser to Google. The callback checks the cookie against what comes back.
authRouter.get("/google", (_req, res) => {
  // Built first so a missing setting fails before any cookie is set.
  const googleClient = getGoogleClient();

  const state = randomBytes(32).toString("base64url");
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax", // Lax: the browser still sends it when Google redirects back
    secure: process.env.NODE_ENV === "production", // localhost is plain http
    maxAge: STATE_MAX_AGE_MS,
    path: STATE_COOKIE_PATH,
  });

  const url = googleClient.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account", // always show the account picker
  });
  res.redirect(url);
});

// GET /api/auth/google/callback: Google sends the browser back here after sign-in.
// Confirms this browser started the login, redeems the code, and checks the member list.
// Creating the session comes next.
authRouter.get("/google/callback", async (req, res) => {
  const savedState = req.cookies[STATE_COOKIE];
  // One use only: the cookie is deleted whether or not the check passes.
  res.clearCookie(STATE_COOKIE, { path: STATE_COOKIE_PATH });

  const { state, code, error } = req.query;
  if (error) {
    // For example the member pressed Cancel on Google's page.
    res.status(400).send("Sign-in was cancelled.");
    return;
  }
  if (typeof state !== "string" || !savedState || state !== savedState) {
    res.status(400).send("Sign-in failed. Please try again.");
    return;
  }
  if (typeof code !== "string") {
    res.status(400).send("Sign-in failed. Please try again.");
    return;
  }

  let identity;
  try {
    identity = await redeemCode(code);
  } catch (err) {
    // Message only: the full error object can carry the request, including the client secret.
    console.error(
      "Google sign-in failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    res.status(400).send("Sign-in failed. Please try again.");
    return;
  }

  const member = await findActiveMemberByEmail(identity.email);
  if (!member) {
    // Same answer for "never added" and "removed", so it doesn't reveal which.
    res
      .status(403)
      .send("This email isn't on the member list. Ask an officer to add you.");
    return;
  }
  if (!member.firstLoginAt) {
    await recordFirstLogin(member.id, identity.name);
  }

  // Temporary: proves sign-in works end to end. Replaced when the session is created.
  res.send(`Signed in as ${member.email}. The session comes next.`);
});
