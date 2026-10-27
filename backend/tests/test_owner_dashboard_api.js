const axios = require('axios');
const API_BASE = 'http://localhost:4000/api';

async function testOwner(email, password) {
  console.log(`\n================ Testing ${email} ================`);
  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password,
      role: 'OWNER'
    });
    const token = loginRes.data.token || loginRes.data.data?.token;
    const user = loginRes.data.user || loginRes.data.data?.user;
    console.log(`Logged in as ${user.name} (${user.id}), role: ${user.role}`);

    // 1. My Equipment
    const eqRes = await axios.get(`${API_BASE}/equipment/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const eqData = eqRes.data.data || eqRes.data;
    console.log(`Equipment (/equipment/my): ${Array.isArray(eqData) ? eqData.length : 'NOT ARRAY'}`);
    if (Array.isArray(eqData) && eqData.length > 0) {
      console.log(`- Sample Equip: ${eqData[0].title} (id: ${eqData[0].id}, available: ${eqData[0].available})`);
    }

    // 2. Owner Bookings
    const bkRes = await axios.get(`${API_BASE}/bookings/owner`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const bkData = bkRes.data.data || bkRes.data;
    console.log(`Bookings (/bookings/owner): ${Array.isArray(bkData) ? bkData.length : 'NOT ARRAY'}`);
    if (Array.isArray(bkData) && bkData.length > 0) {
      console.log(`- Sample Booking: id=${bkData[0].id}, status=${bkData[0].status}, equipment=${bkData[0].equipment?.title}`);
    }

    // 3. Analytics
    const anRes = await axios.get(`${API_BASE}/analytics/owner`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Analytics status: ${anRes.status}, keys: ${Object.keys(anRes.data)}`);
  } catch (err) {
    console.error('Failed:', err.response ? { status: err.response.status, data: err.response.data } : err.message);
  }
}

async function main() {
  await testOwner('web_owner_1787209581213@test.com', 'Password123!');
  await testOwner('owner.live@agrorent.ai', 'Password123!');
  await testOwner('owner11@gmail.com', 'Password123!');
}

main().catch(console.error);
