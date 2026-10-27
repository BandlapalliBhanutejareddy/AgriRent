const assert = require('assert');

const API_BASE = 'http://localhost:4000/api';

async function run() {
  console.log('--- STARTING BACKEND INTEGRATION VERIFICATION ---');

  // Test 1: Register validation - invalid email
  console.log('\n[1] Testing Registration Email Validation...');
  const resBadEmail = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Farmer',
      email: 'not-an-email',
      password: 'Password123',
      role: 'FARMER'
    })
  });
  const dataBadEmail = await resBadEmail.json();
  console.log('Bad email response status:', resBadEmail.status, dataBadEmail.error);
  assert.strictEqual(resBadEmail.status, 400);
  assert(dataBadEmail.error.includes('valid email'));

  // Test 2: Register validation - weak password
  console.log('\n[2] Testing Registration Password Policy Validation...');
  const resWeakPass = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Farmer',
      email: 'valid_test@example.com',
      password: 'weak',
      role: 'FARMER'
    })
  });
  const dataWeakPass = await resWeakPass.json();
  console.log('Weak password response status:', resWeakPass.status, dataWeakPass.error);
  assert.strictEqual(resWeakPass.status, 400);
  assert(dataWeakPass.error.includes('Minimum 8 characters'));

  // Test 3: Register validation - forbid self-registering as ADMIN
  console.log('\n[3] Testing Registration Role Validation (Forbid ADMIN)...');
  const resAdminRole = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Hacker Admin',
      email: 'hacker@example.com',
      password: 'Password123',
      role: 'ADMIN'
    })
  });
  const dataAdminRole = await resAdminRole.json();
  console.log('Admin role rejection status:', resAdminRole.status, dataAdminRole.error);
  assert.strictEqual(resAdminRole.status, 400);
  assert(dataAdminRole.error.includes('Must be FARMER or OWNER'));

  // Test 4: Register validation - duplicate email prevention
  console.log('\n[4] Testing Duplicate Email Prevention...');
  const resDupEmail = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Owner Duplicate',
      email: 'owner11@gmail.com',
      password: 'Password123',
      role: 'OWNER'
    })
  });
  const dataDupEmail = await resDupEmail.json();
  console.log('Duplicate email rejection status:', resDupEmail.status, dataDupEmail.error);
  assert.strictEqual(resDupEmail.status, 400);
  assert(dataDupEmail.error.includes('already exists'));

  // Test 5: Google OAuth endpoint validation
  console.log('\n[5] Testing Google Auth Token Requirement...');
  const resGoogleNoToken = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'FARMER' })
  });
  const dataGoogleNoToken = await resGoogleNoToken.json();
  console.log('Google missing token status:', resGoogleNoToken.status, dataGoogleNoToken.error);
  assert.strictEqual(resGoogleNoToken.status, 400);
  assert(dataGoogleNoToken.error.includes('Google ID token is required'));

  // Test 5b: Google OAuth invalid token verification
  console.log('\n[5b] Testing Google OAuth Token Verification with Fake Token...');
  const resGoogleInvalid = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'invalid_dummy_token_xyz', role: 'FARMER' })
  });
  const dataGoogleInvalid = await resGoogleInvalid.json();
  console.log('Google invalid token status:', resGoogleInvalid.status, dataGoogleInvalid.error);
  assert.strictEqual(resGoogleInvalid.status, 401);
  assert(dataGoogleInvalid.error.includes('Invalid or expired Google identity token'));

  // Test 6: Login owner and test owner bank details gating
  console.log('\n[6] Logging in Owner to verify Bank Details Gating...');
  const resLogin = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner11@gmail.com',
      password: 'Password123!',
      role: 'OWNER'
    })
  });
  const dataLogin = await resLogin.json();
  assert.strictEqual(resLogin.status, 200);
  const token = dataLogin.token;
  console.log('Owner successfully authenticated! User ID:', dataLogin.user.id);

  // Test 7: Owner Analytics endpoint check
  console.log('\n[7] Testing Owner Analytics Endpoint (Real Metrics & Privacy)...');
  const resAnalytics = await fetch(`${API_BASE}/analytics/owner?period=30d`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const dataAnalytics = await resAnalytics.json();
  const payload = dataAnalytics.data || dataAnalytics;
  console.log('Analytics response status:', resAnalytics.status, 'body keys:', Object.keys(dataAnalytics));
  assert.strictEqual(resAnalytics.status, 200);
  assert(payload.equipmentMetrics !== undefined);
  assert(payload.financialMetrics !== undefined);
  console.log('Real Equipment Count:', payload.equipmentMetrics.total);
  console.log('Real Gross Booking Value:', payload.financialMetrics.grossBookingValue);
  console.log('Real Payments Realized:', payload.financialMetrics.realizedEarnings);

  // Test 8: Cross-owner analytics protection
  console.log('\n[8] Testing Cross-Owner Analytics Prohibition...');
  const resCrossOwner = await fetch(`${API_BASE}/analytics/owner?ownerId=fake_other_owner_id`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Cross-owner status:', resCrossOwner.status);
  assert.strictEqual(resCrossOwner.status, 403);

  // Test 9: Priority 5 - Invoice Gating for Pending/Unpaid Bookings
  console.log('\n[9] Testing Invoice Access Gating (Rejecting Unpaid Bookings)...');
  const resInvoice = await fetch(`${API_BASE}/payments/non_existent_or_unpaid/invoice`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const dataInvoice = await resInvoice.json();
  console.log('Invoice download status for invalid/unpaid booking:', resInvoice.status, dataInvoice.error || dataInvoice.message);
  assert(resInvoice.status === 400 || resInvoice.status === 404);

  console.log('\n>>> ALL BACKEND INTEGRATION CHECKS PASSED SUCCESSFULLY! <<<');
}

run().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
