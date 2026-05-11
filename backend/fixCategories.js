const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allEquipment = await prisma.equipment.findMany();
  for (const eq of allEquipment) {
    await prisma.equipment.update({
      where: { id: eq.id },
      data: { category: eq.category.toUpperCase() }
    });
  }
  console.log(`Standardized ${allEquipment.length} equipment items.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
