import type { DriveLinksResponse } from "@ttapp/shared";
import { sql } from "drizzle-orm";
import { Router } from "express";
import { requireLogin } from "../../common/auth.ts";
import { db } from "../../common/db/client.ts";
import { driveLinks } from "../../common/db/schema.ts";
import { requirePermission } from "../../common/permissions.ts";

export const driveLinksRouter = Router();

// GET /api/drive-links: the chapter's shared links, A to Z by label (capitals don't matter).
// Every member can read them; officers add and remove them.
driveLinksRouter.get(
  "/",
  requireLogin,
  requirePermission("driveLinks.view"),
  async (_req, res) => {
    const rows = await db
      .select({
        id: driveLinks.id,
        label: driveLinks.label,
        url: driveLinks.url,
      })
      .from(driveLinks)
      .orderBy(sql`lower(${driveLinks.label})`, driveLinks.createdAt);

    const body: DriveLinksResponse = { links: rows };
    res.json(body);
  },
);
