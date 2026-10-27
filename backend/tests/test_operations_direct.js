const axios = require('axios');
const API_BASE = 'http://localhost:4000/api';

async function main() {
  const farmerRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'farmer.b.1788354195151@agrorent.ai',
    password: 'Password123!',
    role: 'FARMER'
  });
  const token = farmerRes.data.token || farmerRes.data.data?.token;

  const farmsRes = await axios.get(`${API_BASE}/farms`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const farms = Array.isArray(farmsRes.data) ? farmsRes.data : (farmsRes.data.data || []);
  const farm = farms[0];
  const cropId = farm.crops[0]?.id;

  console.log(`Calling operations for farm ${farm.id}, crop ${cropId}...`);
  const start = Date.now();
  try {
    const opsRes = await axios.get(`${API_BASE}/farms/${farm.id}/crops/${cropId}/operations`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });
    console.log(`Operations resolved in ${Date.now() - start}ms:`, {
      status: opsRes.status,
      dataLength: Array.isArray(opsRes.data) ? opsRes.data.length : (opsRes.data.data ? opsRes.data.data.length : 'unknown')
    });
  } catch (e) {
    console.log(`Failed in ${Date.now() - start}ms:`, e.message);
  }
}

main().catch(console.error);
