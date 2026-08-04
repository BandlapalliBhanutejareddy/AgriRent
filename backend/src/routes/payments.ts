import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import Razorpay from 'razorpay';
import crypto from 'crypto';

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

    const order = await razorpay.orders.create(options);

    if (!order) {
      res.status(500).json({ error: 'Failed to create Razorpay order' });
      return;
    }

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
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
      res.status(400).json({ error: 'Payment verification failed: Invalid signature' });
      return;
    }

    // Update Booking status to PAID
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'PAID',
        paymentId: razorpay_payment_id,
        status: 'ACCEPTED' // Auto accept on payment (optional business logic)
      }
    });

    res.json({ success: true, booking });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

export default router;
