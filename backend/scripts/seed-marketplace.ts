import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CATEGORIES = ['TRACTOR', 'HARVESTER', 'IMPLEMENT', 'ROTAVATOR', 'CULTIVATOR', 'SEED DRILL', 'SPRAYER', 'POWER TILLER', 'RICE TRANSPLANTER'];

const EQUIPMENT_TEMPLATES = [
  { title: "Mahindra Arjun 555 DI", price: 1500, desc: "A robust tractor suitable for heavy plowing and transport." },
  { title: "Swaraj 744 FE", price: 1200, desc: "Reliable and fuel-efficient tractor for everyday farm operations." },
  { title: "John Deere 5310", price: 1800, desc: "Premium tractor with high torque and comfort for long hours." },
  { title: "Massey Ferguson 241", price: 1100, desc: "Versatile tractor perfect for medium-sized farms." },
  { title: "Class Crop Tiger 30", price: 4500, desc: "Compact harvester ideal for paddy and wheat." },
  { title: "Kubota MU4501", price: 1600, desc: "Japanese technology for precision farming." },
  { title: "Shaktiman Rotavator", price: 800, desc: "Heavy-duty rotavator for excellent seedbed preparation." },
  { title: "Lemken Reversible Plough", price: 600, desc: "High-quality implement for deep soil turnover." },
  { title: "Garuda Seed Drill", price: 500, desc: "Accurate seed placement for uniform crop growth." },
  { title: "Honda Power Tiller", price: 700, desc: "Lightweight tiller for inter-culture operations." }
];

const LOCATIONS = ['Nashik, MH', 'Pune, MH', 'Nagpur, MH', 'Indore, MP', 'Bhopal, MP', 'Ahmedabad, GJ', 'Surat, GJ', 'Jaipur, RJ', 'Ludhiana, PB', 'Karnal, HR'];

async function main() {
  console.log("Starting Multi-Owner Marketplace Seed...");

  // Delete all existing mock equipment and owners created by previous seeds if any
  await prisma.equipment.deleteMany({
    where: { owner: { email: { startsWith: 'seed_owner_' } } }
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'seed_owner_' } }
  });

  const passwordHash = await bcrypt.hash('password123', 10);
  let equipmentCreatedCount = 0;

  // Create 10 owners
  for (let i = 1; i <= 10; i++) {
    const owner = await prisma.user.create({
      data: {
        name: `Farm Owner ${i}`,
        email: `seed_owner_${i}@test.com`,
        password: passwordHash,
        role: 'OWNER',
        phone: `+91 90000 0000${i - 1}`,
        isVerified: true,
        isSuspended: false
      }
    });

    console.log(`Created Owner: ${owner.name}`);

    // Create 10 equipment for each owner (Total 100)
    for (let j = 1; j <= 10; j++) {
      const template = EQUIPMENT_TEMPLATES[(i + j) % EQUIPMENT_TEMPLATES.length];
      const category = CATEGORIES[j % CATEGORIES.length];
      const location = LOCATIONS[(i + j) % LOCATIONS.length];
      
      const priceModifier = 0.8 + (Math.random() * 0.4); // Random price variation
      const finalPrice = Math.round(template.price * priceModifier);

      await prisma.equipment.create({
        data: {
          ownerId: owner.id,
          title: `${template.title} - Unit ${i}${j}`,
          category: category,
          pricePerDay: finalPrice,
          description: `${template.desc} Excellent condition. Maintained regularly by ${owner.name}.`,
          location: location,
          available: true,
          imageUrl: `https://images.unsplash.com/photo-1592860956272-9eb5d8c366ff?auto=format&fit=crop&q=80&w=800` // Using a standard fallback for seed to ensure visual consistency
        }
      });
      equipmentCreatedCount++;
    }
  }

  console.log(`Successfully created 10 Owners and ${equipmentCreatedCount} Equipment Listings!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
