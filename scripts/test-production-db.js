#!/usr/bin/env node

/**
 * Script to test production database connection (Alibaba Cloud RDS)
 * Usage: node scripts/test-production-db.js
 */

const { Pool } = require('pg');

// Production database credentials
const productionDbConfig = {
  host: 'pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com',
  user: 'db_admin',
  password: 'Indonesia123!',
  port: 5432,
  database: 'postgres', // Change if you have a different database name
  ssl: {
    rejectUnauthorized: false // Required for Alibaba Cloud RDS
  }
};

console.log('🔍 Testing production database connection...\n');
console.log('📍 Host:', productionDbConfig.host);
console.log('📍 Database:', productionDbConfig.database);
console.log('📍 User:', productionDbConfig.user);
console.log('📍 SSL: Enabled\n');

const pool = new Pool(productionDbConfig);

pool.query('SELECT NOW() as current_time, version() as postgres_version, current_database() as database_name')
  .then((result) => {
    console.log('✅ Connection successful!\n');
    console.log('📊 Database Info:');
    console.log('  Current Time:', result.rows[0].current_time);
    console.log('  Database Name:', result.rows[0].database_name);
    console.log('  PostgreSQL:', result.rows[0].postgres_version.split('\n')[0]);
    
    // Check if tables exist
    return pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
  })
  .then((result) => {
    if (result.rows.length > 0) {
      console.log('\n📋 Tables found:');
      result.rows.forEach(row => {
        console.log('  -', row.table_name);
      });
      
      if (!result.rows.find(r => r.table_name === 'users')) {
        console.log('\n⚠️  Warning: "users" table not found.');
        console.log('   Run "npm run init-db" with production DATABASE_URL to initialize schema.');
      }
    } else {
      console.log('\n⚠️  No tables found.');
      console.log('   Run "npm run init-db" with production DATABASE_URL to initialize schema.');
    }
    
    pool.end();
    console.log('\n✅ Test completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Connection failed!\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('SSL')) {
      console.log('\n💡 Tip: Alibaba Cloud RDS requires SSL connection.');
      console.log('   Make sure SSL is enabled in connection config.\n');
    }
    
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.log('\n💡 Tip: Check your database credentials.');
      console.log('   Verify username and password are correct.\n');
    }
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      console.log('\n💡 Tip: Cannot connect to database server.');
      console.log('   - Check if database is running');
      console.log('   - Verify host and port are correct');
      console.log('   - Check firewall/security group settings');
      console.log('   - Ensure public access is enabled in Alibaba Cloud RDS\n');
    }
    
    if (error.message.includes('does not exist')) {
      console.log('\n💡 Tip: Database does not exist.');
      console.log('   Create the database first or use existing database name.\n');
    }
    
    pool.end();
    process.exit(1);
  });

