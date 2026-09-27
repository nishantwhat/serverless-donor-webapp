# System Architecture - A Ray of Hope Donation System

## High-Level Overview

The system provides a complete donation workflow:

**Donor Fills Form** ➔ **Pays** ➔ **Admin Confirms** ➔ **Receipt Generated** ➔ **Donor Downloads**


All data flows through a central database (Google Sheets) and configuration system.

## Component Architecture
graph TD
    subgraph WEB_APP [GOOGLE APPS SCRIPT WEB APPLICATION]
        subgraph FRONTEND [FRONTEND LAYER]
            DONOR["<b>Donor Section</b> (Public)<br>• Donation Form<br>• Payment Method Select<br>• Receipt View/Download<br>• UPI QR Display<br>• Status Messages"]
            ADMIN["<b>Admin Section</b> (Protected)<br>• Dashboard<br>• Payment Confirmation<br>• Form Config<br>• Receipt Config<br>• Data Export<br>• Audit Log<br>• Settings"]
        end

        subgraph BACKEND [APPS SCRIPT BACKEND LAYER]
            LOGIC["• Donation & Donor Management (CRUD)<br>• Payment Abstraction (UPI/CARD/CASH)<br>• Receipt Generation & PDF Export<br>• Form Field Configuration<br>• Authentication & Audit Logging<br>• Configuration Management"]
        end
    end

    DB[(Google Sheets<br>Database)]
    ST[Google Drive<br>Storage]
    TP[Google Docs<br>Template]

    FRONTEND --> BACKEND
    BACKEND --> DB
    BACKEND --> ST
    BACKEND --> TP

    style WEB_APP fill:#f9f9f9,stroke:#333,stroke-width:2px
    style FRONTEND fill:#fff,stroke:#666
    style BACKEND fill:#fff,stroke:#666


## Data Flow

### Donation Creation Flow
Donor opens form (public URL)
System renders form fields (fetched from FORM_FIELDS sheet)
Donor fills form, selects payment method
Form submitted → Apps Script backend
Backend creates DONATION record (status: DRAFT)
Backend creates DONOR record (or references existing)
Backend creates PAYMENT record (status: PENDING)
Return donation_id and payment_method-specific details
Frontend displays payment instructions (UPI QR / Card info / Cash info)
Donor pays
For UPI: Donor clicks "I completed payment" → status: AWAITING_CONFIRMATION
System waits for admin confirmation

### Payment Confirmation Flow
Admin views "Pending Payments" dashboard
Sees list of awaiting-confirmation donations
Admin verifies payment in actual bank/UPI app
Admin clicks "Confirm" button
Apps Script updates PAYMENT status: CONFIRMED
Apps Script triggers receipt generation
Receipt generated from Google Docs template
PDF saved to Google Drive
DONATION record updated with receipt_pdf_url
Donor sees receipt available for download

### Receipt Generation Flow
Admin clicks "Confirm Payment"
Trigger: GenerateReceipt(donation_id)
Fetch donation data from DONATIONS sheet
Fetch donor data from DONORS sheet
Fetch receipt template from Google Docs
Replace placeholders: {{DONOR_NAME}} → "John Doe", etc.
Convert HTML/template to PDF
Save PDF to Google Drive in organized folder
Generate shareable link
Store link in DONATIONS record
Log action to AUDIT_LOG
Return success

## Data Model - Detailed

### Tables in Google Sheets

#### DONATIONS Sheet

Columns:
donation_id (PK) | String | ROH-2026-XXXXX
donor_id (FK) | String | Reference to DONORS
amount | Number | ₹ amount
currency | String | INR
payment_method | String | UPI / CARD / CASH
payment_status | String | DRAFT / PENDING / AWAITING_CONFIRMATION / CONFIRMED / FAILED
receipt_number | String | ROH-2026-000001 (unique, generated at confirmation)
receipt_pdf_url | String | Google Drive link to PDF
created_at | Timestamp | ISO 8601
updated_at | Timestamp | ISO 8601
created_by | String | User email (if admin-created)
notes | String | Optional admin notes

Sample Row:
ROH-2026-001 | D001 | 5000 | INR | UPI | CONFIRMED | ROH-2026-000001 | https://drive.google.com/file/d/... | 2026-01-15T10:15:00Z | 2026-01-15T10:30:00Z | admin@org | "Thank you message"


#### DONORS Sheet

Columns:
donor_id (PK) | String | D001, D002, etc.
name | String | Full name
mobile | String | Phone number (10 digits)
email | String | Email address
address | String | Street address
city | String | City
state | String | State
pin | String | Postal code
country | String | Country (default: India)
pan | String | PAN (optional)
dob | Date | YYYY-MM-DD (optional)
occupation | String | Occupation (optional)
company | String | Company name (optional)
created_at | Timestamp | ISO 8601
updated_at | Timestamp | ISO 8601

Sample Row:
D001 | John Doe | 9999999999 | john@email.com | 123 Main St | Mumbai | MH | 400001 | India | ABCDE1234F | 1980-05-15 | Engineer | TechCorp | 2026-01-15T10:15:00Z | 2026-01-15T10:15:00Z


#### PAYMENTS Sheet

Columns:
payment_id (PK) | String | P001, P002, etc.
donation_id (FK) | String | Reference to DONATIONS
amount | Number | ₹ amount
currency | String | INR
payment_method | String | UPI / CARD / CASH / RAZORPAY / etc.
payment_status | String | PENDING / CONFIRMED / FAILED
transaction_id | String | TXN-123 (optional for manual, populated by gateway)
provider | String | MANUAL / RAZORPAY / PAYUMONEY / etc.
provider_payment_id | String | Payment ID from gateway (blank for manual)
provider_order_id | String | Order ID from gateway (blank for manual)
provider_metadata | String | JSON string with additional provider data
confirmed_by | String | Admin email (who confirmed)
confirmed_at | Timestamp | When payment confirmed (ISO 8601)
payment_timestamp | Timestamp | When payment actually made (ISO 8601)
created_at | Timestamp | ISO 8601
updated_at | Timestamp | ISO 8601

Sample Row (Manual UPI):
P001 | ROH-2026-001 | 5000 | INR | UPI | CONFIRMED | TXN-ABC-123 | MANUAL | (blank) | (blank) | {} | admin@org | 2026-01-15T10:30:00Z | 2026-01-15T10:20:00Z | 2026-01-15T10:15:00Z | 2026-01-15T10:15:00Z

Sample Row (Future Gateway):
P002 | ROH-2026-002 | 10000 | INR | RAZORPAY | CONFIRMED | (blank) | RAZORPAY | pay_123xyz | order_456abc | {...metadata} | admin@org | 2026-01-15T10:40:00Z | 2026-01-15T10:35:00Z | 2026-01-15T10:15:00Z


#### FORM_FIELDS Sheet

Columns:
field_id (PK) | String | F001, F002, etc.
field_key | String | donor_name, mobile, email, etc. (unique)
label | String | Display label ("Donor Name", "Phone", etc.)
type | String | text / number / date / phone / email / dropdown / checkbox
required | Boolean | true / false
enabled | Boolean | true / false (disable without deleting)
display_order | Number | Sort order in form
placeholder | String | Hint text (e.g., "e.g., 9999999999")
options | String | For dropdowns (comma-separated: "Option1,Option2,Option3")
created_at | Timestamp | ISO 8601
updated_at | Timestamp | ISO 8601

Sample Rows:
F001 | donor_name | Donor Name | text | true | true | 1 | "Your name" | (blank) | 2026-01-01T00:00:00Z
F002 | mobile | Phone Number | phone | true | true | 2 | "10-digit number" | (blank) | 2026-01-01T00:00:00Z
F003 | email | Email Address | email | false | true | 3 | "your@email.com" | (blank) | 2026-01-01T00:00:00Z
F004 | company | Company Name | text | false | true | 5 | "(optional)" | (blank) | 2026-01-01T00:00:00Z
F005 | donation_purpose | Purpose | dropdown | false | true | 6 | "Select..." | "Medical,Education,General" | 2026-01-01T00:00:00Z


#### CONFIGURATION Sheet

Columns:
config_key (PK) | String | Unique configuration key
config_value | String | Configuration value
updated_at | Timestamp | ISO 8601
updated_by | String | Admin email

Sample Rows:
org_name | A Ray of Hope | 2026-01-01T00:00:00Z | (initial)
org_logo_url | https://drive.google.com/uc?id=... | 2026-01-01T00:00:00Z | (initial)
org_address | 123 Charity Lane, Mumbai | 2026-01-01T00:00:00Z | (initial)
org_upi_id | arayofhope@upi | 2026-01-01T00:00:00Z | (initial)
org_upi_qr_image_url | https://drive.google.com/uc?id=... | 2026-01-01T00:00:00Z | (initial)
receipt_template_doc_id | 1234567890abcdef... | 2026-01-01T00:00:00Z | (initial)
admin_password_hash | $2b$10$...bcrypt_hash... | 2026-01-01T00:00:00Z | admin@org
receipt_footer_text | "Thank you for your generous donation"| 2026-01-01T00:00:00Z | admin@org
tax_statement | "80G Registration No: XXXXX" | 2026-01-01T00:00:00Z | admin@org
currency | INR | 2026-01-01T00:00:00Z | (initial)
donation_id_prefix | ROH | 2026-01-01T00:00:00Z | (initial)
receipt_id_prefix | ROH | 2026-01-01T00:00:00Z | (initial)
current_year | 2026 | 2026-01-01T00:00:00Z | (initial)
email_enabled | true | 2026-01-01T00:00:00Z | (initial)
email_from | noreply@arayofhope.org | 2026-01-01T00:00:00Z | (initial)
email_subject_pattern | "Your donation receipt from {{ORG_NAME}}" | 2026-01-01T00:00:00Z | (initial)
max_login_attempts | 5 | 2026-01-01T00:00:00Z | (initial)
session_timeout_minutes | 30 | 2026-01-01T00:00:00Z | (initial)


#### AUDIT_LOG Sheet

Columns:
log_id (PK) | String | Auto-generated UUID
timestamp | Timestamp | ISO 8601
user | String | Admin email (or "system")
action | String | CREATED / UPDATED / CONFIRMED_PAYMENT / EXPORTED / etc.
entity_type | String | donation / donor / form_field / configuration / payment
entity_id | String | The ID of the entity affected
old_value | String | Previous value (JSON)
new_value | String | New value (JSON)
notes | String | Optional description

Sample Rows:
L001 | 2026-01-15T10:15:00Z | admin@org | CREATED | donation | ROH-2026-001 | {} | {"amount": 5000, "method": "UPI"} | "Donor: John Doe"
L002 | 2026-01-15T10:30:00Z | admin@org | CONFIRMED_PAYMENT | payment | P001 | {"status": "PENDING"} | {"status": "CONFIRMED"} | "Verified UPI payment"
L003 | 2026-01-15T10:32:00Z | system | GENERATED_RECEIPT | donation | ROH-2026-001 | {"receipt_number": null} | {"receipt_number": "ROH-2026-000001"} | "PDF saved: https://..."


## Configuration System (Zero Hardcoding)

### Principles

1. **No settings hardcoded in code**
2. All configuration stored in CONFIGURATION sheet
3. NGO admin can change settings via Sheets UI
4. Changes take effect immediately
5. No code deployment needed

### How It Works

```javascript
// In Apps Script:
function getConfig(key, defaultValue) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('CONFIGURATION');
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  // Find key in column 1, return value from column 2
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === key) {
      return values[i][1];
    }
  }
  return defaultValue;
}

// Usage:
const orgName = getConfig('org_name', 'A Ray of Hope');
const upiId = getConfig('org_upi_id', 'unknown@upi');
const password = getConfig('admin_password_hash', '');
```

All configuration keys are documented and initialized when system starts.

## Payment Abstraction

### Common Payment Model

All payment methods (UPI, CARD, CASH, future GATEWAY) use the same structure:

```javascript
Payment {
  payment_id: String,
  donation_id: String,
  amount: Number,
  currency: String,  // Always "INR"
  
  // Common fields
  payment_method: "UPI" | "CARD" | "CASH" | "RAZORPAY",
  payment_status: "PENDING" | "CONFIRMED" | "FAILED",
  confirmation_type: "MANUAL" | "AUTOMATIC",
  
  // Admin confirmation (for manual methods)
  confirmed_by: String,  // Admin email
  confirmed_at: Timestamp,
  
  // Payment timestamp
  payment_timestamp: Timestamp,
  
  // Transaction references (optional initially for UPI, required for gateway)
  transaction_id: String,  // e.g., TXN-ABC-123
  reference_number: String,  // Admin notes
  
  // Provider fields (populated only for gateway payments)
  provider: String,  // "MANUAL" or "RAZORPAY" or etc.
  provider_payment_id: String,
  provider_order_id: String,
  provider_metadata: Object,  // Stored as JSON string
}
```

### Method-Specific Behavior

**UPI (Static QR)**
- `confirmation_type`: MANUAL
- `provider`: MANUAL
- `transaction_id`: Optional (admin can fill in later)
- `provider_*`: All empty
- Status flow: PENDING → AWAITING_CONFIRMATION → CONFIRMED

**CARD (POS Machine)**
- `confirmation_type`: MANUAL
- `provider`: MANUAL
- `transaction_id`: Optional (POS reference)
- `provider_*`: All empty
- Status flow: PENDING → CONFIRMED

**CASH**
- `confirmation_type`: MANUAL
- `provider`: MANUAL
- `transaction_id`: Empty
- `provider_*`: All empty
- Status flow: PENDING → CONFIRMED

**Future Gateway (e.g., Razorpay)**
- `confirmation_type`: AUTOMATIC
- `provider`: RAZORPAY
- `transaction_id`: Auto-populated by webhook
- `provider_payment_id`: pay_123xyz
- `provider_order_id`: order_456abc
- `provider_metadata`: {status, method, fee, etc.}
- Status flow: PENDING → CONFIRMED (via webhook)

## Security Model

### Authentication

- Simple password-based (no OAuth complexity)
- Password stored as bcrypt hash in CONFIGURATION sheet
- Session management with timeout (configurable)
- Login attempts tracked, lockout after 5 failures

### Authorization

- **Public section**: No authentication (donor form)
- **Admin section**: Password required (all admin functions)
- All admin actions logged to AUDIT_LOG with user email and timestamp

### Data Protection

- Donor information (name, email, phone) not logged in audit
- PAN and DOB treated as sensitive (logged only if changed)
- No API secrets in frontend code
- Google Apps Script Properties used for runtime secrets
- Rate limiting on form submissions (prevent spam/DDOS)

### Audit Trail

Every significant action recorded:
- Who (admin email)
- What (action type)
- When (timestamp)
- Which (entity ID)
- Before/after (old/new values)

## Deployment Architecture

### Google Apps Script Web App

Deployed as "Web app"
- Execute as: NGO's Google Account
- Access: Anyone (form is public, but admin section requires password)
- URL: `https://script.google.com/macros/d/{DEPLOYMENT_ID}/userweb`

### Google Sheets

- File: "Ray of Hope - Donation Database"
- Owner: NGO's Google Account
- Accessible by: Only authenticated users (Google Drive permissions)
- Backup: Google Drive revision history (automatic)

### Google Drive

- Folder: "Ray of Hope - Receipts"
- Organization: By year (2026/, 2027/, etc.)
- Files: PDF receipts (donation_id_receipt_number.pdf format)

### Google Docs

- File: "Ray of Hope - Receipt Template"
- Used by: Apps Script to generate receipts
- Editable by: NGO admin (no code knowledge required)

## Scaling & Limits

### Google Sheets Limits
- **Max rows**: 10 million (sufficient for ~25 years of daily donations)
- **Max columns**: 18,278 (we use ~15)
- **Concurrent writes**: OK (Sheets handles locking)
- **Read/write speed**: Sufficient for manual workflows

### Apps Script Limits
- **Execution time**: 6 min per request (sufficient for receipt generation)
- **Quota**: 20,000 requests/day per user (sufficient for small NGO)
- **Concurrent executions**: Up to 25 per account

### Gmail Limits (for email receipts)
- **Send quota**: 100 emails/day free account, 1500/day business
- **Sufficient for**: Small NGO (max 100 receipts/day)

## Future Extensions

### Payment Gateway Integration

When NGO decides to add online payments:

1. Research gateway options (Razorpay, PayU, BillDesk, etc.)
2. Implement gateway adapter (new `.gs` file)
3. Add webhook receiver (Apps Script endpoint)
4. Webhook updates PAYMENT record with gateway data
5. Existing receipt/dashboard logic works unchanged

**No core architecture changes needed.**

### Notification Methods

1. Email (Phase 8)
2. SMS (Phase 9+, requires external provider)
3. WhatsApp (NOT part of V1)

### Additional Features

1. Recurring donations (Phase 9+)
2. Donation campaigns (Phase 10+)
3. Donor segments (Phase 11+)
4. Advanced reporting (Phase 12+)