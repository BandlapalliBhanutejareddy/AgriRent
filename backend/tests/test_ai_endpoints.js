const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testEndpoints() {
  console.log('=== BENCHMARKING AI & CHAT ENDPOINTS ===\n');

  // Authenticate as farmer
  const authStart = Date.now();
  const farmerRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'farmer.b.1788354195151@agrorent.ai',
    password: 'Password123!',
    role: 'FARMER'
  });
  const farmerToken = farmerRes.data.token || farmerRes.data.data?.token;
  console.log(`Auth login completed in ${Date.now() - authStart}ms.`);

  const headers = { Authorization: `Bearer ${farmerToken}` };

  // 1. AI Advisor (English)
  console.log('\nTesting POST /api/ai/advisor (English)...');
  const t1 = Date.now();
  try {
    const res1 = await axios.post(`${API_BASE}/ai/advisor`, {
      prompt: 'How to control blast disease in Paddy?',
      crop: 'Paddy',
      language: 'English'
    }, { headers, timeout: 60000 });
    const d1 = Date.now() - t1;
    console.log(`AI Advisor (English) completed in ${d1}ms.`);
    console.log('Reply preview:', (res1.data.reply || '').slice(0, 150).replace(/\n/g, ' '));
  } catch (err) {
    console.error(`AI Advisor (English) failed in ${Date.now() - t1}ms:`, err.response?.data || err.message);
  }

  // 2. AI Advisor (Telugu)
  console.log('\nTesting POST /api/ai/advisor (Telugu)...');
  const t2 = Date.now();
  try {
    const res2 = await axios.post(`${API_BASE}/ai/advisor`, {
      prompt: 'వరి పంటలో అగ్గి తెగులు నివారణ ఎలా?',
      crop: 'వరి',
      language: 'Telugu'
    }, { headers, timeout: 60000 });
    const d2 = Date.now() - t2;
    console.log(`AI Advisor (Telugu) completed in ${d2}ms.`);
    console.log('Reply preview:', (res2.data.reply || '').slice(0, 150).replace(/\n/g, ' '));
  } catch (err) {
    console.error(`AI Advisor (Telugu) failed in ${Date.now() - t2}ms:`, err.response?.data || err.message);
  }

  // 3. Test Booking Chat Endpoint
  console.log('\nTesting GET /api/chat/unread-count...');
  const t3 = Date.now();
  try {
    const res3 = await axios.get(`${API_BASE}/chat/unread-count`, { headers, timeout: 10000 });
    const d3 = Date.now() - t3;
    console.log(`Chat unread-count completed in ${d3}ms. Count:`, res3.data.unreadCount);
  } catch (err) {
    console.error(`Chat unread-count failed:`, err.response?.data || err.message);
  }
}

testEndpoints().catch(console.error);
