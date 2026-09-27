/**
 * A Ray of Hope - Donation & Receipt Automation System
 * 
 * Main entry point for Google Apps Script Web App
 * 
 * This file handles:
 * - Web app deployment routes
 * - Request routing (donor form / admin dashboard)
 * - HTML serving
 */

/**
 * Main entry point for web app requests
 * Routes requests to appropriate handler
 */
function doGet(e) {
  try {
    const page = e.parameter.page || 'donor-form';
    const action = e.parameter.action || null;
    
    // Route to appropriate handler
    switch (page) {
      case 'admin':
        return handleAdminPage(e);
      case 'admin-dashboard':
        return handleAdminDashboard(e);
      case 'donor-form':
      default:
        return handleDonorFormPage(e);
    }
  } catch (error) {
    Logger.log(`Error in doGet: ${error}`);
    return HtmlService.createHtmlOutput(`
      <h1>Error</h1>
      <p>An error occurred. Please try again later.</p>
      <p>${error.toString()}</p>
    `);
  }
}

/**
 * Handle POST requests (form submissions, API calls)
 */
function doPost(e) {
  try {
    const action = e.parameter.action || JSON.parse(e.postData.contents).action;
    const data = e.postData.contents ? JSON.parse(e.postData.contents) : e.parameter;
    
    switch (action) {
      case 'create_donation':
        return createDonation(data);
      case 'confirm_payment':
        return confirmPayment(data);
      case 'get_pending_donations':
        return getPendingDonations();
      case 'get_all_donations':
        return getAllDonations(data);
      case 'search_donations':
        return searchDonations(data);
      case 'get_config':
        return getConfigResponse(data);
      case 'set_config':
        return setConfigResponse(data);
      case 'get_form_fields':
        return getFormFieldsResponse();
      case 'verify_admin_password':
        return verifyAdminPassword(data);
      default:
        return createResponse(false, `Unknown action: ${action}`);
    }
  } catch (error) {
    Logger.log(`Error in doPost: ${error}`);
    return createResponse(false, error.toString());
  }
}

/**
 * Serve the donor form page
 */
function handleDonorFormPage(e) {
  try {
    const html = HtmlService.createTemplateFromFile('html/donor-form')
      .evaluate()
      .setXFrameOptions(HtmlService.XFrameOptions.ALLOWALL);
    return html;
  } catch (error) {
    Logger.log(`Error loading donor form: ${error}`);
    return HtmlService.createHtmlOutput(`
      <h1>Error</h1>
      <p>Failed to load form. Error: ${error}</p>
    `);
  }
}

/**
 * Serve the admin login/dashboard page
 */
function handleAdminPage(e) {
  try {
    const html = HtmlService.createTemplateFromFile('html/admin-dashboard')
      .evaluate()
      .setXFrameOptions(HtmlService.XFrameOptions.ALLOWALL);
    return html;
  } catch (error) {
    Logger.log(`Error loading admin page: ${error}`);
    return HtmlService.createHtmlOutput(`
      <h1>Error</h1>
      <p>Failed to load admin panel. Error: ${error}</p>
    `);
  }
}

/**
 * Handle admin dashboard requests
 */
function handleAdminDashboard(e) {
  return handleAdminPage(e);
}

/**
 * Create a JSON response object
 */
function createResponse(success, message, data = null) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: success,
      message: message,
      data: data
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create donation from form submission
 */
function createDonation(data) {
  try {
    // TODO: Implement in Phase 2
    return createResponse(false, 'Phase 2 - Not yet implemented');
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

/**
 * Confirm payment by admin
 */
function confirmPayment(data) {
  try {
    // TODO: Implement in Phase 5
    return createResponse(false, 'Phase 5 - Not yet implemented');
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

/**
 * Get list of pending donations
 */
function getPendingDonations() {
  try {
    // TODO: Implement in Phase 2
    return createResponse(false, 'Phase 2 - Not yet implemented');
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

/**
 * Get all donations with pagination
 */
function getAllDonations(data) {
  try {
    // TODO: Implement in Phase 2
    return createResponse(false, 'Phase 2 - Not yet implemented');
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

/**
 * Search donations by donor name, amount, etc
 */
function searchDonations(data) {
  try {
    // TODO: Implement in Phase 2
    return createResponse(false, 'Phase 2 - Not yet implemented');
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

/**
 * API: Get configuration value
 */
function getConfigResponse(data) {
  try {
    const key = data.key;
    const value = getConfig(key);
    return createResponse(true, 'Config retrieved', { [key]: value });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

/**
 * API: Set configuration value (admin only)
 */
function setConfigResponse(data) {
  try {
    // TODO: Add admin authentication in Phase 10
    const key = data.key;
    const value = data.value;
    setConfig(key, value);
    return createResponse(true, 'Config updated');
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

/**
 * API: Get all form fields
 */
function getFormFieldsResponse() {
  try {
    // TODO: Implement in Phase 3
    return createResponse(false, 'Phase 3 - Not yet implemented');
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

/**
 * API: Verify admin password
 */
function verifyAdminPassword(data) {
  try {
    // TODO: Implement in Phase 10
    return createResponse(false, 'Phase 10 - Not yet implemented');
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

/**
 * System initialization (call once after deployment)
 */
function initialize() {
  try {
    Logger.log('Initializing system...');
    
    // Ensure all sheets exist
    ensureDonationsSheet();
    ensureDonorsSheet();
    ensurePaymentsSheet();
    ensureFormFieldsSheet();
    ensureConfigurationSheet();
    ensureAuditLogSheet();
    
    // Initialize default configuration
    initializeDefaultConfig();
    
    // Initialize default form fields
    // TODO: Implement in Phase 3
    
    Logger.log('System initialization complete');
    return createResponse(true, 'System initialized');
  } catch (error) {
    Logger.log(`Initialization error: ${error}`);
    return createResponse(false, error.toString());
  }
}

/**
 * Test function (remove in production)
 */
function test() {
  Logger.log('Running tests...');
  
  // Test configuration system
  Logger.log('Config test:');
  setConfig('test_key', 'test_value', 'test_user');
  const value = getConfig('test_key');
  Logger.log(`Set and retrieved test_key: ${value}`);
  
  Logger.log('Tests complete');
}