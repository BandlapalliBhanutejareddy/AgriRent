const axios = require('axios');

async function testPayments() {
  const farmerLogin = await axios.post('http://localhost:4000/api/auth/login', {
    email: 'farmer.b.1788354195151@agrorent.ai',
    password: 'Password123!',
    role: 'FARMER'
  });
  const farmerToken = farmerLogin.data.data?.token || farmerLogin.data.token || farmerLogin.data.accessToken;
  console.log('Farmer token acquired');

  const historyRes = await axios.get('http://localhost:4000/api/payments/history', {
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  const farmerRecords = Array.isArray(historyRes.data) ? historyRes.data : historyRes.data.data;
  console.log('Farmer Payment History count:', farmerRecords?.length);
  if (farmerRecords?.length > 0) {
    console.log('First farmer payment record:', JSON.stringify(farmerRecords[0], null, 2));
  }

  const ownerLogin = await axios.post('http://localhost:4000/api/auth/login', {
    email: 'web_owner_1787209581213@test.com',
    password: 'Password123!',
    role: 'OWNER'
  });
  const ownerToken = ownerLogin.data.data?.token || ownerLogin.data.token || ownerLogin.data.accessToken;
  console.log('Owner token acquired');

  const receivedRes = await axios.get('http://localhost:4000/api/payments/received', {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  const ownerRecords = Array.isArray(receivedRes.data) ? receivedRes.data : receivedRes.data.data;
  console.log('Owner Payments Received count:', ownerRecords?.length);
  if (ownerRecords?.length > 0) {
    console.log('First owner payment record:', JSON.stringify(ownerRecords[0], null, 2));
  }
}

testPayments().catch(err => {
  console.error('Error:', err.response?.data || err.message);
});
