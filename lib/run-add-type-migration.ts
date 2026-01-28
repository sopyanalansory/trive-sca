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

// Run migration to add type column to platforms table
export async function runAddTypeMigration() {
  try {
    console.log('Running migration to add type column to platforms table...');
    
    const sqlFile = readFileSync(
      join(process.cwd(), 'lib', 'add-type-to-platforms.sql'),
      'utf8'
    );
    
    // Execute the entire SQL file as one query
    await pool.query(sqlFile);

    console.log('Migration completed successfully');
    console.log('Column "type" has been added to platforms table');
    console.log('Existing records have been updated based on server_name');
  } catch (error: any) {
    console.error('Error running migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runAddTypeMigration()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}
