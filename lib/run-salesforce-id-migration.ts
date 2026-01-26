import dotenv from 'dotenv';
import { resolve, join } from 'path';
import { existsSync, readFileSync } from 'fs';

// Load environment variables
// Production: prioritize .env, Development: prioritize .env.local
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Production: try .env first (for server)
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
  // Fallback to .env.local if .env doesn't exist
  if ((!process.env.DATABASE_URL || process.env.DATABASE_URL === '') && existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
} else {
  // Development: try .env.local first
  if (existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
  // Fallback to .env if .env.local doesn't exist
  if ((!process.env.DATABASE_URL || process.env.DATABASE_URL === '') && existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import pool from './db';

// Run salesforce_id migration for market_updates table
export async function runSalesforceIdMigration() {
  try {
    console.log('Running salesforce_id migration for market_updates table...');
    
    const sqlFile = readFileSync(
      join(process.cwd(), 'lib', 'add-salesforce-id-to-market-updates.sql'),
      'utf8'
    );
    
    // Execute the entire SQL file as one query
    // PostgreSQL can handle multiple statements separated by semicolons
    await pool.query(sqlFile);

    console.log('Salesforce ID migration completed successfully');
    console.log('Column "salesforce_id" has been added to market_updates table');
    console.log('');
    console.log('IMPORTANT: If you have existing data, you need to backfill salesforce_id values');
    console.log('before adding the NOT NULL constraint. After backfilling, uncomment the');
    console.log('NOT NULL constraint line in the migration file and run it again.');
  } catch (error: any) {
    console.error('Error running salesforce_id migration:', error);
    
    // Check if column already exists
    if (error.message && error.message.includes('already exists')) {
      console.log('Note: Column might already exist. This is safe to ignore if you are re-running the migration.');
    }
    
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runSalesforceIdMigration()
    .then(() => {
      console.log('Migration process complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export default runSalesforceIdMigration;
