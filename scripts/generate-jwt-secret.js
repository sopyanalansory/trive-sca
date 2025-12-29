#!/usr/bin/env node

/**
 * Script to generate a secure JWT_SECRET
 * Usage: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure random string (128 characters = 64 bytes in hex)
const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Generate secret
const secret = generateJWTSecret();

console.log('\n🔐 Generated JWT_SECRET:');
console.log('='.repeat(80));
console.log(secret);
console.log('='.repeat(80));
console.log('\n✅ Length:', secret.length, 'characters');
console.log('✅ Entropy: 512 bits (very secure)');
console.log('\n💡 Copy this value to your .env.local file:');
console.log(`JWT_SECRET=${secret}\n`);

// Optionally update .env.local if it exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('JWT_SECRET=')) {
      // Update existing JWT_SECRET
      envContent = envContent.replace(/JWT_SECRET=.*/g, `JWT_SECRET=${secret}`);
      console.log('📝 Updating .env.local...');
    } else {
      // Append JWT_SECRET if it doesn't exist
      envContent += `\nJWT_SECRET=${secret}\n`;
      console.log('📝 Adding JWT_SECRET to .env.local...');
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local updated successfully!\n');
  } catch (error) {
    console.error('⚠️  Could not update .env.local automatically:', error.message);
    console.log('   Please update it manually.\n');
  }
} else {
  console.log('⚠️  .env.local not found. Please create it and add:');
  console.log(`   JWT_SECRET=${secret}\n`);
}

