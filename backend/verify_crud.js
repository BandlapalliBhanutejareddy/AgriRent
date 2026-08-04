const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function verifyCRUD() {
  console.log('--- Phase 6 & 7 Validation ---');
  try {
    // Login Owner
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner-test@agrorent.ai',
      password: 'password123'
    });
    const token = loginRes.data.token;

    // Create Equipment
    const createRes = await axios.post(`${API_URL}/equipment`, {
      title: 'Demo Harvester 3000',
      category: 'HARVESTER',
      pricePerDay: 4500,
      location: 'Bangalore',
      description: 'High capacity harvester.',
      imageUrl: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?auto=format&fit=crop&q=80&w=800'
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    // Check if equipment is returned properly
    // The backend route might return { data: equipment } or { message, id, ... }
    const equipment = createRes.data.data || createRes.data;
    const eqId = equipment.id;
    console.log(`✅ Create Equipment: Success (ID: ${eqId})`);

    // Read Equipment
    const readRes = await axios.get(`${API_URL}/equipment`);
    const found = (readRes.data.data || readRes.data).find(e => e.id === eqId);
    if(found) console.log('✅ Read Equipment: Success');

    // Update Equipment
    await axios.put(`${API_URL}/equipment/${eqId}`, {
      pricePerDay: 4800
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('✅ Update Equipment: Success');

    // Marketplace Bookings
    const bookingRes = await axios.post(`${API_URL}/bookings`, {
      equipmentId: eqId,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      totalPrice: 4800
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('✅ Booking Request: Success');

    // Delete Equipment
    await axios.delete(`${API_URL}/equipment/${eqId}`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('✅ Delete Equipment: Success');

  } catch(e) {
    console.error('❌ Validation Failed:', e.response?.data || e.message);
  }
}
verifyCRUD();
