const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runCrudTest() {
  console.log('--- STARTING EQUIPMENT CRUD VERIFICATION ---');
  
  try {
    // 1. Fetch active owner
    const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
    if (!owner) {
      throw new Error('No owner found in database to run tests.');
    }
    console.log(`[PASS] Found Owner: ${owner.name} (${owner.id})`);

    // 2. Create equipment
    const title = 'Arjun 555 DI Tractor ' + Date.now();
    const created = await prisma.equipment.create({
      data: {
        title,
        category: 'TRACTOR',
        pricePerDay: 3000,
        description: 'Excellent tractor for heavy cultivation.',
        imageUrl: 'http://example.com/arjun555.png',
        location: 'Pune, Maharashtra',
        latitude: 18.5204,
        longitude: 73.8567,
        ownerId: owner.id,
        available: true
      }
    });
    console.log(`[PASS] Create Equipment Success. ID: ${created.id}`);

    // 3. View single equipment
    const viewed = await prisma.equipment.findUnique({
      where: { id: created.id },
      include: { owner: { select: { name: true, email: true } } }
    });
    if (!viewed || viewed.title !== title) {
      throw new Error('Failed to retrieve the correct equipment record.');
    }
    console.log(`[PASS] View Equipment Success. Title: "${viewed.title}"`);

    // 4. Owner equipment listing
    const listings = await prisma.equipment.findMany({
      where: { ownerId: owner.id }
    });
    const foundInList = listings.some(e => e.id === created.id);
    if (!foundInList) {
      throw new Error('Created equipment was not present in owner fleet listings.');
    }
    console.log(`[PASS] Owner Listings Fetch Success. Total Fleet Size: ${listings.length}`);

    // 5. Edit equipment
    const updated = await prisma.equipment.update({
      where: { id: created.id },
      data: {
        pricePerDay: 3200,
        available: false
      }
    });
    if (updated.pricePerDay !== 3200 || updated.available !== false) {
      throw new Error('Updates did not persist correctly.');
    }
    console.log(`[PASS] Edit Equipment Success. Updated Price: ₹${updated.pricePerDay}, Available: ${updated.available}`);

    // 6. Delete equipment
    await prisma.equipment.delete({
      where: { id: created.id }
    });
    
    // Double check it's gone
    const checkDeleted = await prisma.equipment.findUnique({
      where: { id: created.id }
    });
    if (checkDeleted) {
      throw new Error('Equipment was not successfully deleted.');
    }
    console.log(`[PASS] Delete Equipment Success.`);
    
    console.log('--- ALL CRUD TASKS COMPLETED AND PERSISTED PERFECTLY ---');
  } catch (error) {
    console.error('[FAIL] CRUD Test failed:', error);
  }
}

runCrudTest().catch(console.error).finally(() => prisma.$disconnect());
