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

// Reply to a notification
router.post('/:id/reply', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notificationId = String(req.params.id);
    const { message } = req.body;

    const replyText = String(message || '').trim();
    if (!replyText || replyText.length < 2) {
      res.status(400).json({ success: false, error: 'Reply message cannot be empty (minimum 2 characters).' });
      return;
    }

    // Verify notification ownership
    const notif = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: String(req.prismaUser.id)
      }
    });

    if (!notif) {
      res.status(404).json({ success: false, error: 'Notification not found or access denied.' });
      return;
    }

    const currentUserId = String(req.prismaUser.id);
    const senderName = req.prismaUser.name || 'User';

    // 1. If notification is linked to a booking
    let handled = false;
    let recipientId: string | null = null;

    if (notif.relatedId) {
      const booking = await prisma.booking.findUnique({
        where: { id: notif.relatedId },
        include: { equipment: true }
      });

      if (booking) {
        if (booking.farmerId === currentUserId) {
          recipientId = booking.equipment?.ownerId || null;
        } else if (booking.equipment?.ownerId === currentUserId) {
          recipientId = booking.farmerId;
        }

        if (recipientId) {
          // Persist to booking chat messages
          await prisma.message.create({
            data: {
              bookingId: booking.id,
              senderId: currentUserId,
              text: replyText
            }
          });

          // Deliver notification to recipient
          const newNotif = await prisma.notification.create({
            data: {
              userId: recipientId,
              title: `Reply from ${senderName}`,
              message: replyText,
              relatedId: booking.id,
              type: 'BOOKING_MESSAGE'
            }
          });

          try {
            emitToUser(recipientId, 'new_notification', newNotif);
          } catch (_) {}

          handled = true;
        }
      }
    }

    // 2. If general or admin alert notification, route reply to admin portal
    if (!handled) {
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });

      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: `Reply from ${senderName} regarding "${notif.title}"`,
            message: `${senderName} (${req.prismaUser.email || 'User'}): ${replyText}`,
            relatedId: notif.id,
            type: 'USER_REPLY'
          }
        });
      }
    }

    // Mark current notification as read
    await prisma.notification.update({
      where: { id: notif.id },
      data: { read: true }
    });

    res.json({
      success: true,
      message: 'Reply sent and persisted successfully.',
      reply: {
        senderId: currentUserId,
        senderName,
        text: replyText,
        createdAt: new Date()
      }
    });
  } catch (error: any) {
    console.error('Notification reply error:', error);
    res.status(500).json({ success: false, error: 'Failed to send reply. Please try again.' });
  }
});

export default router;
