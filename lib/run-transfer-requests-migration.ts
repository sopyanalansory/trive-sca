import dotenv from 'dotenv';
import { resolve, join } from 'path';
import { existsSync, readFileSync } from 'fs';

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

export async function runTransferRequestsMigration() {
  try {
    console.log('Running transfer_requests table migration...');

    const sqlFile = readFileSync(
      join(process.cwd(), 'lib', 'add-transfer-requests-table.sql'),
      'utf8'
    );

    await pool.query(sqlFile);

    console.log('Transfer requests migration completed successfully');
  } catch (error: unknown) {
    console.error('Error running transfer requests migration:', error);

    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('Note: Objects might already exist. Safe to ignore on re-run.');
    }

    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runTransferRequestsMigration()
    .then(() => {
      console.log('Migration process complete');
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

export default runTransferRequestsMigration;
