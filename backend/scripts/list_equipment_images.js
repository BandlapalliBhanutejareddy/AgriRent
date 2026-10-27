const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const list = await prisma.equipment.findMany({
    select: { id: true, title: true, category: true, imageUrl: true, pricePerDay: true }
  });
  console.log('Total equipment in DB:', list.length);
  list.slice(0, 8).forEach(e => {
    console.log(`- ${e.title} (${e.category}) - ₹${e.pricePerDay}/day - Image: ${e.imageUrl}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
