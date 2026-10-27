const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const eq = await prisma.equipment.findMany({ select: { id: true, title: true, description: true } });
    console.log('Equipment count:', eq.length);
    let corruptEq = 0;
    eq.forEach(e => {
      if (e.title.includes('Ã') || (e.description && e.description.includes('Ã'))) {
        console.log('Corrupted eq:', e.id, e.title);
        corruptEq++;
      }
    });
    console.log('Corrupted equipment:', corruptEq);

    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
    console.log('User count:', users.length);
    let corruptUsers = 0;
    users.forEach(u => {
      if (u.name && u.name.includes('Ã')) {
        console.log('Corrupted user:', u.id, u.name);
        corruptUsers++;
      }
    });
    console.log('Corrupted users:', corruptUsers);

    const bookings = await prisma.booking.findMany({ select: { id: true, notes: true } });
    console.log('Booking count:', bookings.length);
    let corruptBookings = 0;
    bookings.forEach(b => {
      if (b.notes && b.notes.includes('Ã')) {
        console.log('Corrupted booking:', b.id, b.notes);
        corruptBookings++;
      }
    });
    console.log('Corrupted bookings:', corruptBookings);

  } catch (err) {
    console.error('Error checking encoding:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
