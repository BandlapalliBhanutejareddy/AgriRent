const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testGemini() {
  console.log('--- Testing Gemini Route ---');
  try {
    const res = await axios.post(`${API_URL}/ai/advisor`, {
      prompt: 'How to grow tomatoes?',
      language: 'English'
    });
    console.log('Response:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Error Response:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

testGemini();
