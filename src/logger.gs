/**
 * Audit Logging System
 * 
 * Logs all significant actions for audit trail
 * Tracks who did what, when, and what changed
 */

/**
 * Log an audit action
 * 
 * @param {string} action - Action type (CREATED, UPDATED, CONFIRMED_PAYMENT, etc.)
 * @param {string} entityType - Entity type (donation, donor, payment, etc.)
 * @param {string} entityId - ID of the entity affected
 * @param {Object} oldValue - Previous value (before change)
 * @param {Object} newValue - New value (after change)
 * @param {string} notes - Optional notes about the action
 * @returns {boolean} True if logged successfully
 */
function logAudit(action, entityType, entityId, oldValue = {}, newValue = {}, notes = '') {
  try {
    // Don't log if sheet doesn't exist
    const sheet = getSheet(SHEET_NAMES.AUDIT_LOG);
    if (!sheet) {
      return false;
    }
    
    // Generate log ID
    const logId = generateLogId();
    
    // Get current user (if available)
    const user = getCurrentUser();
    
    // Prepare row
    const row = {
      log_id: logId,
      timestamp: new Date().toISOString(),
      user: user,
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      old_value: JSON.stringify(oldValue),
      new_value: JSON.stringify(newValue),
      notes: notes
    };
    
    // Append to AUDIT_LOG sheet
    appendRow(SHEET_NAMES.AUDIT_LOG, row);
    
    Logger.log(`Audit logged: ${action} - ${entityId}`);
    return true;
  } catch (error) {
    Logger.log(`Error logging audit: ${error}`);
    return false;
  }
}

/**
 * Get current user email
 * Returns authenticated user or 'system'
 * 
 * @returns {string} User email or 'system'
 */
function getCurrentUser() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    return userEmail || 'system';
  } catch (error) {
    return 'system';
  }
}

/**
 * Get audit log entries
 * 
 * @param {number} limit - Maximum number of entries to return
 * @returns {Array} Audit log entries
 */
function getAuditLog(limit = 1000) {
  try {
    let logs = getSheetData(SHEET_NAMES.AUDIT_LOG);
    
    // Return in reverse chronological order (newest first)
    logs.reverse();
    
    // Limit results
    if (limit > 0) {
      logs = logs.slice(0, limit);
    }
    
    return logs;
  } catch (error) {
    Logger.log(`Error getting audit log: ${error}`);
    return [];
  }
}

/**
 * Get audit log entries for a specific entity
 * 
 * @param {string} entityType - Entity type to filter
 * @param {string} entityId - Entity ID to filter
 * @returns {Array} Matching audit log entries
 */
function getAuditLogForEntity(entityType, entityId) {
  try {
    const logs = getSheetData(SHEET_NAMES.AUDIT_LOG);
    
    return logs.filter(log =>
      log.entity_type === entityType && log.entity_id === entityId
    );
  } catch (error) {
    Logger.log(`Error getting audit log for entity: ${error}`);
    return [];
  }
}

/**
 * Get audit log entries for a specific user
 * 
 * @param {string} user - User email to filter
 * @returns {Array} Matching audit log entries
 */
function getAuditLogByUser(user) {
  try {
    const logs = getSheetData(SHEET_NAMES.AUDIT_LOG);
    
    return logs.filter(log => log.user === user);
  } catch (error) {
    Logger.log(`Error getting audit log by user: ${error}`);
    return [];
  }
}

/**
 * Get audit log entries for a specific action
 * 
 * @param {string} action - Action type to filter
 * @returns {Array} Matching audit log entries
 */
function getAuditLogByAction(action) {
  try {
    const logs = getSheetData(SHEET_NAMES.AUDIT_LOG);
    
    return logs.filter(log => log.action === action);
  } catch (error) {
    Logger.log(`Error getting audit log by action: ${error}`);
    return [];
  }
}

/**
 * Get audit log in date range
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Audit log entries in range
 */
function getAuditLogInDateRange(startDate, endDate) {
  try {
    const logs = getSheetData(SHEET_NAMES.AUDIT_LOG);
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return logs.filter(log => {
      const logDate = new Date(log.timestamp).getTime();
      return logDate >= start && logDate <= end;
    });
  } catch (error) {
    Logger.log(`Error getting audit log by date range: ${error}`);
    return [];
  }
}

/**
 * Generate a unique log ID
 * Format: L001, L002, etc.
 * 
 * @returns {string} Unique log ID
 */
function generateLogId() {
  try {
    const logs = getSheetData(SHEET_NAMES.AUDIT_LOG);
    let maxNum = 0;
    
    // Find highest number
    for (let log of logs) {
      const match = log.log_id.match(/L(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    
    // Generate next ID
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `${ID_PREFIX.LOG}${nextNum}`;
  } catch (error) {
    Logger.log(`Error generating log ID: ${error}`);
    return `${ID_PREFIX.LOG}001`;
  }
}

/**
 * Export audit log to CSV format
 * 
 * @returns {string} CSV formatted audit log
 */
function exportAuditLogCsv() {
  try {
    const logs = getSheetData(SHEET_NAMES.AUDIT_LOG);
    
    if (logs.length === 0) {
      return 'No audit log entries';
    }
    
    // CSV headers
    const headers = Object.keys(logs[0]);
    const csvRows = [headers.join(',')];
    
    // CSV rows
    for (let log of logs) {
      const values = headers.map(header => {
        let value = log[header] || '';
        // Escape quotes in values
        value = value.toString().replace(/"/g, '""');
        // Wrap in quotes if contains comma
        if (value.includes(',')) {
          value = `"${value}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  } catch (error) {
    Logger.log(`Error exporting audit log: ${error}`);
    return '';
  }
}

/**
 * Get audit log summary for reporting
 * 
 * @returns {Object} Summary statistics
 */
function getAuditLogSummary() {
  try {
    const logs = getSheetData(SHEET_NAMES.AUDIT_LOG);
    
    const summary = {
      total_entries: logs.length,
      by_action: {},
      by_entity_type: {},
      by_user: {},
      date_range: {
        earliest: null,
        latest: null
      }
    };
    
    for (let log of logs) {
      // Count by action
      summary.by_action[log.action] = (summary.by_action[log.action] || 0) + 1;
      
      // Count by entity type
      summary.by_entity_type[log.entity_type] = (summary.by_entity_type[log.entity_type] || 0) + 1;
      
      // Count by user
      summary.by_user[log.user] = (summary.by_user[log.user] || 0) + 1;
      
      // Track date range
      const logDate = new Date(log.timestamp);
      if (!summary.date_range.earliest || logDate < summary.date_range.earliest) {
        summary.date_range.earliest = logDate;
      }
      if (!summary.date_range.latest || logDate > summary.date_range.latest) {
        summary.date_range.latest = logDate;
      }
    }
    
    return summary;
  } catch (error) {
    Logger.log(`Error getting audit log summary: ${error}`);
    return {};
  }
}

/**
 * Clear old audit logs (for data cleanup)
 * WARNING: This deletes audit records
 * 
 * @param {number} daysToKeep - Keep logs from last N days
 * @returns {number} Number of entries deleted
 */
function clearOldAuditLogs(daysToKeep = 365) {
  try {
    const logs = getSheetData(SHEET_NAMES.AUDIT_LOG);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const sheet = getSheet(SHEET_NAMES.AUDIT_LOG);
    let deletedCount = 0;
    
    // Iterate backwards to avoid index issues when deleting
    for (let i = logs.length - 1; i >= 0; i--) {
      const logDate = new Date(logs[i].timestamp);
      if (logDate < cutoffDate) {
        // Delete row (i+2 because row 1 is header, arrays are 0-indexed)
        sheet.deleteRow(i + 2);
        deletedCount++;
      }
    }
    
    Logger.log(`Deleted ${deletedCount} old audit entries`);
    return deletedCount;
  } catch (error) {
    Logger.log(`Error clearing old audit logs: ${error}`);
    return 0;
  }
}

/**
 * Test logging functions
 */
function testLogging() {
  Logger.log('Testing logging functions...');
  
  try {
    // Log a test action
    logAudit(
      AUDIT_ACTION.CREATED,
      AUDIT_ENTITY_TYPE.DONATION,
      'ROH-2026-001',
      {},
      { amount: 5000, method: 'UPI' },
      'Test donation'
    );
    Logger.log('Test log created');
    
    // Get audit log
    const logs = getAuditLog(10);
    Logger.log(`Total logs: ${logs.length}`);
    
    // Get summary
    const summary = getAuditLogSummary();
    Logger.log(`Summary: ${JSON.stringify(summary)}`);
    
    Logger.log('Logging tests passed!');
  } catch (error) {
    Logger.log(`Test error: ${error}`);
  }
}