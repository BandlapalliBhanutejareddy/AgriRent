const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up booking and equipment test entries...');
  try {
    // 1. Delete notifications related to test bookings or equipment
    const notifRes = await prisma.notification.deleteMany({
      where: {
        OR: [
          { message: { contains: 'Booking Test' } },
          { title: { contains: 'Booking' } }
        ]
      }
    });
    console.log(`Deleted ${notifRes.count} notifications.`);

    // 2. Delete test bookings
    const bookingRes = await prisma.booking.deleteMany({
      where: {
        equipment: {
          title: { contains: 'Booking Test' }
        }
      }
    });
    console.log(`Deleted ${bookingRes.count} bookings.`);

    // 3. Delete test equipment
    const equipRes = await prisma.equipment.deleteMany({
      where: {
        title: { contains: 'Booking Test' }
      }
    });
    console.log(`Deleted ${equipRes.count} equipment.`);

  } catch (err) {
    console.error('Error during cleanup:', err);
  }
}

main().finally(() => prisma.$disconnect());
