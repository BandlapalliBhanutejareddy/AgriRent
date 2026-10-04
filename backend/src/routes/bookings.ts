import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createBookingSchema, updateBookingStatusSchema } from '../schemas';
import { prisma } from '../lib/prisma';

const router = Router();

// 1. Get Availability / Blocked Dates for Equipment
router.get('/availability', async (req: any, res: Response): Promise<void> => {
  try {
    const { equipmentId } = req.query;
    if (!equipmentId) {
      res.status(400).json({ error: 'equipmentId parameter is required' });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: {
        equipmentId: String(equipmentId),
        status: {
          notIn: ['REJECTED', 'CANCELLED', 'REFUNDED']
        }
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true
      }
    });

    res.json({
      equipmentId,
      blockedRanges: bookings.map(b => ({
        bookingId: b.id,
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status
      }))
    });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ error: 'Failed to check equipment availability' });
  }
});

// 2. Create Booking (Farmer Only)
router.post('/', requireAuth, requireRole('FARMER'), validate(createBookingSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { equipmentId, startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Verify Equipment
    const equipment = await prisma.equipment.findUnique({
      where: { id: String(equipmentId) },
      include: { owner: true }
    });

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    if (!equipment.available) {
      res.status(400).json({ error: 'Equipment is currently marked as unavailable by owner' });
      return;
    }

    // Double-Booking Overlap Check in DB
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        equipmentId: String(equipmentId),
        status: { notIn: ['REJECTED', 'CANCELLED', 'REFUNDED'] },
        startDate: { lt: end },
        endDate: { gt: start }
      }
    });

    if (overlappingBookings.length > 0) {
      res.status(409).json({ error: 'Selected dates overlap with an existing booking. Please choose available dates.' });
      return;
    }

    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    const totalPrice = days * equipment.pricePerDay;
    const securityDeposit = Math.round(totalPrice * 0.15); // 15% deposit

    // Create Booking, Status History & Payment Transaction Atomically
    const result = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          farmerId: String(req.prismaUser.id),
          equipmentId: String(equipmentId),
          startDate: start,
          endDate: end,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          totalPrice,
          amountPaid: 0,
          securityDeposit
        }
      });



      await tx.bookingStatusHistory.create({
        data: {
          bookingId: b.id,
          status: 'PENDING',
          title: 'Booking Requested',
          note: `Booking request generated for ${days} day(s) rental from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`
        }
      });

      return b;
    }, { maxWait: 15000, timeout: 30000 });

    // Notify Owner
    await prisma.notification.create({
      data: {
        userId: equipment.ownerId,
        title: 'New Booking Request',
        message: `${req.prismaUser.name} requested to rent ${equipment.title} (${days} days, Ã¢â€šÂ¹${totalPrice}). Approval required.`,
        type: 'BOOKING_REQUEST',
        relatedId: result.id
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.prismaUser.id,
        actorRole: req.prismaUser.role,
        action: 'CREATE_BOOKING',
        resource: 'Booking',
        resourceId: result.id,
        metadata: JSON.stringify({ equipmentId, days, totalPrice, securityDeposit })
      }
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking request' });
  }
});

// 3. Get Tracking Timeline & Details for a Booking
router.get('/:id/tracking', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = String(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        equipment: {
          include: {
            owner: { select: { id: true, name: true, phone: true, email: true } },
            reviews: true
          }
        },
        farmer: { select: { id: true, name: true, phone: true, email: true } },
        payments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        returnInspection: true,
        equipmentReviews: true,
        userReviews: true
      }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const userId = req.prismaUser.id;
    const isFarmer = booking.farmerId === userId;
    const isOwner = booking.equipment.ownerId === userId;
    const isAdmin = req.prismaUser.role === 'ADMIN';

    if (!isFarmer && !isOwner && !isAdmin) {
      res.status(403).json({ error: 'Unauthorized access to booking tracking' });
      return;
    }

    res.json(booking);
  } catch (error) {
    console.error('Fetch tracking error:', error);
    res.status(500).json({ error: 'Failed to load booking tracking' });
  }
});

// 4. Update Booking Status
router.put('/:id/status', requireAuth, validate(updateBookingStatusSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, note } = req.body;
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
    const isAdmin = role === 'ADMIN';

    // Authorization checks based on role and target state
    if (!isAdmin) {
      if (isOwner) {
        const allowedOwnerStatuses = ['ACCEPTED', 'CONFIRMED', 'REJECTED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'COMPLETED'];
        if (!allowedOwnerStatuses.includes(status)) {
          res.status(403).json({ error: 'Owners cannot perform this status transition' });
          return;
        }
      } else if (isFarmer) {
        const allowedFarmerStatuses = ['CANCELLED', 'RETURN_PENDING'];
        if (!allowedFarmerStatuses.includes(status)) {
          res.status(403).json({ error: 'Farmers cannot perform this status transition' });
          return;
        }
      } else {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }
    }

    let updateData: any = { status };
    if (status === 'REJECTED' || status === 'CANCELLED') {
      updateData.paymentStatus = 'CANCELLED';
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          equipment: { include: { owner: { select: { id: true, name: true, phone: true } } } },
          farmer: { select: { id: true, name: true, phone: true } }
        }
      });



      const statusTitles: Record<string, string> = {
        'ACCEPTED': 'Owner Approved Booking',
        'CONFIRMED': 'Booking Confirmed',
        'REJECTED': 'Owner Declined Request (Refund Initiated)',
        'CANCELLED': 'Booking Cancelled (Refund Initiated)',
        'DISPATCHED': 'Equipment Prepared & Dispatched',
        'OUT_FOR_DELIVERY': 'Out for Delivery / Ready for Pickup',
        'IN_TRANSIT': 'In Transit to Location',
        'DELIVERED': 'Delivered / Rental Active',
        'ACTIVE': 'Rental Period Active',
        'RETURN_PENDING': 'Return Requested by Farmer',
        'RETURN_IN_PROGRESS': 'Return Process Started',
        'RETURNED': 'Equipment Returned to Owner',
        'INSPECTION_PENDING': 'Owner Inspection in Progress',
        'COMPLETED': 'Rental Completed & Finalized'
      };

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          status,
          title: statusTitles[status] || `Status updated to ${status}`,
          note: note || `Updated by ${req.prismaUser.name}`
        }
      });

      return b;
    }, { maxWait: 15000, timeout: 30000 });

    // Notify opposing party
    const recipientId = isOwner ? booking.farmerId : booking.equipment.ownerId;
    const notifTitle = status === 'ACCEPTED' ? 'Booking Approved Ã°Å¸Å½â€°' :
                       status === 'REJECTED' ? 'Booking Request Declined' :
                       status === 'RETURN_PENDING' ? 'Equipment Return Requested' :
                       status === 'COMPLETED' ? 'Rental Completed Ã¢Å“â€¦' : `Booking ${status}`;

    const notifMessage = status === 'ACCEPTED' ? `Your request for ${booking.equipment.title} has been approved!` :
                         status === 'REJECTED' ? `Your request for ${booking.equipment.title} was declined. Full refund of Ã¢â€šÂ¹${booking.totalPrice} issued.` :
                         status === 'RETURN_PENDING' ? `Farmer ${req.prismaUser.name} requested return for ${booking.equipment.title}.` :
                         status === 'COMPLETED' ? `Rental cycle for ${booking.equipment.title} has been successfully completed.` :
                         `Booking status updated to ${status}.`;

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

// 5. Submit Return Inspection (Owner Only)
router.post('/:id/inspection', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = String(req.params.id);
    const { condition, deductionAmount, notes } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { equipment: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.equipment.ownerId !== req.prismaUser.id) {
      res.status(403).json({ error: 'Only the equipment owner can submit an inspection' });
      return;
    }

    const inspection = await prisma.$transaction(async (tx) => {
      const insp = await tx.returnInspection.upsert({
        where: { bookingId },
        update: {
          condition: condition || 'GOOD',
          deductionAmount: Number(deductionAmount) || 0,
          notes: notes || ''
        },
        create: {
          bookingId,
          condition: condition || 'GOOD',
          deductionAmount: Number(deductionAmount) || 0,
          notes: notes || ''
        }
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'COMPLETED' }
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          status: 'COMPLETED',
          title: 'Equipment Inspected & Returned',
          note: `Condition: ${condition || 'GOOD'}. Deduction: Ã¢â€šÂ¹${deductionAmount || 0}. Notes: ${notes || 'None'}`
        }
      });

      return insp;
    });

    await prisma.notification.create({
      data: {
        userId: booking.farmerId,
        title: 'Return Inspection Completed',
        message: `Owner completed inspection for ${booking.equipment.title}. Rental marked as COMPLETED.`,
        type: 'BOOKING_UPDATE',
        relatedId: bookingId
      }
    });

    res.json(inspection);
  } catch (error) {
    console.error('Inspection error:', error);
    res.status(500).json({ error: 'Failed to record return inspection' });
  }
});

// 6. Get Owner's Bookings
router.get('/owner', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { equipment: { ownerId: req.prismaUser.id } },
      include: {
        equipment: { select: { id: true, title: true, category: true, imageUrl: true } },
        farmer: { select: { id: true, name: true, email: true, phone: true } },
        payments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        returnInspection: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    console.error('Owner bookings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch owner bookings' });
  }
});

// 7. Get User Bookings List
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
        where.OR = [{ farmerId: userId }, { equipment: { ownerId: userId } }];
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        equipment: {
          include: {
            owner: { select: { id: true, name: true, phone: true } },
            reviews: true
          }
        },
        farmer: { select: { id: true, name: true, phone: true } },
        payments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        returnInspection: true,
        equipmentReviews: true,
        userReviews: true
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
