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

export default router;
