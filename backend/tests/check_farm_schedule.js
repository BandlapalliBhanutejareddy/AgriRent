const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const farm = await prisma.farm.findFirst({
    include: { crops: true, owner: true }
  });
  console.log('Farm found:', farm ? { id: farm.id, name: farm.name, ownerId: farm.ownerId, ownerEmail: farm.owner?.email, cropsCount: farm.crops.length } : 'null');
  
  if (farm) {
    const ops = await prisma.farmOperation.findMany({
      where: { farmId: farm.id }
    });
    console.log('Operations count:', ops.length);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
