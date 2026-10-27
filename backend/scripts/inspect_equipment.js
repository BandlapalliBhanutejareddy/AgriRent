const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.equipment.findMany({
    select: { id: true, title: true, category: true, imageUrl: true }
  });
  const cats = {};
  items.forEach(it => {
    cats[it.category] = cats[it.category] || [];
    cats[it.category].push({ title: it.title, image: it.imageUrl });
  });
  for (const [cat, list] of Object.entries(cats)) {
    console.log(`\n=== CATEGORY: ${cat} (${list.length} items) ===`);
    const distinctTitles = [...new Set(list.map(x => x.title))];
    distinctTitles.forEach(t => {
      const match = list.find(x => x.title === t);
      console.log(`  - Title: "${t}" -> Image: ${match.image || 'EMPTY'}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
