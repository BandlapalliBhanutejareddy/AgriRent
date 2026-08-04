import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Users with hashed passwords
  const users = [
    {
      name: "Agro Owner",
      email: "owner@agrorent.ai",
      password: await bcrypt.hash("Owner@123", 10),
      role: "OWNER",
      phone: "+919876543210"
    },
    {
      name: "Agro Farmer",
      email: "farmer@agrorent.ai",
      password: await bcrypt.hash("Farmer@123", 10),
      role: "FARMER",
      phone: "+919876543211"
    },
    {
      name: "Agro Admin",
      email: "admin@agrorent.ai",
      password: await bcrypt.hash("Admin@123", 10),
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

  const owner = await prisma.user.findUnique({ where: { email: "owner@agrorent.ai" } });

  if (owner) {
    // 2. Create Demo Equipment
    const equipments = [
      {
        title: "John Deere 5050 D Tractor",
        description: "50 HP, Dual Clutch, Power Steering. Perfect for medium scale farming.",
        category: "TRACTORS",
        pricePerDay: 1500,
        imageUrl: "https://images.unsplash.com/photo-1594411130691-e407137f8846?auto=format&fit=crop&q=80&w=800",
        ownerId: owner.id,
        available: true,
        location: "Punjab, India"
      },
      {
        title: "Mahindra Arjun 555 DI",
        description: "High performance tractor with advanced features for deep plowing.",
        category: "TRACTORS",
        pricePerDay: 1200,
        imageUrl: "https://images.unsplash.com/photo-1592919016382-70678625902b?auto=format&fit=crop&q=80&w=800",
        ownerId: owner.id,
        available: true,
        location: "Haryana, India"
      }
    ];

    for (const e of equipments) {
      await prisma.equipment.upsert({
        where: { title_ownerId: { title: e.title, ownerId: e.ownerId } },
        update: e,
        create: e
      });
    }
  }

  console.log('✅ Database seeded with Secure Users and Equipment successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
