import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...');

  // Delete all existing equipment, bookings, and saved items as requested
  await prisma.paymentTransaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.savedEquipment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.equipment.deleteMany();
  console.log('🗑️ Deleted all existing equipment, bookings, and saved equipment.');

  // 1. Create Demo Users with verified status
  const users = [
    {
      name: "Owner Demo",
      email: "owner.demo@agrorent.ai",
      password: "SUPABASE_AUTH_MANAGED",
      role: "OWNER",
      phone: "+919876543001",
      isVerified: true
    },
    {
      name: "Owner Live",
      email: "owner.live@agrorent.ai",
      password: "SUPABASE_AUTH_MANAGED",
      role: "OWNER",
      phone: "+919876543005",
      isVerified: true
    },
    {
      name: "Farmer Demo",
      email: "farmer.demo@agrorent.ai",
      password: "SUPABASE_AUTH_MANAGED",
      role: "FARMER",
      phone: "+919876543002",
      isVerified: true
    },
    {
      name: "Farmer Live",
      email: "farmer.live@agrorent.ai",
      password: "SUPABASE_AUTH_MANAGED",
      role: "FARMER",
      phone: "+919876543004",
      isVerified: true
    },
    {
      name: "Admin Demo",
      email: "admin.demo@agrorent.ai",
      password: "SUPABASE_AUTH_MANAGED",
      role: "ADMIN",
      phone: "+919876543003",
      isVerified: true
    }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u,
    });
    console.log(`ACCOUNT: ${u.name} | EMAIL: ${u.email} | ROLE: ${u.role} | VERIFIED STATUS: ${u.isVerified}`);
  }

  // 2. Create sample equipment under owner.demo@agrorent.ai
  const ownerUser = await prisma.user.findUnique({ where: { email: "owner.demo@agrorent.ai" } });
  if (ownerUser) {
    const sampleEquipments = [
      {
        title: "Mahindra 575 DI Tractor 45HP",
        category: "TRACTOR",
        description: "Heavy-duty 45HP tractor suitable for plowing, haulage, and cultivation operations.",
        pricePerDay: 1800,
        imageUrl: "/assets/equipment/mahindra_575.jpg",
        ownerId: ownerUser.id,
        available: true,
        location: "Kurnool, Andhra Pradesh",
        latitude: 15.8281,
        longitude: 78.0373
      },
      {
        title: "John Deere W70 Combine Harvester",
        category: "HARVESTER",
        description: "High capacity multi-crop combine harvester with 4-straw walker and 2400L grain tank.",
        pricePerDay: 4500,
        imageUrl: "/assets/equipment/john_deere_w70.jpg",
        ownerId: ownerUser.id,
        available: true,
        location: "Anantapur, Andhra Pradesh",
        latitude: 14.6819,
        longitude: 77.6006
      }
    ];

    for (const eq of sampleEquipments) {
      await prisma.equipment.upsert({
        where: {
          title_ownerId: {
            title: eq.title,
            ownerId: eq.ownerId
          }
        },
        update: eq,
        create: eq
      });
    }
    console.log('🚜 Seeded sample machinery for marketplace catalog.');
  }

  console.log('✅ Database seeded with Secure Demo Users and sample equipment.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
