const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting global marketplace data generation...');
  
  // Create 10 Owners
  const ownerIds = [];
  const passwordHash = await bcrypt.hash('password123', 10);
  
  for (let i = 1; i <= 10; i++) {
    const ownerEmail = `owner${i}@agrorent.com`;
    let owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
    
    if (!owner) {
      owner = await prisma.user.create({
        data: {
          name: `Marketplace Owner ${i}`,
          email: ownerEmail,
          password: passwordHash,
          phone: `999990000${i > 9 ? i : '0' + i}`,
          role: 'OWNER',
          isVerified: true,
          isSuspended: false
        }
      });
      console.log(`Created owner: ${owner.name}`);
    }
    ownerIds.push(owner.id);
  }

  const categories = ['TRACTOR', 'HARVESTER', 'IMPLEMENT', 'ROTAVATOR', 'CULTIVATOR', 'SEED DRILL', 'SPRAYER', 'POWER TILLER', 'RICE TRANSPLANTER'];
  const locations = ['Nellore, AP', 'Guntur, AP', 'Hyderabad, TS', 'Vijayawada, AP', 'Kurnool, AP'];
  
  const equipmentData = [];
  
  // Create 100 Equipment (10 per owner)
  for (let i = 0; i < 10; i++) {
    const ownerId = ownerIds[i];
    
    for (let j = 1; j <= 10; j++) {
      const category = categories[(i + j) % categories.length];
      const title = `${category} Pro Series ${i}-${j}`;
      
      equipmentData.push({
        title,
        category,
        description: `High quality ${category} available for rent. Well maintained by Owner ${i+1}.`,
        pricePerDay: 1000 + (Math.floor(Math.random() * 20) * 100), // Random price 1000-3000
        imageUrl: '',
        location: locations[j % locations.length],
        latitude: 14.4426 + (Math.random() * 0.1),
        longitude: 79.9865 + (Math.random() * 0.1),
        available: true,
        ownerId
      });
    }
  }

  try {
    const created = await prisma.equipment.createMany({
      data: equipmentData,
      skipDuplicates: true
    });
    console.log(`Successfully bulk created ${created.count} new equipment listings.`);
  } catch (e) {
    console.error('Error during bulk create:', e);
  }
  
  // Create a farmer to test with
  let farmer = await prisma.user.findUnique({ where: { email: 'farmer_test@agrorent.com' } });
  if (!farmer) {
    farmer = await prisma.user.create({
      data: {
        name: 'Test Farmer',
        email: 'farmer_test@agrorent.com',
        password: passwordHash,
        phone: '8888800000',
        role: 'FARMER',
        isVerified: true,
        isSuspended: false
      }
    });
    console.log('Created test farmer');
  }

  console.log('Data generation complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
