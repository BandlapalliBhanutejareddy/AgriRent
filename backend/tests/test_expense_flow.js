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
  console.log(`Testing expense on farm: ${farm.name} (${farm.id})`);

  // 1. Get initial expenses
  const initRes = await axios.get(`${API_BASE}/farms/${farm.id}/financials/expenses`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Initial expenses response:', {
    status: initRes.status,
    data: initRes.data
  });

  // 2. Post a new expense
  const postRes = await axios.post(`${API_BASE}/farms/${farm.id}/financials/expense`, {
    title: 'Test Urea Fertilizer',
    amount: 1500,
    category: 'Fertilizer'
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Post expense response:', {
    status: postRes.status,
    data: postRes.data
  });

  // 3. Verify it shows in GET expenses
  const afterRes = await axios.get(`${API_BASE}/farms/${farm.id}/financials/expenses`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('After expenses response:', {
    status: afterRes.status,
    spentAmount: afterRes.data.spentAmount || afterRes.data.data?.spentAmount,
    expensesCount: (afterRes.data.expenses || afterRes.data.data?.expenses || []).length
  });
}

main().catch(err => {
  console.error('Test error:', err.response ? err.response.data : err.message);
});
