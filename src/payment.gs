/**
 * Payment Management - Abstraction Layer
 * 
 * Common payment processing for all methods (UPI, CARD, CASH, GATEWAY)
 * Handles payment creation, status tracking, and confirmation
 */

/**
 * Create a payment record
 * 
 * @param {Object} paymentData - Payment data
 * @param {string} paymentData.donation_id - Donation ID
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.payment_method - UPI / CARD / CASH / GATEWAY
 * @param {Object} paymentData.gateway_response - (Optional) Gateway response for automatic payments
 * @returns {Object} Created payment record
 */
function createPayment(paymentData) {
  try {
    // Validate required fields
    if (!paymentData.donation_id || !paymentData.amount || !paymentData.payment_method) {
      throw new Error('donation_id, amount, and payment_method are required');
    }
    
    // Validate amount
    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }
    
    // Generate payment ID
    const paymentId = generatePaymentId();
    
    // Determine confirmation type based on payment method
    const confirmationType = getConfirmationType(paymentData.payment_method);
    const provider = getProvider(paymentData.payment_method);
    
    // Prepare base payment record
    const row = {
      payment_id: paymentId,
      donation_id: paymentData.donation_id,
      amount: amount,
      currency: CURRENCY.INR,
      payment_method: paymentData.payment_method,
      payment_status: PAYMENT_STATUS.PENDING,
      transaction_id: paymentData.transaction_id || '',
      provider: provider,
      provider_payment_id: '',
      provider_order_id: '',
      provider_metadata: '{}',
      confirmed_by: '',
      confirmed_at: '',
      payment_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // If gateway response provided (automatic payment), populate gateway fields
    if (paymentData.gateway_response) {
      row.provider_payment_id = paymentData.gateway_response.payment_id || '';
      row.provider_order_id = paymentData.gateway_response.order_id || '';
      row.transaction_id = paymentData.gateway_response.transaction_id || '';
      row.provider_metadata = JSON.stringify(paymentData.gateway_response.metadata || {});
      
      // For gateway payments, mark as confirmed immediately
      row.payment_status = PAYMENT_STATUS.CONFIRMED;
      row.confirmed_by = 'GATEWAY';
      row.confirmed_at = new Date().toISOString();
    }
    
    // Append to PAYMENTS sheet
    appendRow(SHEET_NAMES.PAYMENTS, row);
    
    Logger.log(`Payment created: ${paymentId}`);
    
    // Log action
    logAudit(AUDIT_ACTION.CREATED, AUDIT_ENTITY_TYPE.PAYMENT, paymentId, {}, row);
    
    return row;
  } catch (error) {
    Logger.log(`Error creating payment: ${error}`);
    throw error;
  }
}

/**
 * Get payment by ID
 * 
 * @param {string} paymentId - Payment ID
 * @returns {Object|null} Payment object or null
 */
function getPaymentById(paymentId) {
  try {
    return findRow(SHEET_NAMES.PAYMENTS, 'payment_id', paymentId);
  } catch (error) {
    Logger.log(`Error getting payment: ${error}`);
    return null;
  }
}

/**
 * Get payment by donation ID
 * 
 * @param {string} donationId - Donation ID
 * @returns {Object|null} Payment object or null
 */
function getPaymentByDonationId(donationId) {
  try {
    return findRow(SHEET_NAMES.PAYMENTS, 'donation_id', donationId);
  } catch (error) {
    Logger.log(`Error getting payment by donation: ${error}`);
    return null;
  }
}

/**
 * Confirm a payment (manual admin action)
 * 
 * @param {string} paymentId - Payment ID
 * @param {string} adminEmail - Admin email
 * @param {string} transactionId - (Optional) Transaction ID/reference
 * @returns {boolean} True if successful
 */
function confirmPayment(paymentId, adminEmail = 'admin@org.com', transactionId = '') {
  try {
    // Get current payment
    const currentPayment = getPaymentById(paymentId);
    if (!currentPayment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }
    
    // Check if already confirmed
    if (currentPayment.payment_status === PAYMENT_STATUS.CONFIRMED) {
      Logger.log(`Payment already confirmed: ${paymentId}`);
      return true;  // Idempotent
    }
    
    // Prepare update
    const updated = {
      payment_status: PAYMENT_STATUS.CONFIRMED,
      confirmed_by: adminEmail,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add transaction ID if provided
    if (transactionId) {
      updated.transaction_id = transactionId;
    }
    
    // Find row index and update
    const sheet = getSheet(SHEET_NAMES.PAYMENTS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === paymentId) {
        updateRow(SHEET_NAMES.PAYMENTS, i - 1, updated);
        
        // Log action
        logAudit(AUDIT_ACTION.CONFIRMED_PAYMENT, AUDIT_ENTITY_TYPE.PAYMENT, paymentId, currentPayment, updated);
        
        // Also update donation status
        const donation = getDonationById(currentPayment.donation_id);
        if (donation) {
          updateDonationStatus(donation.donation_id, DONATION_STATUS.CONFIRMED, {
            receipt_number: generateReceiptNumber()
          });
        }
        
        Logger.log(`Payment confirmed: ${paymentId}`);
        return true;
      }
    }
    
    throw new Error(`Payment not found in sheet: ${paymentId}`);
  } catch (error) {
    Logger.log(`Error confirming payment: ${error}`);
    throw error;
  }
}

/**
 * Mark payment as failed
 * 
 * @param {string} paymentId - Payment ID
 * @param {string} reason - Reason for failure
 * @returns {boolean} True if successful
 */
function failPayment(paymentId, reason = 'Unknown error') {
  try {
    const updated = {
      payment_status: PAYMENT_STATUS.FAILED,
      updated_at: new Date().toISOString()
    };
    
    // Find row index and update
    const sheet = getSheet(SHEET_NAMES.PAYMENTS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === paymentId) {
        updateRow(SHEET_NAMES.PAYMENTS, i - 1, updated);
        
        // Log action
        logAudit(AUDIT_ACTION.UPDATED, AUDIT_ENTITY_TYPE.PAYMENT, paymentId, 
          { status: data[i][5] }, updated, `Failed: ${reason}`);
        
        Logger.log(`Payment failed: ${paymentId} - ${reason}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    Logger.log(`Error failing payment: ${error}`);
    return false;
  }
}

/**
 * Get all payments
 * 
 * @returns {Array} Array of payment objects
 */
function getAllPayments() {
  try {
    return getSheetData(SHEET_NAMES.PAYMENTS);
  } catch (error) {
    Logger.log(`Error getting all payments: ${error}`);
    return [];
  }
}

/**
 * Get payments by status
 * 
 * @param {string} status - Status to filter by
 * @returns {Array} Matching payments
 */
function getPaymentsByStatus(status) {
  try {
    const payments = getAllPayments();
    return payments.filter(p => p.payment_status === status);
  } catch (error) {
    Logger.log(`Error getting payments by status: ${error}`);
    return [];
  }
}

/**
 * Get pending payments (awaiting manual confirmation)
 * 
 * @returns {Array} Pending payments
 */
function getPendingPayments() {
  try {
    return getPaymentsByStatus(PAYMENT_STATUS.PENDING);
  } catch (error) {
    Logger.log(`Error getting pending payments: ${error}`);
    return [];
  }
}

/**
 * Get confirmed payments
 * 
 * @returns {Array} Confirmed payments
 */
function getConfirmedPayments() {
  try {
    return getPaymentsByStatus(PAYMENT_STATUS.CONFIRMED);
  } catch (error) {
    Logger.log(`Error getting confirmed payments: ${error}`);
    return [];
  }
}

/**
 * Get payments by method
 * 
 * @param {string} method - Payment method
 * @returns {Array} Payments using that method
 */
function getPaymentsByMethod(method) {
  try {
    const payments = getAllPayments();
    return payments.filter(p => p.payment_method === method);
  } catch (error) {
    Logger.log(`Error getting payments by method: ${error}`);
    return [];
  }
}

/**
 * Determine confirmation type based on payment method
 * Manual methods require admin confirmation
 * Gateway methods are automatic
 * 
 * @param {string} paymentMethod - Payment method
 * @returns {string} Confirmation type (MANUAL or AUTOMATIC)
 */
function getConfirmationType(paymentMethod) {
  if (paymentMethod === PAYMENT_METHOD.RAZORPAY ||
      paymentMethod === PAYMENT_METHOD.PAYUMONEY ||
      paymentMethod === PAYMENT_METHOD.BILLDESK) {
    return CONFIRMATION_TYPE.AUTOMATIC;
  }
  return CONFIRMATION_TYPE.MANUAL;
}

/**
 * Determine provider based on payment method
 * 
 * @param {string} paymentMethod - Payment method
 * @returns {string} Provider name
 */
function getProvider(paymentMethod) {
  const methodToProvider = {
    [PAYMENT_METHOD.UPI]: PROVIDER.MANUAL,
    [PAYMENT_METHOD.CARD]: PROVIDER.MANUAL,
    [PAYMENT_METHOD.CASH]: PROVIDER.MANUAL,
    [PAYMENT_METHOD.RAZORPAY]: PROVIDER.RAZORPAY,
    [PAYMENT_METHOD.PAYUMONEY]: PROVIDER.PAYUMONEY,
    [PAYMENT_METHOD.BILLDESK]: PROVIDER.BILLDESK
  };
  
  return methodToProvider[paymentMethod] || PROVIDER.MANUAL;
}

/**
 * Generate a unique payment ID
 * Format: P001, P002, etc.
 * 
 * @returns {string} Unique payment ID
 */
function generatePaymentId() {
  try {
    const payments = getAllPayments();
    let maxNum = 0;
    
    // Find highest number
    for (let payment of payments) {
      const match = payment.payment_id.match(/P(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    
    // Generate next ID
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `${ID_PREFIX.PAYMENT}${nextNum}`;
  } catch (error) {
    Logger.log(`Error generating payment ID: ${error}`);
    return `${ID_PREFIX.PAYMENT}001`;
  }
}

/**
 * Get payment statistics
 * 
 * @returns {Object} Payment statistics
 */
function getPaymentStats() {
  try {
    const payments = getAllPayments();
    
    let totalAmount = 0;
    let confirmedAmount = 0;
    let pendingAmount = 0;
    let byMethod = {};
    let byProvider = {};
    
    for (let payment of payments) {
      const amount = parseFloat(payment.amount) || 0;
      totalAmount += amount;
      
      if (payment.payment_status === PAYMENT_STATUS.CONFIRMED) {
        confirmedAmount += amount;
      } else if (payment.payment_status === PAYMENT_STATUS.PENDING) {
        pendingAmount += amount;
      }
      
      // Count by method
      const method = payment.payment_method;
      byMethod[method] = (byMethod[method] || 0) + 1;
      
      // Count by provider
      const provider = payment.provider;
      byProvider[provider] = (byProvider[provider] || 0) + 1;
    }
    
    return {
      total_amount: totalAmount,
      confirmed_amount: confirmedAmount,
      pending_amount: pendingAmount,
      by_method: byMethod,
      by_provider: byProvider
    };
  } catch (error) {
    Logger.log(`Error getting payment stats: ${error}`);
    return {};
  }
}

/**
 * Test payment functions
 */
function testPayment() {
  Logger.log('Testing payment functions...');
  
  try {
    // Create test donor and donation
    const donor = createOrGetDonor({
      name: 'Payment Test Donor',
      mobile: '9777777777'
    });
    
    const donation = createDonation({
      donor_id: donor.donor_id,
      amount: 10000,
      payment_method: PAYMENT_METHOD.UPI
    });
    
    // Create payment
    const payment = createPayment({
      donation_id: donation.donation_id,
      amount: donation.amount,
      payment_method: PAYMENT_METHOD.UPI
    });
    Logger.log(`Created payment: ${JSON.stringify(payment)}`);
    
    // Get payment
    const retrieved = getPaymentById(payment.payment_id);
    Logger.log(`Retrieved payment: ${JSON.stringify(retrieved)}`);
    
    // Get by donation
    const byDonation = getPaymentByDonationId(donation.donation_id);
    Logger.log(`Payment by donation: ${JSON.stringify(byDonation)}`);
    
    // Confirm payment
    confirmPayment(payment.payment_id, 'test@admin.com', 'TXN-TEST-123');
    Logger.log(`Payment confirmed`);
    
    // Get stats
    const stats = getPaymentStats();
    Logger.log(`Stats: ${JSON.stringify(stats)}`);
    
    Logger.log('Payment tests passed!');
  } catch (error) {
    Logger.log(`Test error: ${error}`);
  }
}