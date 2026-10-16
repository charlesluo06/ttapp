import { randomBytes } from "node:crypto";
import { Router } from "express";
import { getGoogleClient } from "./google.ts";

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
// Step 1 of 2: confirm this browser started the login. Redeeming the code comes next.
authRouter.get("/google/callback", (req, res) => {
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

  // Temporary: proves the state check works. Replaced when the code is redeemed.
  res.send("State OK. Code received.");
});
