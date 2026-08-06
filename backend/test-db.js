const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.$connect();
    console.log('CONNECTED_SUCCESS');
  } catch (e) {
    console.log('CONNECTION_FAILED', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
