# Non-Technical Administrator & Operations Guide

**A Ray of Hope — Serverless Donation & Receipt System**

This guide provides step-by-step instructions for non-technical organization leaders and administrative staff operating the Serverless Donation Web Application.

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. One-Time Setup Tasks](#2-one-time-setup-tasks)
  - [2.1 Prerequisites & Account Requirements](#21-prerequisites--account-requirements)
  - [2.2 Preparing the Google Sheet Database](#22-preparing-the-google-sheet-database)
  - [2.3 Setting System Configuration](#23-setting-system-configuration)
  - [2.4 Apps Script Deployment](#24-apps-script-deployment)
- [3. Day-to-Day Operations Guide](#3-day-to-day-operations-guide)
  - [3.1 How Donors Use the Web Form](#31-how-donors-use-the-web-form)
  - [3.2 Processing UPI Donations](#32-processing-upi-donations)
  - [3.3 Processing Card (POS Machine) Donations](#33-processing-card-pos-machine-donations)
  - [3.4 Processing Cash Donations](#34-processing-cash-donations)
  - [3.5 Confirming Payments in Google Sheets](#35-confirming-payments-in-google-sheets)
  - [3.6 Receipts & Invoicing Status](#36-receipts--invoicing-status)
  - [3.7 Admin Dashboard Interface Status](#37-admin-dashboard-interface-status)
- [4. Managing Form Fields & Configuration](#4-managing-form-fields--configuration)
  - [4.1 Managing Form Fields](#41-managing-form-fields)
  - [4.2 Updating Organization Settings](#42-updating-organization-settings)
  - [4.3 Do's and Don'ts for Editing Google Sheets](#43-dos-and-donts-for-editing-google-sheets)
- [5. Troubleshooting & Error Recovery](#5-troubleshooting--error-recovery)
- [6. Data Safety, Backups & Security Practices](#6-data-safety-backups--security-practices)
- [7. Support & Escalation Checklist](#7-support--escalation-checklist)

---

## 1. System Overview

The **Serverless Donation Web Application** allows your non-profit organization (NGO) to collect online donation requests and offline payment confirmations without paying for server hosting or third-party web services.

### What the system does:
- Provides a online form for donors to enter their details and contribution amounts.
- Displays payment instructions for **UPI (QR code)**, **Card (POS machine)**, or **Cash**.
- Stores all donor profiles, donation requests, and payment attempts in a central Google Sheet database.
- Tracks donation status (`PENDING` → `AWAITING_CONFIRMATION` → `CONFIRMED`).

---

## 2. One-Time Setup Tasks

These setup tasks are performed **once** by the administrator during initial system setup.

### 2.1 Prerequisites & Account Requirements

Before starting setup, ensure you have:
1. A dedicated **Google Account** for your NGO (e.g., `donations.nongovernmentorg@gmail.com` or Workspace email).
2. Public HTTPS image link for your organization's static **UPI QR Code** (hosted on Google Drive or public image storage).
3. Access to Google Spreadsheet and Google Apps Script.

---

### 2.2 Preparing the Google Sheet Database

1. Log into your NGO Google Account and open [Google Drive](https://drive.google.com).
2. Click **New > Google Sheets** and name the spreadsheet:
   `A Ray of Hope - Donation Database`
3. Open the spreadsheet and note the browser URL.
4. Click **Extensions > Apps Script** from the top menu.
5. In the Apps Script code editor, ensure all `.gs` and `.html` files from the `src/` directory of the project codebase are present:
   - `Code.gs`
   - `constants.gs`
   - `config.gs`
   - `sheets.gs`
   - `donor.gs`
   - `donation.gs`
   - `payment.gs`
   - `form-fields.gs`
   - `logger.gs`
   - `drive.gs`
   - `html/donor-form.html`
   - `html/styles.html`
   - `html/scripts.html`
6. At the top toolbar, select `initialize` from the function dropdown menu and click **Run**.
7. Grant the requested Google permissions.
8. Switch back to your Google Spreadsheet tab. You will see **6 tabs** automatically created with styled column headers:
   - `DONATIONS`
   - `DONORS`
   - `PAYMENTS`
   - `FORM_FIELDS`
   - `CONFIGURATION`
   - `AUDIT_LOG`

---

### 2.3 Setting System Configuration

1. Click on the `CONFIGURATION` sheet tab in your Google Sheet.
2. Update the `value` column for each configuration key:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `org_name` | `A Ray of Hope Foundation` | Your legal NGO name |
| `org_upi_id` | `arayofhope@upi` | Your organization's official UPI ID / VPA |
| `org_upi_qr_image_url` | `https://example.org/qr.png` | Public image link to your static UPI QR code |
| `currency` | `INR` | Default currency symbol/code |
| `donation_id_prefix` | `ROH` | Prefix code used for generated Donation IDs |

---

### 2.4 Apps Script Deployment

1. In the Apps Script window, click **Deploy > New deployment**.
2. Click the gear icon (**Select type**) and choose **Web app**.
3. Fill in the fields:
   - **Description**: `Production Donor Web App`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone`
4. Click **Deploy**.
5. Copy the published **Web App URL** (e.g., `https://script.google.com/macros/s/.../exec`).
6. Share this link on your website, WhatsApp, or social media for donors to access.

---

## 3. Day-to-Day Operations Guide

This section is for daily staff operations.

### 3.1 How Donors Use the Web Form

1. **Step 1: Donor Details & Amount**: The donor opens the Web App URL, enters their contact information (Name, Mobile Number, Email, Address, PAN, etc.), inputs their donation amount, and clicks **Continue to Payment**.
2. **Step 2: Choose Payment Method**: The donor selects one of three payment options:
   - 📱 **UPI (Scan & Pay)**
   - 💳 **Card (Card Machine)**
   - 💵 **Cash (In Person)**
   The donor clicks **Proceed to Payment**.
3. **Step 3: Payment Instruction & Submission**:
   - **UPI**: Donors view the Organization UPI ID and QR Code, scan it on their UPI app (PhonePe, Google Pay, Paytm), complete the transfer, and click **I have completed payment**.
   - **CARD**: Donors complete payment on the NGO staff POS card machine and click **I have completed payment**.
   - **CASH**: Donors hand cash to NGO staff and click **I have completed payment**.
4. **Step 4: Receipt & Confirmation Acknowledgment**:
   The web form displays a confirmation box with their **Donation ID** (e.g. `ROH20260928001`) and status **Awaiting Confirmation**.

---

### 3.2 Processing UPI Donations

1. When a donor submits a UPI donation, a new row appears in the `DONATIONS` sheet with:
   - `payment_method`: `UPI`
   - `payment_status`: `AWAITING_CONFIRMATION`
2. Staff check the NGO bank account / UPI merchant application for an incoming transaction matching the donor's amount and timestamp.
3. Once verified, follow [3.5 Confirming Payments in Google Sheets](#35-confirming-payments-in-google-sheets).

---

### 3.3 Processing Card (POS Machine) Donations

1. Staff swipe/dip the donor's card on the physical POS terminal.
2. Once the card terminal prints a successful slip, staff verify that the donor completed the Web App form.
3. Staff locate the donation row in the `DONATIONS` sheet and follow [3.5 Confirming Payments in Google Sheets](#35-confirming-payments-in-google-sheets).

---

### 3.4 Processing Cash Donations

1. Staff accept physical cash from the donor.
2. Staff verify that the donor completed the Web App form (or staff fill out the Web App form on behalf of the donor).
3. Staff locate the donation row in `DONATIONS` and follow [3.5 Confirming Payments in Google Sheets](#35-confirming-payments-in-google-sheets).

---

### 3.5 Confirming Payments in Google Sheets

> **Note**: An Admin Dashboard Web Interface is planned for a future release. Currently, staff confirm payments directly inside Google Sheets.

To confirm a payment:
1. Open the Google Spreadsheet `A Ray of Hope - Donation Database`.
2. Click on the `DONATIONS` sheet tab.
3. Locate the row matching the donor's **Donation ID** or **Donor Name**.
4. Change the `payment_status` cell value from `AWAITING_CONFIRMATION` to:
   **`CONFIRMED`**
5. Click on the `PAYMENTS` sheet tab.
6. Locate the matching `donation_id` row and update:
   - `payment_status`: `CONFIRMED`
   - `confirmed_by`: Enter your staff email address
   - `confirmed_at`: Enter the current date and timestamp

---

### 3.6 Receipts & Invoicing Status

> ⚠️ **Not Currently Implemented**
>
> Automated PDF receipt generation and email delivery via Google Docs template is **not currently implemented** in the current software version (`receipt.gs` is currently pending implementation in Phase 6).

#### Current Manual Workaround:
If a donor requires an official receipt immediately:
1. Confirm the donation status in Google Sheets as `CONFIRMED`.
2. Issue a manual physical paper receipt or standard manual PDF receipt.
3. Enter the manual receipt number into the `receipt_number` column in the `DONATIONS` sheet for record-keeping.

---

### 3.7 Admin Dashboard Interface Status

> ⚠️ **Not Currently Implemented**
>
> The web-based graphical Admin Dashboard interface (`admin-dashboard.html`) is **not currently implemented** (`dashboard.gs` is pending implementation in Phase 7). All management, search, and confirmation activities are performed directly inside the Google Sheet tabs.

---

## 4. Managing Form Fields & Configuration

### 4.1 Managing Form Fields

You can change which fields appear on the donor web form without writing code:

1. Open your Google Sheet and click the `FORM_FIELDS` tab.
2. You will see rows for `donor_name`, `mobile`, `email`, `address`, `city`, `state`, `pin`, `company`, `pan`.
3. To disable a field so it no longer appears on the web form:
   - Set the `enabled` column for that field to `FALSE`.
4. To make a field mandatory or optional:
   - Set the `required` column to `TRUE` or `FALSE`.
5. To change field order:
   - Edit the integer numbers in the `display_order` column (e.g. `1`, `2`, `3`).

---

### 4.2 Updating Organization Settings

To update organization settings (e.g. new UPI ID or organization name):
1. Open the `CONFIGURATION` sheet tab.
2. Edit the text in the `value` column for the desired `key`.
3. The Web App updates instantly upon the next page reload.

---

### 4.3 Do's and Don'ts for Editing Google Sheets

#### ✅ DO:
- Update `payment_status` values to `CONFIRMED`, `FAILED`, or `CANCELLED`.
- Enable/disable form fields in `FORM_FIELDS`.
- Add internal notes in the `notes` column of `DONATIONS`.
- Download backups of your spreadsheet periodically.

#### ❌ DO NOT:
- Do **NOT** change or rename column header names in Row 1 of any sheet.
- Do **NOT** delete or rename any of the 6 core sheet tabs (`DONATIONS`, `DONORS`, `PAYMENTS`, `FORM_FIELDS`, `CONFIGURATION`, `AUDIT_LOG`).
- Do **NOT** edit `donation_id`, `donor_id`, or `payment_id` values generated by the system.
- Do **NOT** delete historical rows directly unless resolving duplicate testing data.

---

## 5. Troubleshooting & Error Recovery

| Problem / Error | Cause | Solution |
| :--- | :--- | :--- |
| **"Error Loading Form - Cannot read properties of undefined (reading 'ALLOWALL')"** | Outdated Apps Script permission code | Ensure `Code.gs` uses `setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)`. |
| **"Error Loading Form - No HTML file named html/styles was found"** | Incompatible asset file name | Ensure styles are stored in `src/html/styles.html` and included via `<?!= include('html/styles'); ?>`. |
| **Web app displays "Error Loading Form"** | Permission or initialization issue | 1. Open Apps Script editor.<br>2. Run `initialize()` function.<br>3. Re-deploy web app. |
| **Payment received in bank, but web app status is `PENDING`** | Donor closed browser before clicking completion button | Manually locate the donation in `DONATIONS` sheet and update `payment_status` to `CONFIRMED`. |
| **Receipt not generated automatically** | Feature not yet implemented | Issue manual receipt and record receipt number in `DONATIONS` sheet (`receipt_number` column). |

---

## 6. Data Safety, Backups & Security Practices

1. **Google Sheet Backups**:
   - Go to **File > Make a copy** in Google Sheets weekly to keep offline backup snapshots.
2. **Access Control**:
   - Restrict edit access to the Google Sheet only to authorized finance and management staff.
   - Do not make the Google Sheet publicly viewable.
3. **Data Privacy**:
   - Donor contact details and PAN numbers are personal data. Ensure staff do not export or share sheets externally.

---

## 7. Support & Escalation Checklist

If an unrecoverable issue occurs during operation:

- [ ] Verify internet connectivity.
- [ ] Check if the Google Sheet URL and file permissions were altered.
- [ ] Check Apps Script **Executions Log** under **Extensions > Apps Script > Executions** for specific error logs.
- [ ] Verify all 6 sheet tab names match exact uppercase spellings (`DONATIONS`, `DONORS`, `PAYMENTS`, `FORM_FIELDS`, `CONFIGURATION`, `AUDIT_LOG`).
- [ ] Contact your technical administrator or IT lead with screenshot and Execution Log details.
