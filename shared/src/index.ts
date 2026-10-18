// Types shared by the frontend and backend.
// Change a type here and both sides show errors wherever it no longer fits.

/** The four roles. Every active member is a "member"; the rest are granted by an admin. */
export type Role = "member" | "officer" | "president" | "admin";

/** Response from GET /api/auth/me: who is signed in and what roles they hold. */
export type MeResponse = {
  name: string | null; // filled in from Google at first sign-in, if Google sent one
  email: string;
  roles: Role[];
};

/** Response from GET /api/health, used to check the backend is running. */
export type HealthResponse = {
  status: "ok";
  time: string; // ISO timestamp, e.g. "2026-10-13T18:30:00.000Z"
};
