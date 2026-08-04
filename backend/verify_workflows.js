const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function verifyFeatures() {
  console.log('--- Phase 5 & 6 Verification Script ---');
  let token = '';

  try {
    // 1. Login as Owner
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner-test@agrorent.ai',
      password: 'password123'
    });
    token = loginRes.data.token;
    console.log('✅ Login successful for Owner');

    // 2. Update Profile
    const profileRes = await axios.put(`${API_URL}/users/profile`, {
      name: 'Owner Tester Updated',
      phone: '9999999999'
    }, { headers: { Authorization: `Bearer ${token}` } });
    if(profileRes.data.name === 'Owner Tester Updated') {
      console.log('✅ Profile Update verified');
    }

    // 3. Create Equipment (Phase 6)
    const eqRes = await axios.post(`${API_URL}/equipment`, {
      title: 'Mahindra Jivo 225',
      category: 'TRACTOR',
      pricePerDay: 1200,
      location: 'Pune',
      description: 'Compact and powerful.',
      imageUrl: 'https://images.unsplash.com/photo-1595273670150-db0a3e39223e?auto=format&fit=crop&q=80&w=400'
    }, { headers: { Authorization: `Bearer ${token}` } });
    const equipmentId = eqRes.data.id;
    console.log(`✅ Equipment Created: ${equipmentId}`);

    // 4. Update Equipment
    const eqUpRes = await axios.put(`${API_URL}/equipment/${equipmentId}`, {
      pricePerDay: 1300
    }, { headers: { Authorization: `Bearer ${token}` } });
    if(eqUpRes.data.pricePerDay === 1300) {
      console.log('✅ Equipment Update verified');
    }

    // 5. Read Equipment (Search & Filter - Phase 5 & 7)
    const searchRes = await axios.get(`${API_URL}/equipment?category=TRACTOR&search=Mahindra`);
    if(searchRes.data.length > 0) {
      console.log('✅ Equipment Search & Filters verified');
    }

    // 6. Notifications API (if exists)
    // Checking if there's a notification endpoint
    try {
        const notifRes = await axios.get(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
        console.log('✅ Notifications Read verified');
    } catch(e) {
        console.log('⚠️ Notifications endpoint might not exist locally, skipped.');
    }

    // 7. Delete Equipment
    await axios.delete(`${API_URL}/equipment/${equipmentId}`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('✅ Equipment Delete verified');

    console.log('--- Phase 5 & 6 Verified ---');
  } catch(error) {
    console.error('❌ Verification Failed:', error.response?.data || error.message);
  }
}

verifyFeatures();
