require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('DIRECT_URL:', process.env.DIRECT_URL);
  
  const userCount = await prisma.user.count();
  const equipmentCount = await prisma.equipment.count();
  const bookingCount = await prisma.booking.count();
  
  console.log('User table row count:', userCount);
  console.log('Equipment table row count:', equipmentCount);
  console.log('Booking table row count:', bookingCount);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
