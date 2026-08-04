const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  const password = await bcrypt.hash('Password123!', 10);
  
  await prisma.user.createMany({
    data: [
      { email: 'farmer@demo.com', name: 'Demo Farmer', password, role: 'FARMER', phone: '1111111111', isVerified: true },
      { email: 'owner@demo.com', name: 'Demo Owner', password, role: 'OWNER', phone: '2222222222', isVerified: true },
      { email: 'admin@demo.com', name: 'Demo Admin', password, role: 'ADMIN', phone: '3333333333', isVerified: true }
    ]
  });

  const owner = await prisma.user.findUnique({ where: { email: 'owner@demo.com' } });
  
  await prisma.equipment.create({
    data: {
      title: 'Demo Tractor', category: 'TRACTOR', pricePerDay: 100, description: 'A great tractor', 
      imageUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9',
      ownerId: owner.id, available: true
    }
  });

  console.log('Demo accounts created');
}
main().catch(console.error).finally(()=>prisma.$disconnect());
