/**
 * Google Sheets Utility Functions
 * 
 * Helpers for creating, accessing, and managing Google Sheets
 * Ensures all required sheets exist with proper structure
 */

/**
 * Get or create DONATIONS sheet
 */
function ensureDonationsSheet() {
  return ensureSheet(SHEET_NAMES.DONATIONS, [
    'donation_id',
    'donor_id',
    'amount',
    'currency',
    'payment_method',
    'payment_status',
    'receipt_number',
    'receipt_pdf_url',
    'created_at',
    'updated_at',
    'created_by',
    'notes'
  ]);
}

/**
 * Get or create DONORS sheet
 */
function ensureDonorsSheet() {
  return ensureSheet(SHEET_NAMES.DONORS, [
    'donor_id',
    'name',
    'mobile',
    'email',
    'address',
    'city',
    'state',
    'pin',
    'country',
    'pan',
    'dob',
    'occupation',
    'company',
    'created_at',
    'updated_at'
  ]);
}

/**
 * Get or create PAYMENTS sheet
 */
function ensurePaymentsSheet() {
  return ensureSheet(SHEET_NAMES.PAYMENTS, [
    'payment_id',
    'donation_id',
    'amount',
    'currency',
    'payment_method',
    'payment_status',
    'transaction_id',
    'provider',
    'provider_payment_id',
    'provider_order_id',
    'provider_metadata',
    'confirmed_by',
    'confirmed_at',
    'payment_timestamp',
    'created_at',
    'updated_at'
  ]);
}

/**
 * Get or create FORM_FIELDS sheet
 */
function ensureFormFieldsSheet() {
  return ensureSheet(SHEET_NAMES.FORM_FIELDS, [
    'field_id',
    'field_key',
    'label',
    'type',
    'required',
    'enabled',
    'display_order',
    'placeholder',
    'options',
    'created_at',
    'updated_at'
  ]);
}

/**
 * Get or create AUDIT_LOG sheet
 */
function ensureAuditLogSheet() {
  return ensureSheet(SHEET_NAMES.AUDIT_LOG, [
    'log_id',
    'timestamp',
    'user',
    'action',
    'entity_type',
    'entity_id',
    'old_value',
    'new_value',
    'notes'
  ]);
}

/**
 * Ensure a sheet exists with given name and headers
 * @param {string} sheetName - Name of sheet
 * @param {Array} headers - Column headers
 * @returns {Sheet} The sheet object
 */
function ensureSheet(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    // Create new sheet
    sheet = spreadsheet.insertSheet(sheetName);
    
    // Add headers
    sheet.appendRow(headers);
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#4472c4');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    Logger.log(`Created sheet: ${sheetName}`);
  }
  
  return sheet;
}

/**
 * Get a sheet by name
 * @param {string} sheetName - Name of sheet
 * @returns {Sheet} The sheet
 * @throws Error if sheet not found
 */
function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error(`Sheet not found: ${sheetName}`);
  }
  
  return sheet;
}

/**
 * Get all data from a sheet as array of objects
 * @param {string} sheetName - Name of sheet
 * @returns {Array} Array of row objects
 */
function getSheetData(sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) return [];
    
    // First row is headers
    const headers = data[0];
    const rows = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      rows.push(row);
    }
    
    return rows;
  } catch (error) {
    Logger.log(`Error reading sheet data: ${error}`);
    return [];
  }
}

/**
 * Append a row to a sheet
 * @param {string} sheetName - Name of sheet
 * @param {Object} rowData - Object with column-value pairs
 * @returns {boolean} True if successful
 */
function appendRow(sheetName, rowData) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      throw new Error(`Sheet ${sheetName} has no headers`);
    }
    
    const headers = data[0];
    const values = [];
    
    // Build row values in correct column order
    for (let header of headers) {
      values.push(rowData[header] || '');
    }
    
    sheet.appendRow(values);
    return true;
  } catch (error) {
    Logger.log(`Error appending row: ${error}`);
    return false;
  }
}

/**
 * Update a row in a sheet
 * @param {string} sheetName - Name of sheet
 * @param {number} rowIndex - Row number (1-based, excluding header)
 * @param {Object} rowData - Object with column-value pairs to update
 * @returns {boolean} True if successful
 */
function updateRow(sheetName, rowIndex, rowData) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      throw new Error(`Sheet ${sheetName} has no headers`);
    }
    
    const headers = data[0];
    const actualRow = rowIndex + 1;  // +1 for 1-based indexing
    
    for (let col = 0; col < headers.length; col++) {
      const header = headers[col];
      if (rowData.hasOwnProperty(header)) {
        sheet.getRange(actualRow, col + 1).setValue(rowData[header]);
      }
    }
    
    return true;
  } catch (error) {
    Logger.log(`Error updating row: ${error}`);
    return false;
  }
}

/**
 * Find a row by column value
 * @param {string} sheetName - Name of sheet
 * @param {string} columnName - Column to search in
 * @param {*} value - Value to find
 * @returns {Object|null} Row object or null if not found
 */
function findRow(sheetName, columnName, value) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) return null;
    
    const headers = data[0];
    const columnIndex = headers.indexOf(columnName);
    
    if (columnIndex === -1) {
      throw new Error(`Column not found: ${columnName}`);
    }
    
    // Search from row 2 (skip header)
    for (let i = 1; i < data.length; i++) {
      if (data[i][columnIndex] === value) {
        // Convert to object
        const row = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = data[i][j];
        }
        return row;
      }
    }
    
    return null;
  } catch (error) {
    Logger.log(`Error finding row: ${error}`);
    return null;
  }
}

/**
 * Count rows in a sheet (excluding header)
 * @param {string} sheetName - Name of sheet
 * @returns {number} Number of data rows
 */
function countRows(sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    return lastRow > 1 ? lastRow - 1 : 0;
  } catch (error) {
    Logger.log(`Error counting rows: ${error}`);
    return 0;
  }
}

/**
 * Clear all data from a sheet (keep headers)
 * @param {string} sheetName - Name of sheet
 * @returns {boolean} True if successful
 */
function clearSheetData(sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    return true;
  } catch (error) {
    Logger.log(`Error clearing sheet: ${error}`);
    return false;
  }
}