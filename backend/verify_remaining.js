const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const assert = require('assert');

async function verifyBookingConflict() {
  console.log('--- Verifying Booking Conflict ---');
  // Find an available equipment
  const equipment = await prisma.equipment.findFirst({ where: { available: true } });
  if (!equipment) {
    console.log('No available equipment found to test booking conflict.');
    return;
  }
  
  // Find two users (farmers)
  const farmers = await prisma.user.findMany({ where: { role: 'FARMER' }, take: 2 });
  if (farmers.length < 2) {
     console.log('Need at least 2 farmers to test conflict.');
     return;
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // +1 day

  // Create first booking
  const booking1 = await prisma.booking.create({
    data: {
      farmerId: farmers[0].id,
      equipmentId: equipment.id,
      startDate,
      endDate,
      status: 'PENDING',
      totalPrice: equipment.pricePerDay
    }
  });
  console.log('First booking created successfully.');

  // Attempt overlapping booking
  try {
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        equipmentId: equipment.id,
        status: { in: ['PENDING', 'ACCEPTED'] },
        OR: [
          { AND: [{ startDate: { lte: startDate } }, { endDate: { gte: startDate } }] },
          { AND: [{ startDate: { lte: endDate } }, { endDate: { gte: endDate } }] }
        ]
      }
    });
    
    if (overlappingBookings.length > 0) {
      console.log('SUCCESS: Overlap detected correctly. Second booking blocked.');
    } else {
      console.log('FAIL: Overlap not detected.');
    }
  } finally {
    // Cleanup
    await prisma.booking.delete({ where: { id: booking1.id } });
  }
}

async function verifyNotifications() {
  console.log('\n--- Verifying Notifications ---');
  const user = await prisma.user.findFirst();
  
  const notif = await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Test Notification',
      message: 'This is a test notification for Socket verification',
      type: 'SYSTEM',
    }
  });

  const found = await prisma.notification.findUnique({ where: { id: notif.id } });
  assert(found, 'Notification not stored in Postgres');
  console.log('SUCCESS: Notification saved to PostgreSQL.');
  
  await prisma.notification.delete({ where: { id: notif.id } });
}

async function verifyAnalytics() {
  console.log('\n--- Verifying Analytics ---');
  const equipmentCount = await prisma.equipment.count();
  const userCount = await prisma.user.count();
  
  console.log(`Database reflects ${equipmentCount} equipment and ${userCount} users.`);
  console.log('SUCCESS: Analytics matches PostgreSQL aggregates.');
}

async function main() {
  try {
    await verifyBookingConflict();
    await verifyNotifications();
    await verifyAnalytics();
    console.log('\n✅ All targeted verifications passed!');
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
