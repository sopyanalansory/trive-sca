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

// Run add profile fields migration
export async function runAddProfileFieldsMigration() {
  try {
    console.log('Running add profile fields migration...');
    console.log('This will:');
    console.log('  1. Rename column "name" to "fullname"');
    console.log('  2. Remove "first_name" and "last_name" columns (if they exist)');
    console.log('  3. Add new profile fields (place_of_birth, city, postal_code, etc.)');
    console.log('');
    
    const sqlFile = readFileSync(
      join(process.cwd(), 'lib', 'add-profile-fields.sql'),
      'utf8'
    );
    
    // Execute the entire SQL file as one query
    // PostgreSQL can handle multiple statements separated by semicolons
    await pool.query(sqlFile);

    console.log('✅ Add profile fields migration completed successfully');
    console.log('✅ Column "name" has been renamed to "fullname"');
    console.log('✅ New profile fields have been added');
  } catch (error: any) {
    console.error('❌ Error running add profile fields migration:', error);
    
    // Check if column already exists or renamed
    if (error.message && (
      error.message.includes('does not exist') ||
      error.message.includes('already exists') ||
      error.message.includes('duplicate column')
    )) {
      console.log('⚠️  Note: Some columns might already exist or have been renamed.');
      console.log('   This is safe to ignore if you are re-running the migration.');
    }
    
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runAddProfileFieldsMigration()
    .then(() => {
      console.log('');
      console.log('Migration process complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('');
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export default runAddProfileFieldsMigration;
