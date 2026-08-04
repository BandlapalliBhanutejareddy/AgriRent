const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  const password = await bcrypt.hash('password123', 10);
  
  const accounts = [
    { email: 'farmer-test@agrorent.ai', name: 'Test Farmer', password, role: 'FARMER', phone: '1111111111', isVerified: true },
    { email: 'owner-test@agrorent.ai', name: 'Test Owner', password, role: 'OWNER', phone: '2222222222', isVerified: true },
    { email: 'admin-test@agrorent.ai', name: 'Test Admin', password, role: 'ADMIN', phone: '3333333333', isVerified: true }
  ];

  for (const account of accounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: account,
      create: account,
    });
  }

  console.log('Test accounts created successfully!');
}
main().catch(console.error).finally(()=>prisma.$disconnect());
