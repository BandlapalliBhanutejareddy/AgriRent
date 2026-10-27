const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, name: true, phone: true },
    take: 15,
  });
  console.log('Registered Users:');
  console.table(users);
  await prisma.$disconnect();
}
main();
