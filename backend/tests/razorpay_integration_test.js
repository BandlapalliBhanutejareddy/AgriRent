require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

async function testRazorpayIntegration() {
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
        startDate: new Date(Date.now() + 60 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 61 * 86400000).toISOString(),
        totalPrice: equipment.pricePerDay
      })
    });
    
    if (bookingRes.status !== 201) {
      console.log('Booking Creation Failed:', await bookingRes.text());
      return;
    }
    const bookingJson = await bookingRes.json();
    const booking = bookingJson.data;
    console.log('Booking Created:', booking.id);

    // 2. Create Order
    const orderRes = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ bookingId: booking.id })
    });
    
    if (orderRes.status !== 200) {
      console.log('Order Creation Failed:', await orderRes.text());
      return;
    }
    const orderJson = await orderRes.json();
    const orderData = orderJson.data;
    console.log('Order Created:', orderData.orderId);

    // 3. Verify Payment
    const razorpay_order_id = orderData.orderId;
    const razorpay_payment_id = 'pay_test_' + Date.now();
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
    
    const razorpay_signature = crypto
      .createHmac('sha256', rzpSecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const verifyRes = await fetch(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bookingId: booking.id
      })
    });

    if (verifyRes.status === 200) {
      console.log('RAZORPAY INTEGRATION TEST: PASS');
    } else {
      console.log('RAZORPAY INTEGRATION TEST: FAIL', await verifyRes.text());
    }

  } catch (err) {
    console.error('RAZORPAY INTEGRATION TEST: FAIL', err);
  } finally {
    await prisma.$disconnect();
  }
}

testRazorpayIntegration();
