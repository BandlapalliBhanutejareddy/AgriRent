import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Get chat history for a specific booking
router.get('/booking/:bookingId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = String(req.params.bookingId);

    // Verify user is part of this booking
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.farmerId !== req.prismaUser.id && booking.ownerId !== req.prismaUser.id) {
      res.status(403).json({ error: 'You are not a participant in this booking' });
      return;
    }

    const messages = await prisma.chatMessage.findMany({
      where: { bookingId },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message related to a booking
router.post('/booking/:bookingId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = String(req.params.bookingId);
    const { message } = req.body;

    if (!message || message.trim() === '') {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    // Verify user is part of this booking
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.farmerId !== req.prismaUser.id && booking.ownerId !== req.prismaUser.id) {
      res.status(403).json({ error: 'You are not a participant in this booking' });
      return;
    }

    // Determine receiver
    const receiverId = req.prismaUser.id === booking.farmerId ? booking.ownerId : booking.farmerId;

    const chatMessage = await prisma.chatMessage.create({
      data: {
        bookingId,
        senderId: req.prismaUser.id,
        receiverId,
        message
      },
      include: {
        sender: { select: { id: true, name: true, role: true } }
      }
    });

    // Optionally create a notification for the receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: 'New Message',
        message: `You have a new message regarding a booking from ${req.prismaUser.name}`,
        type: 'SYSTEM',
        relatedId: booking.id
      }
    });

    res.status(201).json(chatMessage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
