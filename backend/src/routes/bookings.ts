import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createBookingSchema, updateBookingStatusSchema } from '../schemas';
import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../lib/push';

const router = Router();

// Create Booking (Farmer Only)
router.post('/', requireAuth, requireRole('FARMER'), validate(createBookingSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { equipmentId, startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 1. Verify Equipment
    const equipment = await prisma.equipment.findUnique({
      where: { id: String(equipmentId) },
      include: { owner: true }
    });

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    if (!equipment.available) {
      res.status(400).json({ error: 'Equipment is currently marked as unavailable' });
      return;
    }

    // 2. Check Overlapping Dates
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        equipmentId: String(equipmentId),
        status: { in: ['PENDING', 'ACCEPTED'] },
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } }
            ]
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } }
            ]
          }
        ]
      }
    });

    if (overlappingBookings.length > 0) {
      res.status(409).json({ error: 'Equipment is already booked for these dates' });
      return;
    }

    // Calculate Price
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    const totalPrice = days * equipment.pricePerDay;

    // Create Booking
    const booking = await prisma.booking.create({
      data: {
        farmerId: String(req.prismaUser.id),
        equipmentId: String(equipmentId),
        startDate: start,
        endDate: end,
        status: 'PENDING',
        totalPrice
      }
    });

    // Generate Notification for Owner (in-app)
    await prisma.notification.create({
      data: {
        userId: equipment.ownerId,
        title: 'New Booking Request',
        message: `You have a new booking request for ${equipment.title} from ${req.prismaUser.name}`,
        type: 'BOOKING_REQUEST',
        relatedId: booking.id
      }
    });

    // Send push notification to owner
    if (equipment.owner?.pushToken) {
      await sendPushNotification(equipment.owner.pushToken, {
        title: '🔔 New Booking Request',
        body: `${req.prismaUser.name} wants to rent your ${equipment.title}`,
        data: { bookingId: booking.id, screen: 'owner/requests' }
      });
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking request' });
  }
});

// Booking Status Update
router.put('/:id/status', requireAuth, validate(updateBookingStatusSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const bookingId = String(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        equipment: true,
        farmer: true
      }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const role = req.prismaUser.role;
    const userId = req.prismaUser.id;

    const isOwner = booking.equipment.ownerId === userId;
    const isFarmer = booking.farmerId === userId;

    if (role === 'OWNER') {
      if (!isOwner) {
        res.status(403).json({ error: 'You do not have permission to manage this booking' });
        return;
      }
      if (status !== 'ACCEPTED' && status !== 'REJECTED') {
        res.status(400).json({ error: 'Owners can only accept or reject booking requests' });
        return;
      }
    } else if (role === 'FARMER') {
      if (!isFarmer) {
        res.status(403).json({ error: 'You do not own this booking' });
        return;
      }
      if (status !== 'CANCELLED') {
        res.status(400).json({ error: 'Farmers can only cancel their own booking requests' });
        return;
      }
    } else if (role !== 'ADMIN') {
      res.status(403).json({ error: 'Role cannot update booking status' });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: status as any },
      include: {
        equipment: { include: { owner: { select: { id: true, pushToken: true } } } },
        farmer: { select: { id: true, name: true, pushToken: true } }
      }
    });

    // In-app notification
    const recipientId = isOwner ? booking.farmerId : booking.equipment.ownerId;
    const notifTitle = `Booking ${status}`;
    const notifMessage = `The booking for ${booking.equipment.title} has been ${status.toLowerCase()} by the ${role.toLowerCase()}.`;

    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: notifTitle,
        message: notifMessage,
        type: 'BOOKING_UPDATE',
        relatedId: booking.id
      }
    });

    // Push notifications
    const statusEmoji: Record<string, string> = {
      ACCEPTED: '✅', REJECTED: '❌', COMPLETED: '🎉', CANCELLED: '🚫'
    };
    const emoji = statusEmoji[status] || '📋';

    // Notify farmer when owner acts
    if (isOwner && updatedBooking.farmer?.pushToken) {
      await sendPushNotification(updatedBooking.farmer.pushToken, {
        title: `${emoji} Booking ${status}`,
        body: `Your booking for ${booking.equipment.title} was ${status.toLowerCase()}`,
        data: { bookingId: booking.id, screen: 'bookings' }
      });
    }

    // Notify owner when farmer cancels
    if (isFarmer && updatedBooking.equipment?.owner?.pushToken) {
      await sendPushNotification(updatedBooking.equipment.owner.pushToken, {
        title: `${emoji} Booking Cancelled`,
        body: `A farmer cancelled their booking for ${booking.equipment.title}`,
        data: { bookingId: booking.id, screen: 'owner/requests' }
      });
    }

    res.json(updatedBooking);
  } catch (error) {
    console.error('Update Booking Status Error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Get Owner's Bookings specifically
router.get('/owner', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { equipment: { ownerId: req.prismaUser.id } },
      include: {
        equipment: { select: { id: true, title: true, category: true, imageUrl: true } },
        farmer: { select: { id: true, name: true, email: true, phone: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    console.error('Owner bookings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch owner bookings' });
  }
});

// Admin: get all bookings
router.get('/admin/all', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        equipment: { select: { id: true, title: true } },
        farmer: { select: { id: true, name: true, email: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all bookings' });
  }
});

// Get User's Bookings
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: any): Promise<void> => {
  try {
    const role = req.prismaUser.role;
    const userId = req.prismaUser.id;

    let where: any = {};
    if (role === 'FARMER') {
      where.farmerId = userId;
    } else if (role === 'OWNER') {
      where.equipment = { ownerId: userId };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        equipment: {
          include: {
            owner: {
              select: { id: true, name: true, phone: true }
            }
          }
        },
        farmer: {
          select: { id: true, name: true, phone: true }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(bookings);
  } catch (error) {
    console.error('Bookings Fetch Error:', error);
    next(error);
  }
});

export default router;
