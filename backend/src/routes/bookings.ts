import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createBookingSchema, updateBookingStatusSchema } from '../schemas';

const router = Router();
const prisma = new PrismaClient();

// Create Booking (Farmer Only)
router.post('/', requireAuth, requireRole('FARMER'), validate(createBookingSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { equipmentId, startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 1. Verify Equipment and Owner
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId, isDeleted: false },
      include: { owner: true }
    });

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    if (!equipment.isAvailable) {
      res.status(400).json({ error: 'Equipment is currently marked as unavailable' });
      return;
    }

    // 2. Check Overlapping Dates
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        equipmentId,
        status: { in: ['PENDING', 'ACCEPTED', 'ACTIVE'] },
        isDeleted: false,
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } }
        ]
      }
    });

    if (overlappingBookings.length > 0) {
      res.status(409).json({ error: 'Equipment is already booked for these dates' });
      return;
    }

    // Calculate Price
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    const totalPrice = days * equipment.pricePerDay;

    // Create Booking
    const booking = await prisma.booking.create({
      data: {
        farmerId: req.prismaUser.id,
        ownerId: equipment.ownerId,
        equipmentId,
        startDate: start,
        endDate: end,
        totalPrice,
        status: 'PENDING'
      }
    });

    // Generate Notification for Owner
    await prisma.notification.create({
      data: {
        userId: equipment.ownerId,
        title: 'New Booking Request',
        message: `You have a new booking request for ${equipment.name}`,
        type: 'BOOKING_REQUEST',
        relatedId: booking.id
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking request' });
  }
});

// Booking Status Update: owner and farmer actions
router.put('/:id/status', requireAuth, validate(updateBookingStatusSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const bookingId = String(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { equipment: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const role = req.prismaUser.role;
    const userId = req.prismaUser.id;

    if (role === 'OWNER') {
      if (booking.ownerId !== userId) {
        res.status(403).json({ error: 'You do not have permission to manage this booking' });
        return;
      }
      if (status !== 'ACCEPTED' && status !== 'REJECTED') {
        res.status(403).json({ error: 'Owners can only accept or reject booking requests' });
        return;
      }
      if (booking.status !== 'PENDING') {
        res.status(400).json({ error: 'Only pending bookings can be accepted or rejected' });
        return;
      }
    } else if (role === 'FARMER') {
      if (booking.farmerId !== userId) {
        res.status(403).json({ error: 'You do not own this booking' });
        return;
      }
      if (status === 'ACTIVE' && booking.status !== 'ACCEPTED') {
        res.status(400).json({ error: 'Only accepted bookings can be started' });
        return;
      }
      if (status === 'COMPLETED' && booking.status !== 'ACTIVE') {
        res.status(400).json({ error: 'Only active bookings can be completed' });
        return;
      }
      if (status !== 'ACTIVE' && status !== 'COMPLETED') {
        res.status(403).json({ error: 'Farmers can only start or complete bookings' });
        return;
      }
    } else if (role !== 'ADMIN') {
      res.status(403).json({ error: 'Role cannot update booking status' });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status }
    });

    const recipientId = role === 'OWNER' ? booking.farmerId : booking.ownerId;
    const title = role === 'OWNER'
      ? `Booking ${status}`
      : status === 'ACTIVE'
        ? 'Rental Started'
        : 'Equipment Returned';
    const message = role === 'OWNER'
      ? `Your equipment booking has been ${status.toLowerCase()}`
      : status === 'ACTIVE'
        ? 'Your owner has marked the rental as active.'
        : 'Your rental has been completed.';

    await prisma.notification.create({
      data: {
        userId: recipientId,
        title,
        message,
        type: status,
        relatedId: booking.id
      }
    });

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Get User's Bookings (Farmer or Owner view)
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.prismaUser.role;
    
    let bookings;
    if (role === 'FARMER') {
      bookings = await prisma.booking.findMany({
        where: { farmerId: req.prismaUser.id, isDeleted: false },
        include: { equipment: true, owner: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'OWNER') {
      bookings = await prisma.booking.findMany({
        where: { ownerId: req.prismaUser.id, isDeleted: false },
        include: { equipment: true, farmer: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Admin gets all (not deleted)
      bookings = await prisma.booking.findMany({ 
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' } 
      });
    }

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

export default router;
