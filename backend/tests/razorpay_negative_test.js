require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function testRazorpayNegative() {
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
        startDate: new Date(Date.now() + 90 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 91 * 86400000).toISOString(),
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

    const razorpay_order_id = orderData.orderId;
    const razorpay_payment_id = 'pay_test_' + Date.now();
    
    console.log('--- RAZORPAY NEGATIVE TESTS ---');
    
    // Invalid signature
    const verifyRes1 = await fetch(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature: 'invalid_sig',
        bookingId: booking.id
      })
    });
    
    console.log('1. Invalid signature status:', verifyRes1.status);

    if (verifyRes1.status === 400) {
      console.log('RAZORPAY NEGATIVE TESTS: PASS');
    } else {
      console.log('RAZORPAY NEGATIVE TESTS: FAIL');
    }

  } catch (err) {
    console.error('RAZORPAY NEGATIVE TESTS: FAIL', err);
  } finally {
    await prisma.$disconnect();
  }
}

testRazorpayNegative();
