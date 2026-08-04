const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function verifyAdmin() {
  console.log('--- Phase 9 Validation ---');
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin-test@agrorent.ai',
      password: 'password123'
    });
    const token = loginRes.data.token;

    const analyticsRes = await axios.get(`${API_URL}/analytics/admin`, { headers: { Authorization: `Bearer ${token}` } });
    if(analyticsRes.data) {
        console.log('✅ Admin Analytics/Reports: Success');
    }

    console.log('--- Phase 9 Validation Complete ---');
  } catch(e) {
    console.error('❌ Validation Failed:', e.response?.data || e.message);
  }
}
verifyAdmin();
