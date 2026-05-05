import dotenv from "dotenv";
import { resolve, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";

const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
  if ((!process.env.DATABASE_URL || process.env.DATABASE_URL === "") && existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
} else {
  if (existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
  if ((!process.env.DATABASE_URL || process.env.DATABASE_URL === "") && existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import pool from "./db";

export async function runMarketUpdateNotificationJobsMigration() {
  try {
    console.log("Running migration for market update notification jobs table...");
    const sqlFile = readFileSync(
      join(process.cwd(), "lib", "create-market-update-notification-jobs.sql"),
      "utf8"
    );
    await pool.query(sqlFile);
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error running market update notification jobs migration:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMarketUpdateNotificationJobsMigration()
    .then(() => {
      console.log("Migration process complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration process failed:", error);
      process.exit(1);
    });
}

