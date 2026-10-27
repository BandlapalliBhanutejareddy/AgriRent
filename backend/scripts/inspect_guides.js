const { prisma } = require('../dist/lib/prisma');

async function check() {
  try {
    const g = await prisma.farmingGuide.findMany({ select: { cropName: true, stepTitle: true } });
    const t = await prisma.modernTechnique.findMany();
    const crops = [...new Set(g.map(x => x.cropName))];
    console.log('Farming Guides count:', g.length);
    console.log('Crops in Farming Guides:', crops);
    console.log('Modern Techniques count:', t.length);
    const sampleGuide = await prisma.farmingGuide.findFirst({ where: { cropName: 'Rice' } });
    console.log('Sample Rice Guide:', JSON.stringify(sampleGuide, null, 2));
    const sampleTech = await prisma.modernTechnique.findFirst();
    console.log('Sample Technique:', JSON.stringify(sampleTech, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
