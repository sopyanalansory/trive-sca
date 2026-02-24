import dotenv from 'dotenv';
import { resolve, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  if (existsSync(envPath)) dotenv.config({ path: envPath });
  if ((!process.env.DATABASE_URL || process.env.DATABASE_URL === '') && existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
} else {
  if (existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
  if ((!process.env.DATABASE_URL || process.env.DATABASE_URL === '') && existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import pool from './db';

export async function runInvestmentAccountMigration() {
  try {
    console.log('Running investment account migration...');
    console.log('Creates table: investment_account_applications');
    console.log('');

    const sql = readFileSync(
      join(process.cwd(), 'lib', 'investment-account-schema.sql'),
      'utf8'
    );
    await pool.query(sql);

    console.log('✅ Investment account migration completed');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runInvestmentAccountMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
