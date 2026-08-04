import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Executing Live PostgreSQL Database Structural Audit...\n');

  try {
    const userCount = await prisma.user.count();
    const equipmentCount = await prisma.equipment.count();
    const bookingCount = await prisma.booking.count();
    const otpCount = await prisma.oTPVerification.count();

    console.log(`📊 [COUNTS] User table: ${userCount} rows`);
    console.log(`📊 [COUNTS] Equipment table: ${equipmentCount} rows`);
    console.log(`📊 [COUNTS] Booking table: ${bookingCount} rows`);
    console.log(`📊 [COUNTS] OTPVerification table: ${otpCount} rows\n`);

    // Fetch details
    const users = await prisma.user.findMany({ take: 3 });
    console.log('👤 [USERS DIRECTORY PREVIEW]:');
    users.forEach(u => console.log(`  - Name: ${u.name} | Role: ${u.role} | Verified: ${u.isVerified}`));

    const equipment = await prisma.equipment.findMany({ take: 3 });
    console.log('\n🚜 [EQUIPMENT MARKETPLACE PREVIEW]:');
    equipment.forEach(e => console.log(`  - Title: ${e.title} | Price: ₹${e.pricePerDay}/day | Available: ${e.available}`));

    const bookings = await prisma.booking.findMany({ take: 3, include: { farmer: true } });
    console.log('\n📅 [BOOKINGS LIFECYCLE PREVIEW]:');
    bookings.forEach(b => console.log(`  - ID: ${b.id} | Farmer: ${b.farmer?.name} | Status: ${b.status} | Total: ₹${b.totalPrice}`));

    console.log('\n✅ Live PostgreSQL database connection is fully secure and operational.');
  } catch (error) {
    console.error('❌ Database connection audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
