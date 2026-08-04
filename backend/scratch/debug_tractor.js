const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- RUNNING DIRECT PRISMA INSERT TEST ---');
  try {
    const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
    if (!owner) {
      throw new Error('No owner found in database to run direct insert test.');
    }
    console.log(`Using owner ID: ${owner.id}`);

    const equipment = await prisma.equipment.create({
      data: {
        title: "Debug Tractor " + Date.now(),
        category: "TRACTOR",
        pricePerDay: 1000,
        location: "Chennai",
        imageUrl: "https://example.com/test.jpg",
        ownerId: owner.id
      }
    });

    console.log('[SUCCESS] Direct Prisma insert succeeded! Row created:');
    console.log(JSON.stringify(equipment, null, 2));

    // Cleanup
    await prisma.equipment.delete({ where: { id: equipment.id } });
    console.log('[SUCCESS] Test row cleaned up successfully.');

  } catch (error) {
    console.error('[FAIL] Direct Prisma insert failed! Database error stacktrace:');
    console.error(error);
  }
}

main().finally(() => prisma.$disconnect());
