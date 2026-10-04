const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const realisticInventory = [
  {
    title: 'Mahindra 575 DI Tractor',
    category: 'TRACTORS',
    description: '45 HP utility tractor suitable for general farm operations including ploughing, cultivating, and transport.',
    pricePerDay: 1500,
    imageUrl: '/images/equipment/tractor-utility.jpg',
  },
  {
    title: 'Sonalika 60 RX Heavy Tractor',
    category: 'TRACTORS',
    description: '60 HP heavy-duty tractor for tough soil conditions and deep tillage.',
    pricePerDay: 2000,
    imageUrl: '/images/equipment/tractor-heavy.jpg',
  },
  {
    title: 'Shaktiman Rotavator 6ft',
    category: 'IMPLEMENTS',
    description: '6-foot rotary tiller perfect for seedbed preparation in a single pass.',
    pricePerDay: 800,
    imageUrl: '/images/equipment/rotavator.jpg',
  },
  {
    title: 'Laser Land Leveller',
    category: 'IMPLEMENTS',
    description: 'Precision land levelling equipment for improved water efficiency.',
    pricePerDay: 2500,
    imageUrl: '/images/equipment/laser-leveller.jpg',
  },
  {
    title: 'Multi-Crop Seed Drill',
    category: 'IMPLEMENTS',
    description: 'Accurate seed and fertilizer placement for crops like wheat, soybean, and maize.',
    pricePerDay: 1000,
    imageUrl: '/images/equipment/seed-drill.jpg',
  },
  {
    title: 'Paddy Transplanter (Ride-on)',
    category: 'IMPLEMENTS',
    description: 'High-speed riding type rice transplanter for large scale paddy planting.',
    pricePerDay: 3000,
    imageUrl: '/images/equipment/transplanter.jpg',
  },
  {
    title: 'Honda 5HP Water Pump',
    category: 'IRRIGATION',
    description: 'Portable petrol-driven water pump for irrigation.',
    pricePerDay: 400,
    imageUrl: '/images/equipment/water-pump.jpg',
  },
  {
    title: 'Tractor Mounted Boom Sprayer',
    category: 'IMPLEMENTS',
    description: '400L tank capacity boom sprayer for efficient crop protection.',
    pricePerDay: 700,
    imageUrl: '/images/equipment/boom-sprayer.jpg',
  },
  {
    title: 'Power Weeder (Petrol)',
    category: 'POWER_TILLERS',
    description: 'Self-propelled power weeder for inter-row weeding in row crops.',
    pricePerDay: 500,
    imageUrl: '/images/equipment/power-weeder.jpg',
  },
  {
    title: 'Class Crop Tiger Combine Harvester',
    category: 'HARVESTERS',
    description: 'Track-type combine harvester specialized for paddy harvesting in wet conditions.',
    pricePerDay: 8000,
    imageUrl: '/images/equipment/combine-harvester.jpg',
  },
  {
    title: 'Multi-Crop Thresher',
    category: 'IMPLEMENTS',
    description: 'High-capacity thresher suitable for wheat, soybean, and gram.',
    pricePerDay: 1500,
    imageUrl: '/images/equipment/thresher.jpg',
  },
  {
    title: 'Tractor Trolley (2 Tonne)',
    category: 'IMPLEMENTS',
    description: 'Heavy-duty hydraulic tipping trailer for farm produce transport.',
    pricePerDay: 600,
    imageUrl: '/images/equipment/trolley.jpg',
  }
];

async function seed() {
  console.log('Seeding realistic inventory...');
  
  const owner = await prisma.user.findFirst({
    where: { email: 'owner@agrorent.ai' }
  });

  if (!owner) {
    console.error('Owner account owner@agrorent.ai not found.');
    return;
  }

  let count = 0;
  for (const item of realisticInventory) {
    // Check if it already exists to avoid duplication
    const exists = await prisma.equipment.findFirst({
      where: { 
        title: item.title,
        ownerId: owner.id
      }
    });

    if (!exists) {
      await prisma.equipment.create({
        data: {
          ...item,
          ownerId: owner.id,
          location: 'Andhra Pradesh',
          latitude: 16.5,
          longitude: 80.6,
          available: true
        }
      });
      count++;
      console.log(`Created: ${item.title}`);
    }
  }

  console.log(`Successfully seeded ${count} new realistic equipment items for owner@agrorent.ai.`);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
