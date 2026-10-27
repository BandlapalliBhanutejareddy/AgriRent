require('dotenv').config();
const { prisma } = require('../dist/lib/prisma');

async function main() {
  const owner = await prisma.user.findFirst({ where: { email: 'owner11@gmail.com' } });
  console.log('Owner id:', owner.id);

  console.log('Testing booking.findMany with relations...');
  const t0 = Date.now();
  const bookings = await prisma.booking.findMany({
    where: {
      equipment: { ownerId: owner.id }
    },
    include: {
      equipment: true,
      payments: true,
      returnInspection: true,
      farmer: { select: { id: true, name: true, phone: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`Fetched ${bookings.length} bookings in ${Date.now() - t0}ms`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
