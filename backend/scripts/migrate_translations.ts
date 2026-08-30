import { PrismaClient } from '@prisma/client';
import { aiProvider } from '../src/services/aiProvider';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting migration for existing equipment translations...');
  
  const equipments = await prisma.equipment.findMany({
    where: {
      OR: [
        { titleEn: null },
        { translationVersion: 0 }
      ]
    }
  });

  console.log(`Found ${equipments.length} equipments to translate.`);

  for (const eq of equipments) {
    try {
      console.log(`Translating: ${eq.title}...`);
      const trans = await aiProvider.translateListing(eq.title, eq.description || '');
      
      await prisma.equipment.update({
        where: { id: eq.id },
        data: {
          titleEn: trans.titleEn,
          titleTe: trans.titleTe,
          titleHi: trans.titleHi,
          titleTa: trans.titleTa,
          titleKn: trans.titleKn,
          descriptionEn: trans.descriptionEn,
          descriptionTe: trans.descriptionTe,
          descriptionHi: trans.descriptionHi,
          descriptionTa: trans.descriptionTa,
          descriptionKn: trans.descriptionKn,
          translationVersion: 1
        }
      });
      console.log(`Successfully updated ${eq.title}`);
    } catch (e) {
      console.error(`Failed to translate equipment ${eq.id}:`, e.message);
    }
  }
  
  console.log('Migration completed.');
  await prisma.$disconnect();
}

migrate();
