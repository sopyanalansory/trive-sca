import { readFileSync } from 'fs';
import { resolve } from 'path';
import pool from '../lib/db';
import { hashPassword } from '../lib/auth';

interface CSVRow {
  'Account ID': string;
  'Client ID': string;
  'Account Name': string;
  'First Name': string;
  'Last Name': string;
  'Email': string;
  'Mobile': string;
  'Client Type': string;
  'CFD Status': string;
}

// Parse CSV manually (simple parser for quoted CSV)
function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  // Parse data rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row as CSVRow);
  }
  
  return rows;
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  values.push(current.trim());
  
  return values;
}

// Normalize phone number (remove country code, leading zeros, non-digits)
function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove country code (62 or 0062)
  if (cleaned.startsWith('0062')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('62')) {
    cleaned = cleaned.substring(2);
  }
  
  // Remove leading zero
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
}

// Normalize email
function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

// Combine first name and last name
function combineName(firstName: string, lastName: string, accountName: string): string {
  // Use account name if available and not just a dash or underscore
  if (accountName && accountName.trim() && accountName.trim() !== '-' && accountName.trim() !== '_') {
    return accountName.trim();
  }
  
  // Otherwise combine first and last name
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();
  
  if (first && last) {
    return `${first} ${last}`.trim();
  } else if (first) {
    return first;
  } else if (last) {
    return last;
  }
  
  return 'User'; // Default name
}

// Generate a default password hash for existing users
async function generateDefaultPasswordHash(): Promise<string> {
  // Use a default password that users can reset later
  const defaultPassword = 'TempPassword123!';
  return hashPassword(defaultPassword);
}

async function importUsers() {
  try {
    console.log('Starting CSV import...');
    
    // Read CSV file
    // const csvPath = resolve(process.cwd(), 'csv', 'Import Account.csv');
    const csvPath = resolve(process.cwd(), 'csv', 'account_rendy.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const rows = parseCSV(csvContent);
    console.log(`Parsed ${rows.length} rows from CSV`);
    
    if (rows.length === 0) {
      console.log('No data to import');
      return;
    }
    
    // Generate default password hash once (for efficiency)
    const defaultPasswordHash = await generateDefaultPasswordHash();
    
    // Check if additional columns exist (once, before processing rows)
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('account_id', 'client_id', 'client_type', 'cfd_status')
    `);
    const hasAdditionalFields = columnCheck.rows.length > 0;
    const availableColumns = columnCheck.rows.map((r: any) => r.column_name);
    
    if (hasAdditionalFields) {
      console.log(`Additional fields detected: ${availableColumns.join(', ')}`);
    }
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Skip empty rows
        if (!row.Email || !row.Email.trim()) {
          skipCount++;
          continue;
        }
        
        // Normalize data
        const email = normalizeEmail(row.Email);
        const phone = normalizePhoneNumber(row.Mobile);
        const name = combineName(row['First Name'], row['Last Name'], row['Account Name']);
        
        // Validate required fields
        if (!email || email.length === 0) {
          errors.push(`Row ${i + 2}: Missing or invalid email`);
          errorCount++;
          continue;
        }
        
        if (!phone || phone.length === 0) {
          errors.push(`Row ${i + 2}: Missing or invalid phone number - Original: ${row.Mobile}`);
          errorCount++;
          continue;
        }
        
        // Validate email format (basic check)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push(`Row ${i + 2}: Invalid email format - ${email}`);
          errorCount++;
          continue;
        }
        
        // Check if user already exists (by email)
        const existingUser = await pool.query(
          'SELECT id, email, phone FROM users WHERE email = $1',
          [email]
        );
        
        if (existingUser.rows.length > 0) {
          // Update existing user
          const userId = existingUser.rows[0].id;
          
          // Build update query with additional fields if available
          let updateFields = ['name = $1', 'phone = $2', 'updated_at = CURRENT_TIMESTAMP'];
          let updateValues: any[] = [name, phone];
          let paramIndex = 3;
          
          if (hasAdditionalFields) {
            if (availableColumns.includes('account_id')) {
              updateFields.push(`account_id = $${paramIndex}`);
              updateValues.push(row['Account ID'] || null);
              paramIndex++;
            }
            if (availableColumns.includes('client_id')) {
              updateFields.push(`client_id = $${paramIndex}`);
              updateValues.push(row['Client ID'] || null);
              paramIndex++;
            }
            if (availableColumns.includes('client_type')) {
              updateFields.push(`client_type = $${paramIndex}`);
              updateValues.push(row['Client Type'] || null);
              paramIndex++;
            }
            if (availableColumns.includes('cfd_status')) {
              updateFields.push(`cfd_status = $${paramIndex}`);
              updateValues.push(row['CFD Status'] || null);
              paramIndex++;
            }
          }
          
          updateValues.push(userId);
          
          // Update user
          await pool.query(
            `UPDATE users 
             SET ${updateFields.join(', ')}
             WHERE id = $${paramIndex}`,
            updateValues
          );
          
          console.log(`Updated user: ${email} (ID: ${userId})`);
          successCount++;
        } else {
          // Build insert query with additional fields if available
          let insertFields = ['name', 'email', 'phone', 'country_code', 'password_hash', 
                              'marketing_consent', 'terms_consent', 'email_verified', 'phone_verified'];
          let insertValues: any[] = [
            name,
            email,
            phone,
            '+62', // Default country code for Indonesia
            defaultPasswordHash,
            true, // marketing_consent
            true, // terms_consent
            true, // email_verified (assuming existing users are verified)
            true, // phone_verified (assuming existing users are verified)
          ];
          let paramIndex = insertValues.length + 1;
          
          if (hasAdditionalFields) {
            if (availableColumns.includes('account_id')) {
              insertFields.push('account_id');
              insertValues.push(row['Account ID'] || null);
            }
            if (availableColumns.includes('client_id')) {
              insertFields.push('client_id');
              insertValues.push(row['Client ID'] || null);
            }
            if (availableColumns.includes('client_type')) {
              insertFields.push('client_type');
              insertValues.push(row['Client Type'] || null);
            }
            if (availableColumns.includes('cfd_status')) {
              insertFields.push('cfd_status');
              insertValues.push(row['CFD Status'] || null);
            }
          }
          
          const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(', ');
          
          // Insert new user
          const result = await pool.query(
            `INSERT INTO users 
             (${insertFields.join(', ')})
             VALUES (${placeholders})
             RETURNING id, email`,
            insertValues
          );
          
          console.log(`Inserted user: ${email} (ID: ${result.rows[0].id})`);
          successCount++;
        }
      } catch (error: any) {
        const errorMsg = `Row ${i + 2}: ${error.message}`;
        errors.push(errorMsg);
        errorCount++;
        console.error(`Error processing row ${i + 2}:`, error.message);
      }
    }
    
    // Print summary
    console.log('\n=== Import Summary ===');
    console.log(`Total rows processed: ${rows.length}`);
    console.log(`Successfully imported/updated: ${successCount}`);
    console.log(`Skipped (empty): ${skipCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n=== Errors ===');
      errors.forEach(error => console.log(error));
    }
    
    console.log('\nImport completed!');
    
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run import if called directly
importUsers()
  .then(() => {
    console.log('Import process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import process failed:', error);
    process.exit(1);
  });

export { importUsers };
