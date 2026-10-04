import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { emitToUser } from '../lib/socket';

const router = Router();

// Get unread messages count for logged-in user
router.get('/unread-count', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = String(req.prismaUser.id);
    const count = await prisma.message.count({
      where: {
        read: false,
        senderId: { not: userId },
        booking: {
          OR: [
            { farmerId: userId },
            { equipment: { ownerId: userId } }
          ]
        }
      }
    });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unread chat count' });
  }
});

// Mark messages in a booking as read
router.put('/read/:bookingId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = String(req.params.bookingId);
    const userId = String(req.prismaUser.id);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { equipment: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const isFarmer = booking.farmerId === userId;
    const isOwner = booking.equipment.ownerId === userId;

    if (!isFarmer && !isOwner) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.message.updateMany({
      where: {
        bookingId,
        senderId: { not: userId },
        read: false
      },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get chat history for a specific booking
router.get('/booking/:bookingId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = String(req.params.bookingId);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { equipment: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const userId = String(req.prismaUser.id);
    const isFarmer = booking.farmerId === userId;
    const isOwner = booking.equipment.ownerId === userId;

    if (!isFarmer && !isOwner && req.prismaUser.role !== 'ADMIN') {
      res.status(403).json({ error: 'You are not a participant in this booking' });
      return;
    }

    // Auto mark received messages as read
    await prisma.message.updateMany({
      where: {
        bookingId,
        senderId: { not: userId },
        read: false
      },
      data: { read: true }
    });

    const messages = await prisma.message.findMany({
      where: { bookingId },
      include: {
        sender: { select: { id: true, name: true, role: true, profileImage: true } },
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    console.error('Fetch Messages Error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message related to a booking
router.post('/booking/:bookingId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = String(req.params.bookingId);
    const { text } = req.body;

    if (!text || String(text).trim() === '') {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }

    const userId = String(req.prismaUser.id);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { equipment: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const isFarmer = booking.farmerId === userId;
    const isOwner = booking.equipment.ownerId === userId;

    if (!isFarmer && !isOwner && req.prismaUser.role !== 'ADMIN') {
      res.status(403).json({ error: 'You are not a participant in this booking' });
      return;
    }

    const receiverId = isFarmer ? booking.equipment.ownerId : booking.farmerId;

    const chatMessage = await prisma.message.create({
      data: {
        bookingId,
        senderId: userId,
        text: String(text).trim(),
        read: false
      },
      include: {
        sender: { select: { id: true, name: true, role: true, profileImage: true } }
      }
    });

    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: 'New Message Ã°Å¸â€™Â¬',
        message: `${req.prismaUser.name}: "${String(text).trim().slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
        type: 'CHAT_MESSAGE',
        relatedId: bookingId
      }
    });

    emitToUser(receiverId, 'new_message', chatMessage);

    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
