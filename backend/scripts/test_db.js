const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Testing prisma connection...');
  try {
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, name: true } });
    console.log('Users in DB:', users);
  } catch (err) {
    console.error('Prisma query error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
