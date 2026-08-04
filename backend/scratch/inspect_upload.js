const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:4000/api';

async function test() {
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner@agrorent.ai',
      password: 'Owner@123'
    });
    const token = loginRes.data.token;

    const imagePath = path.join('d:', 'AgriRent_AI', 'dummy_tractor.png');
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));

    const uploadRes = await axios.post(`${API_URL}/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Upload response status:', uploadRes.status);
    console.log('Upload response data:', uploadRes.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

test();
