const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing equipment creation...');
  try {
    const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
    if (!owner) {
      console.log('No owner found');
      return;
    }
    console.log(`Using owner ID: ${owner.id}`);

    const equip = await prisma.equipment.create({
      data: {
        title: 'Test Tractor ' + Date.now(),
        category: 'TRACTOR',
        pricePerDay: 2500,
        description: 'Test description',
        imageUrl: 'http://example.com/image.png',
        location: 'Nashik',
        latitude: 19.9975,
        longitude: 73.7898,
        ownerId: owner.id,
        available: true
      }
    });

    console.log('Equipment created successfully:', equip);

    // Now let's try to delete it to keep it clean
    await prisma.equipment.delete({ where: { id: equip.id } });
    console.log('Equipment cleaned up');
  } catch (error) {
    console.error('Error during creation:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
