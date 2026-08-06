import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentStatus } from '../constants/paymentStates';
import { generateInvoicePdf } from '../lib/invoice';

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_xxxxx',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
});

// Create Payment Order
router.post('/create-order', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      res.status(400).json({ error: 'Booking ID is required' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking || !booking.totalPrice) {
      res.status(404).json({ error: 'Booking not found or price not set' });
      return;
    }

    if (booking.paymentStatus === 'PAID') {
      res.status(400).json({ error: 'Booking is already paid' });
      return;
    }

    const amountInPaise = Math.round(booking.totalPrice * 100); // Razorpay requires amount in smallest currency unit

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_booking_${booking.id}`,
    };

    let order;
    if (process.env.RAZORPAY_KEY_SECRET === 'test_secret' || !process.env.RAZORPAY_KEY_SECRET) {
      order = {
        id: 'order_MOCK' + Math.floor(Math.random() * 100000),
        amount: options.amount,
        currency: options.currency
      };
    } else {
      order = await razorpay.orders.create(options);
    }

    if (!order) {
      res.status(500).json({ error: 'Failed to create Razorpay order' });
      return;
    }

    // Persist Payment Intent
    const paymentTransaction = await prisma.paymentTransaction.create({
      data: {
        bookingId: booking.id,
        razorpayOrderId: order.id,
        amount: booking.totalPrice,
        currency: 'INR',
        status: PaymentStatus.ORDER_CREATED
      }
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      transactionId: paymentTransaction.id
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// Verify Payment Signature
router.post('/verify', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      await prisma.paymentTransaction.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: PaymentStatus.FAILED, failureReason: 'Invalid signature' }
      });
      res.status(400).json({ error: 'Payment verification failed: Invalid signature' });
      return;
    }

    // Update Transaction and Booking
    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: PaymentStatus.PAYMENT_CAPTURED
        }
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'PAID',
          paymentId: razorpay_payment_id,
          status: 'CONFIRMED' // Auto confirm on successful payment verification
        }
      });
    });

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
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

    if (booking.paymentStatus !== 'PAID') {
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

// Process Refund
router.post('/:bookingId/refund', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = String(req.params.bookingId);
    
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true, equipment: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.farmerId !== req.prismaUser.id && booking.equipment.ownerId !== req.prismaUser.id && req.prismaUser.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    if (booking.paymentStatus !== 'PAID') {
      res.status(400).json({ error: 'Can only refund paid bookings' });
      return;
    }

    const payment = booking.payments.find((p: any) => p.status === PaymentStatus.PAYMENT_CAPTURED);
    if (!payment || !payment.razorpayPaymentId) {
      res.status(400).json({ error: 'No valid payment transaction found' });
      return;
    }

    // Update state to REFUND_REQUESTED
    await prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUND_REQUESTED }
    });

    // Initiate Razorpay Refund
    let refund;
    if (payment.razorpayPaymentId.startsWith('pay_MOCK')) {
      refund = { id: 'rfnd_MOCK' + Math.floor(Math.random() * 100000) };
    } else {
      refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(payment.amount * 100),
        speed: 'normal'
      });
    }

    if (!refund) {
      res.status(500).json({ error: 'Failed to initiate refund with Razorpay' });
      return;
    }

    // Update state to REFUND_PROCESSING
    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REFUND_PROCESSING }
      });
      await tx.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: 'REFUND_PROCESSING' }
      });
    });

    res.json({ success: true, message: 'Refund initiated successfully', refundId: refund.id });
  } catch (error) {
    console.error('Refund Error:', error);
    res.status(500).json({ error: 'Refund processing failed' });
  }
});

// Webhook Handler
router.post('/webhook', async (req: Request | any, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

    const bodyStr = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyStr)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('Webhook signature mismatch');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (!event || !payload) {
      res.status(400).json({ error: 'Invalid payload format' });
      return;
    }

    // Idempotency: checking if event was already processed based on payment ID and status
    // For this example, we assume idempotency is handled by the deterministic state machine transitions.

    if (event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;
      
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { razorpayOrderId: orderId }
      });

      if (transaction && transaction.status !== PaymentStatus.PAYMENT_CAPTURED) {
        await prisma.$transaction(async (tx) => {
          await tx.paymentTransaction.update({
            where: { id: transaction.id },
            data: { status: PaymentStatus.PAYMENT_CAPTURED, razorpayPaymentId: paymentEntity.id }
          });
          await tx.booking.update({
            where: { id: transaction.bookingId },
            data: { paymentStatus: 'PAID', paymentId: paymentEntity.id, status: 'CONFIRMED' }
          });
        });
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;
      
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { razorpayOrderId: orderId }
      });

      if (transaction && transaction.status !== PaymentStatus.FAILED) {
        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: { status: PaymentStatus.FAILED, failureReason: paymentEntity.error_description || 'Payment Failed' }
        });
      }
    } else if (event === 'refund.processed') {
      const refundEntity = payload.refund.entity;
      const paymentId = refundEntity.payment_id;
      
      const transaction = await prisma.paymentTransaction.findFirst({
        where: { razorpayPaymentId: paymentId }
      });

      if (transaction && transaction.status !== PaymentStatus.REFUNDED) {
        await prisma.$transaction(async (tx) => {
          await tx.paymentTransaction.update({
            where: { id: transaction.id },
            data: { status: PaymentStatus.REFUNDED, refundedAmount: refundEntity.amount / 100 }
          });
          await tx.booking.update({
            where: { id: transaction.bookingId },
            data: { paymentStatus: 'REFUNDED', status: 'CANCELLED' }
          });
        });
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
