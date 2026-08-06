const axios = require('axios');
const crypto = require('crypto');

const API_URL = 'http://localhost:4000/api';
let farmerToken = '';
let ownerToken = '';
let equipmentId = '';
let bookingId = '';
let razorpayOrderId = '';
let razorpayPaymentId = 'pay_MOCK' + Math.floor(Math.random() * 100000);
let razorpaySignature = '';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

async function runTest() {
  console.log('--- Starting Payments Flow Test ---');

  try {
    // 1. Login Farmer
    const farmerRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'farmer@agrorent.com',
      password: 'password123'
    });
    farmerToken = farmerRes.data.token;
    console.log('✅ Farmer Logged In');

    // 2. Fetch Equipment
    const eqRes = await axios.get(`${API_URL}/equipment`);
    equipmentId = eqRes.data[0].id;
    console.log(`✅ Equipment Found: ${eqRes.data[0].title}`);

    // 3. Create Booking
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 2);
    
    const bookingRes = await axios.post(`${API_URL}/bookings`, {
      equipmentId: equipmentId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }, { headers: { Authorization: `Bearer ${farmerToken}` } });
    
    bookingId = bookingRes.data.id;
    console.log(`✅ Booking Created: ${bookingId}`);

    // 4. Create Razorpay Order
    const orderRes = await axios.post(`${API_URL}/payments/create-order`, {
      bookingId: bookingId
    }, { headers: { Authorization: `Bearer ${farmerToken}` } });

    razorpayOrderId = orderRes.data.orderId;
    console.log(`✅ Razorpay Order Created: ${razorpayOrderId}`);

    // 5. Verify Payment Signature (Mocking frontend callback)
    razorpaySignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

    const verifyRes = await axios.post(`${API_URL}/payments/verify`, {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      bookingId: bookingId
    }, { headers: { Authorization: `Bearer ${farmerToken}` } });

    console.log(`✅ Payment Verified & Captured`);

    // 6. Test Webhook (payment.captured idempotency check)
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: razorpayPaymentId,
            order_id: razorpayOrderId,
            amount: 500000
          }
        }
      }
    };

    const webhookSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const webhookRes = await axios.post(`${API_URL}/payments/webhook`, payload, {
      headers: {
        'x-razorpay-signature': webhookSignature,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Webhook Handled Successfully`);

    // 7. Request Refund
    const refundRes = await axios.post(`${API_URL}/payments/${bookingId}/refund`, {}, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });

    console.log(`✅ Refund Requested Successfully`);

    console.log('\n🎉 All Payment Flow Tests Passed!');
  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTest();
