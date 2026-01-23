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

// Run deposit and withdrawal tables migration
export async function runDepositWithdrawalMigration() {
  try {
    console.log('Running deposit and withdrawal tables migration...');
    
    const sqlFile = readFileSync(
      join(process.cwd(), 'lib', 'add-deposit-withdrawal-tables.sql'),
      'utf8'
    );
    
    // Execute the entire SQL file as one query
    // PostgreSQL can handle multiple statements separated by semicolons
    await pool.query(sqlFile);

    console.log('Deposit and withdrawal tables migration completed successfully');
    console.log('Tables "deposit_requests" and "withdrawal_requests" have been created with all indexes and triggers');
  } catch (error: any) {
    console.error('Error running deposit and withdrawal migration:', error);
    
    // Check if table already exists
    if (error.message && error.message.includes('already exists')) {
      console.log('Note: Tables might already exist. This is safe to ignore if you are re-running the migration.');
    }
    
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runDepositWithdrawalMigration()
    .then(() => {
      console.log('Migration process complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export default runDepositWithdrawalMigration;
