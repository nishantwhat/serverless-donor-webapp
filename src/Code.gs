/**
 * A Ray of Hope - Donation & Receipt Automation System
 * 
 * Main entry point for Google Apps Script Web App
 * Phase 2: Database operations fully functional
 * 
 * This file handles:
 * - Web app deployment routes
 * - Request routing (donor form / admin dashboard)
 * - HTML serving
 * - API endpoints for database operations
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
    // Parse request data
    let data = {};
    let action = '';
    
    try {
      if (e.postData && e.postData.contents) {
        data = JSON.parse(e.postData.contents);
        action = data.action || e.parameter.action;
      } else {
        data = e.parameter;
        action = data.action;
      }
    } catch (parseError) {
      // Fallback to parameter parsing
      data = e.parameter;
      action = data.action;
    }
    
    // Route actions
    switch (action) {
      // Donation operations
      case 'create_donation':
        return handleCreateDonation(data);
      case 'get_donation':
        return handleGetDonation(data);
      case 'get_all_donations':
        return handleGetAllDonations(data);
      case 'search_donations':
        return handleSearchDonations(data);
      case 'get_pending_donations':
        return handleGetPendingDonations();
      case 'confirm_donation':
        return handleConfirmDonation(data);
      
      // Payment operations
      case 'get_payment':
        return handleGetPayment(data);
      case 'confirm_payment':
        return handleConfirmPayment(data);
      case 'get_pending_payments':
        return handleGetPendingPayments();
      
      // Donor operations
      case 'get_donor':
        return handleGetDonor(data);
      case 'search_donors':
        return handleSearchDonors(data);
      
      // Form field operations
      case 'get_form_fields':
        return handleGetFormFields();
      case 'get_form_field_validation':
        return handleGetFormFieldValidation();
      case 'validate_donor_data':
        return handleValidateDonorData(data);
      
      // Configuration operations
      case 'get_config':
        return handleGetConfig(data);
      case 'set_config':
        return handleSetConfig(data);
      
      // Statistics
      case 'get_donation_stats':
        return handleGetDonationStats();
      case 'get_payment_stats':
        return handleGetPaymentStats();
      
      // Audit log
      case 'get_audit_log':
        return handleGetAuditLog(data);
      
      default:
        return createResponse(false, `Unknown action: ${action}`);
    }
  } catch (error) {
    Logger.log(`Error in doPost: ${error}`);
    return createResponse(false, error.toString());
  }
}

// ============================================================
// DONATION HANDLERS
// ============================================================

function handleCreateDonation(data) {
  try {
    // Create/get donor first
    const donor = createOrGetDonor({
      name: data.donor_name || '',
      mobile: data.mobile || '',
      email: data.email || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      pin: data.pin || '',
      country: data.country || 'India',
      pan: data.pan || '',
      dob: data.dob || '',
      occupation: data.occupation || '',
      company: data.company || ''
    });
    
    // Create donation
    const donation = createDonation({
      donor_id: donor.donor_id,
      amount: parseFloat(data.amount),
      payment_method: data.payment_method
    });
    
    // Create payment record
    const payment = createPayment({
      donation_id: donation.donation_id,
      amount: donation.amount,
      payment_method: donation.payment_method
    });
    
    // Mark donation as pending
    markPaymentPending(donation.donation_id);
    
    return createResponse(true, 'Donation created', {
      donation: donation,
      donor: donor,
      payment: payment
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function handleGetDonation(data) {
  try {
    if (!data.donation_id) {
      return createResponse(false, 'donation_id required');
    }
    
    const donation = getDonationById(data.donation_id);
    const payment = getPaymentByDonationId(data.donation_id);
    const donor = getDonorById(donation.donor_id);
    
    return createResponse(true, 'Donation retrieved', {
      donation: donation,
      payment: payment,
      donor: donor
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function handleGetAllDonations(data) {
  try {
    const donations = getAllDonations();
    return createResponse(true, 'Donations retrieved', {
      donations: donations,
      count: donations.length
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function handleSearchDonations(data) {
  try {
    if (!data.term) {
      return createResponse(false, 'Search term required');
    }
    
    const results = searchDonations(data.term);
    return createResponse(true, 'Search complete', {
      results: results,
      count: results.length
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function handleGetPendingDonations() {
  try {
    const pending = getPendingDonations();
    return createResponse(true, 'Pending donations retrieved', {
      donations: pending,
      count: pending.length
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function handleConfirmDonation(data) {
  try {
    if (!data.donation_id) {
      return createResponse(false, 'donation_id required');
    }
    
    confirmDonation(data.donation_id, data.admin_email || 'admin@org.com');
    const updated = getDonationById(data.donation_id);
    
    return createResponse(true, 'Donation confirmed', {
      donation: updated
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

// ============================================================
// PAYMENT HANDLERS
// ============================================================

function handleGetPayment(data) {
  try {
    if (!data.payment_id) {
      return createResponse(false, 'payment_id required');
    }
    
    const payment = getPaymentById(data.payment_id);
    return createResponse(true, 'Payment retrieved', {
      payment: payment
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function handleConfirmPayment(data) {
  try {
    if (!data.payment_id) {
      return createResponse(false, 'payment_id required');
    }
    
    confirmPayment(data.payment_id, data.admin_email || 'admin@org.com', data.transaction_id || '');
    const updated = getPaymentById(data.payment_id);
    
    return createResponse(true, 'Payment confirmed', {
      payment: updated
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function handleGetPendingPayments() {
  try {
    const pending = getPendingPayments();
    return createResponse(true, 'Pending payments retrieved', {
      payments: pending,
      count: pending.length
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

// ============================================================
// DONOR HANDLERS
// ============================================================

function handleGetDonor(data) {
  try {
    if (!data.donor_id) {
      return createResponse(false, 'donor_id required');
    }
    
    const donor = getDonorById(data.donor_id);
    return createResponse(true, 'Donor retrieved', {
      donor: donor
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function handleSearchDonors(data) {
  try {
    if (!data.term) {
      return createResponse(false, 'Search term required');
    }
    
    const results = searchDonorsByName(data.term);
    return createResponse(true, 'Search complete', {
      results: results,
      count: results.length
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

// ============================================================
// FORM FIELD HANDLERS
// ============================================================

function handleGetFormFields() {
  try {
    const fields = getActiveFormFields();
    return createResponse(true, 'Form fields retrieved', {
      fields: fields
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function handleGetFormFieldValidation() {
  try {
    const rules = getFormFieldValidationRules();
    return createResponse(true, 'Validation rules retrieved', {
      rules: rules
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function handleValidateDonorData(data) {
  try {
    const result = validateDonorData(data);
    return createResponse(result.valid, result.valid ? 'Valid' : 'Validation failed', {
      errors: result.errors
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

// ============================================================
// CONFIGURATION HANDLERS
// ============================================================

function handleGetConfig(data) {
  try {
    if (!data.key) {
      return createResponse(false, 'key required');
    }
    
    const value = getConfig(data.key);
    return createResponse(true, 'Config retrieved', {
      [data.key]: value
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function handleSetConfig(data) {
  try {
    if (!data.key || data.value === undefined) {
      return createResponse(false, 'key and value required');
    }
    
    setConfig(data.key, data.value, data.updated_by || 'admin@org.com');
    return createResponse(true, 'Config updated');
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

// ============================================================
// STATISTICS HANDLERS
// ============================================================

function handleGetDonationStats() {
  try {
    const stats = getDonationStats();
    return createResponse(true, 'Stats retrieved', stats);
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function handleGetPaymentStats() {
  try {
    const stats = getPaymentStats();
    return createResponse(true, 'Stats retrieved', stats);
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

// ============================================================
// AUDIT LOG HANDLERS
// ============================================================

function handleGetAuditLog(data) {
  try {
    const limit = parseInt(data.limit) || 100;
    const logs = getAuditLog(limit);
    return createResponse(true, 'Audit log retrieved', {
      logs: logs,
      count: logs.length
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

// ============================================================
// PAGE HANDLERS
// ============================================================

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

function handleAdminDashboard(e) {
  return handleAdminPage(e);
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

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
    initializeDefaultFormFields();
    
    Logger.log('System initialization complete');
    return createResponse(true, 'System initialized');
  } catch (error) {
    Logger.log(`Initialization error: ${error}`);
    return createResponse(false, error.toString());
  }
}

/**
 * Run database tests
 */
function testAll() {
  runAllDatabaseTests();
}

/**
 * Quick test function
 */
function quickTest() {
  Logger.log('Running quick test...');
  
  try {
    // Initialize
    initialize();
    
    // Create test donor
    const donor = createOrGetDonor({
      name: 'Quick Test Donor',
      mobile: '9999888877'
    });
    Logger.log(`✓ Created donor: ${donor.donor_id}`);
    
    // Create test donation
    const donation = createDonation({
      donor_id: donor.donor_id,
      amount: 1000,
      payment_method: PAYMENT_METHOD.UPI
    });
    Logger.log(`✓ Created donation: ${donation.donation_id}`);
    
    // Get form fields
    const fields = getActiveFormFields();
    Logger.log(`✓ Retrieved ${fields.length} form fields`);
    
    // Get stats
    const stats = getDonationStats();
    Logger.log(`✓ Stats: ${JSON.stringify(stats)}`);
    
    Logger.log('✓ Quick test passed');
  } catch (error) {
    Logger.log(`✗ Quick test failed: ${error}`);
  }
}