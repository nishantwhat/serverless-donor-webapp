# Google Apps Script Setup & Deployment

This guide explains how to set up and deploy the Apps Script project.

## Prerequisites

- A Google Account with the Sheets file
- Access to Google Drive and Google Apps Script
- Basic familiarity with Google Apps Script editor

## Step 1: Create an Apps Script Project

### Option A: From Google Sheets (Recommended)

1. Open your "Ray of Hope - Donation Database" Sheets file
2. Go to **Extensions** → **Apps Script**
3. This creates an Apps Script project bound to the Sheets

### Option B: Standalone Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Click **+ New project**
3. You'll need to bind it to the Sheets later (more complex)

**Use Option A for simplicity.**

## Step 2: Copy Source Code

In the Apps Script editor:

1. Delete the default `Code.gs` file (if exists)
2. Copy each `.gs` file from the `src/` directory

### Files to Copy (in this order):

1. `constants.gs`
2. `config.gs`
3. `sheets.gs`
4. `drive.gs`
5. `Code.gs`

For each file:

1. Click **+ New** → **File**
2. Name it (e.g., `constants.gs`)
3. Copy-paste the contents from the repository
4. Save

## Step 3: Copy HTML Files

For the UI files:

1. Click **+ New** → **HTML file**
2. Name it: `donor-form.html`
3. Copy contents from `src/html/donor-form.html`
4. Repeat for other HTML files

HTML files to copy:
- `donor-form.html`
- `admin-dashboard.html`
- `styles.css`
- `scripts.js`

## Step 4: Create .clasp.json (Optional)

For advanced users who want to use command-line deployment:

Create `.clasp.json` in repository root:

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "./src"
}
```

Find `YOUR_SCRIPT_ID_HERE`:
- Apps Script Editor → Project Settings → Script ID

## Step 5: Initialize the System

Once all code is copied:

1. In Apps Script editor, go to **Run** menu
2. Select `initialize` function
3. Click **Run**
4. Authorize the script to:
   - Access Google Sheets
   - Access Google Drive
   - Create files

This creates all required sheets and initializes configuration.

## Step 6: Deploy as Web App

1. In Apps Script editor, click **Deploy** → **New deployment**
2. Select type: **Web app**
3. Configure:
   - **Execute as**: Your Google Account
   - **Who has access**: Anyone
4. Click **Deploy**
5. Copy the URL provided

## Step 7: Share the URL

The deployment creates a URL like:
`https://script.google.com/macros/d/{DEPLOYMENT_ID}/userweb`


Share this URL with NGO admin.

## Step 8: Test the System

1. Open the deployment URL
2. You should see the Donor Form
3. Try filling out a form (Phase 1 won't save, but interface should load)
4. Go to `?page=admin` to see admin panel (not functional yet)

## Managing Multiple Versions

When you update code:

1. Edit the `.gs` files in Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Create a new version (optional)
4. Or select existing deployment and re-deploy

## Troubleshooting

### Authorization Errors

If you see "Authorization required":

1. Run any function first (e.g., `test()`)
2. Click "Authorize"
3. Select your Google Account
4. Grant permissions (review all permissions)
5. Then try running the function again

### Sheets Not Connecting

If sheets don't auto-create:

1. Make sure Sheets file is accessible
2. Run `initialize()` function manually
3. Check error logs (View → Logs)

### Functions Not Running

1. Check the function name matches exactly
2. Make sure all `.gs` files are copied
3. Check for syntax errors (View → Logs will show them)

## Environment Variables (Phase 10)

Later phases may require sensitive configuration.

Store secrets using **Apps Script Properties Service**:

```javascript
// Set a secret (run once)
PropertiesService.getUserProperties().setProperty('API_KEY', 'secret_value');

// Retrieve a secret
const apiKey = PropertiesService.getUserProperties().getProperty('API_KEY');
```

Never commit secrets to Git!

## Command-Line Deployment (Advanced)

For developers familiar with `clasp`:

```bash
# Install clasp
npm install -g @google/clasp

# Clone project
clasp clone SCRIPT_ID

# Edit code locally
# src/constants.gs
# src/config.gs
# etc.

# Push changes to Apps Script
clasp push

# Deploy
clasp deploy
```

## Limits & Quotas

- **Execution time**: 6 minutes per request
- **Quota**: 20,000 requests/day per user
- **Concurrent executions**: Up to 25

These are sufficient for a small NGO.

---

For more information, see: `README.md` → Deployment section