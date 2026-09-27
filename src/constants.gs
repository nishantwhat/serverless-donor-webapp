/**
 * Application Constants
 * These are immutable values used throughout the application
 */

// ============================================================
// SHEET NAMES
// ============================================================

const SHEET_NAMES = {
  DONATIONS: 'DONATIONS',
  DONORS: 'DONORS',
  PAYMENTS: 'PAYMENTS',
  FORM_FIELDS: 'FORM_FIELDS',
  CONFIGURATION: 'CONFIGURATION',
  AUDIT_LOG: 'AUDIT_LOG'
};

// ============================================================
// DONATION STATUSES
// ============================================================

const DONATION_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

// ============================================================
// PAYMENT STATUSES
// ============================================================

const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

// ============================================================
// PAYMENT METHODS
// ============================================================

const PAYMENT_METHOD = {
  UPI: 'UPI',
  CARD: 'CARD',
  CASH: 'CASH',
  RAZORPAY: 'RAZORPAY',
  PAYUMONEY: 'PAYUMONEY',
  BILLDESK: 'BILLDESK'
};

// ============================================================
// CONFIRMATION TYPES
// ============================================================

const CONFIRMATION_TYPE = {
  MANUAL: 'MANUAL',
  AUTOMATIC: 'AUTOMATIC'
};

// ============================================================
// PROVIDERS
// ============================================================

const PROVIDER = {
  MANUAL: 'MANUAL',
  RAZORPAY: 'RAZORPAY',
  PAYUMONEY: 'PAYUMONEY',
  BILLDESK: 'BILLDESK'
};

// ============================================================
// FORM FIELD TYPES
// ============================================================

const FIELD_TYPE = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  PHONE: 'phone',
  EMAIL: 'email',
  DROPDOWN: 'dropdown',
  CHECKBOX: 'checkbox',
  TEXTAREA: 'textarea'
};

// ============================================================
// AUDIT ACTIONS
// ============================================================

const AUDIT_ACTION = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  DELETED: 'DELETED',
  CONFIRMED_PAYMENT: 'CONFIRMED_PAYMENT',
  GENERATED_RECEIPT: 'GENERATED_RECEIPT',
  EXPORTED_DATA: 'EXPORTED_DATA',
  LOGGED_IN: 'LOGGED_IN',
  LOGGED_OUT: 'LOGGED_OUT',
  UPDATED_CONFIG: 'UPDATED_CONFIG',
  UPDATED_FORM_FIELD: 'UPDATED_FORM_FIELD'
};

// ============================================================
// AUDIT ENTITY TYPES
// ============================================================

const AUDIT_ENTITY_TYPE = {
  DONATION: 'donation',
  DONOR: 'donor',
  PAYMENT: 'payment',
  FORM_FIELD: 'form_field',
  CONFIGURATION: 'configuration',
  RECEIPT: 'receipt'
};

// ============================================================
// CURRENCY
// ============================================================

const CURRENCY = {
  INR: 'INR'
};

// ============================================================
// ID PREFIXES
// ============================================================

const ID_PREFIX = {
  DONATION: 'ROH',
  RECEIPT: 'ROH',
  DONOR: 'D',
  PAYMENT: 'P',
  FIELD: 'F',
  LOG: 'L'
};

// ============================================================
// DEFAULT CONFIGURATION KEYS
// ============================================================

const CONFIG_KEYS = {
  ORG_NAME: 'org_name',
  ORG_LOGO_URL: 'org_logo_url',
  ORG_ADDRESS: 'org_address',
  ORG_UPI_ID: 'org_upi_id',
  ORG_UPI_QR_URL: 'org_upi_qr_image_url',
  RECEIPT_TEMPLATE_DOC_ID: 'receipt_template_doc_id',
  ADMIN_PASSWORD_HASH: 'admin_password_hash',
  RECEIPT_FOOTER_TEXT: 'receipt_footer_text',
  TAX_STATEMENT: 'tax_statement',
  CURRENCY: 'currency',
  DONATION_ID_PREFIX: 'donation_id_prefix',
  RECEIPT_ID_PREFIX: 'receipt_id_prefix',
  CURRENT_YEAR: 'current_year',
  EMAIL_ENABLED: 'email_enabled',
  EMAIL_FROM: 'email_from',
  EMAIL_SUBJECT_PATTERN: 'email_subject_pattern',
  MAX_LOGIN_ATTEMPTS: 'max_login_attempts',
  SESSION_TIMEOUT_MINUTES: 'session_timeout_minutes',
  LAST_RECEIPT_NUMBER: 'last_receipt_number'
};

// ============================================================
// DEFAULT FORM FIELDS
// ============================================================

const DEFAULT_FORM_FIELDS = [
  {
    field_key: 'donor_name',
    label: 'Donor Name',
    type: FIELD_TYPE.TEXT,
    required: true,
    placeholder: 'Your full name'
  },
  {
    field_key: 'mobile',
    label: 'Phone Number',
    type: FIELD_TYPE.PHONE,
    required: true,
    placeholder: 'e.g., 9999999999'
  },
  {
    field_key: 'email',
    label: 'Email Address',
    type: FIELD_TYPE.EMAIL,
    required: false,
    placeholder: 'your@email.com'
  },
  {
    field_key: 'address',
    label: 'Address',
    type: FIELD_TYPE.TEXT,
    required: false,
    placeholder: 'Street address'
  },
  {
    field_key: 'city',
    label: 'City',
    type: FIELD_TYPE.TEXT,
    required: false,
    placeholder: 'City'
  },
  {
    field_key: 'state',
    label: 'State',
    type: FIELD_TYPE.TEXT,
    required: false,
    placeholder: 'State'
  },
  {
    field_key: 'pin',
    label: 'PIN Code',
    type: FIELD_TYPE.TEXT,
    required: false,
    placeholder: '6-digit code'
  },
  {
    field_key: 'company',
    label: 'Company',
    type: FIELD_TYPE.TEXT,
    required: false,
    placeholder: 'Company name (optional)'
  },
  {
    field_key: 'pan',
    label: 'PAN',
    type: FIELD_TYPE.TEXT,
    required: false,
    placeholder: 'PAN (optional)'
  }
];

// ============================================================
// REGEX PATTERNS
// ============================================================

const PATTERNS = {
  PHONE: /^[6-9]\d{9}$/,  // Indian phone (10 digits, starts with 6-9)
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PIN: /^\d{6}$/,  // 6-digit postal code
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  UPI: /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/  // Simple UPI validation
};

// ============================================================
// ERROR MESSAGES
// ============================================================

const ERROR_MESSAGES = {
  SHEET_NOT_FOUND: 'Sheet not found: {sheet}',
  INVALID_INPUT: 'Invalid input: {field}',
  UNAUTHORIZED: 'Unauthorized access',
  CONFIG_NOT_FOUND: 'Configuration not found: {key}',
  DONATION_NOT_FOUND: 'Donation not found: {id}',
  DONOR_NOT_FOUND: 'Donor not found: {id}',
  PAYMENT_NOT_FOUND: 'Payment not found: {id}',
  RECEIPT_GENERATION_FAILED: 'Failed to generate receipt',
  DATABASE_ERROR: 'Database error',
  INVALID_PASSWORD: 'Invalid password',
  SESSION_EXPIRED: 'Session expired'
};

// ============================================================
// SUCCESS MESSAGES
// ============================================================

const SUCCESS_MESSAGES = {
  DONATION_CREATED: 'Donation created successfully',
  PAYMENT_CONFIRMED: 'Payment confirmed',
  RECEIPT_GENERATED: 'Receipt generated',
  CONFIG_UPDATED: 'Configuration updated',
  FORM_FIELD_UPDATED: 'Form field updated',
  DATA_EXPORTED: 'Data exported successfully'
};

// ============================================================
// UI LABELS
// ============================================================

const UI_LABELS = {
  DONATION_ID: 'Donation ID',
  RECEIPT_NUMBER: 'Receipt Number',
  DONOR_NAME: 'Donor Name',
  AMOUNT: 'Amount',
  PAYMENT_METHOD: 'Payment Method',
  STATUS: 'Status',
  DATE: 'Date',
  CREATED_AT: 'Created At',
  CONFIRMED_AT: 'Confirmed At',
  PAYMENT_METHOD_UPI: 'UPI',
  PAYMENT_METHOD_CARD: 'Card',
  PAYMENT_METHOD_CASH: 'Cash',
  CONFIRM: 'Confirm',
  CANCEL: 'Cancel',
  DOWNLOAD_PDF: 'Download PDF',
  PRINT: 'Print',
  SEARCH: 'Search',
  EXPORT: 'Export',
  SETTINGS: 'Settings'
};

// ============================================================
// NUMERICAL CONSTANTS
// ============================================================

const LIMITS = {
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_TIMEOUT_MINUTES: 30,
  RATE_LIMIT_REQUESTS_PER_MINUTE: 60,
  MAX_FORM_FIELDS: 50,
  MIN_DONATION_AMOUNT: 1,
  MAX_DONATION_AMOUNT: 10000000
};

// ============================================================
// DATE/TIME FORMATS
// ============================================================

const DATE_FORMATS = {
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'',
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm:ss',
  YEAR_MONTH: 'yyyy-MM'
};

// ============================================================
// COLORS (for UI)
// ============================================================

const COLORS = {
  PRIMARY: '#0066cc',
  SUCCESS: '#28a745',
  WARNING: '#ffc107',
  DANGER: '#dc3545',
  INFO: '#17a2b8',
  LIGHT: '#f8f9fa',
  DARK: '#343a40'
};