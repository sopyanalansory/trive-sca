import dotenv from 'dotenv';
import { resolve, join } from 'path';
import { existsSync, readFileSync } from 'fs';

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

export async function runFullContentMigration() {
  try {
    console.log('Running full_content migration for market_updates table...');

    const sqlFile = readFileSync(
      join(process.cwd(), 'lib', 'add-full-content-to-market-updates.sql'),
      'utf8'
    );

    await pool.query(sqlFile);

    console.log('Full content migration completed successfully');
    console.log('Column "full_content" has been added to market_updates table');
  } catch (error: any) {
    console.error('Error running full_content migration:', error);

    if (error.message && error.message.includes('already exists')) {
      console.log('Note: Column might already exist. This is safe to ignore if you are re-running the migration.');
    }

    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runFullContentMigration()
    .then(() => {
      console.log('Migration process complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export default runFullContentMigration;
