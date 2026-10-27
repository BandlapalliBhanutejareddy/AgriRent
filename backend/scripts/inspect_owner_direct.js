const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'owner11@gmail.com' } });
  if (!user) {
    console.log('User owner11@gmail.com NOT FOUND');
    return;
  }
  console.log('User found:', { id: user.id, email: user.email, role: user.role, authId: user.authId });
  
  const equipment = await prisma.equipment.findMany({ where: { ownerId: user.id } });
  console.log('Equipment count:', equipment.length);
  equipment.forEach((e, i) => console.log('  [' + (i+1) + '] id=' + e.id + ' | title=' + e.title + ' | available=' + e.available + ' | pricePerDay=' + e.pricePerDay));

  const bookings = await prisma.booking.findMany({
    where: { equipment: { ownerId: user.id } },
    include: { equipment: true, farmer: true }
  });
  console.log('Bookings count:', bookings.length);
  bookings.forEach((b, i) => console.log('  [' + (i+1) + '] id=' + b.id + ' | status=' + b.status + ' | equip=' + b.equipment?.title + ' | farmer=' + b.farmer?.name + ' | total=' + b.totalPrice));
}

main().catch(console.error).finally(() => prisma.$disconnect());
