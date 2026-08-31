import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...');

  // Delete all existing equipment, bookings, and saved items as requested
  await prisma.paymentTransaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.savedEquipment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.equipment.deleteMany();
  console.log('🗑️  Deleted all existing equipment, bookings, and saved equipment.');

  // 1. Create Demo Users with hashed passwords and verified status
  const users = [
    {
      name: "Owner Demo",
      email: "owner.demo@agrorent.ai",
      password: await bcrypt.hash("Owner@123", 10),
      role: "OWNER",
      phone: "+919876543001",
      isVerified: true
    },
    {
      name: "Farmer Demo",
      email: "farmer.demo@agrorent.ai",
      password: await bcrypt.hash("Farmer@123", 10),
      role: "FARMER",
      phone: "+919876543002",
      isVerified: true
    },
    {
      name: "Admin Demo",
      email: "admin.demo@agrorent.ai",
      password: await bcrypt.hash("Admin@123", 10),
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
    console.log(`ACCOUNT: ${u.name} | EMAIL: ${u.email} | ROLE: ${u.role} | PASSWORD: ${u.role.charAt(0) + u.role.slice(1).toLowerCase()}@123 | VERIFIED STATUS: ${u.isVerified}`);
  }

  console.log('✅ Database seeded with Secure Demo Users and all old equipment removed.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
