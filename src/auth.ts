import type { Request, Response, NextFunction } from "express";
import { config } from "./config.js";

/**
 * Simple bearer-token auth middleware.
 *
 * The owner sets OWNER_PASSWORD in the environment. Clients pass it as:
 *   Authorization: Bearer <password>
 *
 * This is intentionally minimal — one user, one password — matching the
 * "simple personal login" suggestion in the spec. A later phase can swap
 * in session tokens or OAuth without changing the rest of the app.
 */
export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  const expected = config.ownerPassword;
  if (!expected) {
    res.status(500).json({ error: "OWNER_PASSWORD is not configured on the server" });
    return;
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Authorization header (Bearer <password>)" });
    return;
  }

  const token = header.slice("Bearer ".length);
  if (token !== expected) {
    res.status(403).json({ error: "Invalid password" });
    return;
  }

  next();
}
