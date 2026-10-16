import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  ownerPassword: process.env.OWNER_PASSWORD || "",
  databasePath: process.env.DATABASE_PATH || "./data/pip.db",
} as const;
