const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  const password = await bcrypt.hash('Owner@123', 10);
  
  await prisma.user.createMany({
    data: [
      { email: 'farmer@agrorent.ai', name: 'Original Farmer', password, role: 'FARMER', phone: '1111111111', isVerified: true },
      { email: 'owner@agrorent.ai', name: 'Original Owner', password, role: 'OWNER', phone: '2222222222', isVerified: true },
      { email: 'admin@agrorent.ai', name: 'Original Admin', password, role: 'ADMIN', phone: '3333333333', isVerified: true }
    ]
  });

  const owner = await prisma.user.findUnique({ where: { email: 'owner@agrorent.ai' } });
  
  await prisma.equipment.createMany({
    data: [
      { title: 'Mahindra 575 DI Tractor', category: 'TRACTOR', pricePerDay: 1500, description: 'Heavy duty tractor', imageUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9', ownerId: owner.id, available: true },
      { title: 'John Deere Harvester', category: 'HARVESTER', pricePerDay: 3000, description: 'Efficient harvesting machine', imageUrl: 'https://images.unsplash.com/photo-1472141521881-95d0e87e2e39', ownerId: owner.id, available: true },
      { title: 'Rotavator', category: 'IMPLEMENT', pricePerDay: 800, description: 'Soil preparation implement', imageUrl: 'https://images.unsplash.com/photo-1622383529357-3703c6b2da8a', ownerId: owner.id, available: true }
    ]
  });

  console.log('Original accounts and equipment restored in local DB');
}
main().catch(console.error).finally(()=>prisma.$disconnect());
