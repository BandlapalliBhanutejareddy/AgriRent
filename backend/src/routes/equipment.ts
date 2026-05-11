import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createEquipmentSchema, updateEquipmentSchema } from '../schemas';
import { deleteFileByUrl } from '../lib/storage';

const router = Router();
const prisma = new PrismaClient();

// Get Equipment List (Public)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, location } = req.query;
    const where: any = { isDeleted: false };
    if (category) where.category = String(category);
    if (location) where.location = { contains: String(location), mode: 'insensitive' };

    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, location: true } }
      }
    });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment list' });
  }
});

// Get My Equipment (Owner Only)
router.get('/my', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipment = await prisma.equipment.findMany({
      where: { 
        ownerId: req.prismaUser.id,
        isDeleted: false
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your equipment' });
  }
});

// Get Single Equipment (Public)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { 
        id: String(String(req.params.id)),
        isDeleted: false
      },
      include: {
        owner: { select: { id: true, name: true, location: true } }
      }
    });
    
    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }
    
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment details' });
  }
});

// Add Equipment (Owner Only)
router.post('/', requireAuth, requireRole('OWNER'), validate(createEquipmentSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, category, description, pricePerDay, imageUrl, location } = req.body;
    
    const equipment = await prisma.equipment.create({
      data: {
        name,
        category: category.toUpperCase(),
        description,
        pricePerDay,
        imageUrl,
        location,
        ownerId: req.prismaUser.id
      }
    });
    
    res.status(201).json(equipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

// Edit Equipment (Owner Only)
router.put('/:id', requireAuth, requireRole('OWNER'), validate(updateEquipmentSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipmentId = String(String(req.params.id));
    
    // Verify ownership
    const existing = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!existing) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }
    
    if (existing.ownerId !== req.prismaUser.id) {
      res.status(403).json({ error: 'You do not have permission to edit this equipment' });
      return;
    }
    
    // If image is changing, delete old image
    if (req.body.imageUrl && existing.imageUrl && req.body.imageUrl !== existing.imageUrl) {
      await deleteFileByUrl(existing.imageUrl, 'equipment-images');
    }

    const data = { ...req.body };
    if (data.category) data.category = data.category.toUpperCase();

    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data
    });
    
    res.json(updatedEquipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

// Delete Equipment (Owner Only)
router.delete('/:id', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipmentId = String(String(req.params.id));
    
    // Verify ownership
    const existing = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!existing) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }
    
    if (existing.ownerId !== req.prismaUser.id) {
      res.status(403).json({ error: 'You do not have permission to delete this equipment' });
      return;
    }
    
    // Delete from Storage first (Strict rollback logic)
    if (existing.imageUrl) {
      try {
        await deleteFileByUrl(existing.imageUrl, 'equipment-images');
      } catch (storageError) {
        // If storage deletion fails, we prevent DB deletion to avoid orphans
        console.error('Storage deletion failed, aborting DB delete:', storageError);
        res.status(500).json({ error: 'Failed to clean up storage assets. Equipment was not deleted.' });
        return;
      }
    }

    await prisma.equipment.update({
      where: { id: equipmentId },
      data: { 
        isDeleted: true,
        deletedAt: new Date()
      }
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});

export default router;
