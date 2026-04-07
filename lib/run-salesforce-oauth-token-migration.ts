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
  if (
    (!process.env.DATABASE_URL || process.env.DATABASE_URL === "") &&
    existsSync(envLocalPath)
  ) {
    dotenv.config({ path: envLocalPath });
  }
} else {
  if (existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
  if (
    (!process.env.DATABASE_URL || process.env.DATABASE_URL === "") &&
    existsSync(envPath)
  ) {
    dotenv.config({ path: envPath });
  }
}

import pool from "./db";

export async function runSalesforceOauthTokenMigration() {
  try {
    console.log("Running salesforce oauth token migration...");
    const sqlFile = readFileSync(
      join(process.cwd(), "lib", "add-salesforce-oauth-tokens.sql"),
      "utf8"
    );
    await pool.query(sqlFile);
    console.log(
      'Migration completed: table "salesforce_oauth_tokens" is ready.'
    );
  } catch (error: any) {
    console.error("Error running salesforce oauth token migration:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runSalesforceOauthTokenMigration()
    .then(() => {
      console.log("Migration process complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration process failed:", error);
      process.exit(1);
    });
}

export default runSalesforceOauthTokenMigration;
