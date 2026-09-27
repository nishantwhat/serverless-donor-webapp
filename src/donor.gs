/**
 * Donor Management
 * 
 * CRUD operations for donor records
 * Handles donor creation, retrieval, updates
 */

/**
 * Create or get a donor
 * Returns existing donor if found by mobile, creates new if not
 * 
 * @param {Object} donorData - Donor information object
 * @param {string} donorData.name - Donor name
 * @param {string} donorData.mobile - Mobile number (unique identifier)
 * @param {string} donorData.email - Email (optional)
 * @param {string} donorData.address - Address (optional)
 * @param {string} donorData.city - City (optional)
 * @param {string} donorData.state - State (optional)
 * @param {string} donorData.pin - PIN (optional)
 * @param {string} donorData.country - Country (optional, default: India)
 * @param {string} donorData.pan - PAN (optional)
 * @param {string} donorData.dob - DOB (optional)
 * @param {string} donorData.occupation - Occupation (optional)
 * @param {string} donorData.company - Company (optional)
 * @returns {Object} Donor object with donor_id
 */
function createOrGetDonor(donorData) {
  try {
    // Validate required fields
    if (!donorData.name || !donorData.mobile) {
      throw new Error('Donor name and mobile are required');
    }
    
    // Normalize mobile (remove spaces/special chars)
    donorData.mobile = normalizeMobile(donorData.mobile);
    
    // Check if donor exists by mobile
    let existingDonor = findDonorByMobile(donorData.mobile);
    if (existingDonor) {
      Logger.log(`Donor found: ${existingDonor.donor_id}`);
      // Update if new data provided
      updateDonor(existingDonor.donor_id, donorData);
      return existingDonor;
    }
    
    // Create new donor
    return createDonor(donorData);
  } catch (error) {
    Logger.log(`Error in createOrGetDonor: ${error}`);
    throw error;
  }
}

/**
 * Create a new donor record
 * 
 * @param {Object} donorData - Donor data
 * @returns {Object} Created donor with donor_id
 */
function createDonor(donorData) {
  try {
    // Generate donor ID
    const donorId = generateDonorId();
    
    // Prepare row
    const row = {
      donor_id: donorId,
      name: donorData.name || '',
      mobile: donorData.mobile || '',
      email: donorData.email || '',
      address: donorData.address || '',
      city: donorData.city || '',
      state: donorData.state || '',
      pin: donorData.pin || '',
      country: donorData.country || 'India',
      pan: donorData.pan || '',
      dob: donorData.dob || '',
      occupation: donorData.occupation || '',
      company: donorData.company || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Append to DONORS sheet
    appendRow(SHEET_NAMES.DONORS, row);
    
    Logger.log(`Donor created: ${donorId}`);
    
    // Log action
    logAudit(AUDIT_ACTION.CREATED, AUDIT_ENTITY_TYPE.DONOR, donorId, {}, row);
    
    return row;
  } catch (error) {
    Logger.log(`Error creating donor: ${error}`);
    throw error;
  }
}

/**
 * Get donor by ID
 * 
 * @param {string} donorId - Donor ID
 * @returns {Object|null} Donor object or null
 */
function getDonorById(donorId) {
  try {
    return findRow(SHEET_NAMES.DONORS, 'donor_id', donorId);
  } catch (error) {
    Logger.log(`Error getting donor: ${error}`);
    return null;
  }
}

/**
 * Get donor by mobile number
 * 
 * @param {string} mobile - Mobile number
 * @returns {Object|null} Donor object or null
 */
function findDonorByMobile(mobile) {
  try {
    const normalizedMobile = normalizeMobile(mobile);
    return findRow(SHEET_NAMES.DONORS, 'mobile', normalizedMobile);
  } catch (error) {
    Logger.log(`Error finding donor by mobile: ${error}`);
    return null;
  }
}

/**
 * Update donor record
 * 
 * @param {string} donorId - Donor ID
 * @param {Object} updateData - Fields to update
 * @returns {boolean} True if successful
 */
function updateDonor(donorId, updateData) {
  try {
    // Get current donor
    const currentDonor = getDonorById(donorId);
    if (!currentDonor) {
      throw new Error(`Donor not found: ${donorId}`);
    }
    
    // Prepare update
    const updated = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    // Find row index
    const sheet = getSheet(SHEET_NAMES.DONORS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === donorId) {
        updateRow(SHEET_NAMES.DONORS, i - 1, updated);
        
        // Log action
        logAudit(AUDIT_ACTION.UPDATED, AUDIT_ENTITY_TYPE.DONOR, donorId, currentDonor, updated);
        
        Logger.log(`Donor updated: ${donorId}`);
        return true;
      }
    }
    
    throw new Error(`Donor not found in sheet: ${donorId}`);
  } catch (error) {
    Logger.log(`Error updating donor: ${error}`);
    throw error;
  }
}

/**
 * Get all donors
 * 
 * @returns {Array} Array of donor objects
 */
function getAllDonors() {
  try {
    return getSheetData(SHEET_NAMES.DONORS);
  } catch (error) {
    Logger.log(`Error getting all donors: ${error}`);
    return [];
  }
}

/**
 * Search donors by name
 * 
 * @param {string} searchTerm - Name to search for
 * @returns {Array} Matching donors
 */
function searchDonorsByName(searchTerm) {
  try {
    const donors = getAllDonors();
    const term = searchTerm.toLowerCase();
    
    return donors.filter(donor =>
      donor.name && donor.name.toLowerCase().includes(term)
    );
  } catch (error) {
    Logger.log(`Error searching donors: ${error}`);
    return [];
  }
}

/**
 * Generate a unique donor ID
 * Format: D001, D002, etc.
 * 
 * @returns {string} Unique donor ID
 */
function generateDonorId() {
  try {
    const donors = getAllDonors();
    let maxNum = 0;
    
    // Find highest number
    for (let donor of donors) {
      const match = donor.donor_id.match(/D(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    
    // Generate next ID
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `${ID_PREFIX.DONOR}${nextNum}`;
  } catch (error) {
    Logger.log(`Error generating donor ID: ${error}`);
    return `${ID_PREFIX.DONOR}001`;
  }
}

/**
 * Normalize mobile number (remove spaces, dashes, etc.)
 * 
 * @param {string} mobile - Mobile number
 * @returns {string} Normalized mobile
 */
function normalizeMobile(mobile) {
  if (!mobile) return '';
  return mobile.toString().replace(/\D/g, '').slice(-10);
}

/**
 * Validate mobile number format
 * 
 * @param {string} mobile - Mobile number to validate
 * @returns {boolean} True if valid
 */
function isValidMobile(mobile) {
  if (!mobile) return false;
  const normalized = normalizeMobile(mobile);
  return PATTERNS.PHONE.test(normalized);
}

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  if (!email) return true; // Email is optional
  return PATTERNS.EMAIL.test(email);
}

/**
 * Count total donors
 * 
 * @returns {number} Total donor count
 */
function countDonors() {
  try {
    return countRows(SHEET_NAMES.DONORS);
  } catch (error) {
    Logger.log(`Error counting donors: ${error}`);
    return 0;
  }
}

/**
 * Delete donor (soft delete - mark inactive)
 * Note: We don't hard delete to preserve historical records
 * 
 * @param {string} donorId - Donor ID
 * @returns {boolean} True if successful
 */
function softDeleteDonor(donorId) {
  try {
    // Add an 'active' flag instead of deleting
    updateDonor(donorId, { active: false });
    Logger.log(`Donor deactivated: ${donorId}`);
    return true;
  } catch (error) {
    Logger.log(`Error deleting donor: ${error}`);
    return false;
  }
}

/**
 * Test donor functions
 */
function testDonor() {
  Logger.log('Testing donor functions...');
  
  try {
    // Create test donor
    const donor = createOrGetDonor({
      name: 'Test Donor',
      mobile: '9999999999',
      email: 'test@example.com',
      city: 'Mumbai',
      state: 'MH'
    });
    Logger.log(`Created donor: ${JSON.stringify(donor)}`);
    
    // Get donor
    const retrieved = getDonorById(donor.donor_id);
    Logger.log(`Retrieved donor: ${JSON.stringify(retrieved)}`);
    
    // Search donor
    const found = findDonorByMobile('9999999999');
    Logger.log(`Found by mobile: ${JSON.stringify(found)}`);
    
    // Count donors
    const count = countDonors();
    Logger.log(`Total donors: ${count}`);
    
    Logger.log('Donor tests passed!');
  } catch (error) {
    Logger.log(`Test error: ${error}`);
  }
}