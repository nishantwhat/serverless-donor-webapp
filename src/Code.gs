/**
 * A Ray of Hope - Donation & Receipt Automation System
 * Clean consolidated Code.gs
 * Phase 1 + Phase 2 + Phase 3
 */

// ============================================================
// WEB APP ENTRY POINT (ONLY ONE doGet AND ONE doPost)
// ============================================================

function doGet(e) {
  try {
    const params = e?.parameter || {};
    const page = params.page || 'donor-form';

    switch (page) {
      case 'admin':
        return handleAdminPage(e);
      case 'donor-form':
      default:
        return handleDonorFormPage(e);
    }
  } catch (error) {
    Logger.log(`Error in doGet: ${error}`);
    return HtmlService.createHtmlOutput(`
      <h1>Error</h1>
      <p>${error.toString()}</p>
    `);
  }
}

function doPost(e) {
  try {
    Logger.log('POST event received');

    if (!e) {
      Logger.log('ERROR: No event object');
      return createResponse(false, 'No request event received');
    }

    Logger.log('Parameters: ' + JSON.stringify(e.parameter || {}));

    if (e.postData) {
      Logger.log('PostData type: ' + e.postData.type);
      Logger.log('PostData contents: ' + e.postData.contents);
    }

    let data = {};
    let action = '';

    // 1. JSON request
    if (e.postData &&
        e.postData.contents &&
        e.postData.type &&
        e.postData.type.includes('application/json')) {

      data = JSON.parse(e.postData.contents);
      action = data.action || '';
    }

    // 2. Form-urlencoded / multipart request
    else if (e.parameter) {
      data = Object.assign({}, e.parameter);
      action = data.action || '';
    }

    // 3. Fallback: try parsing postData regardless of content type
    else if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
        action = data.action || '';
      } catch (parseError) {
        Logger.log('Could not parse postData as JSON');
      }
    }

    Logger.log('Final action: ' + action);
    Logger.log('Final data: ' + JSON.stringify(data));

    switch (action) {

      case 'getFormFields':
        return getFormFieldsAPI();

      case 'validateDonorData':
        return validateDonorDataAPI(data);

      case 'createDonation':
        return createDonationAPI(data);

      case 'markPaymentPending':
        return markPaymentPendingAPI(data);

      case 'getConfig':
        return getConfigAPI(data);

      case 'setConfig':
        return setConfigAPI(data);

      default:
        return createResponse(
          false,
          `Unknown action: ${action}`
        );
    }

  } catch (error) {
    Logger.log(`Error in doPost: ${error}`);
    return createResponse(false, error.toString());
  }
}
function testDoPost() {
  const mockEvent = {
    parameter: {
      action: 'getFormFields'
    },
    postData: {
      type: 'application/json',
      contents: JSON.stringify({
        action: 'getFormFields'
      })
    }
  };

  const response = doPost(mockEvent);

  Logger.log(response.getContent());
}

// ============================================================
// PAGE HANDLERS
// ============================================================

function handleDonorFormPage(e) {
  try {
    const html = HtmlService
      .createTemplateFromFile('html/donor-form')
      .evaluate();

    return html;

  } catch (error) {
    Logger.log(`Error loading donor form: ${error}`);
    return HtmlService.createHtmlOutput(`
      <h1>Error Loading Form</h1>
      <p>${error.toString()}</p>
    `);
  }
}

function handleAdminPage(e) {
  try {
    const html = HtmlService
      .createTemplateFromFile('html/admin-dashboard')
      .evaluate();

    return html;

  } catch (error) {
    Logger.log(`Error loading admin page: ${error}`);
    return HtmlService.createHtmlOutput(`
      <h1>Error Loading Admin Panel</h1>
      <p>${error.toString()}</p>
    `);
  }
}
// ============================================================
// API HANDLERS (Call Phase 2 database functions)
// ============================================================

function getFormFieldsAPI() {
  try {
    const fields = getActiveFormFields();
    return createResponse(true, 'Form fields retrieved', {
      fields: fields
    });
  } catch (error) {
    Logger.log(`Error getting form fields: ${error}`);
    return createResponse(false, error.toString());
  }
}
function validateDonorDataAPI(data) {
  try {
    if (!data) {
      return createResponse(false, 'Request data is missing');
    }

    const result = validateDonorData(data);

    return createResponse(
      result.valid,
      result.valid ? 'Valid' : 'Validation failed',
      {
        errors: result.errors
      }
    );

  } catch (error) {
    Logger.log(`Error validating data: ${error}`);
    return createResponse(false, error.toString());
  }
}
function createDonationAPI(data) {
  try {
    if (!data) {
      return createResponse(false, 'Request data is missing');
    }

    Logger.log('Creating donation...');
    Logger.log('Donation data: ' + JSON.stringify(data));

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

    Logger.log('Donor created: ' + donor.donor_id);

    const donation = createDonation({
      donor_id: donor.donor_id,
      amount: parseFloat(data.amount),
      payment_method: data.payment_method
    });

    Logger.log('Donation created: ' + donation.donation_id);

    const payment = createPayment({
      donation_id: donation.donation_id,
      amount: donation.amount,
      payment_method: donation.payment_method
    });

    Logger.log('Payment created: ' + payment.payment_id);

    return createResponse(true, 'Donation created', {
      donation: donation,
      donor: donor,
      payment: payment
    });

  } catch (error) {
    Logger.log(`Error creating donation: ${error}`);
    return createResponse(false, error.toString());
  }
}
function markPaymentPendingAPI(data) {
  try {
    if (!data) {
      return createResponse(false, 'Request data is missing');
    }

    if (!data.donation_id) {
      return createResponse(false, 'donation_id required');
    }

    markAwaitingConfirmation(data.donation_id);

    Logger.log(
      'Donation marked as awaiting confirmation: ' +
      data.donation_id
    );

    return createResponse(true, 'Payment marked as pending', {
      donation_id: data.donation_id
    });

  } catch (error) {
    Logger.log(`Error marking payment pending: ${error}`);
    return createResponse(false, error.toString());
  }
}
function getConfigAPI(data) {
  try {
    data = data || {};

    if (!data.key) {
      return createResponse(false, 'key required');
    }

    const value = getConfig(data.key);

    return createResponse(true, 'Config retrieved', {
      [data.key]: value
    });

  } catch (error) {
    Logger.log(`Error getting config: ${error}`);
    return createResponse(false, error.toString());
  }
}


function setConfigAPI(data) {
  try {
    data = data || {};

    if (!data.key || data.value === undefined) {
      return createResponse(false, 'key and value required');
    }

    setConfig(
      data.key,
      data.value,
      data.updated_by || 'admin@org.com'
    );

    return createResponse(true, 'Config updated');

  } catch (error) {
    Logger.log(`Error setting config: ${error}`);
    return createResponse(false, error.toString());
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function createResponse(success, message, data = null) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: success,
      message: message,
      data: data
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// SYSTEM INITIALIZATION
// ============================================================

function initialize() {
  try {
    Logger.log('Initializing system...');
    
    // Create all sheets
    ensureDonationsSheet();
    ensureDonorsSheet();
    ensurePaymentsSheet();
    ensureFormFieldsSheet();
    ensureConfigurationSheet();
    ensureAuditLogSheet();
    
    // Initialize config
    initializeDefaultConfig();
    
    // Initialize form fields
    initializeDefaultFormFields();
    
    Logger.log('System initialization complete');
    return createResponse(true, 'System initialized');
  } catch (error) {
    Logger.log(`Initialization error: ${error}`);
    return createResponse(false, error.toString());
  }
}
function testValidateDonorDataAPI() {
  const data = {
    donor_name: 'Test Donor',
    mobile: '9999999999',
    email: 'test@example.com'
  };

  const response = validateDonorDataAPI(data);
  Logger.log(response.getContent());
}


function testCreateDonationAPI() {
  const data = {
    donor_name: 'Test Donor',
    mobile: '9999999999',
    email: 'test@example.com',
    address: 'Test Address',
    city: 'Pune',
    state: 'Maharashtra',
    pin: '411001',
    country: 'India',
    amount: 100,
    payment_method: 'UPI'
  };

  const response = createDonationAPI(data);
  Logger.log(response.getContent());
}


function testSetConfigAPI() {
  const data = {
    key: 'test_key',
    value: 'test_value',
    updated_by: 'test@example.com'
  };

  const response = setConfigAPI(data);
  Logger.log(response.getContent());
}
function testAll() {
  runAllDatabaseTests();
}