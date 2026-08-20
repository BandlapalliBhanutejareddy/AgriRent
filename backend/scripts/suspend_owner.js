const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const suspend = process.argv[3] === 'true';

  await prisma.user.updateMany({
    where: { email },
    data: { isSuspended: suspend }
  });

  console.log(`Updated ${email} isSuspended to ${suspend}`);
}

main().then(() => prisma.$disconnect());
