require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

async function testRazorpayWebhook() {
  const baseUrl = 'http://localhost:4000/api';

  try {
    const user = await prisma.user.findFirst({ where: { email: 'farmer@agrorent.ai' } });
    const equipment = await prisma.equipment.findFirst({ where: { available: true } });

    if (!user || !equipment) throw new Error('Missing test data');

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '15m' });

    // 1. Create a Booking
    const bookingRes = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        equipmentId: equipment.id,
        startDate: new Date(Date.now() + 120 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 121 * 86400000).toISOString(),
        totalPrice: equipment.pricePerDay
      })
    });
    
    const bookingJson = await bookingRes.json();
    const booking = bookingJson.data;

    // 2. Create Order
    const orderRes = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ bookingId: booking.id })
    });
    const orderJson = await orderRes.json();
    const orderData = orderJson.data;

    console.log('--- RAZORPAY WEBHOOK TESTS ---');

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_' + Date.now(),
            order_id: orderData.orderId,
            amount: equipment.pricePerDay * 100
          }
        }
      }
    };

    const bodyStr = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyStr)
      .digest('hex');

    // Valid webhook
    const hookRes1 = await fetch(`${baseUrl}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      body: bodyStr
    });
    
    console.log('1. Valid webhook status:', hookRes1.status);

    // Invalid webhook
    const hookRes2 = await fetch(`${baseUrl}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid_sig'
      },
      body: bodyStr
    });
    
    console.log('2. Invalid webhook status:', hookRes2.status);

    if (hookRes1.status === 200 && hookRes2.status === 400) {
      console.log('RAZORPAY WEBHOOK TESTS: PASS');
    } else {
      console.log('RAZORPAY WEBHOOK TESTS: FAIL');
    }

  } catch (err) {
    console.error('RAZORPAY WEBHOOK TESTS: FAIL', err);
  } finally {
    await prisma.$disconnect();
  }
}

testRazorpayWebhook();
