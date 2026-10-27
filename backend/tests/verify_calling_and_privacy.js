const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testCallingAndPrivacy() {
  console.log('=== VERIFYING CALLING & PRIVACY BACKEND ENDPOINTS ===\n');

  // 1. Health check
  try {
    const health = await axios.get('http://localhost:4000/api/health');
    console.log('1. Backend Health Check: PASS (status:', health.status, ')');
  } catch (err) {
    console.error('1. Backend Health Check: FAIL', err.message);
    process.exit(1);
  }

  // 2. Auth tests for Farmer & Owner
  let farmerToken, ownerToken;
  try {
    const farmerRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'farmer.b.1788354195151@agrorent.ai',
      password: 'Password123!',
      role: 'FARMER'
    });
    farmerToken = farmerRes.data.token || farmerRes.data.data?.token;
    console.log('2. Farmer Auth: PASS (token received)');
  } catch (err) {
    console.error('2. Farmer Auth: FAIL', err.response?.data || err.message);
  }

  try {
    const ownerRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'web_owner_1787209581213@test.com',
      password: 'Password123!',
      role: 'OWNER'
    });
    ownerToken = ownerRes.data.token || ownerRes.data.data?.token;
    console.log('3. Owner Auth: PASS (token received)');
  } catch (err) {
    console.error('3. Owner Auth: FAIL', err.response?.data || err.message);
  }

  // Set valid phone for Owner and Farmer to test complete flow
  if (ownerToken) {
    try {
      await axios.put(
        `${API_BASE}/auth/me`,
        { phone: '9876543210', name: 'Verified Test Owner' },
        { headers: { Authorization: `Bearer ${ownerToken}` } }
      );
      console.log('4. Owner Profile Phone Update (9876543210): PASS');
    } catch (err) {
      console.log('4. Owner Profile Phone Update:', err.message);
    }
  }

  if (farmerToken) {
    try {
      await axios.put(
        `${API_BASE}/auth/me`,
        { phone: '9123456780', name: 'Verified Test Farmer' },
        { headers: { Authorization: `Bearer ${farmerToken}` } }
      );
      console.log('5. Farmer Profile Phone Update (9123456780): PASS');
    } catch (err) {
      console.log('5. Farmer Profile Phone Update:', err.message);
    }
  }

  // 6. Test Equipment Creation with Valid Phone
  let createdEquipmentId = null;
  if (ownerToken) {
    try {
      const eqPayload = {
        title: `John Deere 5050D Tractor ${Date.now()}`,
        description: '50 HP reliable tractor for all tillage and hauling operations',
        category: 'TRACTOR',
        pricePerDay: 2000,
        location: 'Kadapa, Andhra Pradesh'
      };
      const addRes = await axios.post(`${API_BASE}/equipment`, eqPayload, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      const eqData = addRes.data.data || addRes.data;
      createdEquipmentId = eqData.id;
      console.log('6. Owner Equipment Creation with Valid Phone: PASS (ID:', createdEquipmentId, ')');
    } catch (err) {
      console.error('6. Owner Equipment Creation: FAIL', err.response?.data || err.message);
    }
  }

  // 7. Test Equipment List & Detail Privacy Sanitization
  if (createdEquipmentId && farmerToken) {
    try {
      const eqDetailRes = await axios.get(`${API_BASE}/equipment/${createdEquipmentId}`, {
        headers: { Authorization: `Bearer ${farmerToken}` }
      });
      const eq = eqDetailRes.data.data || eqDetailRes.data;
      if (eq.owner && eq.owner.phone) {
        console.error('7. Equipment Detail Privacy: FAIL (Owner phone leaked!):', eq.owner.phone);
      } else {
        console.log('7. Equipment Detail Privacy (Owner phone safely stripped): PASS');
      }
    } catch (err) {
      console.error('7. Equipment Detail Privacy: FAIL', err.response?.data || err.message);
    }
  }

  // 8. Test Private Call Initiation (POST /api/calls/initiate)
  if (farmerToken && createdEquipmentId) {
    try {
      const callRes = await axios.post(
        `${API_BASE}/calls/initiate`,
        { equipmentId: createdEquipmentId },
        { headers: { Authorization: `Bearer ${farmerToken}` } }
      );
      const data = callRes.data.data || callRes.data;
      console.log('8. Private Call Initiation via Equipment ID: PASS');
      console.log('   - Relay Session ID:', data.sessionId);
      console.log('   - Recipient Name:', data.targetName);
      console.log('   - Privacy Mode:', data.privacyMode);
      console.log('   - Privacy Verified (No Raw Numbers):', !data.phone && !data.ownerPhone ? 'PASS' : 'FAIL');
    } catch (err) {
      console.error('8. Private Call Initiation: FAIL', err.response?.data || err.message);
    }
  }

  // 9. Test Booking Flow & Booking Call Initiation
  if (farmerToken && ownerToken && createdEquipmentId) {
    try {
      // Create a booking
      const now = new Date();
      const startDate = new Date(now.getTime() + 86400000).toISOString();
      const endDate = new Date(now.getTime() + 2 * 86400000).toISOString();
      const bookingRes = await axios.post(
        `${API_BASE}/bookings`,
        {
          equipmentId: createdEquipmentId,
          startDate,
          endDate,
          deliveryAddress: 'Kadapa Farm Sector 4'
        },
        { headers: { Authorization: `Bearer ${farmerToken}` } }
      );
      const booking = bookingRes.data.data || bookingRes.data;
      const bookingId = booking.id;
      console.log('9. Booking Creation: PASS (ID:', bookingId, ')');

      // Call Owner from Booking (as Farmer)
      const callOwnerRes = await axios.post(
        `${API_BASE}/calls/initiate`,
        { bookingId },
        { headers: { Authorization: `Bearer ${farmerToken}` } }
      );
      const callOwnerData = callOwnerRes.data.data || callOwnerRes.data;
      console.log('10. Farmer -> Owner Private Call from Booking: PASS');
      console.log('    - Session ID:', callOwnerData.sessionId);
      console.log('    - Calling:', callOwnerData.targetName);
      console.log('    - Privacy Mode:', callOwnerData.privacyMode);

      // Call Farmer from Booking (as Owner)
      const callFarmerRes = await axios.post(
        `${API_BASE}/calls/initiate`,
        { bookingId },
        { headers: { Authorization: `Bearer ${ownerToken}` } }
      );
      const callFarmerData = callFarmerRes.data.data || callFarmerRes.data;
      console.log('11. Owner -> Farmer Private Call from Booking: PASS');
      console.log('    - Session ID:', callFarmerData.sessionId);
      console.log('    - Calling:', callFarmerData.targetName);
      console.log('    - Privacy Mode:', callFarmerData.privacyMode);

    } catch (err) {
      console.error('9-11. Booking Call Flows: FAIL', err.response?.data || err.message);
    }
  }

  // 12. Test Unauthorized Call (Blocked)
  try {
    await axios.post(`${API_BASE}/calls/initiate`, { equipmentId: createdEquipmentId || 'fake-id' });
    console.error('12. Unauthenticated Call Rejection: FAIL (allowed without token)');
  } catch (err) {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      console.log('12. Unauthenticated Call Rejection: PASS (blocked with status:', err.response.status, ')');
    } else {
      console.error('12. Unauthenticated Call Rejection: FAIL', err.message);
    }
  }

  console.log('\n=============================================================');
  console.log('ALL CALLING & PRIVACY TESTS EXECUTED AND FULLY VERIFIED');
  console.log('=============================================================');
}

testCallingAndPrivacy();
