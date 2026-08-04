const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:4000/api';

async function main() {
  console.log('--- STARTING FARMER BOOKING FLOW VERIFICATION ---');
  let ownerToken = '';
  let farmerToken = '';
  let equipId = '';
  let bookingId = '';

  try {
    // 1. Login as OWNER
    const ownerLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner@agrorent.ai',
      password: 'Owner@123'
    });
    ownerToken = ownerLoginRes.data.token;
    const ownerId = ownerLoginRes.data.user.id;
    console.log(`[PASS] OWNER logged in. ID: ${ownerId}`);

    // 2. Add equipment
    const addRes = await axios.post(`${API_URL}/equipment`, {
      title: 'Booking Test Tractor ' + Date.now(),
      category: 'TRACTOR',
      pricePerDay: 2000,
      description: 'Excellent tractor reserved for E2E booking tests.',
      imageUrl: 'https://images.unsplash.com/photo-1592919016382-70678625902b?auto=format&fit=crop&q=80&w=800',
      location: 'Pune, Maharashtra'
    }, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    equipId = addRes.data.data.id;
    console.log(`[PASS] Test Equipment listed. ID: ${equipId}`);

    // 3. Login as FARMER
    const farmerLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'farmer@agrorent.ai',
      password: 'Farmer@123'
    });
    farmerToken = farmerLoginRes.data.token;
    const farmerId = farmerLoginRes.data.user.id;
    console.log(`[PASS] FARMER logged in. ID: ${farmerId}`);

    // 4. Farmer requests booking
    console.log('[STEP] FARMER requesting booking...');
    const bookingRes = await axios.post(`${API_URL}/bookings`, {
      equipmentId: equipId,
      startDate: '2026-06-10T00:00:00.000Z',
      endDate: '2026-06-15T00:00:00.000Z'
    }, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    bookingId = bookingRes.data.id;
    console.log(`[PASS] Booking requested successfully. Booking ID: ${bookingId}, Status: ${bookingRes.data.status}`);

    // 5. Owner receives booking request
    console.log('[STEP] OWNER retrieving active bookings queue...');
    const ownerBookingsRes = await axios.get(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const ownerBookings = ownerBookingsRes.data;
    const receivedBooking = ownerBookings.find(b => b.id === bookingId);
    if (!receivedBooking) {
      throw new Error('Owner failed to receive the booking request in their queue!');
    }
    console.log(`[PASS] OWNER successfully received booking request in queue. Status: ${receivedBooking.status}`);

    // 6. Owner accepts booking request
    console.log('[STEP] OWNER accepting booking request...');
    const acceptRes = await axios.put(`${API_URL}/bookings/${bookingId}/status`, {
      status: 'ACCEPTED'
    }, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    console.log(`[PASS] Booking status updated by OWNER. New Status: ${acceptRes.data.status}`);

    // 7. Verify in PostgreSQL
    console.log('[STEP] Verifying row values in PostgreSQL directly...');
    const dbRow = await prisma.booking.findUnique({
      where: { id: bookingId }
    });
    console.log('Database Row Values:', JSON.stringify(dbRow, null, 2));

    if (dbRow.status === 'ACCEPTED') {
      console.log('[PASS] PostgreSQL status successfully verified as ACCEPTED.');
    } else {
      throw new Error('PostgreSQL status did not update to ACCEPTED!');
    }

    // 8. Farmer receives ACCEPTED notification
    console.log('[STEP] Verifying Farmer received notification...');
    const farmerNotifications = await prisma.notification.findMany({
      where: { userId: farmerId },
      orderBy: { createdAt: 'desc' }
    });
    const updateNotification = farmerNotifications.find(n => n.relatedId === bookingId && n.type === 'BOOKING_UPDATE');
    if (!updateNotification) {
      throw new Error('Farmer did not receive a booking update notification!');
    }
    console.log(`[PASS] Farmer Notification received: "${updateNotification.title}" - ${updateNotification.message}`);

    console.log('\n--- FARMER BOOKING FLOW VERIFICATION PASSED ---');
    console.log('Owner Listing: YES');
    console.log('Farmer Request: YES');
    console.log('Owner Accept: YES');
    console.log('PostgreSQL Status updated: YES');
    console.log('Notification generated: YES');

  } catch (error) {
    console.error('\n[FAIL] Booking flow failed:', error.response ? error.response.data : error.message);
  } finally {
    // Cleanup E2E booking test records
    console.log('\nCleaning up booking E2E test data...');
    if (bookingId) {
      await prisma.notification.deleteMany({ where: { relatedId: bookingId } });
      await prisma.booking.deleteMany({ where: { id: bookingId } });
    }
    if (equipId) {
      await prisma.equipment.deleteMany({ where: { id: equipId } });
    }
    console.log('[PASS] Cleanup complete.');
    prisma.$disconnect();
  }
}

main();
