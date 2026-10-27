const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const owners = await prisma.user.findMany({
    where: {
      role: { in: ['OWNER', 'BOTH', 'EQUIPMENT_OWNER', 'ADMIN'] }
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      equipments: {
        select: { id: true, title: true, category: true, pricePerDay: true }
      }
    }
  });

  console.log(`Found ${owners.length} owner users:`);
  owners.forEach((o, i) => {
    console.log(`[${i + 1}] ID: ${o.id} | Email: ${o.email} | Name: ${o.name} | Role: ${o.role} | Equipment count: ${(o.equipments || []).length}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
