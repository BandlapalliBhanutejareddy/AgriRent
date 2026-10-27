const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const owners = await prisma.user.findMany({
    where: { role: 'OWNER' },
    include: {
      equipments: {
        include: {
          bookings: true
        }
      }
    }
  });

  console.log(`Checking ${owners.length} owners:`);
  for (const o of owners) {
    const totalBookings = o.equipments.reduce((sum, e) => sum + e.bookings.length, 0);
    if (o.equipments.length > 0 || totalBookings > 0) {
      console.log(`Owner: ${o.email} (id: ${o.id}) => Equipments: ${o.equipments.length}, Bookings: ${totalBookings}`);
      for (const e of o.equipments) {
        console.log(`   - Equipment: ${e.title} (id: ${e.id}, bookings: ${e.bookings.length})`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
