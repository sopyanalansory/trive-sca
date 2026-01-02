import { Pool } from 'pg';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables
// Production: prioritize .env, Development: prioritize .env.local
if (!process.env.DATABASE_URL || process.env.DATABASE_URL === '') {
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
}

// Parse DATABASE_URL or use individual config
const getDbConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl && typeof databaseUrl === 'string' && databaseUrl.trim() !== '') {
    // Parse SSL mode from connection string
    const sslModeMatch = databaseUrl.match(/[?&]sslmode=([^&]+)/i);
    const sslMode = sslModeMatch ? sslModeMatch[1].toLowerCase() : null;
    
    // Check if it's a cloud database (RDS, Supabase, Neon, etc.)
    const isCloudDb = databaseUrl.includes('rds.aliyuncs.com') || 
                     databaseUrl.includes('supabase') || 
                     databaseUrl.includes('neon') || 
                     databaseUrl.includes('railway') ||
                     databaseUrl.includes('render') ||
                     databaseUrl.includes('heroku') ||
                     databaseUrl.includes('amazonaws.com');
    
    // Handle SSL configuration based on sslmode parameter
    if (sslMode === 'require' || sslMode === 'verify-full' || sslMode === 'verify-ca') {
      // For require/verify modes, explicitly set SSL config
      return {
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: sslMode === 'verify-full' || sslMode === 'verify-ca' },
      };
    } else if (sslMode === 'prefer' || sslMode === 'allow') {
      // For prefer/allow, try SSL but don't require it
      return {
        connectionString: databaseUrl,
        ssl: false, // Let pg library negotiate
      };
    } else if (sslMode === 'disable') {
      // Explicitly disable SSL
      return {
        connectionString: databaseUrl,
        ssl: false,
      };
    } else if (sslMode) {
      // Unknown sslmode, pass connection string as-is
      return {
        connectionString: databaseUrl,
      };
    } else {
      // No sslmode specified, enable SSL for production or cloud databases
      if (process.env.NODE_ENV === 'production' || isCloudDb) {
        return {
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false },
        };
      } else {
        return {
          connectionString: databaseUrl,
          ssl: false,
        };
      }
    }
  }
  
  // Fallback to individual config if DATABASE_URL is not set
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'trive_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
};

// Create a connection pool
const pool = new Pool(getDbConfig());

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

