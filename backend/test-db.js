const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  while (true) {
    try {
      await prisma.$connect();
      console.log('CONNECTED_SUCCESS');
      break;
    } catch (e) {
      console.log('STILL_PAUSED');
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}
main();
