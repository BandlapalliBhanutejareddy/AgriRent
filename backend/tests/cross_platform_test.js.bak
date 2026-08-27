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
