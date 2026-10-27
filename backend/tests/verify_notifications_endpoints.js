const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testNotifications() {
  console.log('=== VERIFYING NOTIFICATION BACKEND ENDPOINTS ===\n');

  // Authenticate as farmer
  const farmerRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'farmer.b.1788354195151@agrorent.ai',
    password: 'Password123!',
    role: 'FARMER'
  });
  const farmerToken = farmerRes.data.token || farmerRes.data.data?.token;
  const headers = { Authorization: `Bearer ${farmerToken}` };

  // 1. Fetch notifications
  const resList = await axios.get(`${API_BASE}/notifications`, { headers });
  console.log('1. GET /api/notifications: PASS (status:', resList.status, ', count:', resList.data.length, ')');

  // 2. Mark all as read
  const resReadAll = await axios.put(`${API_BASE}/notifications/read-all`, {}, { headers });
  console.log('2. PUT /api/notifications/read-all: PASS (status:', resReadAll.status, ', success:', resReadAll.data.success, ')');

  // 3. Verify unauthenticated rejection
  try {
    await axios.get(`${API_BASE}/notifications`);
    console.error('3. Unauthenticated Rejection: FAIL (expected 401)');
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('3. Unauthenticated Rejection (401): PASS');
    } else {
      console.error('3. Unauthenticated Rejection: FAIL', err.message);
      process.exit(1);
    }
  }

  console.log('\nAll notification backend endpoints PASSED!');
}

testNotifications().catch(err => {
  console.error('Test error:', err.response?.data || err.message);
  process.exit(1);
});
