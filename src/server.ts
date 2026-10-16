import express from "express";
import type Database from "better-sqlite3";
import { requireOwner } from "./auth.js";
import { petRouter } from "./routes/pet.js";
import { actionsRouter } from "./routes/actions.js";

export function createApp(db: Database.Database): express.Express {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", pet: "Pip" });
  });

  // Pet state (read) — requires auth
  app.use("/api/pet", requireOwner, petRouter(db));

  // Care actions (write) — requires auth
  app.use("/api/actions", requireOwner, actionsRouter(db));

  return app;
}
