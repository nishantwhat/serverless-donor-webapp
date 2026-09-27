# Google Sheets Database Setup

This guide explains how to create and configure the Google Sheets database for the donation system.

## Prerequisites

- A Google Account (ideally the NGO's dedicated account)
- Access to Google Drive
- Basic familiarity with Google Sheets

## Step 1: Create a New Google Sheet

1. Go to [Google Drive](https://drive.google.com)
2. Click **+ New** → **Google Sheets**
3. Name the file: **"Ray of Hope - Donation Database"**
4. Click **Create**

## Step 2: Create Database Structure

The Apps Script will automatically create the required sheets when you run the initialization function.

However, you can also manually create them:

### Sheets to Create (Optional - will be auto-created)

- DONATIONS
- DONORS
- PAYMENTS
- FORM_FIELDS
- CONFIGURATION
- AUDIT_LOG

## Step 3: Initialize via Apps Script

1. After deploying the Apps Script, open the web app
2. In the browser console (F12), run:
```javascript
   initialize();
```
3. This will create all sheets with proper headers and formatting

## Sheet Descriptions

### DONATIONS Sheet

Stores donation records.

| Column | Type | Example |
|--------|------|---------|
| donation_id | Text | ROH-2026-001 |
| donor_id | Text | D001 |
| amount | Number | 5000 |
| currency | Text | INR |
| payment_method | Text | UPI |
| payment_status | Text | CONFIRMED |
| receipt_number | Text | ROH-2026-000001 |
| receipt_pdf_url | URL | https://drive.google.com/... |
| created_at | Timestamp | 2026-01-15T10:15:00Z |
| updated_at | Timestamp | 2026-01-15T10:15:00Z |
| created_by | Text | admin@org.com |
| notes | Text | Optional notes |

### DONORS Sheet

Stores donor contact and information.

| Column | Type | Example |
|--------|------|---------|
| donor_id | Text | D001 |
| name | Text | John Doe |
| mobile | Text | 9999999999 |
| email | Text | john@email.com |
| address | Text | 123 Main St |
| city | Text | Mumbai |
| state | Text | MH |
| pin | Text | 400001 |
| country | Text | India |
| pan | Text | ABCDE1234F |
| dob | Date | 1980-05-15 |
| occupation | Text | Engineer |
| company | Text | TechCorp |
| created_at | Timestamp | 2026-01-15T10:15:00Z |
| updated_at | Timestamp | 2026-01-15T10:15:00Z |

### PAYMENTS Sheet

Stores payment records (payment method abstraction).

| Column | Type | Example |
|--------|------|---------|
| payment_id | Text | P001 |
| donation_id | Text | ROH-2026-001 |
| amount | Number | 5000 |
| currency | Text | INR |
| payment_method | Text | UPI |
| payment_status | Text | CONFIRMED |
| transaction_id | Text | TXN-ABC-123 |
| provider | Text | MANUAL |
| provider_payment_id | Text | (blank) |
| provider_order_id | Text | (blank) |
| provider_metadata | Text | {} |
| confirmed_by | Text | admin@org.com |
| confirmed_at | Timestamp | 2026-01-15T10:30:00Z |
| payment_timestamp | Timestamp | 2026-01-15T10:20:00Z |
| created_at | Timestamp | 2026-01-15T10:15:00Z |
| updated_at | Timestamp | 2026-01-15T10:15:00Z |

### FORM_FIELDS Sheet

Stores configurable form field definitions.

| Column | Type | Example |
|--------|------|---------|
| field_id | Text | F001 |
| field_key | Text | donor_name |
| label | Text | Donor Name |
| type | Text | text |
| required | Boolean | TRUE |
| enabled | Boolean | TRUE |
| display_order | Number | 1 |
| placeholder | Text | Your full name |
| options | Text | (for dropdowns) |
| created_at | Timestamp | 2026-01-01T00:00:00Z |
| updated_at | Timestamp | 2026-01-01T00:00:00Z |

### CONFIGURATION Sheet

Stores all system configuration (key-value pairs).

| Column | Type | Example |
|--------|------|---------|
| config_key | Text | org_name |
| config_value | Text | A Ray of Hope |
| updated_at | Timestamp | 2026-01-01T00:00:00Z |
| updated_by | Text | admin@org.com |

### AUDIT_LOG Sheet

Stores audit trail of all admin actions.

| Column | Type | Example |
|--------|------|---------|
| log_id | Text | L001 |
| timestamp | Timestamp | 2026-01-15T10:15:00Z |
| user | Text | admin@org.com |
| action | Text | CREATED |
| entity_type | Text | donation |
| entity_id | Text | ROH-2026-001 |
| old_value | Text | {} |
| new_value | Text | {"amount": 5000} |
| notes | Text | Donor: John Doe |

## Data Types in Google Sheets

When creating formulas or data validation:

- **Text**: Plain text values
- **Number**: Integer or decimal values
- **Boolean**: TRUE or FALSE
- **Date**: Format as YYYY-MM-DD
- **Timestamp**: Format as ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)
- **URL**: Full URL starting with https://

## Sharing and Permissions

### Keep the Database Private

1. Go to the Sheets file
2. Click **Share**
3. Set to: **Restricted** (only specific people)
4. Grant access only to:
   - NGO admin(s)
   - System developer (temporary, for setup)

### Do NOT Share with Public

The database contains donor information and should not be publicly accessible.

The web form is separate and does NOT require Sheets access.

## Backup

Google Sheets automatically:
- Saves every change
- Maintains version history
- Allows recovery of previous versions

To manually backup:

1. Right-click the file in Drive
2. Click **Download** → **Microsoft Excel (.xlsx)**
3. Save to your computer

Regular backups recommended (monthly minimum).

## Troubleshooting

**Q: I can't see the sheets after initialization**
A: Refresh the page (Ctrl+R or Cmd+R). Sheets should auto-create.

**Q: The headers look wrong**
A: Delete the empty sheets and run `initialize()` again in Apps Script console.

**Q: I accidentally deleted data**
A: Use Google Drive's version history:
   1. Right-click file → Version history
   2. Select a previous version to restore

---

For more information, see: `README.md` → Database section