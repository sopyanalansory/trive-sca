import { readFileSync } from 'fs';
import { resolve } from 'path';
import pool from '../lib/db';

interface CSVRow {
  'Platform Registration ID': string;
  'Account: Account ID': string;
  'Login Number': string;
  'Server Name': string;
  'Account Type': string;
  'Client Group Name': string;
  'Status': string;
  'Currency': string;
  'Leverage': string;
  'Swap Free': string;
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

// Normalize status
function normalizeStatus(status: string): string {
  if (!status) return 'Enabled';
  const normalized = status.trim();
  if (normalized === 'Read-Only' || normalized === 'Disabled') {
    return normalized;
  }
  return 'Enabled';
}

// Normalize swap free
function normalizeSwapFree(swapFree: string): string {
  if (!swapFree) return 'Tidak';
  const normalized = swapFree.trim().toLowerCase();
  if (normalized === 'ya' || normalized === 'yes' || normalized === 'true' || normalized === '1') {
    return 'Ya';
  }
  return 'Tidak';
}

async function importPlatforms() {
  try {
    console.log('Starting platform CSV import...');
    
    // Read CSV file
    const csvPath = resolve(process.cwd(), 'csv', 'Import Platform.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const rows = parseCSV(csvContent);
    console.log(`Parsed ${rows.length} rows from CSV`);
    
    if (rows.length === 0) {
      console.log('No data to import');
      return;
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
        if (!row['Platform Registration ID'] || !row['Platform Registration ID'].trim()) {
          skipCount++;
          continue;
        }
        
        // Normalize data
        const platformRegistrationId = row['Platform Registration ID'].trim();
        const accountId = row['Account: Account ID']?.trim() || '';
        const loginNumber = row['Login Number']?.trim() || '';
        const serverName = row['Server Name']?.trim() || '';
        const accountType = row['Account Type']?.trim() || null;
        const clientGroupName = row['Client Group Name']?.trim() || null;
        const status = normalizeStatus(row['Status']);
        const currency = row['Currency']?.trim() || 'USD';
        const leverage = row['Leverage']?.trim() || null;
        const swapFree = normalizeSwapFree(row['Swap Free']);
        
        // Validate required fields
        if (!platformRegistrationId) {
          errors.push(`Row ${i + 2}: Missing Platform Registration ID`);
          errorCount++;
          continue;
        }
        
        if (!accountId) {
          errors.push(`Row ${i + 2}: Missing Account ID`);
          errorCount++;
          continue;
        }
        
        if (!loginNumber) {
          errors.push(`Row ${i + 2}: Missing Login Number`);
          errorCount++;
          continue;
        }
        
        if (!serverName) {
          errors.push(`Row ${i + 2}: Missing Server Name`);
          errorCount++;
          continue;
        }
        
        // Find user by account_id
        let userId: number | null = null;
        if (accountId) {
          const userResult = await pool.query(
            'SELECT id FROM users WHERE account_id = $1',
            [accountId]
          );
          
          if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
          } else {
            console.warn(`Row ${i + 2}: User with account_id "${accountId}" not found. Platform will be created without user_id.`);
          }
        }
        
        // Check if platform already exists (by platform_registration_id)
        const existingPlatform = await pool.query(
          'SELECT id, platform_registration_id FROM platforms WHERE platform_registration_id = $1',
          [platformRegistrationId]
        );
        
        if (existingPlatform.rows.length > 0) {
          // Update existing platform
          const platformId = existingPlatform.rows[0].id;
          
          await pool.query(
            `UPDATE platforms 
             SET user_id = $1,
                 account_id = $2,
                 login_number = $3,
                 server_name = $4,
                 account_type = $5,
                 client_group_name = $6,
                 status = $7,
                 currency = $8,
                 leverage = $9,
                 swap_free = $10,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $11`,
            [
              userId,
              accountId,
              loginNumber,
              serverName,
              accountType,
              clientGroupName,
              status,
              currency,
              leverage,
              swapFree,
              platformId
            ]
          );
          
          console.log(`Updated platform: ${platformRegistrationId} (ID: ${platformId})`);
          successCount++;
        } else {
          // Insert new platform
          const result = await pool.query(
            `INSERT INTO platforms 
             (platform_registration_id, user_id, account_id, login_number, server_name, 
              account_type, client_group_name, status, currency, leverage, swap_free)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id, platform_registration_id`,
            [
              platformRegistrationId,
              userId,
              accountId,
              loginNumber,
              serverName,
              accountType,
              clientGroupName,
              status,
              currency,
              leverage,
              swapFree
            ]
          );
          
          console.log(`Inserted platform: ${platformRegistrationId} (ID: ${result.rows[0].id})`);
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
importPlatforms()
  .then(() => {
    console.log('Import process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import process failed:', error);
    process.exit(1);
  });

export { importPlatforms };
