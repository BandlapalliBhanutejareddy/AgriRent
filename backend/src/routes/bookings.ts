import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createBookingSchema, updateBookingStatusSchema, returnInspectionSchema } from '../schemas';
import { prisma } from '../lib/prisma';
import { emitToUser } from '../lib/socket';

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
    const ownerNotif = await prisma.notification.create({
      data: {
        userId: equipment.ownerId,
        title: 'New Booking Request',
        message: `${req.prismaUser.name} requested to rent ${equipment.title} (${days} days, ₹${totalPrice}). Approval required.`,
        type: 'BOOKING_REQUEST',
        relatedId: result.id
      }
    });
    emitToUser(equipment.ownerId, 'notification', ownerNotif);

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

// 2.3. Get Owner's Bookings (Must precede /:id to prevent parameter shadowing)
router.get('/owner', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { equipment: { ownerId: req.prismaUser.id } },
      include: {
        equipment: {
          select: {
            id: true,
            title: true,
            category: true,
            imageUrl: true,
            ownerId: true,
            owner: { select: { id: true, name: true, email: true } }
          }
        },
        farmer: { select: { id: true, name: true, email: true } },
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

// 2.4. Get User Bookings List (Supports both / and /my, must precede /:id)
router.get(['/', '/my'], requireAuth, async (req: AuthRequest, res: Response, next: any): Promise<void> => {
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
            owner: { select: { id: true, name: true } },
            reviews: true
          }
        },
        farmer: { select: { id: true, name: true } },
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

// 2.5. Get Single Booking by ID
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = String(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        equipment: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            reviews: true
          }
        },
        farmer: { select: { id: true, name: true, email: true } },
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
      res.status(403).json({ error: 'Unauthorized access to booking' });
      return;
    }

    res.json(booking);
  } catch (error) {
    console.error('Fetch booking by ID error:', error);
    res.status(500).json({ error: 'Failed to load booking' });
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
            owner: { select: { id: true, name: true, email: true } },
            reviews: true
          }
        },
        farmer: { select: { id: true, name: true, email: true } },
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

// Authoritative Transition Matrix & Inspection Constants
export const VALID_BOOKING_TRANSITIONS: Record<string, { OWNER: string[]; FARMER: string[]; ADMIN: string[] }> = {
  PENDING: {
    OWNER: ['ACCEPTED', 'CONFIRMED', 'REJECTED'],
    FARMER: ['CANCELLED'],
    ADMIN: ['ACCEPTED', 'CONFIRMED', 'REJECTED', 'CANCELLED']
  },
  PAYMENT_SUCCESSFUL: {
    OWNER: ['CONFIRMED', 'ACCEPTED', 'DISPATCHED', 'ACTIVE', 'REJECTED'],
    FARMER: ['CANCELLED'],
    ADMIN: ['CONFIRMED', 'CANCELLED', 'REFUND_PROCESSING', 'REFUNDED', 'REJECTED']
  },
  ACCEPTED: {
    OWNER: ['CONFIRMED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE', 'REJECTED'],
    FARMER: ['CANCELLED'],
    ADMIN: ['CONFIRMED', 'CANCELLED', 'REJECTED', 'REFUND_PROCESSING']
  },
  CONFIRMED: {
    OWNER: ['DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE', 'CANCELLED'],
    FARMER: ['CANCELLED'],
    ADMIN: ['DISPATCHED', 'CANCELLED', 'REFUND_PROCESSING', 'REFUNDED']
  },
  DISPATCHED: {
    OWNER: ['OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE'],
    FARMER: [],
    ADMIN: ['OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE', 'CANCELLED', 'DISPUTED']
  },
  OUT_FOR_DELIVERY: {
    OWNER: ['IN_TRANSIT', 'DELIVERED', 'ACTIVE'],
    FARMER: [],
    ADMIN: ['DELIVERED', 'ACTIVE', 'CANCELLED', 'DISPUTED']
  },
  IN_TRANSIT: {
    OWNER: ['DELIVERED', 'ACTIVE'],
    FARMER: [],
    ADMIN: ['DELIVERED', 'ACTIVE', 'CANCELLED', 'DISPUTED']
  },
  DELIVERED: {
    OWNER: ['ACTIVE', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'COMPLETED'],
    FARMER: ['RETURN_PENDING'],
    ADMIN: ['ACTIVE', 'RETURN_PENDING', 'RETURNED', 'COMPLETED', 'DISPUTED']
  },
  ACTIVE: {
    OWNER: ['RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'COMPLETED'],
    FARMER: ['RETURN_PENDING'],
    ADMIN: ['RETURN_PENDING', 'RETURNED', 'COMPLETED', 'DISPUTED']
  },
  RETURN_PENDING: {
    OWNER: ['RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'COMPLETED'],
    FARMER: [],
    ADMIN: ['RETURN_IN_PROGRESS', 'RETURNED', 'COMPLETED', 'DISPUTED']
  },
  RETURN_IN_PROGRESS: {
    OWNER: ['RETURNED', 'INSPECTION_PENDING', 'COMPLETED'],
    FARMER: [],
    ADMIN: ['RETURNED', 'INSPECTION_PENDING', 'COMPLETED', 'DISPUTED']
  },
  RETURNED: {
    OWNER: ['INSPECTION_PENDING', 'COMPLETED'],
    FARMER: [],
    ADMIN: ['INSPECTION_PENDING', 'COMPLETED', 'DISPUTED']
  },
  INSPECTION_PENDING: {
    OWNER: ['COMPLETED'],
    FARMER: [],
    ADMIN: ['COMPLETED', 'DISPUTED']
  },
  DISPUTED: {
    OWNER: ['COMPLETED'],
    FARMER: [],
    ADMIN: ['COMPLETED', 'REFUND_PROCESSING', 'REFUNDED', 'CANCELLED']
  },
  REFUND_PROCESSING: {
    OWNER: [],
    FARMER: [],
    ADMIN: ['REFUNDED']
  },
  // Terminal states cannot be transitioned or reopened
  COMPLETED: {
    OWNER: [],
    FARMER: [],
    ADMIN: []
  },
  CANCELLED: {
    OWNER: [],
    FARMER: [],
    ADMIN: []
  },
  REJECTED: {
    OWNER: [],
    FARMER: [],
    ADMIN: []
  },
  REFUNDED: {
    OWNER: [],
    FARMER: [],
    ADMIN: []
  }
};

export const PERMITTED_INSPECTION_STATUSES = [
  'RETURN_PENDING',
  'RETURN_IN_PROGRESS',
  'RETURNED',
  'INSPECTION_PENDING'
];

export const CANONICAL_INSPECTION_CONDITIONS = [
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'DAMAGED'
];

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

    // 1. Ownership & Role authorization
    if (!isOwner && !isFarmer && !isAdmin) {
      res.status(403).json({ error: 'Unauthorized: You do not have permission to modify this booking' });
      return;
    }

    // 2. Terminal state guard: Terminal states cannot be transitioned or reopened by anyone
    const terminalStatuses = ['COMPLETED', 'CANCELLED', 'REJECTED', 'REFUNDED'];
    if (terminalStatuses.includes(booking.status)) {
      res.status(400).json({ error: `Cannot transition booking in terminal state '${booking.status}'` });
      return;
    }

    // 3. Role-level status capability guard
    const allowedOwnerStatuses = ['ACCEPTED', 'CONFIRMED', 'REJECTED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'COMPLETED'];
    const allowedFarmerStatuses = ['CANCELLED', 'RETURN_PENDING'];

    if (!isAdmin) {
      if (isFarmer && !isOwner) {
        if (!allowedFarmerStatuses.includes(status)) {
          res.status(403).json({ error: 'Farmers cannot perform this status transition' });
          return;
        }
      } else if (isOwner && !isFarmer) {
        if (!allowedOwnerStatuses.includes(status)) {
          res.status(403).json({ error: 'Owners cannot perform this status transition' });
          return;
        }
      }
    }

    // 4. Current-status to target-status transition matrix validation
    const allowedTransitionsForActor = new Set<string>();
    if (isAdmin) {
      (VALID_BOOKING_TRANSITIONS[booking.status]?.ADMIN || []).forEach(s => allowedTransitionsForActor.add(s));
    }
    if (isOwner) {
      (VALID_BOOKING_TRANSITIONS[booking.status]?.OWNER || []).forEach(s => allowedTransitionsForActor.add(s));
    }
    if (isFarmer) {
      (VALID_BOOKING_TRANSITIONS[booking.status]?.FARMER || []).forEach(s => allowedTransitionsForActor.add(s));
    }

    if (!allowedTransitionsForActor.has(status)) {
      res.status(400).json({
        error: `Invalid status transition from '${booking.status}' to '${status}'`
      });
      return;
    }

    // 5. Concurrency-safe atomic conditional update (Compare-And-Swap)
    let updateData: any = { status };
    if (status === 'REJECTED' || status === 'CANCELLED') {
      updateData.paymentStatus = 'CANCELLED';
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.booking.updateMany({
        where: {
          id: bookingId,
          status: booking.status // Ensure status hasn't changed since read
        },
        data: updateData
      });

      if (updateResult.count === 0) {
        throw new Error('CONCURRENCY_CONFLICT');
      }

      const b = await tx.booking.findUniqueOrThrow({
        where: { id: bookingId },
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

    // 6. Notifications emitted strictly after transaction succeeds
    const recipientId = isOwner ? booking.farmerId : booking.equipment.ownerId;
    const notifTitle = status === 'ACCEPTED' ? 'Booking Approved 🎉' :
                       status === 'REJECTED' ? 'Booking Request Declined' :
                       status === 'RETURN_PENDING' ? 'Equipment Return Requested' :
                       status === 'COMPLETED' ? 'Rental Completed ✅' : `Booking ${status}`;

    const notifMessage = status === 'ACCEPTED' ? `Your request for ${booking.equipment.title} has been approved!` :
                         status === 'REJECTED' ? `Your request for ${booking.equipment.title} was declined. Full refund of ₹${booking.totalPrice} issued.` :
                         status === 'RETURN_PENDING' ? `Farmer ${req.prismaUser.name} requested return for ${booking.equipment.title}.` :
                         status === 'COMPLETED' ? `Rental cycle for ${booking.equipment.title} has been successfully completed.` :
                         `Booking status updated to ${status}.`;

    const statusNotif = await prisma.notification.create({
      data: {
        userId: recipientId,
        title: notifTitle,
        message: notifMessage,
        type: 'BOOKING_UPDATE',
        relatedId: booking.id
      }
    });
    emitToUser(recipientId, 'notification', statusNotif);

    res.json(updatedBooking);
  } catch (error: any) {
    if (error?.message === 'CONCURRENCY_CONFLICT') {
      res.status(409).json({ error: 'Conflict: Booking status was concurrently modified by another request' });
      return;
    }
    console.error('Update Booking Status Error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// 5. Submit Return Inspection (Owner Only)
router.post('/:id/inspection', requireAuth, requireRole('OWNER'), validate(returnInspectionSchema), async (req: AuthRequest, res: Response): Promise<void> => {
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

    // 1. Authoritative ownership verification
    if (booking.equipment.ownerId !== req.prismaUser.id) {
      res.status(403).json({ error: 'Only the equipment owner can submit an inspection' });
      return;
    }

    // 2. Return-inspection eligibility based on current booking status
    if (!PERMITTED_INSPECTION_STATUSES.includes(booking.status)) {
      res.status(400).json({
        error: `Cannot inspect booking with status '${booking.status}'. Booking must be in one of: ${PERMITTED_INSPECTION_STATUSES.join(', ')}`
      });
      return;
    }

    // 3. Condition enum validation
    const cleanCondition = String(condition || '').trim().toUpperCase();
    if (!CANONICAL_INSPECTION_CONDITIONS.includes(cleanCondition)) {
      res.status(400).json({
        error: `Invalid condition '${condition}'. Must be one of: ${CANONICAL_INSPECTION_CONDITIONS.join(', ')}`
      });
      return;
    }

    // 4. Deduction amount validation against authoritative security deposit
    let parsedDeduction = 0;
    if (deductionAmount !== undefined && deductionAmount !== null) {
      if (typeof deductionAmount === 'string' && deductionAmount.trim() === '') {
        res.status(400).json({ error: 'Invalid deductionAmount. Must be a finite number' });
        return;
      }
      const num = Number(deductionAmount);
      if (typeof num !== 'number' || !Number.isFinite(num) || isNaN(num)) {
        res.status(400).json({ error: 'Invalid deductionAmount. Must be a finite number' });
        return;
      }
      if (num < 0) {
        res.status(400).json({ error: 'deductionAmount cannot be negative' });
        return;
      }
      const authoritativeDeposit = booking.securityDeposit ?? 0;
      if (num > authoritativeDeposit) {
        res.status(400).json({
          error: `deductionAmount (₹${num}) cannot exceed authoritative security deposit (₹${authoritativeDeposit})`
        });
        return;
      }
      parsedDeduction = num;
    }

    const cleanNotes = notes !== undefined && notes !== null ? String(notes).trim() : '';

    // 5. Atomic transaction with CAS update
    const inspection = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.booking.updateMany({
        where: {
          id: bookingId,
          status: { in: PERMITTED_INSPECTION_STATUSES }
        },
        data: { status: 'COMPLETED' }
      });

      if (updateResult.count === 0) {
        throw new Error('CONCURRENCY_CONFLICT');
      }

      const insp = await tx.returnInspection.upsert({
        where: { bookingId },
        update: {
          condition: cleanCondition,
          deductionAmount: parsedDeduction,
          notes: cleanNotes
        },
        create: {
          bookingId,
          condition: cleanCondition,
          deductionAmount: parsedDeduction,
          notes: cleanNotes
        }
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          status: 'COMPLETED',
          title: 'Equipment Inspected & Returned',
          note: `Condition: ${cleanCondition}. Deduction: ₹${parsedDeduction}. Notes: ${cleanNotes || 'None'}`
        }
      });

      return insp;
    }, { maxWait: 15000, timeout: 30000 });

    // 6. Notification emitted strictly after transaction succeeds
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
  } catch (error: any) {
    if (error?.message === 'CONCURRENCY_CONFLICT') {
      res.status(409).json({ error: 'Conflict: Booking inspection was submitted concurrently or status is no longer eligible' });
      return;
    }
    console.error('Inspection error:', error);
    res.status(500).json({ error: 'Failed to record return inspection' });
  }
});

export default router;
