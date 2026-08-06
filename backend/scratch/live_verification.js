const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('======================================================');
console.log('💰 V0.8.1 LIVE PAYMENT VERIFICATION AUDITOR 💰');
console.log('======================================================\n');
console.log('Instructions:');
console.log('1. Ensure you have REAL Razorpay test keys in backend/.env');
console.log('2. Run `node scripts/start_tunnel.js` and set the webhook in Razorpay Dashboard.');
console.log('3. Open the frontend, log in as a farmer, and make a live test payment.');
console.log('4. This script will continuously poll the database to verify the end-to-end flow.');
console.log('\nPolling started...\n');

let lastCheckedBookingId = null;

setInterval(async () => {
  try {
    // Check for latest PaymentTransaction
    const latestTx = await prisma.paymentTransaction.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { booking: true }
    });

    if (latestTx && latestTx.bookingId !== lastCheckedBookingId) {
      if (latestTx.status === 'PAYMENT_CAPTURED' && latestTx.booking.paymentStatus === 'PAID') {
        console.log(`✅ [LIVE TEST SUCCESS: CAPTURE] Booking ${latestTx.bookingId} successfully confirmed via live webhook!`);
        console.log(`   - Razorpay Order ID: ${latestTx.razorpayOrderId}`);
        console.log(`   - Amount Captured: INR ${latestTx.amount}`);
        lastCheckedBookingId = latestTx.bookingId;
      }
    }

    if (latestTx && latestTx.bookingId === lastCheckedBookingId && latestTx.status === 'REFUNDED') {
      console.log(`✅ [LIVE TEST SUCCESS: REFUND] Refund processed for Booking ${latestTx.bookingId} via live webhook!`);
      lastCheckedBookingId = null; // reset to listen for next
    }

  } catch (error) {
    console.error('Polling error:', error.message);
  }
}, 5000);
