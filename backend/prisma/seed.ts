import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Ã°Å¸Å’Â± Starting database seeding...');

  // Delete all existing equipment, bookings, and saved items as requested
  await prisma.paymentTransaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.savedEquipment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.equipment.deleteMany();
  console.log('Ã°Å¸â€”â€˜Ã¯Â¸Â  Deleted all existing equipment, bookings, and saved equipment.');

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
      name: "Farmer Demo",
      email: "farmer.demo@agrorent.ai",
      password: "SUPABASE_AUTH_MANAGED",
      role: "FARMER",
      phone: "+919876543002",
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

  console.log('Ã¢Å“â€¦ Database seeded with Secure Demo Users and all old equipment removed.');
}

main()
  .catch((e) => {
    console.error('Ã¢ÂÅ’ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
