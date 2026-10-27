const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testPerformance() {
  console.log('--- TESTING OLLAMA CONNECTIVITY & AI PERFORMANCE ---');

  // 1. Ollama direct check
  const ollamaStart = Date.now();
  try {
    const tagsRes = await axios.get('http://localhost:11434/api/tags', { timeout: 3000 });
    const models = tagsRes.data.models.map(m => m.name);
    console.log(`[PASS] Ollama reachable in ${Date.now() - ollamaStart}ms. Models:`, models);
  } catch (err) {
    console.error('[FAIL] Ollama unreachable:', err.message);
    process.exit(1);
  }

  // 2. Auth login
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'farmer.b.1788354195151@agrorent.ai',
    password: 'Password123!',
    role: 'FARMER'
  });
  const token = loginRes.data.token || loginRes.data.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  // 3. AI Advisor English latency
  console.log('\n--- Measuring AI Advisor (English) ---');
  const tEn = Date.now();
  const resEn = await axios.post(`${API_BASE}/ai/advisor`, {
    prompt: 'How to manage weeds in Paddy?',
    crop: 'Paddy',
    language: 'English'
  }, { headers });
  const latencyEn = Date.now() - tEn;
  console.log(`[PASS] AI Advisor (English) Latency: ${latencyEn}ms`);
  console.log('English snippet:', (resEn.data.reply || '').slice(0, 120).replace(/\n/g, ' '));

  // 4. AI Advisor Telugu latency
  console.log('\n--- Measuring AI Advisor (Telugu) ---');
  const tTe = Date.now();
  const resTe = await axios.post(`${API_BASE}/ai/advisor`, {
    prompt: 'వరి పంటలో కలుపు నివారణ ఎలా?',
    crop: 'వరి',
    language: 'Telugu'
  }, { headers });
  const latencyTe = Date.now() - tTe;
  console.log(`[PASS] AI Advisor (Telugu) Latency: ${latencyTe}ms`);
  console.log('Telugu snippet:', (resTe.data.reply || '').slice(0, 120).replace(/\n/g, ' '));

  // 5. Chat Unread Count
  console.log('\n--- Measuring Chat Unread Count ---');
  const tChat = Date.now();
  const resChat = await axios.get(`${API_BASE}/chat/unread-count`, { headers });
  const latencyChat = Date.now() - tChat;
  console.log(`[PASS] Chat Unread Count Latency: ${latencyChat}ms. Count:`, resChat.data.unreadCount);
}

testPerformance().catch(err => {
  console.error('Test error:', err.response?.data || err.message);
  process.exit(1);
});
