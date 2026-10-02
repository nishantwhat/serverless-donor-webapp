/**
 * Donation Management
 * 
 * CRUD operations for donation records
 * Handles donation creation, status management, and queries
 */

/**
 * Create a new donation
 * 
 * @param {Object} donationData - Donation data
 * @param {string} donationData.donor_id - Donor ID
 * @param {number} donationData.amount - Donation amount
 * @param {string} donationData.payment_method - UPI / CARD / CASH
 * @param {string} donationData.created_by - Admin email (optional)
 * @param {string} donationData.notes - Optional notes
 * @returns {Object} Created donation
 */
function createDonation(donationData) {
  try {
    // Validate required fields
    if (!donationData.donor_id || !donationData.amount || !donationData.payment_method) {
      throw new Error('donor_id, amount, and payment_method are required');
    }
    
    // Validate amount
    const amount = parseFloat(donationData.amount);
    if (isNaN(amount) || amount < LIMITS.MIN_DONATION_AMOUNT || amount > LIMITS.MAX_DONATION_AMOUNT) {
      throw new Error(`Amount must be between ₹${LIMITS.MIN_DONATION_AMOUNT} and ₹${LIMITS.MAX_DONATION_AMOUNT}`);
    }
    
    // Validate payment method
    if (!Object.values(PAYMENT_METHOD).includes(donationData.payment_method)) {
      throw new Error('Invalid payment method');
    }
    
    // Generate donation ID
    const donationId = generateDonationId();
    
    // Prepare row
    const row = {
      donation_id: donationId,
      donor_id: donationData.donor_id,
      amount: amount,
      currency: CURRENCY.INR,
      payment_method: donationData.payment_method,
      payment_status: DONATION_STATUS.PENDING,
      receipt_number: '',
      receipt_pdf_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: donationData.created_by || 'donor',
      notes: donationData.notes || ''
    };
    
    // Append to DONATIONS sheet
    appendRow(SHEET_NAMES.DONATIONS, row);
    
    Logger.log(`Donation created: ${donationId}`);
    
    // Log action
    logAudit(AUDIT_ACTION.CREATED, AUDIT_ENTITY_TYPE.DONATION, donationId, {}, row);
    
    return row;
  } catch (error) {
    Logger.log(`Error creating donation: ${error}`);
    throw error;
  }
}

/**
 * Get donation by ID
 * 
 * @param {string} donationId - Donation ID
 * @returns {Object|null} Donation object or null
 */
function getDonationById(donationId) {
  try {
    return findRow(SHEET_NAMES.DONATIONS, 'donation_id', donationId);
  } catch (error) {
    Logger.log(`Error getting donation: ${error}`);
    return null;
  }
}

/**
 * Update donation status
 * 
 * @param {string} donationId - Donation ID
 * @param {string} newStatus - New status (DRAFT / PENDING / AWAITING_CONFIRMATION / CONFIRMED / FAILED)
 * @param {Object} additionalData - Other fields to update
 * @returns {boolean} True if successful
 */
function updateDonationStatus(donationId, newStatus, additionalData = {}) {
  try {
    // Validate status
    if (!Object.values(DONATION_STATUS).includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }
    
    // Get current donation
    const currentDonation = getDonationById(donationId);
    if (!currentDonation) {
      throw new Error(`Donation not found: ${donationId}`);
    }
    
    // Prepare update
    const updated = {
      ...additionalData,
      payment_status: newStatus,
      updated_at: new Date().toISOString()
    };
    
    // Find row index and update
    const sheet = getSheet(SHEET_NAMES.DONATIONS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === donationId) {
        updateRow(SHEET_NAMES.DONATIONS, i + 1, updated);
        
        // Log action
        logAudit(AUDIT_ACTION.UPDATED, AUDIT_ENTITY_TYPE.DONATION, donationId, currentDonation, updated);
        
        Logger.log(`Donation status updated: ${donationId} → ${newStatus}`);
        return true;
      }
    }
    
    throw new Error(`Donation not found in sheet: ${donationId}`);
  } catch (error) {
    Logger.log(`Error updating donation status: ${error}`);
    throw error;
  }
}

/**
 * Mark donation as payment pending
 * Called after donor initiates payment
 * 
 * @param {string} donationId - Donation ID
 * @returns {boolean} True if successful
 */
function markPaymentPending(donationId) {
  try {
    return updateDonationStatus(donationId, DONATION_STATUS.PENDING);
  } catch (error) {
    Logger.log(`Error marking payment pending: ${error}`);
    throw error;
  }
}

/**
 * Mark donation as awaiting confirmation
 * Called when donor indicates payment completion
 * 
 * @param {string} donationId - Donation ID
 * @returns {boolean} True if successful
 */
function markAwaitingConfirmation(donationId) {
  try {
    const updated = updateDonationStatus(donationId, DONATION_STATUS.AWAITING_CONFIRMATION);
    
    // Also sync status on matching payment record if present
    const payment = getPaymentByDonationId(donationId);
    if (payment && payment.payment_id) {
      updatePaymentStatus(payment.payment_id, PAYMENT_STATUS.PENDING);
    }
    
    return updated;
  } catch (error) {
    Logger.log(`Error marking awaiting confirmation: ${error}`);
    throw error;
  }
}

/**
 * Confirm a donation (admin action)
 * Sets status to CONFIRMED and generates receipt
 * 
 * @param {string} donationId - Donation ID
 * @param {string} adminEmail - Admin email
 * @returns {boolean} True if successful
 */
function confirmDonation(donationId, adminEmail = 'admin@org.com') {
  try {
    // Get donation
    const donation = getDonationById(donationId);
    if (!donation) {
      throw new Error(`Donation not found: ${donationId}`);
    }
    
    // Check if already confirmed
    if (donation.payment_status === DONATION_STATUS.CONFIRMED) {
      Logger.log(`Donation already confirmed: ${donationId}`);
      return true;  // Idempotent
    }
    
    // Generate receipt number
    const receiptNumber = generateReceiptNumber();
    
    // Update donation
    updateDonationStatus(donationId, DONATION_STATUS.CONFIRMED, {
      receipt_number: receiptNumber
    });
    
    // Log confirmation action
    logAudit(AUDIT_ACTION.CONFIRMED_PAYMENT, AUDIT_ENTITY_TYPE.DONATION, donationId, 
      { status: donation.payment_status },
      { status: DONATION_STATUS.CONFIRMED, receipt_number: receiptNumber },
      `Confirmed by ${adminEmail}`);
    
    Logger.log(`Donation confirmed: ${donationId}, Receipt: ${receiptNumber}`);
    return true;
  } catch (error) {
    Logger.log(`Error confirming donation: ${error}`);
    throw error;
  }
}

/**
 * Get all donations
 * 
 * @returns {Array} Array of donation objects
 */
function getAllDonations() {
  try {
    return getSheetData(SHEET_NAMES.DONATIONS);
  } catch (error) {
    Logger.log(`Error getting all donations: ${error}`);
    return [];
  }
}

/**
 * Get donations by status
 * 
 * @param {string} status - Status to filter by
 * @returns {Array} Matching donations
 */
function getDonationsByStatus(status) {
  try {
    const donations = getAllDonations();
    return donations.filter(d => d.payment_status === status);
  } catch (error) {
    Logger.log(`Error getting donations by status: ${error}`);
    return [];
  }
}

/**
 * Get pending donations (awaiting admin confirmation)
 * 
 * @returns {Array} Pending donations
 */
function getPendingDonations() {
  try {
    return getDonationsByStatus(DONATION_STATUS.AWAITING_CONFIRMATION);
  } catch (error) {
    Logger.log(`Error getting pending donations: ${error}`);
    return [];
  }
}

/**
 * Get confirmed donations
 * 
 * @returns {Array} Confirmed donations
 */
function getConfirmedDonations() {
  try {
    return getDonationsByStatus(DONATION_STATUS.CONFIRMED);
  } catch (error) {
    Logger.log(`Error getting confirmed donations: ${error}`);
    return [];
  }
}

/**
 * Search donations by donor name or ID
 * 
 * @param {string} searchTerm - Search term
 * @returns {Array} Matching donations
 */
function searchDonations(searchTerm) {
  try {
    const donations = getAllDonations();
    const term = searchTerm.toLowerCase();
    
    return donations.filter(donation => {
      // Search by donation ID
      if (donation.donation_id && donation.donation_id.toLowerCase().includes(term)) {
        return true;
      }
      
      // Search by receipt number
      if (donation.receipt_number && donation.receipt_number.toLowerCase().includes(term)) {
        return true;
      }
      
      // Search by donor name (requires lookup)
      const donor = getDonorById(donation.donor_id);
      if (donor && donor.name && donor.name.toLowerCase().includes(term)) {
        return true;
      }
      
      return false;
    });
  } catch (error) {
    Logger.log(`Error searching donations: ${error}`);
    return [];
  }
}

/**
 * Get donations for a specific donor
 * 
 * @param {string} donorId - Donor ID
 * @returns {Array} Donor's donations
 */
function getDonationsByDonor(donorId) {
  try {
    const donations = getAllDonations();
    return donations.filter(d => d.donor_id === donorId);
  } catch (error) {
    Logger.log(`Error getting donor donations: ${error}`);
    return [];
  }
}

/**
 * Get donations in a date range
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Donations in date range
 */
function getDonationsInDateRange(startDate, endDate) {
  try {
    const donations = getAllDonations();
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return donations.filter(donation => {
      const donationDate = new Date(donation.created_at).getTime();
      return donationDate >= start && donationDate <= end;
    });
  } catch (error) {
    Logger.log(`Error getting donations by date range: ${error}`);
    return [];
  }
}

/**
 * Generate a unique donation ID
 * Format: ROH-2026-001, ROH-2026-002, etc.
 * 
 * @returns {string} Unique donation ID
 */
function generateDonationId() {
  try {
    const prefix = getConfig(CONFIG_KEYS.DONATION_ID_PREFIX, ID_PREFIX.DONATION);
    const year = new Date().getFullYear();
    const donations = getAllDonations();
    
    let maxNum = 0;
    const pattern = new RegExp(`${prefix}-${year}-(\\d+)`);
    
    // Find highest number for this year
    for (let donation of donations) {
      const match = donation.donation_id.match(pattern);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    
    // Generate next ID
    const nextNum = (maxNum + 1).toString().padStart(6, '0');
    return `${prefix}-${year}-${nextNum}`;
  } catch (error) {
    Logger.log(`Error generating donation ID: ${error}`);
    return `${ID_PREFIX.DONATION}-${new Date().getFullYear()}-000001`;
  }
}

/**
 * Generate a unique receipt number
 * Format: ROH-2026-000001, ROH-2026-000002, etc.
 * 
 * @returns {string} Unique receipt number
 */
function generateReceiptNumber() {
  try {
    const prefix = getConfig(CONFIG_KEYS.RECEIPT_ID_PREFIX, ID_PREFIX.RECEIPT);
    const year = new Date().getFullYear();
    
    // Get last receipt number from config
    let lastNum = parseInt(getConfig(CONFIG_KEYS.LAST_RECEIPT_NUMBER, '0'));
    lastNum = isNaN(lastNum) ? 0 : lastNum;
    
    // Increment
    lastNum++;
    
    // Save updated number
    setConfig(CONFIG_KEYS.LAST_RECEIPT_NUMBER, lastNum.toString());
    
    // Generate receipt number
    const receiptNum = lastNum.toString().padStart(6, '0');
    const receiptNumber = `${prefix}-${year}-${receiptNum}`;
    
    Logger.log(`Generated receipt number: ${receiptNumber}`);
    return receiptNumber;
  } catch (error) {
    Logger.log(`Error generating receipt number: ${error}`);
    throw error;
  }
}

/**
 * Count total donations
 * 
 * @returns {number} Total donation count
 */
function countDonations() {
  try {
    return countRows(SHEET_NAMES.DONATIONS);
  } catch (error) {
    Logger.log(`Error counting donations: ${error}`);
    return 0;
  }
}

/**
 * Get donation summary statistics
 * 
 * @returns {Object} Statistics object
 */
function getDonationStats() {
  try {
    const donations = getAllDonations();
    
    let totalAmount = 0;
    let totalCount = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    let byMethod = {};
    
    for (let donation of donations) {
      totalCount++;
      totalAmount += parseFloat(donation.amount) || 0;
      
      if (donation.payment_status === DONATION_STATUS.CONFIRMED) {
        confirmedCount++;
      } else if (donation.payment_status === DONATION_STATUS.AWAITING_CONFIRMATION) {
        pendingCount++;
      }
      
      // Count by method
      const method = donation.payment_method;
      byMethod[method] = (byMethod[method] || 0) + 1;
    }
    
    return {
      total_count: totalCount,
      total_amount: totalAmount,
      confirmed_count: confirmedCount,
      pending_count: pendingCount,
      by_method: byMethod
    };
  } catch (error) {
    Logger.log(`Error getting donation stats: ${error}`);
    return {};
  }
}

/**
 * Test donation functions
 */
function testDonation() {
  Logger.log('Testing donation functions...');
  
  try {
    // Create test donor first
    const donor = createOrGetDonor({
      name: 'Test Donor',
      mobile: '9888888888'
    });
    
    // Create test donation
    const donation = createDonation({
      donor_id: donor.donor_id,
      amount: 5000,
      payment_method: PAYMENT_METHOD.UPI
    });
    Logger.log(`Created donation: ${JSON.stringify(donation)}`);
    
    // Get donation
    const retrieved = getDonationById(donation.donation_id);
    Logger.log(`Retrieved donation: ${JSON.stringify(retrieved)}`);
    
    // Mark as payment pending
    markPaymentPending(donation.donation_id);
    Logger.log(`Marked as payment pending`);
    
    // Mark as awaiting confirmation
    markAwaitingConfirmation(donation.donation_id);
    Logger.log(`Marked as awaiting confirmation`);
    
    // Confirm donation
    confirmDonation(donation.donation_id);
    Logger.log(`Donation confirmed`);
    
    // Get stats
    const stats = getDonationStats();
    Logger.log(`Stats: ${JSON.stringify(stats)}`);
    
    Logger.log('Donation tests passed!');
  } catch (error) {
    Logger.log(`Test error: ${error}`);
  }
}