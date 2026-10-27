const { prisma } = require('../dist/lib/prisma');

async function inspectEquipmentImages() {
  const all = await prisma.equipment.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      imageUrl: true,
      ownerId: true
    }
  });

  console.log(`Total Equipment Count: ${all.length}`);

  const byCategory = {};
  const emptyImages = [];
  const relativeImages = [];
  const validImages = [];

  for (const eq of all) {
    if (!byCategory[eq.category]) byCategory[eq.category] = 0;
    byCategory[eq.category]++;

    const img = (eq.imageUrl || '').trim();
    if (!img || img === 'EMPTY' || img === 'null') {
      emptyImages.push(eq);
    } else if (img.startsWith('/') || !img.startsWith('http')) {
      relativeImages.push(eq);
    } else {
      validImages.push(eq);
    }
  }

  console.log('Count by Category:', byCategory);
  console.log(`Empty/Null Images: ${emptyImages.length}`);
  console.log(`Relative Images: ${relativeImages.length}`);
  console.log(`Valid HTTP Images: ${validImages.length}`);

  console.log('\nSample Empty Equipments:');
  emptyImages.slice(0, 5).forEach(e => console.log(`- [${e.category}] ${e.title} (ID: ${e.id})`));

  console.log('\nSample Relative Equipments:');
  relativeImages.slice(0, 5).forEach(e => console.log(`- [${e.category}] ${e.title} -> ${e.imageUrl}`));

  await prisma.$disconnect();
}

inspectEquipmentImages().catch(console.error);
