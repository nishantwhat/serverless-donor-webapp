/**
 * Form Field Management
 * 
 * Handles configurable donor form fields
 * NGO admin can enable/disable, mark required/optional, change order without code changes
 */

/**
 * Initialize default form fields
 * Call once during system setup
 */
function initializeDefaultFormFields() {
  try {
    // Ensure sheet exists
    ensureFormFieldsSheet();
    
    // Check if already initialized
    const fields = getSheetData(SHEET_NAMES.FORM_FIELDS);
    if (fields.length > 0) {
      Logger.log('Form fields already initialized');
      return;
    }
    
    // Add default fields
    let displayOrder = 1;
    for (let field of DEFAULT_FORM_FIELDS) {
      const fieldId = generateFieldId();
      
      const row = {
        field_id: fieldId,
        field_key: field.field_key,
        label: field.label,
        type: field.type,
        required: field.required ? 'TRUE' : 'FALSE',
        enabled: 'TRUE',
        display_order: displayOrder,
        placeholder: field.placeholder || '',
        options: field.options || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      appendRow(SHEET_NAMES.FORM_FIELDS, row);
      displayOrder++;
    }
    
    Logger.log(`Initialized ${DEFAULT_FORM_FIELDS.length} default form fields`);
    return true;
  } catch (error) {
    Logger.log(`Error initializing form fields: ${error}`);
    return false;
  }
}

/**
 * Get all enabled form fields, sorted by display order
 * 
 * @returns {Array} Enabled form fields
 */
function getActiveFormFields() {
  try {
    const fields = getSheetData(SHEET_NAMES.FORM_FIELDS);
    
    // Filter enabled fields and sort by display order
    const active = fields
      .filter(field => field.enabled === 'TRUE' || field.enabled === true)
      .sort((a, b) => parseInt(a.display_order) - parseInt(b.display_order));
    
    return active;
  } catch (error) {
    Logger.log(`Error getting active form fields: ${error}`);
    return [];
  }
}

/**
 * Get a form field by ID
 * 
 * @param {string} fieldId - Field ID
 * @returns {Object|null} Field object or null
 */
function getFormFieldById(fieldId) {
  try {
    return findRow(SHEET_NAMES.FORM_FIELDS, 'field_id', fieldId);
  } catch (error) {
    Logger.log(`Error getting form field: ${error}`);
    return null;
  }
}

/**
 * Get a form field by key
 * 
 * @param {string} fieldKey - Field key (e.g., 'donor_name')
 * @returns {Object|null} Field object or null
 */
function getFormFieldByKey(fieldKey) {
  try {
    return findRow(SHEET_NAMES.FORM_FIELDS, 'field_key', fieldKey);
  } catch (error) {
    Logger.log(`Error getting form field by key: ${error}`);
    return null;
  }
}

/**
 * Update a form field
 * 
 * @param {string} fieldId - Field ID
 * @param {Object} updateData - Fields to update (label, required, enabled, display_order, etc.)
 * @returns {boolean} True if successful
 */
function updateFormField(fieldId, updateData) {
  try {
    const currentField = getFormFieldById(fieldId);
    if (!currentField) {
      throw new Error(`Form field not found: ${fieldId}`);
    }
    
    // Prepare update
    const updated = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    // Convert booleans to strings
    if (updated.required !== undefined) {
      updated.required = updated.required ? 'TRUE' : 'FALSE';
    }
    if (updated.enabled !== undefined) {
      updated.enabled = updated.enabled ? 'TRUE' : 'FALSE';
    }
    
    // Find row index and update
    const sheet = getSheet(SHEET_NAMES.FORM_FIELDS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === fieldId) {
        updateRow(SHEET_NAMES.FORM_FIELDS, i - 1, updated);
        
        // Log action
        logAudit(AUDIT_ACTION.UPDATED_FORM_FIELD, AUDIT_ENTITY_TYPE.FORM_FIELD, fieldId, currentField, updated);
        
        Logger.log(`Form field updated: ${fieldId}`);
        return true;
      }
    }
    
    throw new Error(`Form field not found in sheet: ${fieldId}`);
  } catch (error) {
    Logger.log(`Error updating form field: ${error}`);
    throw error;
  }
}

/**
 * Enable a form field
 * 
 * @param {string} fieldId - Field ID
 * @returns {boolean} True if successful
 */
function enableFormField(fieldId) {
  try {
    return updateFormField(fieldId, { enabled: true });
  } catch (error) {
    Logger.log(`Error enabling form field: ${error}`);
    return false;
  }
}

/**
 * Disable a form field (soft delete)
 * 
 * @param {string} fieldId - Field ID
 * @returns {boolean} True if successful
 */
function disableFormField(fieldId) {
  try {
    return updateFormField(fieldId, { enabled: false });
  } catch (error) {
    Logger.log(`Error disabling form field: ${error}`);
    return false;
  }
}

/**
 * Mark a form field as required
 * 
 * @param {string} fieldId - Field ID
 * @returns {boolean} True if successful
 */
function markFormFieldRequired(fieldId) {
  try {
    return updateFormField(fieldId, { required: true });
  } catch (error) {
    Logger.log(`Error marking field required: ${error}`);
    return false;
  }
}

/**
 * Mark a form field as optional
 * 
 * @param {string} fieldId - Field ID
 * @returns {boolean} True if successful
 */
function markFormFieldOptional(fieldId) {
  try {
    return updateFormField(fieldId, { required: false });
  } catch (error) {
    Logger.log(`Error marking field optional: ${error}`);
    return false;
  }
}

/**
 * Add a custom form field
 * 
 * @param {Object} fieldData - Field data
 * @param {string} fieldData.field_key - Unique key (e.g., 'donation_purpose')
 * @param {string} fieldData.label - Display label
 * @param {string} fieldData.type - Field type (text, number, date, email, phone, dropdown, checkbox)
 * @param {boolean} fieldData.required - Is it required?
 * @param {string} fieldData.placeholder - Placeholder text (optional)
 * @param {string} fieldData.options - Comma-separated options for dropdowns (optional)
 * @returns {Object} Created field
 */
function addCustomFormField(fieldData) {
  try {
    // Validate required fields
    if (!fieldData.field_key || !fieldData.label || !fieldData.type) {
      throw new Error('field_key, label, and type are required');
    }
    
    // Check if key already exists
    const existing = getFormFieldByKey(fieldData.field_key);
    if (existing) {
      throw new Error(`Field key already exists: ${fieldData.field_key}`);
    }
    
    // Validate type
    if (!Object.values(FIELD_TYPE).includes(fieldData.type)) {
      throw new Error(`Invalid field type: ${fieldData.type}`);
    }
    
    // Generate field ID
    const fieldId = generateFieldId();
    
    // Get next display order
    const fields = getSheetData(SHEET_NAMES.FORM_FIELDS);
    const nextOrder = (fields.length + 1);
    
    // Prepare row
    const row = {
      field_id: fieldId,
      field_key: fieldData.field_key,
      label: fieldData.label,
      type: fieldData.type,
      required: fieldData.required ? 'TRUE' : 'FALSE',
      enabled: 'TRUE',
      display_order: nextOrder,
      placeholder: fieldData.placeholder || '',
      options: fieldData.options || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Append to sheet
    appendRow(SHEET_NAMES.FORM_FIELDS, row);
    
    // Log action
    logAudit(AUDIT_ACTION.CREATED, AUDIT_ENTITY_TYPE.FORM_FIELD, fieldId, {}, row);
    
    Logger.log(`Custom form field added: ${fieldId} (${fieldData.field_key})`);
    return row;
  } catch (error) {
    Logger.log(`Error adding custom form field: ${error}`);
    throw error;
  }
}

/**
 * Reorder form fields
 * 
 * @param {Array} fieldOrder - Array of field IDs in desired order
 * @returns {boolean} True if successful
 */
function reorderFormFields(fieldOrder) {
  try {
    let displayOrder = 1;
    
    for (let fieldId of fieldOrder) {
      updateFormField(fieldId, { display_order: displayOrder });
      displayOrder++;
    }
    
    Logger.log('Form fields reordered');
    return true;
  } catch (error) {
    Logger.log(`Error reordering form fields: ${error}`);
    return false;
  }
}

/**
 * Generate a unique field ID
 * Format: F001, F002, etc.
 * 
 * @returns {string} Unique field ID
 */
function generateFieldId() {
  try {
    const fields = getSheetData(SHEET_NAMES.FORM_FIELDS);
    let maxNum = 0;
    
    // Find highest number
    for (let field of fields) {
      const match = field.field_id.match(/F(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    
    // Generate next ID
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `${ID_PREFIX.FIELD}${nextNum}`;
  } catch (error) {
    Logger.log(`Error generating field ID: ${error}`);
    return `${ID_PREFIX.FIELD}001`;
  }
}

/**
 * Build form field validation rules
 * Returns rules for frontend form validation
 * 
 * @returns {Array} Form field definitions with validation
 */
function getFormFieldValidationRules() {
  try {
    const fields = getActiveFormFields();
    const rules = [];
    
    for (let field of fields) {
      const rule = {
        field_key: field.field_key,
        label: field.label,
        type: field.type,
        required: field.required === 'TRUE' || field.required === true,
        placeholder: field.placeholder,
        options: field.options ? field.options.split(',').map(opt => opt.trim()) : []
      };
      
      // Add pattern for specific types
      switch (field.type) {
        case FIELD_TYPE.EMAIL:
          rule.pattern = PATTERNS.EMAIL;
          break;
        case FIELD_TYPE.PHONE:
          rule.pattern = PATTERNS.PHONE;
          break;
        case FIELD_TYPE.PIN:
          rule.pattern = PATTERNS.PIN;
          break;
        case FIELD_TYPE.PAN:
          rule.pattern = PATTERNS.PAN;
          break;
      }
      
      rules.push(rule);
    }
    
    return rules;
  } catch (error) {
    Logger.log(`Error getting validation rules: ${error}`);
    return [];
  }
}

/**
 * Validate donor data against form fields
 * 
 * @param {Object} donorData - Donor data to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validateDonorData(donorData) {
  try {
    const fields = getActiveFormFields();
    const errors = [];
    
    for (let field of fields) {
      const value = donorData[field.field_key];
      
      // Check required fields
      if (field.required === 'TRUE' || field.required === true) {
        if (!value || value.toString().trim() === '') {
          errors.push(`${field.label} is required`);
          continue;
        }
      }
      
      // Skip validation if field is empty and not required
      if (!value || value.toString().trim() === '') {
        continue;
      }
      
      // Validate based on type
      switch (field.type) {
        case FIELD_TYPE.EMAIL:
          if (!isValidEmail(value)) {
            errors.push(`${field.label} is not a valid email`);
          }
          break;
        case FIELD_TYPE.PHONE:
          if (!isValidMobile(value)) {
            errors.push(`${field.label} must be a 10-digit number`);
          }
          break;
        case FIELD_TYPE.PIN:
          if (!PATTERNS.PIN.test(value.toString())) {
            errors.push(`${field.label} must be 6 digits`);
          }
          break;
        case FIELD_TYPE.DATE:
          if (isNaN(Date.parse(value))) {
            errors.push(`${field.label} is not a valid date`);
          }
          break;
        case FIELD_TYPE.NUMBER:
          if (isNaN(parseFloat(value))) {
            errors.push(`${field.label} must be a number`);
          }
          break;
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  } catch (error) {
    Logger.log(`Error validating donor data: ${error}`);
    return { valid: false, errors: [error.toString()] };
  }
}

/**
 * Test form field functions
 */
function testFormFields() {
  Logger.log('Testing form field functions...');
  
  try {
    // Initialize fields
    initializeDefaultFormFields();
    
    // Get active fields
    const active = getActiveFormFields();
    Logger.log(`Active fields: ${active.length}`);
    
    // Get field by key
    const nameField = getFormFieldByKey('donor_name');
    Logger.log(`Name field: ${JSON.stringify(nameField)}`);
    
    // Add custom field
    const custom = addCustomFormField({
      field_key: 'donation_purpose',
      label: 'Donation Purpose',
      type: FIELD_TYPE.DROPDOWN,
      required: false,
      options: 'Medical,Education,General,Other'
    });
    Logger.log(`Custom field added: ${custom.field_id}`);
    
    // Validate donor data
    const validation = validateDonorData({
      donor_name: 'John Doe',
      mobile: '9999999999',
      email: 'john@example.com'
    });
    Logger.log(`Validation result: ${JSON.stringify(validation)}`);
    
    Logger.log('Form field tests passed!');
  } catch (error) {
    Logger.log(`Test error: ${error}`);
  }
}