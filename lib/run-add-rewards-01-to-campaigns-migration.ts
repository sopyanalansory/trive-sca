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

export async function runAddRewards01ToCampaignsMigration() {
  try {
    console.log('Running add rewards_01 to campaigns migration...');

    const sqlFile = readFileSync(
      join(process.cwd(), 'lib', 'add-rewards-01-to-campaigns.sql'),
      'utf8'
    );

    await pool.query(sqlFile);
    console.log('Migration completed successfully');
  } catch (error: unknown) {
    console.error('Error running migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runAddRewards01ToCampaignsMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runAddRewards01ToCampaignsMigration;
