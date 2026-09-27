/**
 * Configuration Management System
 * 
 * Central configuration store - all settings are read from Google Sheets
 * No settings are hardcoded in the application code.
 * 
 * Usage:
 *   getConfig('org_name')  → Returns value from CONFIGURATION sheet
 *   setConfig('key', 'value')  → Stores value in CONFIGURATION sheet
 *   initializeDefaultConfig()  → Sets up initial configuration
 */

/**
 * Get a configuration value from the CONFIGURATION sheet
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} Configuration value or default
 */
function getConfig(key, defaultValue = null) {
  try {
    const sheet = getConfigSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row (row 1)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return data[i][1];
      }
    }
    
    // Not found, return default
    Logger.log(`Config key not found: ${key}, using default: ${defaultValue}`);
    return defaultValue;
  } catch (error) {
    Logger.log(`Error reading config: ${error}`);
    return defaultValue;
  }
}

/**
 * Set a configuration value in the CONFIGURATION sheet
 * @param {string} key - Configuration key
 * @param {*} value - Configuration value
 * @param {string} updatedBy - User email (optional)
 * @returns {boolean} True if successful
 */
function setConfig(key, value, updatedBy = 'system') {
  try {
    const sheet = getConfigSheet();
    const data = sheet.getDataRange().getValues();
    
    // Look for existing key
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        // Update existing row
        sheet.getRange(i + 1, 2).setValue(value);  // Column B
        sheet.getRange(i + 1, 3).setValue(new Date());  // updated_at
        sheet.getRange(i + 1, 4).setValue(updatedBy);  // updated_by
        found = true;
        break;
      }
    }
    
    // Add new row if not found
    if (!found) {
      const newRow = [key, value, new Date(), updatedBy];
      sheet.appendRow(newRow);
    }
    
    return true;
  } catch (error) {
    Logger.log(`Error setting config: ${error}`);
    return false;
  }
}

/**
 * Get the CONFIGURATION sheet
 * @returns {Sheet} CONFIGURATION sheet
 */
function getConfigSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAMES.CONFIGURATION);
  
  if (!sheet) {
    throw new Error(`Sheet not found: ${SHEET_NAMES.CONFIGURATION}`);
  }
  
  return sheet;
}

/**
 * Initialize default configuration if not already set
 * Call this once during system setup
 */
function initializeDefaultConfig() {
  try {
    // Ensure sheet exists
    ensureConfigurationSheet();
    
    // Set defaults (only if not already set)
    const defaults = {
      [CONFIG_KEYS.ORG_NAME]: 'A Ray of Hope',
      [CONFIG_KEYS.ORG_ADDRESS]: 'Mumbai, India',
      [CONFIG_KEYS.ORG_UPI_ID]: 'arayofhope@upi',
      [CONFIG_KEYS.CURRENCY]: CURRENCY.INR,
      [CONFIG_KEYS.DONATION_ID_PREFIX]: ID_PREFIX.DONATION,
      [CONFIG_KEYS.RECEIPT_ID_PREFIX]: ID_PREFIX.RECEIPT,
      [CONFIG_KEYS.CURRENT_YEAR]: new Date().getFullYear().toString(),
      [CONFIG_KEYS.EMAIL_ENABLED]: 'true',
      [CONFIG_KEYS.EMAIL_FROM]: 'noreply@arayofhope.org',
      [CONFIG_KEYS.EMAIL_SUBJECT_PATTERN]: 'Your donation receipt from {{ORG_NAME}}',
      [CONFIG_KEYS.MAX_LOGIN_ATTEMPTS]: LIMITS.MAX_LOGIN_ATTEMPTS.toString(),
      [CONFIG_KEYS.SESSION_TIMEOUT_MINUTES]: LIMITS.SESSION_TIMEOUT_MINUTES.toString(),
      [CONFIG_KEYS.RECEIPT_FOOTER_TEXT]: 'Thank you for your generous donation to A Ray of Hope',
      [CONFIG_KEYS.TAX_STATEMENT]: '80G Registration No: XXXXX',
      [CONFIG_KEYS.LAST_RECEIPT_NUMBER]: '0',
      [CONFIG_KEYS.RECEIPT_TEMPLATE_DOC_ID]: ''  // To be configured by admin
    };
    
    for (const [key, value] of Object.entries(defaults)) {
      const existing = getConfig(key);
      if (!existing) {
        setConfig(key, value, 'system');
      }
    }
    
    Logger.log('Default configuration initialized');
    return true;
  } catch (error) {
    Logger.log(`Error initializing config: ${error}`);
    return false;
  }
}

/**
 * Ensure CONFIGURATION sheet exists, create if missing
 */
function ensureConfigurationSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.CONFIGURATION);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAMES.CONFIGURATION);
    
    // Add headers
    const headers = ['config_key', 'config_value', 'updated_at', 'updated_by'];
    sheet.appendRow(headers);
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, 4);
    headerRange.setBackground('#e8e8e8');
    headerRange.setFontWeight('bold');
    
    Logger.log(`Created sheet: ${SHEET_NAMES.CONFIGURATION}`);
  }
  
  return sheet;
}

/**
 * Get all configuration as an object
 * @returns {Object} All configuration key-value pairs
 */
function getAllConfig() {
  try {
    const sheet = getConfigSheet();
    const data = sheet.getDataRange().getValues();
    const config = {};
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      const value = data[i][1];
      if (key) {
        config[key] = value;
      }
    }
    
    return config;
  } catch (error) {
    Logger.log(`Error reading all config: ${error}`);
    return {};
  }
}

/**
 * Reset configuration to defaults (for testing/setup)
 * WARNING: This deletes all current configuration
 */
function resetConfiguration() {
  try {
    const sheet = getConfigSheet();
    
    // Delete all rows except header
    const numRows = sheet.getLastRow();
    if (numRows > 1) {
      sheet.deleteRows(2, numRows - 1);
    }
    
    // Re-initialize
    initializeDefaultConfig();
    
    Logger.log('Configuration reset to defaults');
    return true;
  } catch (error) {
    Logger.log(`Error resetting config: ${error}`);
    return false;
  }
}