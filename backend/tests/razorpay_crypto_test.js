const crypto = require('crypto');
const axios = require('axios');

const API_URL = 'http://localhost:4000/api';
const SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret';

async function testCrypto() {
  console.log('--- Level A: Razorpay Crypto & Unit Validation ---');
  let token;
  let bookingId;

  try {
    // Login
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'farmer@agrorent.com',
      password: 'password123'
    });
    token = loginRes.data.token;
    console.log('✅ Auth token acquired.');

    // Fetch equipments
    const eqRes = await axios.get(`${API_URL}/equipment`);
    const equipmentId = eqRes.data[0].id;

    // Create booking
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 2);
    
    const bookRes = await axios.post(`${API_URL}/bookings`, {
      equipmentId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }, { headers: { Authorization: `Bearer ${token}` } });
    bookingId = bookRes.data.id;
    console.log(`✅ Booking created: ${bookingId}`);

    // Create Order
    const orderRes = await axios.post(`${API_URL}/payments/create-order`, { bookingId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orderId = orderRes.data.orderId;
    console.log(`✅ Order created: ${orderId}`);

    const fakePaymentId = 'pay_MOCK' + Math.floor(Math.random() * 100000);

    // Test 1: Invalid Signature
    try {
      await axios.post(`${API_URL}/payments/verify`, {
        razorpay_order_id: orderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: 'invalid_signature_here',
        bookingId
      }, { headers: { Authorization: `Bearer ${token}` } });
      console.log('❌ Failed: Invalid signature was accepted.');
      process.exit(1);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log('✅ Invalid signature rejected correctly.');
      } else {
        console.log('❌ Failed: Unexpected error for invalid signature.', err.message);
        process.exit(1);
      }
    }

    // Test 2: Valid Signature (Cryptographic validation only)
    const validSignature = crypto.createHmac('sha256', SECRET)
      .update(orderId + '|' + fakePaymentId)
      .digest('hex');
    
    await axios.post(`${API_URL}/payments/verify`, {
      razorpay_order_id: orderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: validSignature,
      bookingId
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('✅ Valid signature accepted correctly.');

    // Test 3: Duplicate verification
    await axios.post(`${API_URL}/payments/verify`, {
      razorpay_order_id: orderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: validSignature,
      bookingId
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('✅ Duplicate verification handled without crashing.');

    console.log('--- Crypto Tests Passed ---');
  } catch (error) {
    console.error('Crypto Test Failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

testCrypto();
