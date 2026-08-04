const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:4000/api';

async function main() {
  console.log('--- STARTING UPDATE FLOW VERIFICATION ---');
  try {
    // 1. Login as OWNER
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner@agrorent.ai',
      password: 'Owner@123'
    });
    const token = loginRes.data.token;
    const ownerId = loginRes.data.user.id;
    console.log(`[PASS] Logged in as Owner. ID: ${ownerId}`);

    // 2. Find the last created E2E equipment
    const equip = await prisma.equipment.findFirst({
      where: { ownerId, title: { contains: 'Ultra E2E' } },
      orderBy: { createdAt: 'desc' }
    });

    if (!equip) {
      throw new Error('No test equipment found to update.');
    }
    console.log(`[PASS] Found test equipment to update: "${equip.title}" (ID: ${equip.id})`);

    // 3. Update via PUT API
    const updatePayload = {
      title: 'Mahindra Arjun 555 Ultra E2E Updated',
      category: 'IMPLEMENT',
      pricePerDay: 1950,
      description: 'Fully serviced implement with dual plow mounts.',
      location: equip.location,
      imageUrl: equip.imageUrl
    };

    console.log('[STEP] Sending PUT update request...');
    const updateRes = await axios.put(`${API_URL}/equipment/${equip.id}`, updatePayload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Update API response:', updateRes.data);

    // 4. Verify PostgreSQL database values directly
    console.log('[STEP] Fetching row directly from PostgreSQL to verify persistence...');
    const updatedRow = await prisma.equipment.findUnique({
      where: { id: equip.id }
    });

    console.log('Database Row Values:');
    console.log(JSON.stringify(updatedRow, null, 2));

    if (
      updatedRow.title === 'Mahindra Arjun 555 Ultra E2E Updated' &&
      updatedRow.category === 'IMPLEMENT' &&
      updatedRow.pricePerDay === 1950 &&
      updatedRow.description === 'Fully serviced implement with dual plow mounts.'
    ) {
      console.log('\n--- UPDATE FLOW VERIFICATION PASSED ---');
      console.log('All edited values match database records perfectly.');
    } else {
      throw new Error('Database records do not match updated values.');
    }

  } catch (error) {
    console.error('[FAIL] Update flow failed:', error.response ? error.response.data : error.message);
  }
}

main().finally(() => prisma.$disconnect());
