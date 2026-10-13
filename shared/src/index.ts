// Types shared by the frontend and backend.
// Change a type here and both sides show errors wherever it no longer fits.

/** Response from GET /api/health, used to check the backend is running. */
export type HealthResponse = {
  status: "ok";
  time: string; // ISO timestamp, e.g. "2026-10-13T18:30:00.000Z"
};
