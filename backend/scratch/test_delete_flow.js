const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:4000/api';

async function main() {
  console.log('--- STARTING DELETE FLOW VERIFICATION ---');
  try {
    // 1. Login as OWNER
    const ownerLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner@agrorent.ai',
      password: 'Owner@123'
    });
    const ownerToken = ownerLoginRes.data.token;
    const ownerId = ownerLoginRes.data.user.id;
    console.log(`[PASS] Logged in as Owner. ID: ${ownerId}`);

    // 2. Find the updated E2E equipment
    const equip = await prisma.equipment.findFirst({
      where: { ownerId, title: 'Mahindra Arjun 555 Ultra E2E Updated' },
      orderBy: { createdAt: 'desc' }
    });

    if (!equip) {
      throw new Error('No test equipment found to delete.');
    }
    console.log(`[PASS] Found test equipment to delete: "${equip.title}" (ID: ${equip.id})`);

    // 3. Delete via DELETE API
    console.log('[STEP] Sending DELETE request to API...');
    const deleteRes = await axios.delete(`${API_URL}/equipment/${equip.id}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    console.log('Delete API response:', deleteRes.data);

    // 4. Verify PostgreSQL row removal directly
    console.log('[STEP] Verifying database row removal in PostgreSQL...');
    const pgRow = await prisma.equipment.findUnique({
      where: { id: equip.id }
    });
    if (pgRow) {
      throw new Error('Database row still exists in PostgreSQL!');
    }
    console.log('[PASS] Row successfully removed from PostgreSQL database.');

    // 5. Verify owner fleet listing updated
    console.log('[STEP] Verifying owner fleet listing is updated...');
    const fleetRes = await axios.get(`${API_URL}/equipment/my`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const fleetItems = fleetRes.data.data || fleetRes.data;
    const existsInFleet = fleetItems.some(item => item.id === equip.id);
    if (existsInFleet) {
      throw new Error('Deleted equipment is still showing in Owner Fleet list!');
    }
    console.log('[PASS] Equipment successfully removed from Owner Fleet listing.');

    // 6. Login as FARMER and verify marketplace updated
    console.log('[STEP] Logging in as Farmer...');
    const farmerLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'farmer@agrorent.ai',
      password: 'Farmer@123'
    });
    const farmerToken = farmerLoginRes.data.token;

    console.log('[STEP] Verifying farmer marketplace list is updated...');
    const marketRes = await axios.get(`${API_URL}/equipment`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    const marketItems = marketRes.data.data || marketRes.data;
    const existsInMarket = marketItems.some(item => item.id === equip.id);
    if (existsInMarket) {
      throw new Error('Deleted equipment is still showing in Farmer Marketplace list!');
    }
    console.log('[PASS] Equipment successfully removed from Farmer Marketplace listing.');

    console.log('\n--- DELETE FLOW VERIFICATION PASSED ---');
    console.log('Database row removed: YES');
    console.log('Marketplace updated: YES');
    console.log('Owner Fleet updated: YES');

  } catch (error) {
    console.error('[FAIL] Delete flow failed:', error.response ? error.response.data : error.message);
  }
}

main().finally(() => prisma.$disconnect());
