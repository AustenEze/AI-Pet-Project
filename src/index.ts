import { config } from "./config.js";
import { getDb, closeDb, ensurePetExists } from "./db/database.js";
import { createApp } from "./server.js";

if (!config.ownerPassword) {
  console.error("ERROR: Set OWNER_PASSWORD in .env before starting.");
  process.exit(1);
}

const db = getDb(config.databasePath);
ensurePetExists(db, Date.now());

const app = createApp(db);

const server = app.listen(config.port, () => {
  console.log(`Pip is awake on http://localhost:${config.port}`);
});

function shutdown() {
  console.log("\nPip is going to sleep...");
  server.close();
  closeDb();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
