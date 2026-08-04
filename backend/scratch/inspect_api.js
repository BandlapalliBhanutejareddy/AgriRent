const axios = require('axios');
const API_URL = 'http://localhost:4000/api';

async function test() {
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner@agrorent.ai',
      password: 'Owner@123'
    });
    console.log('Login Response:', loginRes.data);
    const token = loginRes.data.token;

    const equipPayload = {
      title: 'Mahindra Arjun 555 Ultra E2E ' + Date.now(),
      category: 'TRACTOR',
      pricePerDay: 1800,
      description: 'High power tractor with standard plow implements.',
      imageUrl: 'https://images.unsplash.com/photo-1592919016382-70678625902b?auto=format&fit=crop&q=80&w=800',
      location: 'Nashik, Maharashtra'
    };

    const createRes = await axios.post(`${API_URL}/equipment`, equipPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Create Response status:', createRes.status);
    console.log('Create Response:', createRes.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

test();
