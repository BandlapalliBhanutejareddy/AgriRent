const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const allEquip = await prisma.equipment.findMany({
    select: { id: true, title: true, category: true, imageUrl: true, ownerId: true }
  });
  console.log('Total Equipment in DB:', allEquip.length);
  for (const e of allEquip) {
    console.log(`- [${e.id}] "${e.title}" (${e.category}): ${e.imageUrl}`);
  }
  await prisma.$disconnect();
}

run().catch(console.error);
