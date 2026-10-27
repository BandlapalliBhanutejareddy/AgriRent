import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/saved - List saved equipment for the authenticated user
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = String(req.prismaUser?.id);
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const savedRecords = await prisma.savedEquipment.findMany({
      where: { userId },
      include: {
        equipment: {
          include: {
            owner: {
              select: { id: true, name: true, phone: true }
            },
            reviews: {
              select: { rating: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter out records where equipment was deleted or is inaccessible
    const validSaved = savedRecords.filter(item => item.equipment != null);

    res.json(validSaved);
  } catch (error: any) {
    console.error('Error fetching saved equipment:', error);
    res.status(500).json({ error: 'Failed to fetch saved equipment' });
  }
});

// GET /api/saved/ids - List of saved equipment IDs for fast client lookup
router.get('/ids', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = String(req.prismaUser?.id);
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const savedRecords = await prisma.savedEquipment.findMany({
      where: { userId },
      select: { equipmentId: true }
    });

    const savedIds = savedRecords.map(r => r.equipmentId);
    res.json({ savedIds });
  } catch (error: any) {
    console.error('Error fetching saved equipment IDs:', error);
    res.status(500).json({ error: 'Failed to fetch saved IDs' });
  }
});

// GET /api/saved/check/:equipmentId - Check if specific equipment is saved
router.get('/check/:equipmentId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipmentId = String(req.params.equipmentId || '').trim();
    const userId = String(req.prismaUser?.id);

    if (!equipmentId) {
      res.status(400).json({ error: 'Equipment ID is required' });
      return;
    }

    const existing = await prisma.savedEquipment.findUnique({
      where: {
        userId_equipmentId: {
          userId,
          equipmentId
        }
      }
    });

    res.json({ saved: !!existing });
  } catch (error: any) {
    console.error('Error checking saved status:', error);
    res.status(500).json({ error: 'Failed to check saved status' });
  }
});

// POST /api/saved/:equipmentId - Toggle save/unsave
router.post('/:equipmentId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipmentId = String(req.params.equipmentId || '').trim();
    const userId = String(req.prismaUser?.id);

    if (!equipmentId) {
      res.status(400).json({ error: 'Equipment ID is required' });
      return;
    }

    // Check if equipment exists in database
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    });

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    const existing = await prisma.savedEquipment.findUnique({
      where: {
        userId_equipmentId: {
          userId,
          equipmentId
        }
      }
    });

    if (existing) {
      await prisma.savedEquipment.delete({
        where: { id: String(existing.id) }
      });
      res.json({ saved: false, message: 'Equipment removed from saved' });
    } else {
      await prisma.savedEquipment.create({
        data: {
          userId,
          equipmentId
        }
      });
      res.json({ saved: true, message: 'Equipment saved to favorites' });
    }
  } catch (error: any) {
    console.error('Error toggling save status:', error);
    res.status(500).json({ error: 'Failed to toggle save status' });
  }
});

// POST /api/saved/:equipmentId/save - Explicit idempotent save
router.post('/:equipmentId/save', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipmentId = String(req.params.equipmentId || '').trim();
    const userId = String(req.prismaUser?.id);

    if (!equipmentId) {
      res.status(400).json({ error: 'Equipment ID is required' });
      return;
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    });

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    const existing = await prisma.savedEquipment.findUnique({
      where: {
        userId_equipmentId: {
          userId,
          equipmentId
        }
      }
    });

    if (!existing) {
      await prisma.savedEquipment.create({
        data: {
          userId,
          equipmentId
        }
      });
    }

    res.json({ saved: true, message: 'Equipment saved to favorites' });
  } catch (error: any) {
    console.error('Error saving equipment:', error);
    res.status(500).json({ error: 'Failed to save equipment' });
  }
});

// DELETE /api/saved/:equipmentId - Explicit idempotent unsave / remove
router.delete('/:equipmentId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipmentId = String(req.params.equipmentId || '').trim();
    const userId = String(req.prismaUser?.id);

    if (!equipmentId) {
      res.status(400).json({ error: 'Equipment ID is required' });
      return;
    }

    const existing = await prisma.savedEquipment.findUnique({
      where: {
        userId_equipmentId: {
          userId,
          equipmentId
        }
      }
    });

    if (existing) {
      await prisma.savedEquipment.delete({
        where: { id: String(existing.id) }
      });
    }

    res.json({ saved: false, message: 'Equipment removed from saved' });
  } catch (error: any) {
    console.error('Error removing saved equipment:', error);
    res.status(500).json({ error: 'Failed to remove saved equipment' });
  }
});

export default router;
