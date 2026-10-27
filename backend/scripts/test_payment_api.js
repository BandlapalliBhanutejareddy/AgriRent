const axios = require('axios');

async function test() {
  try {
    const login = await axios.post('http://127.0.0.1:4000/api/auth/login', {
      email: 'farmer.live@agrorent.ai',
      password: 'Farmer@123'
    });
    console.log('Login success! User:', login.data.user.name, 'Role:', login.data.user.role);
    const token = login.data.token;

    const res = await axios.get('http://127.0.0.1:4000/api/payments/history', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Payment history response code:', res.status);
    console.log('Payment records count:', res.data.length);
    console.log('Sample record:', res.data[0] || 'None');
  } catch (err) {
    console.error('API Error:', err.response?.status, err.response?.data || err.message);
  }
}

test();
