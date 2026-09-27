// ============================================================
// A Ray of Hope - Donor Form Scripts
// ============================================================

// State Management
const state = {
  formData: {},
  donorFormData: {},
  donationId: null,
  paymentMethod: null,
  amount: 0,
  formFields: []
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Page loaded, initializing...');
  loadFormFields();
  setupFormEventListeners();
});

// ============================================================
// LOAD FORM FIELDS FROM DATABASE
// ============================================================

function loadFormFields() {
  console.log('Loading form fields...');
  
  google.script.run.withSuccessHandler(function(response) {
    if (response.success) {
      state.formFields = response.data.fields;
      console.log('Loaded ' + state.formFields.length + ' form fields');
      renderFormFields();
    } else {
      showError('Failed to load form fields: ' + response.message);
    }
  }).withFailureHandler(function(error) {
    console.error('Error loading form fields:', error);
    showError('Error loading form. Please refresh the page.');
  }).getFormFields();
}

function renderFormFields() {
  const container = document.getElementById('formFields');
  container.innerHTML = '';
  
  state.formFields.forEach(field => {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    let input;
    const requiredAttr = field.required ? ' required' : '';
    const requiredLabel = field.required ? '<span class="required">*</span>' : '';
    
    switch(field.type) {
      case 'email':
        input = `<input type="email" name="${field.field_key}" placeholder="${field.placeholder}" ${requiredAttr}>`;
        break;
      case 'phone':
        input = `<input type="tel" name="${field.field_key}" placeholder="${field.placeholder}" ${requiredAttr}>`;
        break;
      case 'number':
        input = `<input type="number" name="${field.field_key}" placeholder="${field.placeholder}" ${requiredAttr}>`;
        break;
      case 'date':
        input = `<input type="date" name="${field.field_key}" ${requiredAttr}>`;
        break;
      case 'textarea':
        input = `<textarea name="${field.field_key}" placeholder="${field.placeholder}" ${requiredAttr}></textarea>`;
        break;
      case 'dropdown':
        const options = field.options ? field.options.split(',').map(opt => opt.trim()) : [];
        input = `<select name="${field.field_key}" ${requiredAttr}>
          <option value="">Select ${field.label}</option>
          ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>`;
        break;
      case 'checkbox':
        input = `<input type="checkbox" name="${field.field_key}" id="${field.field_key}">`;
        break;
      default:
        input = `<input type="text" name="${field.field_key}" placeholder="${field.placeholder}" ${requiredAttr}>`;
    }
    
    group.innerHTML = `
      <label for="${field.field_key}">${field.label}${requiredLabel}</label>
      ${input}
      <div class="form-error"></div>
    `;
    
    container.appendChild(group);
  });
  
  console.log('Form fields rendered');
}

// ============================================================
// FORM SUBMISSION
// ============================================================

function setupFormEventListeners() {
  const donorForm = document.getElementById('donorForm');
  if (donorForm) {
    donorForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitDonorForm();
    });
  }
}

function submitDonorForm() {
  console.log('Submitting donor form...');
  
  // Collect form data
  const formData = new FormData(document.getElementById('donorForm'));
  
  state.donorFormData = {
    donor_name: formData.get('donor_name') || '',
    mobile: formData.get('mobile') || '',
    email: formData.get('email') || '',
    address: formData.get('address') || '',
    city: formData.get('city') || '',
    state: formData.get('state') || '',
    pin: formData.get('pin') || '',
    country: formData.get('country') || 'India',
    company: formData.get('company') || '',
    pan: formData.get('pan') || '',
    dob: formData.get('dob') || '',
    occupation: formData.get('occupation') || ''
  };
  
  state.amount = parseFloat(formData.get('amount'));
  
  if (!state.amount || state.amount <= 0) {
    showError('Please enter a valid donation amount');
    return;
  }
  
  // Validate data
  console.log('Validating donor data...');
  google.script.run.withSuccessHandler(function(response) {
    if (response.success) {
      console.log('Validation passed');
      showStep('stepPaymentMethod');
    } else {
      showError('Validation failed: ' + response.data.errors.join(', '));
    }
  }).withFailureHandler(function(error) {
    console.error('Validation error:', error);
    showError('Error validating form. Please check your entries.');
  }).validateDonorData(state.donorFormData);
}

// ============================================================
// STEP NAVIGATION
// ============================================================

function showStep(stepId) {
  // Hide all steps
  document.querySelectorAll('.step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Show target step
  document.getElementById(stepId).classList.add('active');
  
  // Scroll to top
  window.scrollTo(0, 0);
  
  console.log('Showing step: ' + stepId);
}

function goBackToForm() {
  showStep('stepDonorForm');
}

function goBackToPaymentMethod() {
  showStep('stepPaymentMethod');
}

function proceedToPayment() {
  const method = document.querySelector('input[name="paymentMethod"]:checked');
  
  if (!method) {
    showError('Please select a payment method');
    return;
  }
  
  state.paymentMethod = method.value;
  
  console.log('Creating donation with method: ' + state.paymentMethod);
  showSpinner(true);
  
  // Create donation
  google.script.run.withSuccessHandler(function(response) {
    showSpinner(false);
    
    if (response.success) {
      const donation = response.data.donation;
      state.donationId = donation.donation_id;
      
      console.log('Donation created: ' + state.donationId);
      
      // Display amount and donation ID
      document.getElementById('upiAmount').textContent = '₹' + state.amount;
      document.getElementById('cardAmount').textContent = '₹' + state.amount;
      document.getElementById('cashAmount').textContent = '₹' + state.amount;
      
      document.getElementById('upiDonationId').textContent = state.donationId;
      document.getElementById('cardDonationId').textContent = state.donationId;
      document.getElementById('cashDonationId').textContent = state.donationId;
      
      // Show relevant payment step
      if (state.paymentMethod === 'UPI') {
        loadUPIQR();
        showStep('stepUPIPayment');
      } else if (state.paymentMethod === 'CARD') {
        showStep('stepCardPayment');
      } else if (state.paymentMethod === 'CASH') {
        showStep('stepCashPayment');
      }
    } else {
      showError('Error creating donation: ' + response.message);
    }
  }).withFailureHandler(function(error) {
    showSpinner(false);
    console.error('Error creating donation:', error);
    showError('Error creating donation. Please try again.');
  }).createDonation({
    donor_name: state.donorFormData.donor_name,
    mobile: state.donorFormData.mobile,
    email: state.donorFormData.email,
    address: state.donorFormData.address,
    city: state.donorFormData.city,
    state: state.donorFormData.state,
    pin: state.donorFormData.pin,
    country: state.donorFormData.country,
    company: state.donorFormData.company,
    pan: state.donorFormData.pan,
    dob: state.donorFormData.dob,
    occupation: state.donorFormData.occupation,
    amount: state.amount,
    payment_method: state.paymentMethod
  });
}

// ============================================================
// UPI PAYMENT
// ============================================================

function loadUPIQR() {
  console.log('Loading UPI QR...');
  showSpinner(true);
  
  google.script.run.withSuccessHandler(function(response) {
    showSpinner(false);
    
    if (response.success) {
      const upiId = response.data.org_upi_id;
      const qrUrl = response.data.org_upi_qr_url;
      
      document.getElementById('upiId').textContent = upiId;
      
      if (qrUrl) {
        const qrContainer = document.getElementById('qrCode');
        qrContainer.innerHTML = `<img src="${qrUrl}" alt="UPI QR Code">`;
      }
      
      console.log('UPI QR loaded');
    } else {
      showError('Error loading UPI details: ' + response.message);
    }
  }).withFailureHandler(function(error) {
    showSpinner(false);
    console.error('Error loading UPI QR:', error);
    showError('Error loading UPI details.');
  }).getConfig({key: 'org_upi_id'});
  
  // Also get QR code
  google.script.run.withSuccessHandler(function(response) {
    if (response.success && response.data.org_upi_qr_url) {
      const qrContainer = document.getElementById('qrCode');
      qrContainer.innerHTML = `<img src="${response.data.org_upi_qr_url}" alt="UPI QR Code">`;
    }
  }).getConfig({key: 'org_upi_qr_url'});
}

function confirmUPIPayment() {
  console.log('Confirming UPI payment...');
  showSpinner(true);
  
  google.script.run.withSuccessHandler(function(response) {
    showSpinner(false);
    
    if (response.success) {
      console.log('UPI payment confirmed');
      showConfirmation();
    } else {
      showError('Error confirming payment: ' + response.message);
    }
  }).withFailureHandler(function(error) {
    showSpinner(false);
    console.error('Error confirming payment:', error);
    showError('Error confirming payment. Please try again.');
  }).markPaymentPending({donation_id: state.donationId});
}

// ============================================================
// CARD PAYMENT
// ============================================================

function confirmCardPayment() {
  console.log('Confirming card payment...');
  showSpinner(true);
  
  google.script.run.withSuccessHandler(function(response) {
    showSpinner(false);
    
    if (response.success) {
      console.log('Card payment confirmed');
      showConfirmation();
    } else {
      showError('Error confirming payment: ' + response.message);
    }
  }).withFailureHandler(function(error) {
    showSpinner(false);
    console.error('Error confirming payment:', error);
    showError('Error confirming payment. Please try again.');
  }).markPaymentPending({donation_id: state.donationId});
}

// ============================================================
// CASH PAYMENT
// ============================================================

function confirmCashPayment() {
  console.log('Confirming cash payment...');
  showSpinner(true);
  
  google.script.run.withSuccessHandler(function(response) {
    showSpinner(false);
    
    if (response.success) {
      console.log('Cash payment confirmed');
      showConfirmation();
    } else {
      showError('Error confirming payment: ' + response.message);
    }
  }).withFailureHandler(function(error) {
    showSpinner(false);
    console.error('Error confirming payment:', error);
    showError('Error confirming payment. Please try again.');
  }).markPaymentPending({donation_id: state.donationId});
}

// ============================================================
// CONFIRMATION
// ============================================================

function showConfirmation() {
  document.getElementById('confirmAmount').textContent = '₹' + state.amount;
  document.getElementById('confirmDonationId').textContent = state.donationId;
  document.getElementById('confirmPaymentMethod').textContent = state.paymentMethod;
  document.getElementById('confirmStatus').textContent = 'Awaiting Confirmation';
  
  showStep('stepConfirmation');
}

function startNewDonation() {
  // Reset form
  document.getElementById('donorForm').reset();
  state.donationId = null;
  state.paymentMethod = null;
  state.amount = 0;
  
  showStep('stepDonorForm');
}

function downloadReceipt() {
  alert('Receipt download will be available after admin confirmation.');
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function showSpinner(show) {
  const spinner = document.getElementById('loadingSpinner');
  if (show) {
    spinner.classList.add('show');
  } else {
    spinner.classList.remove('show');
  }
}

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
  errorDiv.style.display = 'block';
  
  console.error('Error:', message);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorDiv.classList.remove('show');
    errorDiv.style.display = 'none';
  }, 5000);
}

function hideError() {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.classList.remove('show');
  errorDiv.style.display = 'none';
}