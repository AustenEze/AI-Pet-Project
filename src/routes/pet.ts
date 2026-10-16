import { Router, type Request, type Response } from "express";
import type Database from "better-sqlite3";
import { loadNeeds, saveNeeds, lastActionTime, ensurePetExists } from "../db/database.js";
import { applyDecay, buildSnapshot } from "../pet/state.js";
import { personality } from "../pet/personality.js";

export function petRouter(db: Database.Database): Router {
  const router = Router();

  /** GET /api/pet — current pet state with decay applied */
  router.get("/", (_req: Request, res: Response) => {
    const now = Date.now();
    ensurePetExists(db, now);

    const raw = loadNeeds(db);
    const decayed = applyDecay(raw, now);
    saveNeeds(db, decayed);

    const snapshot = buildSnapshot(decayed, lastActionTime(db));
    res.json(snapshot);
  });

  /** GET /api/pet/personality — Pip's character sheet (public, no auth) */
  router.get("/personality", (_req: Request, res: Response) => {
    res.json(personality);
  });

  return router;
}
