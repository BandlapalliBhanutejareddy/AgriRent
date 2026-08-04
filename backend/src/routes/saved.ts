import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';

const router = Router();

// Get saved equipment
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const saved = await prisma.savedEquipment.findMany({
      where: { userId: String(req.prismaUser.id) },
      include: {
        equipment: {
          include: {
            owner: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saved equipment' });
  }
});

// Save/Unsave equipment
router.post('/:equipmentId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const equipmentId = String(req.params.equipmentId);
    const userId = String(req.prismaUser.id);

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
      res.json({ saved: false });
    } else {
      await prisma.savedEquipment.create({
        data: {
          userId,
          equipmentId
        }
      });
      res.json({ saved: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle save status' });
  }
});

export default router;
