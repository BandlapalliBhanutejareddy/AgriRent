import { prisma } from '../src/lib/prisma';

async function debug() {
  const allBookings = await prisma.booking.findMany({ include: { equipment: true } });
  console.log("All bookings:", allBookings);
  
  if (allBookings.length > 0) {
    const ownerId = allBookings[0].equipment.ownerId;
    const ownerBookings = await prisma.booking.findMany({
      where: { equipment: { ownerId: ownerId } },
      include: { equipment: true }
    });
    console.log("Owner Bookings count:", ownerBookings.length);
  }
}

debug();
