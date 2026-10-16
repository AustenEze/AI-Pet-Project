import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import {
  ensurePetExists,
  loadNeeds,
  saveNeeds,
  logAction,
  lastActionTime,
  lastActionTimeFor,
} from "../src/db/database.js";
import { NEED_NAMES, type NeedName, type NeedState } from "../src/pet/needs.js";

function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.exec(`
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
  return db;
}

describe("database layer", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  it("ensurePetExists creates pet and needs on first call", () => {
    ensurePetExists(db, 1000);
    const needs = loadNeeds(db);
    expect(Object.keys(needs)).toHaveLength(6);
    for (const name of NEED_NAMES) {
      expect(needs[name].value).toBe(80);
      expect(needs[name].lastUpdated).toBe(1000);
    }
  });

  it("ensurePetExists is idempotent", () => {
    ensurePetExists(db, 1000);
    ensurePetExists(db, 2000); // should not throw or re-create
    const needs = loadNeeds(db);
    expect(needs.hunger.lastUpdated).toBe(1000); // original timestamp kept
  });

  it("saveNeeds persists updated values", () => {
    ensurePetExists(db, 1000);
    const needs = loadNeeds(db);
    needs.hunger = { value: 42, lastUpdated: 2000 };
    saveNeeds(db, needs);

    const reloaded = loadNeeds(db);
    expect(reloaded.hunger.value).toBe(42);
    expect(reloaded.hunger.lastUpdated).toBe(2000);
  });

  it("logAction and lastActionTime work together", () => {
    ensurePetExists(db, 1000);
    expect(lastActionTime(db)).toBeNull();

    logAction(db, "feed", 5000);
    expect(lastActionTime(db)).toBe(5000);

    logAction(db, "play", 6000);
    expect(lastActionTime(db)).toBe(6000);
  });

  it("lastActionTimeFor returns per-action timestamps", () => {
    ensurePetExists(db, 1000);
    logAction(db, "feed", 5000);
    logAction(db, "play", 6000);

    expect(lastActionTimeFor(db, "feed")).toBe(5000);
    expect(lastActionTimeFor(db, "play")).toBe(6000);
    expect(lastActionTimeFor(db, "rest")).toBeNull();
  });
});
