import { createHash, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { db } from "../../common/db/client.ts";
import { jobRuns } from "../../common/db/schema.ts";
import { jobs } from "./jobs.ts";

export const jobsRouter = Router();

// Hashing both sides gives them the same length, which timingSafeEqual requires.
function sha256(text: string) {
  return createHash("sha256").update(text).digest();
}

// Only the scheduler knows CRON_SECRET. It sends it as "Authorization: Bearer <secret>".
// With no secret configured the endpoint stays closed instead of open.
function requireCronSecret(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Jobs are not configured" });
    return;
  }
  const sent = req.get("authorization") ?? "";
  if (!timingSafeEqual(sha256(sent), sha256(`Bearer ${secret}`))) {
    res.status(401).json({ error: "Not allowed" });
    return;
  }
  next();
}

// Remembers when a job last finished, so a missed run is visible and can catch up.
async function recordRun(jobName: string) {
  const now = new Date();
  await db
    .insert(jobRuns)
    .values({ jobName, lastRunAt: now })
    .onConflictDoUpdate({ target: jobRuns.jobName, set: { lastRunAt: now } });
}

type JobResult = { status: "ok"; result: unknown } | { status: "failed" };

// POST /api/jobs/run: runs every job in jobs.ts, one after another. A failing job doesn't
// stop the others. Answers 500 if any job failed, so the scheduler's run shows as failed.
jobsRouter.post("/run", requireCronSecret, async (_req, res) => {
  const results: Record<string, JobResult> = {};

  for (const [name, job] of Object.entries(jobs)) {
    try {
      const result = await job();
      await recordRun(name);
      results[name] = { status: "ok", result };
    } catch (err) {
      // Message only, like the sign-in errors: the full error can carry connection details.
      console.error(
        `Job ${name} failed:`,
        err instanceof Error ? err.message : "unknown error",
      );
      results[name] = { status: "failed" };
    }
  }

  const allOk = Object.values(results).every((r) => r.status === "ok");
  res.status(allOk ? 200 : 500).json({ results });
});
