import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { emitToUser } from '../lib/socket';

const router = Router();

// Get user notifications
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: String(req.prismaUser.id) },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = String(req.params.id);
    await prisma.notification.update({
      where: { 
        id: notificationId,
        userId: String(req.prismaUser.id) // Ensure ownership
      },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.put('/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        userId: String(req.prismaUser.id),
        read: false
      },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Delete notification
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = String(req.params.id);
    await prisma.notification.delete({
      where: { 
        id: notificationId,
        userId: String(req.prismaUser.id) 
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
