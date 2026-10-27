const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000/api';

async function main() {
  // Find owners in database
  const owners = await prisma.user.findMany({
    where: { role: 'OWNER' },
    include: {
      equipments: true
    }
  });
  console.log(`Found ${owners.length} owners in DB.`);
  for (const o of owners) {
    console.log(`- Owner: ${o.name} (${o.email}, id: ${o.id}), Equipment count: ${o.equipments.length}`);
  }

  // Also check all equipment
  const allEquipment = await prisma.equipment.findMany({
    include: { owner: true }
  });
  console.log(`\nTotal equipment in DB: ${allEquipment.length}`);
  for (const e of allEquipment.slice(0, 5)) {
    console.log(`- Equipment: ${e.title} (id: ${e.id}, ownerId: ${e.ownerId}, ownerEmail: ${e.owner?.email})`);
  }

  // Also check all bookings
  const allBookings = await prisma.booking.findMany({
    include: {
      equipment: { include: { owner: true } },
      farmer: true
    }
  });
  console.log(`\nTotal bookings in DB: ${allBookings.length}`);
  for (const b of allBookings.slice(0, 5)) {
    console.log(`- Booking: ${b.id}, status: ${b.status}, equipOwnerId: ${b.equipment?.ownerId}, farmerId: ${b.farmerId}`);
  }

  // Now test owner login
  const testOwner = owners.find(o => o.equipments.length > 0) || owners[0];
  if (!testOwner) {
    console.log('No owner found in DB');
    return;
  }

  console.log(`\nAttempting login for owner: ${testOwner.email}...`);
  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testOwner.email,
      password: 'Password123!',
      role: 'OWNER'
    });
    const token = loginRes.data.token || loginRes.data.data?.token;
    console.log('Owner login successful! Token:', token ? 'YES' : 'NO');
    console.log('Login response user:', loginRes.data.user || loginRes.data.data?.user);

    // Test owner equipment endpoints
    console.log('\nTesting equipment endpoints...');
    for (const path of ['/equipment/owner', '/equipment/my', '/equipment/my-equipment', `/equipment?ownerId=${testOwner.id}`]) {
      try {
        const res = await axios.get(`${API_BASE}${path}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`GET ${path} => ${res.status}:`, Array.isArray(res.data) ? `Array(${res.data.length})` : (res.data.data ? `data: Array(${res.data.data.length})` : Object.keys(res.data)));
      } catch (err) {
        console.log(`GET ${path} => ${err.response ? err.response.status : err.message}`);
      }
    }

    // Test owner bookings endpoints
    console.log('\nTesting bookings endpoints...');
    for (const path of ['/bookings/owner', '/bookings/owner/requests', '/bookings/my', '/bookings']) {
      try {
        const res = await axios.get(`${API_BASE}${path}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`GET ${path} => ${res.status}:`, Array.isArray(res.data) ? `Array(${res.data.length})` : (res.data.data ? `data: Array(${res.data.data.length})` : Object.keys(res.data)));
      } catch (err) {
        console.log(`GET ${path} => ${err.response ? err.response.status : err.message}`);
      }
    }
  } catch (err) {
    console.log('Owner login failed:', err.response ? err.response.data : err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
