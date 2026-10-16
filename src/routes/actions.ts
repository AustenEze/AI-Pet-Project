import { Router, type Request, type Response } from "express";
import type Database from "better-sqlite3";
import {
  loadNeeds,
  saveNeeds,
  logAction,
  lastActionTimeFor,
  ensurePetExists,
} from "../db/database.js";
import { applyDecay, applyAction, buildSnapshot } from "../pet/state.js";
import { ACTION_CONFIGS, ACTION_NAMES, type ActionName } from "../pet/actions.js";
import { lastActionTime } from "../db/database.js";

export function actionsRouter(db: Database.Database): Router {
  const router = Router();

  /** POST /api/actions/:action — perform a care action */
  router.post("/:action", (req: Request, res: Response) => {
    const actionName = req.params.action as ActionName;

    if (!ACTION_NAMES.includes(actionName)) {
      res.status(400).json({
        error: `Unknown action "${req.params.action}". Valid actions: ${ACTION_NAMES.join(", ")}`,
      });
      return;
    }

    const now = Date.now();
    ensurePetExists(db, now);

    const cfg = ACTION_CONFIGS[actionName];
    const lastUse = lastActionTimeFor(db, actionName);
    if (lastUse !== null) {
      const elapsed = (now - lastUse) / 1000;
      if (elapsed < cfg.cooldownSeconds) {
        const remaining = Math.ceil(cfg.cooldownSeconds - elapsed);
        res.status(429).json({
          error: `Action "${actionName}" is on cooldown. Try again in ${remaining}s.`,
          cooldownRemaining: remaining,
        });
        return;
      }
    }

    const raw = loadNeeds(db);
    const decayed = applyDecay(raw, now);
    const { needs: updated, message } = applyAction(decayed, actionName, now);

    saveNeeds(db, updated);
    logAction(db, actionName, now);

    const snapshot = buildSnapshot(updated, lastActionTime(db));
    res.json({ message, ...snapshot });
  });

  /** GET /api/actions — list available actions and their effects */
  router.get("/", (_req: Request, res: Response) => {
    res.json(ACTION_CONFIGS);
  });

  return router;
}
