import dotenv from 'dotenv';
import { resolve, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

// Load environment variables
// Production: prioritize .env, Development: prioritize .env.local
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
  if ((!process.env.DATABASE_URL || process.env.DATABASE_URL === '') && existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
} else {
  if (existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
  if ((!process.env.DATABASE_URL || process.env.DATABASE_URL === '') && existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import pool from './db';

// Run migration to add provision columns to platforms table
export async function runAddProvisionStatusMigration() {
  try {
    console.log('Running migration to add provision status columns to platforms table...');

    const sqlFile = readFileSync(
      join(process.cwd(), 'lib', 'add-provision-status-to-platforms.sql'),
      'utf8'
    );

    await pool.query(sqlFile);

    console.log('Migration completed successfully');
    console.log('Columns "provision_status" and "provision_error" have been added to platforms table');
  } catch (error: any) {
    console.error('Error running migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runAddProvisionStatusMigration()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}
