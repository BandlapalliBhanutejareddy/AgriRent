require('dotenv').config();

async function testBackendAI() {
  const baseUrl = 'http://localhost:4000/api';

  try {
    // 1. Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'farmer@agrorent.ai', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.success) {
      throw new Error('Login failed: ' + JSON.stringify(loginData));
    }
    const token = loginData.token;
    console.log('Login Success. Token length:', token.length);

    // 2. Call AI Advisor
    const aiRes = await fetch(`${baseUrl}/ai/advisor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ prompt: 'Which equipment is suitable for 5 acres of paddy?', language: 'English' })
    });
    
    const aiData = await aiRes.json();
    console.log('AI Response Status:', aiRes.status);
    console.log('AI Response:', aiData);

    if (aiRes.status === 200 && aiData.reply) {
      console.log('BACKEND AI ADVISOR TEST: PASS');
    } else {
      console.log('BACKEND AI ADVISOR TEST: FAIL');
    }

  } catch (err) {
    console.error('BACKEND AI ADVISOR TEST: FAIL', err.message);
    process.exit(1);
  }
}

testBackendAI();
