require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Testing direct Supabase connection to:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
  try {
    const userCount = await prisma.user.count();
    console.log('✅ DIRECT PRISMA CONNECTED! Total users:', userCount);
    const owner = await prisma.user.findFirst({
      where: { email: 'owner11@gmail.com' },
      select: { id: true, email: true, role: true, name: true }
    });
    console.log('Found owner11:', owner);
    const equipmentCount = await prisma.equipment.count({
      where: { ownerId: owner.id }
    });
    console.log('owner11 equipment count in DB:', equipmentCount);
    const bookingCount = await prisma.booking.count({
      where: { equipment: { ownerId: owner.id } }
    });
    console.log('owner11 bookings count in DB:', bookingCount);
  } catch (err) {
    console.error('❌ Connection error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
