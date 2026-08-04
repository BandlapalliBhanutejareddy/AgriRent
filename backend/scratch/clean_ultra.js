const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up E2E test equipment...');
  try {
    const res = await prisma.equipment.deleteMany({
      where: {
        title: { contains: 'Ultra E2E' }
      }
    });
    console.log(`Successfully deleted ${res.count} E2E test equipment rows.`);
  } catch (err) {
    console.error('Error during cleanup:', err);
  }
}

main().finally(() => prisma.$disconnect());
