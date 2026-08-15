const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding real equipment for testing...');
  
  // Find or create an owner
  let owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        email: 'owner@example.com',
        password: 'password123',
        name: 'Test Owner',
        role: 'OWNER',
        isVerified: true,
      }
    });
  }

  // Create equipment
  await prisma.equipment.create({
    data: {
      title: 'Mahindra Arjun 555 DI (Test)',
      description: 'High performance tractor with advanced features for deep plowing.',
      category: 'TRACTOR',
      pricePerDay: 1200,
      available: true,
      location: 'Haryana, India',
      ownerId: owner.id,
      imageUrl: 'https://images.unsplash.com/photo-1592982537447-6f2c3c6f6004?auto=format&fit=crop&q=80&w=800',
    }
  });

  console.log('Seeded equipment successfully!');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
