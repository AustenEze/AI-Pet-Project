import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { NEED_NAMES, type NeedName, type NeedState } from "../pet/needs.js";
import { initialNeeds } from "../pet/state.js";

let db: Database.Database | null = null;

export function getDb(dbPath?: string): Database.Database {
  if (db) return db;
  const resolvedPath = dbPath ?? "./data/pip.db";
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(resolvedPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Create a one-off in-memory database (useful for tests).
 */
export function createTestDb(): Database.Database {
  const mem = new Database(":memory:");
  mem.pragma("journal_mode = WAL");
  migrate(mem);
  return mem;
}

function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS pet (
      id          INTEGER PRIMARY KEY CHECK (id = 1),
      name        TEXT    NOT NULL DEFAULT 'Pip',
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS needs (
      pet_id       INTEGER NOT NULL REFERENCES pet(id),
      name         TEXT    NOT NULL,
      value        REAL    NOT NULL,
      last_updated INTEGER NOT NULL,
      PRIMARY KEY (pet_id, name)
    );

    CREATE TABLE IF NOT EXISTS action_log (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id       INTEGER NOT NULL REFERENCES pet(id),
      action       TEXT    NOT NULL,
      performed_at INTEGER NOT NULL
    );
  `);
}

/* ------------------------------------------------------------------ */
/*  Data access                                                        */
/* ------------------------------------------------------------------ */

export function ensurePetExists(database: Database.Database, now: number): void {
  const row = database.prepare("SELECT id FROM pet WHERE id = 1").get();
  if (row) return;

  const insertPet = database.prepare(
    "INSERT INTO pet (id, name, created_at) VALUES (1, 'Pip', ?)",
  );
  const insertNeed = database.prepare(
    "INSERT INTO needs (pet_id, name, value, last_updated) VALUES (1, ?, ?, ?)",
  );

  const txn = database.transaction(() => {
    insertPet.run(now);
    const needs = initialNeeds(now);
    for (const [name, state] of Object.entries(needs)) {
      insertNeed.run(name, state.value, state.lastUpdated);
    }
  });
  txn();
}

export function loadNeeds(
  database: Database.Database,
): Record<NeedName, NeedState> {
  const rows = database
    .prepare("SELECT name, value, last_updated FROM needs WHERE pet_id = 1")
    .all() as { name: string; value: number; last_updated: number }[];

  const needs = {} as Record<NeedName, NeedState>;
  for (const row of rows) {
    needs[row.name as NeedName] = {
      value: row.value,
      lastUpdated: row.last_updated,
    };
  }
  return needs;
}

export function saveNeeds(
  database: Database.Database,
  needs: Record<NeedName, NeedState>,
): void {
  const stmt = database.prepare(
    "UPDATE needs SET value = ?, last_updated = ? WHERE pet_id = 1 AND name = ?",
  );
  const txn = database.transaction(() => {
    for (const name of NEED_NAMES) {
      const s = needs[name];
      stmt.run(s.value, s.lastUpdated, name);
    }
  });
  txn();
}

export function logAction(
  database: Database.Database,
  action: string,
  performedAt: number,
): void {
  database
    .prepare(
      "INSERT INTO action_log (pet_id, action, performed_at) VALUES (1, ?, ?)",
    )
    .run(action, performedAt);
}

export function lastActionTime(
  database: Database.Database,
): number | null {
  const row = database
    .prepare(
      "SELECT performed_at FROM action_log WHERE pet_id = 1 ORDER BY performed_at DESC LIMIT 1",
    )
    .get() as { performed_at: number } | undefined;
  return row?.performed_at ?? null;
}

export function lastActionTimeFor(
  database: Database.Database,
  action: string,
): number | null {
  const row = database
    .prepare(
      "SELECT performed_at FROM action_log WHERE pet_id = 1 AND action = ? ORDER BY performed_at DESC LIMIT 1",
    )
    .get(action) as { performed_at: number } | undefined;
  return row?.performed_at ?? null;
}
