import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Get User's Notifications
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.prismaUser.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark Notification as Read
router.put('/:id/read', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notificationId = String(req.params.id);
    
    // Check ownership
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    
    if (notification.userId !== req.prismaUser.id) {
      res.status(403).json({ error: 'Not authorized to update this notification' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

export default router;
