require('dotenv').config();
const Razorpay = require('razorpay');

async function testRazorpay() {
  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const orders = await instance.orders.all({ count: 1 });
    console.log('RAZORPAY TEST: VALID');
  } catch (err) {
    console.log('RAZORPAY TEST: INVALID');
    console.error(err.message);
  }
}

testRazorpay();
