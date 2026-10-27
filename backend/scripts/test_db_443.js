const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/agrorent"
    }
  }
});

async function main() {
  console.log('Testing prisma connection on port 443...');
  try {
    const userCount = await prisma.user.count();
    console.log('SUCCESS! User count:', userCount);
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, name: true } });
    console.log('Users in DB:', users);
  } catch (err) {
    console.error('Prisma query error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
