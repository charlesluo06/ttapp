import { Router } from "express";
import type { HealthResponse } from "@ttapp/shared";

// GET /api/health: cheap "I'm running" check. No database or login involved,
// so the keep-alive ping and deploy checks can call it freely.
export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const body: HealthResponse = { status: "ok", time: new Date().toISOString() };
  res.json(body);
});
