import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { emitToUser } from '../lib/socket';

const router = Router();

// Get chat history for a specific booking
router.get('/booking/:bookingId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = String(req.params.bookingId);

    // Verify user is part of this booking
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

    if (!isFarmer && !isOwner) {
      res.status(403).json({ error: 'You are not a participant in this booking' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { bookingId },
      include: {
        sender: { select: { id: true, name: true, role: true } },
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

    // Verify user is part of this booking
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
      res.status(403).json({ error: 'You are not a participant in this booking' });
      return;
    }

    // Determine receiver
    const receiverId = isFarmer ? booking.equipment.ownerId : booking.farmerId;

    const chatMessage = await prisma.message.create({
      data: {
        bookingId,
        senderId: userId,
        text: String(text)
      },
      include: {
        sender: { select: { id: true, name: true, role: true } }
      }
    });

    // Create a notification for the receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: 'New Message',
        message: `You have a new message from ${req.prismaUser.name} regarding your booking.`,
        type: 'CHAT_MESSAGE',
        relatedId: bookingId
      }
    });

    // Emit realtime event
    emitToUser(receiverId, 'new_message', chatMessage);

    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
