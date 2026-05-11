import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Get user's saved equipment
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const saved = await prisma.savedEquipment.findMany({
      where: { userId: req.prismaUser.id },
      include: {
        equipment: {
          include: { owner: { select: { id: true, name: true, location: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saved equipment' });
  }
});

// Save an equipment
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { equipmentId } = req.body;
    
    // Check if equipment exists
    const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    const saved = await prisma.savedEquipment.create({
      data: {
        userId: req.prismaUser.id,
        equipmentId
      }
    });
    
    res.status(201).json(saved);
  } catch (error: any) {
    // Unique constraint violation (already saved)
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Equipment is already saved' });
    } else {
      res.status(500).json({ error: 'Failed to save equipment' });
    }
  }
});

// Remove saved equipment
router.delete('/:equipmentId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipmentId = String(req.params.equipmentId);
    
    // Find the record first
    const record = await prisma.savedEquipment.findUnique({
      where: {
        userId_equipmentId: {
          userId: req.prismaUser.id,
          equipmentId
        }
      }
    });

    if (!record) {
      res.status(404).json({ error: 'Saved equipment record not found' });
      return;
    }

    await prisma.savedEquipment.delete({
      where: {
        id: record.id
      }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove saved equipment' });
  }
});

export default router;
