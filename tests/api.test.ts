import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import Database from "better-sqlite3";
import { createApp } from "../src/server.js";
import { ensurePetExists } from "../src/db/database.js";
import { config } from "../src/config.js";

const TEST_PASSWORD = "test-secret";

function setup() {
  const originalPassword = config.ownerPassword;
  (config as any).ownerPassword = TEST_PASSWORD;

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
  ensurePetExists(db, Date.now());

  const app = createApp(db);
  return { app, db, restore: () => { (config as any).ownerPassword = originalPassword; } };
}

describe("API", () => {
  let app: ReturnType<typeof createApp>;
  let db: Database;
  let restore: () => void;

  beforeEach(() => {
    const ctx = setup();
    app = ctx.app;
    db = ctx.db;
    restore = ctx.restore;
  });

  afterEach(() => {
    db.close();
    restore();
  });

  describe("GET /api/health", () => {
    it("returns ok without auth", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });

  describe("GET /api/pet", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/pet");
      expect(res.status).toBe(401);
    });

    it("returns 403 with wrong password", async () => {
      const res = await request(app)
        .get("/api/pet")
        .set("Authorization", "Bearer wrong");
      expect(res.status).toBe(403);
    });

    it("returns pet state with valid auth", async () => {
      const res = await request(app)
        .get("/api/pet")
        .set("Authorization", `Bearer ${TEST_PASSWORD}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Pip");
      expect(res.body.needs).toBeDefined();
      expect(res.body.mood).toBeDefined();
      expect(res.body.mood.level).toBeDefined();
    });
  });

  describe("GET /api/pet/personality", () => {
    it("returns personality with auth", async () => {
      const res = await request(app)
        .get("/api/pet/personality")
        .set("Authorization", `Bearer ${TEST_PASSWORD}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Pip");
      expect(res.body.quirks).toBeDefined();
    });
  });

  describe("POST /api/actions/:action", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).post("/api/actions/feed");
      expect(res.status).toBe(401);
    });

    it("returns 400 for unknown action", async () => {
      const res = await request(app)
        .post("/api/actions/dance")
        .set("Authorization", `Bearer ${TEST_PASSWORD}`);
      expect(res.status).toBe(400);
    });

    it("performs feed action successfully", async () => {
      const res = await request(app)
        .post("/api/actions/feed")
        .set("Authorization", `Bearer ${TEST_PASSWORD}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
      expect(res.body.needs).toBeDefined();
    });

    it("respects cooldown", async () => {
      await request(app)
        .post("/api/actions/feed")
        .set("Authorization", `Bearer ${TEST_PASSWORD}`);
      const res = await request(app)
        .post("/api/actions/feed")
        .set("Authorization", `Bearer ${TEST_PASSWORD}`);
      expect(res.status).toBe(429);
      expect(res.body.cooldownRemaining).toBeDefined();
    });

    it("all six actions are accepted", async () => {
      for (const action of ["feed", "play", "rest", "clean", "explore", "pet"]) {
        const res = await request(app)
          .post(`/api/actions/${action}`)
          .set("Authorization", `Bearer ${TEST_PASSWORD}`);
        expect(res.status).toBe(200);
      }
    });
  });

  describe("GET /api/actions", () => {
    it("lists available actions with auth", async () => {
      const res = await request(app)
        .get("/api/actions")
        .set("Authorization", `Bearer ${TEST_PASSWORD}`);
      expect(res.status).toBe(200);
      expect(Object.keys(res.body)).toContain("feed");
      expect(Object.keys(res.body)).toContain("play");
    });
  });
});
