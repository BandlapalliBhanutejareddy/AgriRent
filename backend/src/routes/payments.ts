import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { PaymentStatus } from '../constants/paymentStates';
import { generateInvoicePdf } from '../lib/invoice';

const router = Router();

// Admin: Get all payments
router.get('/admin/payments', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.prismaUser.role !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const payments = await prisma.paymentTransaction.findMany({
      include: {
        booking: {
          include: {
            farmer: true,
            equipment: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(payments);
  } catch (error) {
    console.error('Get Admin Payments Error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Download Invoice
router.get('/:bookingId/invoice', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = String(req.params.bookingId);

    // Authorization check
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { equipment: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.farmerId !== req.prismaUser.id && booking.equipment.ownerId !== req.prismaUser.id && req.prismaUser.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized to view this invoice' });
      return;
    }

    if (booking.paymentStatus !== 'PAID' && booking.paymentStatus !== 'SUCCESS') {
      res.status(400).json({ error: 'Invoice is only available for paid bookings' });
      return;
    }

    const pdfBytes = await generateInvoicePdf(bookingId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${bookingId}.pdf`);
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Invoice Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// Farmer: Get Payment History
router.get('/history', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmerId = req.prismaUser.id;
    const bookings = await prisma.booking.findMany({
      where: { farmerId },
      include: {
        equipment: {
          include: {
            owner: { select: { id: true, name: true } }
          }
        },
        farmer: { select: { id: true, name: true } },
        payments: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const records = bookings.map(b => {
      const ptx = b.payments?.[0];
      const isPaid = b.paymentStatus === 'PAID' || b.paymentStatus === 'SUCCESS' || ptx?.status === 'SUCCESS';
      return {
        id: ptx?.id || b.id,
        transactionRef: ptx?.transactionRef || b.paymentId || `TXN-${b.id.substring(b.id.length - 8).toUpperCase()}`,
        bookingId: b.id,
        equipmentId: b.equipmentId,
        equipmentTitle: b.equipment?.title || 'Equipment',
        equipmentCategory: b.equipment?.category || 'TRACTOR',
        equipmentImageUrl: b.equipment?.imageUrl,
        ownerName: b.equipment?.owner?.name || 'Equipment Owner',
        farmerName: b.farmer?.name || req.prismaUser.name,
        paymentDate: ptx?.createdAt || b.updatedAt,
        startDate: b.startDate,
        endDate: b.endDate,
        amount: ptx?.amount ?? (b.amountPaid ?? (isPaid ? (b.totalPrice ?? 0) : 0)),
        totalPrice: b.totalPrice ?? 0,
        currency: ptx?.currency || 'INR',
        paymentStatus: isPaid ? 'PAID' : (b.paymentStatus || 'PENDING'),
        paymentMethod: ptx?.paymentMethod || (isPaid ? 'AGRORENT_DIRECT' : 'Not Available'),
        status: b.status,
        hasReceipt: isPaid || (b.amountPaid != null && b.amountPaid > 0)
      };
    });

    res.json(records);
  } catch (error) {
    console.error('Get Farmer Payment History Error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Owner: Get Payments Received
router.get('/received', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.prismaUser.id;
    const bookings = await prisma.booking.findMany({
      where: { equipment: { ownerId } },
      include: {
        equipment: { select: { id: true, title: true, category: true, imageUrl: true } },
        farmer: { select: { id: true, name: true } },
        payments: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const records = bookings.map(b => {
      const ptx = b.payments?.[0];
      const isPaid = b.paymentStatus === 'PAID' || b.paymentStatus === 'SUCCESS' || ptx?.status === 'SUCCESS';
      return {
        id: ptx?.id || b.id,
        transactionRef: ptx?.transactionRef || b.paymentId || `TXN-${b.id.substring(b.id.length - 8).toUpperCase()}`,
        bookingId: b.id,
        equipmentId: b.equipmentId,
        equipmentTitle: b.equipment?.title || 'Equipment',
        equipmentCategory: b.equipment?.category || 'TRACTOR',
        equipmentImageUrl: b.equipment?.imageUrl,
        ownerName: req.prismaUser.name,
        farmerName: b.farmer?.name || 'Farmer',
        paymentDate: ptx?.createdAt || b.updatedAt,
        startDate: b.startDate,
        endDate: b.endDate,
        amount: ptx?.amount ?? (b.amountPaid ?? (isPaid ? (b.totalPrice ?? 0) : 0)),
        totalPrice: b.totalPrice ?? 0,
        currency: ptx?.currency || 'INR',
        paymentStatus: isPaid ? 'PAID' : (b.paymentStatus || 'PENDING'),
        paymentMethod: ptx?.paymentMethod || (isPaid ? 'AGRORENT_DIRECT' : 'Not Available'),
        status: b.status,
        hasReceipt: isPaid || (b.amountPaid != null && b.amountPaid > 0)
      };
    });

    res.json(records);
  } catch (error) {
    console.error('Get Owner Payments Received Error:', error);
    res.status(500).json({ error: 'Failed to fetch payments received' });
  }
});

export default router;
