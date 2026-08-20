const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  const users = [
    {
      name: "Owner Test",
      email: "owner-test@agrorent.ai",
      password: await bcrypt.hash("password123", 10),
      role: "OWNER",
      phone: "+919876543210"
    },
    {
      name: "Farmer Test",
      email: "farmer-test@agrorent.ai",
      password: await bcrypt.hash("password123", 10),
      role: "FARMER",
      phone: "+919876543211"
    },
    {
      name: "Admin Test",
      email: "admin@agrorent.ai",
      password: await bcrypt.hash("password123", 10),
      role: "ADMIN",
      phone: "+919876543212"
    }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u,
    });
  }
  console.log('Test users created for Playwright!');
}

main().finally(async () => { await prisma.$disconnect(); });
