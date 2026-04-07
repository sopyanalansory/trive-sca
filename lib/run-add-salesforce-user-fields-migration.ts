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

export async function runAddSalesforceUserFieldsMigration() {
  try {
    console.log('Running Salesforce user fields migration...');

    const sqlFile = readFileSync(
      join(process.cwd(), 'lib', 'add-salesforce-user-fields.sql'),
      'utf8'
    );

    await pool.query(sqlFile);

    console.log('✅ Salesforce user fields migration completed successfully');
    console.log('✅ Added: date_of_birth, lead_id, salesforce_interview_guid, salesforce_interview_status');
  } catch (error: any) {
    console.error('❌ Error running Salesforce user fields migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runAddSalesforceUserFieldsMigration()
    .then(() => {
      console.log('Migration process complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export default runAddSalesforceUserFieldsMigration;
