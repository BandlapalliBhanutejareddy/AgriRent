import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createBookingSchema, updateBookingStatusSchema } from '../schemas';
import { prisma } from '../lib/prisma';


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



    await prisma.auditLog.create({
      data: {
        actorId: req.prismaUser.id,
        actorRole: req.prismaUser.role,
        action: 'CREATE_BOOKING',
        resource: 'Booking',
        resourceId: booking.id,
        metadata: JSON.stringify({ equipmentId, startDate: start, endDate: end, price: totalPrice }),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

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

    if (role === 'ADMIN') {
      // Admins can do anything
    } else if (isOwner && (status === 'ACCEPTED' || status === 'REJECTED' || status === 'COMPLETED')) {
      // Owner of equipment can accept, reject, or mark as completed
    } else if (isFarmer && status === 'CANCELLED') {
      // Farmer who made booking can cancel
    } else {
      res.status(403).json({ error: 'You do not have permission to perform this action' });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: status as any },
      include: {
        equipment: { include: { owner: { select: { id: true } } } },
        farmer: { select: { id: true, name: true } }
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
    const activeContext = req.query.role as string;

    if (role === 'FARMER') {
      where.farmerId = userId;
    } else if (role === 'OWNER') {
      where.equipment = { ownerId: userId };
    } else if (role === 'BOTH') {
      if (activeContext === 'FARMER') {
        where.farmerId = userId;
      } else if (activeContext === 'OWNER') {
        where.equipment = { ownerId: userId };
      } else {
        // Fallback for safety, fetch all related
        where.OR = [{ farmerId: userId }, { equipment: { ownerId: userId } }];
      }
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
