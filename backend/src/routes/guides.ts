import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Get all Farming Guides grouped by Crop
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const guides = await prisma.farmingGuide.findMany({
      orderBy: [
        { cropName: 'asc' },
        { stepOrder: 'asc' }
      ]
    });
    
    // Grouping by crop for easier frontend consumption
    const groupedGuides = guides.reduce((acc: any, guide) => {
      if (!acc[guide.cropName]) {
        acc[guide.cropName] = [];
      }
      acc[guide.cropName].push(guide);
      return acc;
    }, {});

    res.json(groupedGuides);
  } catch (error) {
    console.error('Failed to fetch farming guides:', error);
    res.status(500).json({ error: 'Failed to fetch farming guides' });
  }
});

// Get Modern Techniques
router.get('/techniques', async (req: Request, res: Response): Promise<void> => {
  try {
    const techniques = await prisma.modernTechnique.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(techniques);
  } catch (error) {
    console.error('Failed to fetch modern techniques:', error);
    res.status(500).json({ error: 'Failed to fetch modern techniques' });
  }
});

export default router;

