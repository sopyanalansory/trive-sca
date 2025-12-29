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

// Initialize database schema
export async function initDatabase() {
  try {
    const sqlFile = readFileSync(
      join(process.cwd(), 'lib', 'db-init.sql'),
      'utf8'
    );
    
    // Execute the entire SQL file as one query
    // PostgreSQL can handle multiple statements separated by semicolons
    await pool.query(sqlFile);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Run initialization if called directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Database initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

