const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:4000/api';

async function main() {
  console.log('--- STARTING LIVE API & POSTGRES VERIFICATION ---');
  let ownerToken = '';
  let farmerToken = '';
  let createdEquipmentId = '';

  try {
    // 1. Login as OWNER
    console.log('\n[STEP 1] Logging in as OWNER...');
    const ownerLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner@agrorent.ai',
      password: 'Owner@123'
    });
    ownerToken = ownerLoginRes.data.token;
    console.log(`[PASS] OWNER logged in successfully. Token length: ${ownerToken.length}`);

    // 2. Create Equipment via API
    console.log('\n[STEP 2] Creating equipment via OWNER API...');
    const equipPayload = {
      title: 'Mahindra Arjun 555 Ultra E2E ' + Date.now(),
      category: 'TRACTOR',
      pricePerDay: 1800,
      description: 'High power tractor with standard plow implements.',
      imageUrl: 'https://images.unsplash.com/photo-1592919016382-70678625902b?auto=format&fit=crop&q=80&w=800',
      location: 'Nashik, Maharashtra'
    };

    const createRes = await axios.post(`${API_URL}/equipment`, equipPayload, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    createdEquipmentId = createRes.data.data.id;
    console.log(`[PASS] Equipment created successfully! ID: ${createdEquipmentId}`);

    // 3. Verify Row exists in PostgreSQL using Prisma
    console.log('\n[STEP 3] Verifying database row exists in PostgreSQL...');
    const pgRow = await prisma.equipment.findUnique({
      where: { id: createdEquipmentId }
    });
    if (!pgRow) {
      throw new Error(`Row not found in PostgreSQL for ID ${createdEquipmentId}`);
    }
    console.log('[PASS] PostgreSQL Database Row details:');
    console.log(JSON.stringify(pgRow, null, 2));

    // 4. Verify equipment appears in Owner fleet
    console.log('\n[STEP 4] Verifying equipment appears in Owner Fleet list...');
    const fleetRes = await axios.get(`${API_URL}/equipment/my`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const fleetItems = fleetRes.data.data || fleetRes.data;
    const isPresentInFleet = fleetItems.some(item => item.id === createdEquipmentId);
    if (!isPresentInFleet) {
      throw new Error('Equipment was not found in owner fleet listings');
    }
    console.log(`[PASS] Owner Fleet verified successfully. Fleet size: ${fleetItems.length} items.`);

    // 5. Login as FARMER
    console.log('\n[STEP 5] Logging in as FARMER...');
    const farmerLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'farmer@agrorent.ai',
      password: 'Farmer@123'
    });
    farmerToken = farmerLoginRes.data.token;
    console.log(`[PASS] FARMER logged in successfully. Token length: ${farmerToken.length}`);

    // 6. Verify equipment appears in Farmer Marketplace
    console.log('\n[STEP 6] Verifying equipment appears in Farmer Marketplace...');
    const marketRes = await axios.get(`${API_URL}/equipment`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    const marketItems = marketRes.data.data || marketRes.data;
    const isPresentInMarket = marketItems.some(item => item.id === createdEquipmentId);
    if (!isPresentInMarket) {
      throw new Error('Equipment was not found in Farmer Marketplace');
    }
    console.log(`[PASS] Farmer Marketplace verified successfully. Marketplace size: ${marketItems.length} items.`);

    console.log('\n--- ALL E2E VERIFICATIONS PASSED ---');
    console.log(`CREATED RECORD ID: ${createdEquipmentId}`);
    console.log(`DATABASE ROW: ${JSON.stringify(pgRow)}`);
    console.log('MARKETPLACE VERIFIED: YES');
    console.log('OWNER FLEET VERIFIED: YES');

  } catch (error) {
    console.error('\n[FAIL] Live verification failed:', error.response ? error.response.data : error.message);
  }
}

main().finally(() => prisma.$disconnect());
