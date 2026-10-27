const axios = require('axios');
const API_BASE = 'http://localhost:4000/api';

async function main() {
  const farmerRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'farmer.b.1788354195151@agrorent.ai',
    password: 'Password123!',
    role: 'FARMER'
  });
  const token = farmerRes.data.token || farmerRes.data.data?.token;
  console.log('Farmer logged in successfully, token length:', token?.length);

  // Get farms
  const farmsRes = await axios.get(`${API_BASE}/farms`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const farms = Array.isArray(farmsRes.data) ? farmsRes.data : (farmsRes.data.data || []);
  console.log(`Farms count: ${farms.length}`);
  if (farms.length === 0) {
    console.log('No farms found for farmer@test.com');
    return;
  }

  const farm = farms[0];
  console.log(`Testing schedule for farm ${farm.name} (${farm.id})...`);
  const start = Date.now();
  try {
    const res = await axios.get(`${API_BASE}/farms/${farm.id}/schedule?lang=en`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 45000
    });
    console.log(`Schedule success in ${Date.now() - start}ms:`, {
      status: res.status,
      keys: Object.keys(res.data),
      operations: res.data.operations ? res.data.operations.length : 0
    });
  } catch (err) {
    console.log(`Schedule failed in ${Date.now() - start}ms:`, err.response ? { status: err.response.status, data: err.response.data } : err.message);
  }

  // Also test operations endpoint
  if (farm.crops && farm.crops.length > 0) {
    const cropId = farm.crops[0].id;
    console.log(`Testing operations for crop ${cropId}...`);
    try {
      const opsRes = await axios.get(`${API_BASE}/farms/${farm.id}/crops/${cropId}/operations`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      console.log('Operations status:', opsRes.status, 'count:', Array.isArray(opsRes.data) ? opsRes.data.length : 0);
    } catch (e) {
      console.log('Operations error:', e.response ? e.response.data : e.message);
    }
  }
}

main().catch(console.error);
