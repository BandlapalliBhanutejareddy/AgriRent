const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findUnique({ where: { email: 'owner11@gmail.com' } });
  if (!user) {
    console.log('User owner11@gmail.com not found');
    return;
  }
  const myEquip = await prisma.equipment.findMany({ where: { ownerId: user.id } });
  console.log('Owner11 Equipment Count:', myEquip.length);
  for (const e of myEquip) {
    console.log(`- [${e.id}] "${e.title}" (${e.category}): ${e.imageUrl}`);
  }
  await prisma.$disconnect();
}

run().catch(console.error);
