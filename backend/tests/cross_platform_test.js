const axios = require('axios');
const assert = require('assert');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:4000/api';

async function runTests() {
  console.log('Starting Cross-Platform Integration Tests...');
  let farmerToken, ownerToken;
  let farmerRefreshToken, ownerRefreshToken;
  let equipmentId;

  const suffix = Date.now();
  const farmerCreds = { name: 'Flutter Farmer', email: `flutter_farmer_${suffix}@test.com`, password: 'Password123!', role: 'FARMER' };
  const ownerCreds = { name: 'Web Owner', email: `web_owner_${suffix}@test.com`, password: 'Password123!', role: 'OWNER' };

  try {
    console.log('--- TEST 4: SHARED AUTHENTICATION ---');
    // Register Farmer on "Mobile"
    try {
      await axios.post(`${BASE_URL}/auth/register`, farmerCreds);
      const otpRecord = await prisma.oTPVerification.findFirst({ where: { email: farmerCreds.email }, orderBy: { createdAt: 'desc' }});
      await axios.post(`${BASE_URL}/auth/verify-otp`, { email: farmerCreds.email, otp: otpRecord.otp, purpose: 'REGISTER' });
    } catch (e) {
      if (e.response?.data?.error !== 'Email already registered' && e.response?.data?.error !== 'User already exists') {
        throw e;
      }
    }
    
    // Login Farmer on "Mobile"
    let res = await axios.post(`${BASE_URL}/auth/login`, { email: farmerCreds.email, password: farmerCreds.password });
    assert(res.data.success, 'Mobile login failed');
    farmerToken = res.data.token;
    farmerRefreshToken = res.data.refreshToken;
    console.log('✔ Mobile Registration & Login verified');

    // Register Owner on "Web"
    try {
      await axios.post(`${BASE_URL}/auth/register`, ownerCreds);
      const otpRecord = await prisma.oTPVerification.findFirst({ where: { email: ownerCreds.email }, orderBy: { createdAt: 'desc' }});
      await axios.post(`${BASE_URL}/auth/verify-otp`, { email: ownerCreds.email, otp: otpRecord.otp, purpose: 'REGISTER' });
    } catch (e) {
      if (e.response?.data?.error !== 'Email already registered' && e.response?.data?.error !== 'User already exists') {
        throw e;
      }
    }

    // Login Owner on "Web"
    res = await axios.post(`${BASE_URL}/auth/login`, { email: ownerCreds.email, password: ownerCreds.password });
    ownerToken = res.data.token;
    console.log('✔ Web Registration & Login verified');


    console.log('\n--- TEST 6: CROSS-PLATFORM EQUIPMENT ---');
    // Owner creates equipment on "Web"
    res = await axios.post(`${BASE_URL}/equipment`, {
      title: 'Test Tractor ' + Date.now(),
      description: 'A reliable test tractor',
      pricePerDay: 500,
      category: 'TRACTOR',
      available: true
    }, { headers: { Authorization: `Bearer ${ownerToken}` } });
    equipmentId = res.data.data.id;
    console.log('✔ Owner created equipment on Web');

    // Farmer views equipment on "Mobile"
    res = await axios.get(`${BASE_URL}/equipment?category=TRACTOR`, { headers: { Authorization: `Bearer ${farmerToken}` } });
    const items = res.data.data.data || res.data.data;
    const found = items.find(eq => eq.id === equipmentId);
    assert(found, 'Mobile Farmer cannot see Web Owner equipment');
    console.log('✔ Mobile Farmer sees Web Owner equipment');


    console.log('\n--- TEST 7: CROSS-PLATFORM BOOKING ---');
    // Farmer books equipment on "Mobile"
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);

    res = await axios.post(`${BASE_URL}/bookings`, {
      equipmentId: equipmentId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }, { headers: { Authorization: `Bearer ${farmerToken}` } });
    
    const bookingId = res.data.data.id;
    assert(bookingId, 'Booking failed');
    console.log('✔ Mobile Farmer booked equipment');

    // Owner accepts booking on "Web"
    res = await axios.put(`${BASE_URL}/bookings/${bookingId}/status`, {
      status: 'ACCEPTED'
    }, { headers: { Authorization: `Bearer ${ownerToken}` } });
    assert.strictEqual(res.data.data.status, 'ACCEPTED');
    console.log('✔ Web Owner accepted booking');

    // Farmer sees accepted booking on "Mobile"
    res = await axios.get(`${BASE_URL}/bookings`, { headers: { Authorization: `Bearer ${farmerToken}` } });
    const farmerBooking = res.data.data.find(b => b.id === bookingId);
    assert.strictEqual(farmerBooking.status, 'ACCEPTED');
    console.log('✔ Mobile Farmer sees booking is ACCEPTED');

    console.log('\n--- TEST MULTI-OWNER MARKETPLACE ---');
    const owner2Creds = { name: 'Owner 2', email: `owner2_${suffix}@test.com`, password: 'Password123!', role: 'OWNER' };
    await axios.post(`${BASE_URL}/auth/register`, owner2Creds);
    let otpRec2 = await prisma.oTPVerification.findFirst({ where: { email: owner2Creds.email }, orderBy: { createdAt: 'desc' }});
    await axios.post(`${BASE_URL}/auth/verify-otp`, { email: owner2Creds.email, otp: otpRec2.otp, purpose: 'REGISTER' });
    let res2 = await axios.post(`${BASE_URL}/auth/login`, { email: owner2Creds.email, password: owner2Creds.password });
    let owner2Token = res2.data.token;
    await axios.post(`${BASE_URL}/equipment`, { title: 'Tractor 2', description: 'Desc', pricePerDay: 400, category: 'TRACTOR', available: true }, { headers: { Authorization: `Bearer ${owner2Token}` } });
    
    // Farmer search
    res = await axios.get(`${BASE_URL}/equipment`, { headers: { Authorization: `Bearer ${farmerToken}` } });
    let marketplaceItems = res.data.data.data || res.data.data;
    assert(marketplaceItems.length >= 2, 'Marketplace should show equipment from multiple owners');
    console.log('✔ Global multi-owner marketplace verified');

    console.log('\n--- TEST BOOKING CONFLICT ---');
    try {
      await axios.post(`${BASE_URL}/bookings`, {
        equipmentId: equipmentId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }, { headers: { Authorization: `Bearer ${farmerToken}` } });
      assert.fail('Should have rejected overlapping booking');
    } catch (e) {
      assert(e.response && (e.response.status === 400 || e.response.status === 409), 'Should reject with 400/409');
      console.log('✔ Booking conflict properly rejected by backend');
    }

    console.log('\n--- TEST NOTIFICATIONS ---');
    res = await axios.get(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${farmerToken}` } });
    assert(res.data.data.length > 0, 'Farmer should have received a notification for accepted booking');
    console.log('✔ Notifications verified via API');

    console.log('\n--- TEST ANALYTICS ---');
    res = await axios.get(`${BASE_URL}/analytics/owner`, { headers: { Authorization: `Bearer ${ownerToken}` } });
    assert(res.data.success, 'Owner analytics retrieved');
    console.log('✔ Analytics API verified');

    console.log('\n--- TEST PROFILE ---');
    res = await axios.get(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${farmerToken}` } });
    assert.strictEqual(res.data.data.email, farmerCreds.email, 'Profile data mismatch');
    console.log('✔ Profile API verified');

    console.log('\n--- TEST PAYMENT & AI GRACEFUL DEGRADATION ---');
    try {
      await axios.post(`${BASE_URL}/payments/create-order`, { amount: 500, currency: 'INR' }, { headers: { Authorization: `Bearer ${farmerToken}` } });
    } catch (e) {
      assert([500, 503, 400].includes(e.response?.status), 'Payment API should gracefully handle missing keys or bad request');
    }
    
    try {
      await axios.post(`${BASE_URL}/ai/advisor`, { prompt: 'Hello' }, { headers: { Authorization: `Bearer ${farmerToken}` } });
    } catch (e) {
      if (![400, 500, 503].includes(e.response?.status)) {
         throw new Error(`AI API failed with unexpected status: ${e.response?.status}. Body: ${JSON.stringify(e.response?.data)}`);
      }
    }
    console.log('✔ Payment and AI gracefully degrade (no live keys)');

    console.log('\n--- TOKEN ROTATION TEST ---');
    res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: farmerRefreshToken });
    assert(res.data.success, 'Token refresh failed');
    console.log('✔ Token refresh works seamlessly');

    console.log('\nAll Cross-Platform Tests Passed!');

  } catch (error) {
    console.error('Test Failed:', error.response ? JSON.stringify(error.response.data) : error.message);
    process.exit(1);
  }
}

runTests();
