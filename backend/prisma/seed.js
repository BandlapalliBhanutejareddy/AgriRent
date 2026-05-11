const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding (JS mode)...');

  const farmer = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      phone: '+919876543210',
      name: 'Rajesh Kumar',
      role: 'FARMER',
      location: 'Nashik, Maharashtra',
    },
  });

  const owner = await prisma.user.upsert({
    where: { phone: '+919876543211' },
    update: {},
    create: {
      phone: '+919876543211',
      name: 'Amit Patil',
      role: 'OWNER',
      location: 'Pune, Maharashtra',
    },
  });

  // Equipment Data
  const equipmentData = [
    {
      name: 'Mahindra Novo 605 DI',
      category: 'TRACTOR',
      description: 'Powerful 50 HP tractor with advanced hydraulics, perfect for heavy-duty plowing and haulage.',
      pricePerDay: 1800,
      imageUrl: 'https://images.unsplash.com/photo-1592982537447-6f2b6e1b7823?q=80&w=800&auto=format&fit=crop',
      location: 'Nashik, Maharashtra'
    },
    {
      name: 'John Deere W70 Harvester',
      category: 'HARVESTER',
      description: 'High-performance multi-crop harvester designed for minimal grain loss and maximum efficiency.',
      pricePerDay: 3500,
      imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=800&auto=format&fit=crop',
      location: 'Pune, Maharashtra'
    }
  ];

  for (const item of equipmentData) {
    await prisma.equipment.create({
      data: { ...item, ownerId: owner.id }
    });
  }

  // Farming Guides
  await prisma.farmingGuide.createMany({
    data: [
      {
        cropName: 'Rice',
        stepTitle: 'Land Preparation',
        description: 'Plow the field twice and perform puddling to create a soft, level surface.',
        imageUrl: 'https://images.unsplash.com/photo-1594398044700-1482421319c5?q=80&w=800&auto=format&fit=crop',
        stepOrder: 1,
        smartTip: 'Ensure proper leveling to maintain uniform water depth.',
        recommendedEquipment: 'Tractor, Rotavator'
      },
      {
        cropName: 'Potato',
        stepTitle: 'Ridge Planting',
        description: 'Plant tubers in ridges spaced 60 cm apart at a depth of 7-10 cm.',
        imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=800&auto=format&fit=crop',
        stepOrder: 1,
        smartTip: 'Use medium-sized tubers for optimal yield.',
        recommendedEquipment: 'Potato Planter, Tractor'
      }
    ]
  });

  // Modern Techniques
  await prisma.modernTechnique.createMany({
    data: [
      {
        title: 'Precision Drip Irrigation',
        description: 'Delivering water directly to the root zone increases potato yield by up to 30%.',
        imageUrl: 'https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?q=80&w=800&auto=format&fit=crop',
        relatedCrop: 'Potato',
        equipmentSuggestion: 'Drip System Kit'
      }
    ]
  });

  // Sample Bookings
  const equipment = await prisma.equipment.findMany({ take: 2 });
  if (equipment.length >= 2) {
    await prisma.booking.create({
      data: {
        equipmentId: equipment[0].id,
        farmerId: farmer.id,
        ownerId: owner.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 3),
        totalPrice: equipment[0].pricePerDay * 3,
        status: 'ACCEPTED'
      }
    });

    await prisma.booking.create({
      data: {
        equipmentId: equipment[1].id,
        farmerId: farmer.id,
        ownerId: owner.id,
        startDate: new Date(Date.now() + 86400000 * 7),
        endDate: new Date(Date.now() + 86400000 * 10),
        totalPrice: equipment[1].pricePerDay * 3,
        status: 'PENDING'
      }
    });
  }

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: farmer.id,
        title: 'Booking Accepted!',
        message: `Your request for equipment was approved.`,
        type: 'BOOKING_UPDATE'
      },
      {
        userId: owner.id,
        title: 'New Booking Request',
        message: `A farmer wants to rent your equipment.`,
        type: 'NEW_BOOKING'
      }
    ]
  });

  console.log('✅ Database seeded with Demo Data successfully (JS)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
