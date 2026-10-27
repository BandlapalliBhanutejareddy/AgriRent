const { prisma } = require('../dist/lib/prisma');

const CATEGORY_IMAGES = {
  TRACTOR: 'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&q=80&w=800',
  TRACTORS: 'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&q=80&w=800',
  HARVESTER: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800',
  HARVESTERS: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800',
  CULTIVATOR: 'https://images.unsplash.com/photo-1590005354167-6da97870c91d?auto=format&fit=crop&q=80&w=800',
  POWER_TILLERS: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&q=80&w=800',
  POWER_TILLER: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&q=80&w=800',
  IRRIGATION: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=800',
  IMPLEMENTS: 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&q=80&w=800',
  OTHER: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=800'
};

function getAccurateImage(title, category) {
  const t = (title || '').toLowerCase();
  
  if (t.includes('rotavator') || t.includes('rotary')) {
    return 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&q=80&w=800';
  }
  if (t.includes('leveller') || t.includes('leveler') || t.includes('cultivator')) {
    return 'https://images.unsplash.com/photo-1590005354167-6da97870c91d?auto=format&fit=crop&q=80&w=800';
  }
  if (t.includes('seed drill') || t.includes('planter') || t.includes('seeder')) {
    return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800';
  }
  if (t.includes('transplanter')) {
    return 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&q=80&w=800';
  }
  if (t.includes('water pump') || t.includes('pump') || t.includes('irrigation')) {
    return 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=800';
  }
  if (t.includes('sprayer') || t.includes('boom')) {
    return 'https://images.unsplash.com/photo-1592178036777-50b86a87c1be?auto=format&fit=crop&q=80&w=800';
  }
  if (t.includes('harvester') || t.includes('combine') || t.includes('tiger') || t.includes('thresher')) {
    return 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800';
  }
  if (t.includes('tiller') || t.includes('vst') || t.includes('power tiller')) {
    return 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&q=80&w=800';
  }
  if (t.includes('trailer') || t.includes('trolley') || t.includes('tipping')) {
    return 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=800';
  }
  if (t.includes('john deere') || t.includes('deere')) {
    return 'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&q=80&w=800';
  }
  if (t.includes('mahindra') || t.includes('swaraj') || t.includes('sonalika') || t.includes('tractor')) {
    return 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=800';
  }

  const catUpper = (category || 'TRACTOR').toUpperCase();
  return CATEGORY_IMAGES[catUpper] || CATEGORY_IMAGES.TRACTOR;
}

async function fixEquipmentImages() {
  console.log('--- Fixing Equipment Images According to Titles & Categories ---');

  const all = await prisma.equipment.findMany({
    select: { id: true, title: true, category: true, imageUrl: true }
  });

  let fixedCount = 0;

  for (const eq of all) {
    const img = (eq.imageUrl || '').trim();
    const isBad = !img || img === 'EMPTY' || img === 'null' || img.startsWith('/') || !img.startsWith('http');
    
    if (isBad) {
      const accurate = getAccurateImage(eq.title, eq.category);
      await prisma.equipment.update({
        where: { id: eq.id },
        data: { imageUrl: accurate }
      });
      console.log(`[FIXED] "${eq.title}" (${eq.category}): ${img || 'EMPTY'} -> ${accurate}`);
      fixedCount++;
    }
  }

  console.log(`\n✅ Completed fixing equipment images. Total corrected: ${fixedCount}`);
  await prisma.$disconnect();
}

fixEquipmentImages().catch(console.error);
