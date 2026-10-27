const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/agrorent'
    }
  }
});

async function main() {
  try {
    const count = await prisma.user.count();
    console.log('✅ PRISMA CONNECTED! User count:', count);
    const sample = await prisma.user.findFirst({
      select: { id: true, email: true, role: true, name: true }
    });
    console.log('Sample user:', sample);
  } catch (err) {
    console.error('Prisma Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
