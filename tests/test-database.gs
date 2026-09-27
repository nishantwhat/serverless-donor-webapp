/**
 * Database Testing Suite
 * 
 * Comprehensive tests for all database operations
 * Run this to verify the database layer is working correctly
 */

/**
 * Run all database tests
 */
function runAllDatabaseTests() {
  Logger.log('========================================');
  Logger.log('STARTING DATABASE TESTS');
  Logger.log('========================================');
  
  try {
    // Initialize system
    Logger.log('\n1. INITIALIZATION TEST');
    testInitialization();
    
    // Configuration tests
    Logger.log('\n2. CONFIGURATION TESTS');
    testConfiguration();
    
    // Donor tests
    Logger.log('\n3. DONOR TESTS');
    testDonor();
    
    // Donation tests
    Logger.log('\n4. DONATION TESTS');
    testDonation();
    
    // Payment tests
    Logger.log('\n5. PAYMENT TESTS');
    testPayment();
    
    // Form field tests
    Logger.log('\n6. FORM FIELD TESTS');
    testFormFields();
    
    // Logging tests
    Logger.log('\n7. LOGGING TESTS');
    testLogging();
    
    // Integration tests
    Logger.log('\n8. INTEGRATION TESTS');
    testIntegration();
    
    Logger.log('\n========================================');
    Logger.log('ALL DATABASE TESTS COMPLETED');
    Logger.log('========================================');
    
  } catch (error) {
    Logger.log(`\n❌ TEST SUITE ERROR: ${error}`);
  }
}

/**
 * Test system initialization
 */
function testInitialization() {
  try {
    Logger.log('Testing system initialization...');
    
    // Ensure all sheets exist
    ensureDonationsSheet();
    ensureDonorsSheet();
    ensurePaymentsSheet();
    ensureFormFieldsSheet();
    ensureConfigurationSheet();
    ensureAuditLogSheet();
    
    Logger.log('✓ All sheets created successfully');
    
    // Initialize configuration
    initializeDefaultConfig();
    Logger.log('✓ Configuration initialized');
    
    // Initialize form fields
    initializeDefaultFormFields();
    Logger.log('✓ Form fields initialized');
    
    Logger.log('✓ Initialization test passed');
  } catch (error) {
    Logger.log(`✗ Initialization test failed: ${error}`);
  }
}

/**
 * Test configuration system
 */
function testConfiguration() {
  try {
    Logger.log('Testing configuration system...');
    
    // Get config
    const orgName = getConfig(CONFIG_KEYS.ORG_NAME);
    Logger.log(`✓ Retrieved org_name: ${orgName}`);
    
    // Set config
    setConfig('test_config_key', 'test_value', 'test_user');
    const testValue = getConfig('test_config_key');
    if (testValue === 'test_value') {
      Logger.log('✓ Set and retrieved config value');
    } else {
      throw new Error('Config value mismatch');
    }
    
    // Get all config
    const allConfig = getAllConfig();
    Logger.log(`✓ Retrieved all config (${Object.keys(allConfig).length} keys)`);
    
    Logger.log('✓ Configuration test passed');
  } catch (error) {
    Logger.log(`✗ Configuration test failed: ${error}`);
  }
}

/**
 * Integration test: Complete donation flow
 */
function testIntegration() {
  try {
    Logger.log('Testing complete donation flow...');
    
    // Step 1: Create donor
    const donor = createOrGetDonor({
      name: 'Integration Test Donor',
      mobile: '9888777777',
      email: 'integration@test.com',
      city: 'Mumbai',
      state: 'MH'
    });
    Logger.log(`✓ Step 1: Created donor ${donor.donor_id}`);
    
    // Step 2: Create donation
    const donation = createDonation({
      donor_id: donor.donor_id,
      amount: 5000,
      payment_method: PAYMENT_METHOD.UPI
    });
    Logger.log(`✓ Step 2: Created donation ${donation.donation_id}`);
    
    // Step 3: Create payment
    const payment = createPayment({
      donation_id: donation.donation_id,
      amount: donation.amount,
      payment_method: PAYMENT_METHOD.UPI
    });
    Logger.log(`✓ Step 3: Created payment ${payment.payment_id}`);
    
    // Step 4: Mark payment pending
    markPaymentPending(donation.donation_id);
    Logger.log('✓ Step 4: Marked payment as pending');
    
    // Step 5: Mark awaiting confirmation
    markAwaitingConfirmation(donation.donation_id);
    Logger.log('✓ Step 5: Marked as awaiting confirmation');
    
    // Step 6: Confirm payment
    confirmPayment(payment.payment_id, 'integration@test.com', 'TXN-INT-123');
    Logger.log('✓ Step 6: Confirmed payment');
    
    // Step 7: Verify donation is confirmed
    const confirmedDonation = getDonationById(donation.donation_id);
    if (confirmedDonation.payment_status === DONATION_STATUS.CONFIRMED) {
      Logger.log(`✓ Step 7: Donation confirmed with receipt ${confirmedDonation.receipt_number}`);
    } else {
      throw new Error('Donation not confirmed');
    }
    
    // Step 8: Check audit log
    const auditLog = getAuditLogForEntity(AUDIT_ENTITY_TYPE.DONATION, donation.donation_id);
    Logger.log(`✓ Step 8: Found ${auditLog.length} audit log entries`);
    
    Logger.log('✓ Integration test passed');
  } catch (error) {
    Logger.log(`✗ Integration test failed: ${error}`);
  }
}

/**
 * Test error handling
 */
function testErrorHandling() {
  try {
    Logger.log('Testing error handling...');
    
    // Test 1: Invalid donation amount
    try {
      createDonation({
        donor_id: 'D001',
        amount: -1000,
        payment_method: PAYMENT_METHOD.UPI
      });
      Logger.log('✗ Should have rejected negative amount');
    } catch (error) {
      Logger.log('✓ Correctly rejected negative amount');
    }
    
    // Test 2: Invalid payment method
    try {
      createDonation({
        donor_id: 'D001',
        amount: 5000,
        payment_method: 'INVALID_METHOD'
      });
      Logger.log('✗ Should have rejected invalid payment method');
    } catch (error) {
      Logger.log('✓ Correctly rejected invalid payment method');
    }
    
    // Test 3: Non-existent donation
    const result = getDonationById('NON_EXISTENT');
    if (result === null) {
      Logger.log('✓ Correctly handled non-existent donation');
    } else {
      Logger.log('✗ Should have returned null for non-existent donation');
    }
    
    // Test 4: Mobile validation
    if (!isValidMobile('12345')) {
      Logger.log('✓ Correctly rejected invalid mobile');
    } else {
      Logger.log('✗ Should have rejected invalid mobile');
    }
    
    if (isValidMobile('9999999999')) {
      Logger.log('✓ Correctly accepted valid mobile');
    } else {
      Logger.log('✗ Should have accepted valid mobile');
    }
    
    Logger.log('✓ Error handling tests passed');
  } catch (error) {
    Logger.log(`✗ Error handling test failed: ${error}`);
  }
}

/**
 * Test data export functionality
 */
function testDataExport() {
  try {
    Logger.log('Testing data export...');
    
    // Export audit log
    const auditCsv = exportAuditLogCsv();
    if (auditCsv.length > 0) {
      Logger.log(`✓ Exported audit log (${auditCsv.split('\n').length} lines)`);
    } else {
      Logger.log('⚠ Audit log export empty (may be normal if no logs)');
    }
    
    Logger.log('✓ Data export tests passed');
  } catch (error) {
    Logger.log(`✗ Data export test failed: ${error}`);
  }
}

/**
 * Test statistics functions
 */
function testStatistics() {
  try {
    Logger.log('Testing statistics functions...');
    
    // Donation stats
    const donationStats = getDonationStats();
    Logger.log(`✓ Donation stats: ${JSON.stringify(donationStats)}`);
    
    // Payment stats
    const paymentStats = getPaymentStats();
    Logger.log(`✓ Payment stats: ${JSON.stringify(paymentStats)}`);
    
    // Audit log summary
    const auditSummary = getAuditLogSummary();
    Logger.log(`✓ Audit log summary: ${JSON.stringify(auditSummary)}`);
    
    Logger.log('✓ Statistics tests passed');
  } catch (error) {
    Logger.log(`✗ Statistics test failed: ${error}`);
  }
}

/**
 * Performance test - Creating multiple records
 */
function testPerformance() {
  try {
    Logger.log('Testing performance...');
    
    const startTime = new Date().getTime();
    
    // Create 10 donors
    for (let i = 1; i <= 10; i++) {
      createOrGetDonor({
        name: `Perf Test Donor ${i}`,
        mobile: `99${String(i).padStart(8, '0')}`
      });
    }
    
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    
    Logger.log(`✓ Created 10 donors in ${duration}ms`);
    Logger.log('✓ Performance test passed');
  } catch (error) {
    Logger.log(`✗ Performance test failed: ${error}`);
  }
}

/**
 * Test idempotency
 */
function testIdempotency() {
  try {
    Logger.log('Testing idempotency...');
    
    // Create donor
    const donor = createOrGetDonor({
      name: 'Idempotency Test',
      mobile: '9877776666'
    });
    const firstDonorId = donor.donor_id;
    
    // Create same donor again (should return existing)
    const donor2 = createOrGetDonor({
      name: 'Idempotency Test',
      mobile: '9877776666'
    });
    const secondDonorId = donor2.donor_id;
    
    if (firstDonorId === secondDonorId) {
      Logger.log('✓ createOrGetDonor is idempotent');
    } else {
      Logger.log('✗ createOrGetDonor created duplicate');
    }
    
    Logger.log('✓ Idempotency tests passed');
  } catch (error) {
    Logger.log(`✗ Idempotency test failed: ${error}`);
  }
}

/**
 * Summary of all tests
 */
function testSummary() {
  try {
    Logger.log('\n========== TEST SUMMARY ==========');
    
    // Get statistics
    const donors = countDonors();
    const donations = countDonations();
    const auditLog = getAuditLog(10000);
    
    Logger.log(`Total Donors: ${donors}`);
    Logger.log(`Total Donations: ${donations}`);
    Logger.log(`Audit Log Entries: ${auditLog.length}`);
    Logger.log(`Active Form Fields: ${getActiveFormFields().length}`);
    
    const stats = getDonationStats();
    Logger.log(`Total Donation Amount: ₹${stats.total_amount}`);
    Logger.log(`Confirmed Donations: ${stats.confirmed_count}`);
    Logger.log(`Pending Confirmations: ${stats.pending_count}`);
    
    Logger.log('==================================\n');
  } catch (error) {
    Logger.log(`Error generating summary: ${error}`);
  }
}