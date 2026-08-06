
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:4000/api';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAudit() {
  const report = [];
  
  function logResult(step, dbResult, apiResult, status) {
    report.push(`Step: ${step}\nSTATUS: ${status}\nDATABASE RESULT: ${dbResult}\nAPI RESULT: ${apiResult}\n`);
    console.log(`[${status}] ${step}`);
  }

  try {
    console.log('--- STARTING WORKFLOW AUDIT ---');
    await prisma.notification.deleteMany({
      where: { user: { email: { in: ['owner_test@example.com', 'farmer_test@example.com', 'admin_test@example.com', 'admin_test2@example.com'] } } }
    });
    await prisma.booking.deleteMany({
      where: { OR: [ { farmer: { email: 'farmer_test@example.com' } }, { equipment: { owner: { email: 'owner_test@example.com' } } } ] }
    });
    await prisma.equipment.deleteMany({
      where: { owner: { email: 'owner_test@example.com' } }
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['owner_test@example.com', 'farmer_test@example.com', 'admin_test@example.com'] } }
    });

    // 1. Create Owner & Register
    let res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Owner', email: 'owner_test@example.com', password: 'Password123!', role: 'OWNER', phone: '9998887776' })
    });
    let data = await res.json();
    let ownerId = data.user?.id;
    
    // Auto-verify Owner for simplicity
    await prisma.user.update({ where: { email: 'owner_test@example.com' }, data: { isVerified: true } });
    
    // Login Owner
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner_test@example.com', password: 'Password123!' })
    });
    let ownerData = await res.json();
    let ownerToken = ownerData.token;
    
    let dbOwner = await prisma.user.findUnique({ where: { email: 'owner_test@example.com' } });
    logResult('1. Create Owner', dbOwner ? 'Created' : 'Missing', data.success ? 'Success' : 'Failed', data.success && dbOwner ? 'PASS' : 'FAIL');

    // 2. Add Equipment
    res = await fetch(`${API_BASE}/equipment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
      body: JSON.stringify({ name: 'Audit Tractor', title: 'Audit Tractor', description: 'Test', pricePerDay: 5000, category: 'Tractors', location: 'Test Farm' })
    });
    data = await res.json();
    let equipmentId = data.id || data.equipment?.id; // Depends on API response
    let dbEquipment = await prisma.equipment.findFirst({ where: { ownerId: ownerId } });
    if (!equipmentId && dbEquipment) equipmentId = dbEquipment.id;
    logResult('2. Add Equipment', dbEquipment ? 'Saved' : 'Missing', data.id || dbEquipment ? 'Success' : 'Failed', dbEquipment ? 'PASS' : 'FAIL');

    // 3 & 4. Create & Register Farmer
    res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Farmer', email: 'farmer_test@example.com', password: 'Password123!', role: 'FARMER', phone: '1112223334' })
    });
    data = await res.json();
    let farmerId = data.user?.id;
    let dbFarmer = await prisma.user.findUnique({ where: { email: 'farmer_test@example.com' } });
    logResult('3 & 4. Create/Register Farmer', dbFarmer ? 'Created Unverified' : 'Missing', data.success ? 'Success' : 'Failed', data.success ? 'PASS' : 'FAIL');

    // 5. Retrieve OTP
    let otpRecord = await prisma.$queryRaw`SELECT * FROM "OTPVerification" WHERE email = 'farmer_test@example.com' ORDER BY "createdAt" DESC LIMIT 1`;
    let farmerOtp = otpRecord[0]?.otp;
    logResult('5. Retrieve OTP (Simulated Ethereal)', farmerOtp ? `Found ${farmerOtp}` : 'Missing', 'N/A', farmerOtp ? 'PASS' : 'FAIL');

    // 6. Verify Farmer
    res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'farmer_test@example.com', otp: farmerOtp, purpose: 'REGISTER' })
    });
    data = await res.json();
    dbFarmer = await prisma.user.findUnique({ where: { email: 'farmer_test@example.com' } });
    logResult('6. Verify Farmer', dbFarmer?.isVerified ? 'Verified' : 'Unverified', data.success ? 'Success' : 'Failed', dbFarmer?.isVerified ? 'PASS' : 'FAIL');

    // 7. Login Farmer
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'farmer_test@example.com', password: 'Password123!' })
    });
    let farmerData = await res.json();
    let farmerToken = farmerData.token;
    logResult('7. Login Farmer', 'Checked', farmerData.success ? 'Success Token Generated' : 'Failed', farmerData.success ? 'PASS' : 'FAIL');

    // 8. Search Equipment
    res = await fetch(`${API_BASE}/equipment`, { headers: { 'Authorization': `Bearer ${farmerToken}` } });
    data = await res.json();
    let items = Array.isArray(data) ? data : (data.equipment || data.data || data.items || []);
    let foundEq = items.find(e => e.id === equipmentId);
    logResult('8. Search Equipment', 'Queried', foundEq ? 'Found Audit Tractor' : 'Missing', foundEq ? 'PASS' : 'FAIL');

    // 9. Create Booking
    res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${farmerToken}` },
      body: JSON.stringify({ equipmentId, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 86400000).toISOString() })
    });
    data = await res.json();
    let bookingId = data.id || data.booking?.id;
    let dbBooking = await prisma.booking.findFirst({ where: { farmerId } });
    if (!bookingId && dbBooking) bookingId = dbBooking.id;
    logResult('9. Create Booking', dbBooking ? 'Saved PENDING' : 'Missing', data.id || dbBooking ? 'Success' : 'Failed', dbBooking ? 'PASS' : 'FAIL');

    // 10 & 11. Login Owner & Accept Booking
    res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'ACCEPTED' })
    });
    data = await res.json();
    dbBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
    logResult('10 & 11. Owner Accepts Booking', dbBooking?.status === 'ACCEPTED' ? 'Updated ACCEPTED' : 'Failed', data.id || dbBooking?.status === 'ACCEPTED' ? 'Success' : 'Failed', dbBooking?.status === 'ACCEPTED' ? 'PASS' : 'FAIL');

    // 12. Complete Booking
    // Let's forcefully complete it via Prisma to simulate end of rental and payment
    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED', paymentStatus: 'PAID', totalPrice: 5000 } });
    dbBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
    logResult('12. Complete Booking', dbBooking?.status === 'COMPLETED' ? 'Updated COMPLETED/PAID' : 'Failed', 'N/A', dbBooking?.status === 'COMPLETED' ? 'PASS' : 'FAIL');

    // 13. Verify Notifications
    let notifications = await prisma.notification.findMany({ where: { userId: { in: [farmerId, ownerId] } } });
    // Assuming backend triggers notifications (if implemented). Currently it might not be fully hooked up.
    logResult('13. Verify Notifications', notifications.length > 0 ? `Found ${notifications.length}` : '0 Found (Notification Lifecycle missing)', 'N/A', notifications.length > 0 ? 'PASS' : 'FAIL (Expected - Priority 1/2)');

    // 14. Verify Analytics
    res = await fetch(`${API_BASE}/analytics/owner`, { headers: { 'Authorization': `Bearer ${ownerToken}` } });
    let ownerAnalyticsRes = await res.json();
    let oData = ownerAnalyticsRes.data || ownerAnalyticsRes;
    console.log("OWNER ANALYTICS DATA:", oData);
    let analyticsPass = oData.monthlyRevenue && oData.monthlyRevenue.length > 0 && oData.totalRevenue >= 5000;
    logResult('14. Verify Analytics', analyticsPass ? 'Graph updated with 5000' : 'No revenue', oData.monthlyRevenue ? 'Returned API data' : 'Failed', analyticsPass ? 'PASS' : 'FAIL');

    // 15 & 16. Admin Verify User Registry
    // Let's create an Admin dynamically
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('Password123!', 10);
    await prisma.user.upsert({
      where: { email: 'admin_test2@example.com' },
      update: { password: hash, role: 'ADMIN', isVerified: true },
      create: { name: 'Admin Test', email: 'admin_test2@example.com', password: hash, role: 'ADMIN', isVerified: true }
    });
    let adminLogin = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin_test2@example.com', password: 'Password123!' }) });
    let adminData = await adminLogin.json();
    let adminToken = adminData.token;

    res = await fetch(`${API_BASE}/analytics/admin/users`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    let adminUsersRes = await res.json();
    let aData = adminUsersRes.data || adminUsersRes;
    let adminPass = Array.isArray(aData) && aData.find(u => u.email === 'farmer_test@example.com');
    logResult('15 & 16. Admin User Registry', adminPass ? 'Farmer found in list' : 'Missing', aData ? 'Success' : 'Failed', adminPass ? 'PASS' : 'FAIL');

    // 17. Suspend Farmer
    res = await fetch(`${API_BASE}/analytics/admin/users/${farmerId}/suspend`, { method: 'PUT', headers: { 'Authorization': `Bearer ${adminToken}` } });
    data = await res.json();
    dbFarmer = await prisma.user.findUnique({ where: { id: farmerId } });
    logResult('17. Suspend Farmer', dbFarmer?.isSuspended ? 'Suspended' : 'Failed', data ? 'Success' : 'Failed', dbFarmer?.isSuspended ? 'PASS' : 'FAIL');

    // 18. Verify Login Blocked
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'farmer_test@example.com', password: 'Password123!' })
    });
    data = await res.json();
    logResult('18. Verify Login Blocked', 'Unverified/Suspended state', data.success === false ? 'Blocked with error' : 'Failed to block', data.success === false ? 'PASS' : 'FAIL');

    // 19. Reactivate Farmer
    res = await fetch(`${API_BASE}/analytics/admin/users/${farmerId}/suspend`, { method: 'PUT', headers: { 'Authorization': `Bearer ${adminToken}` } });
    data = await res.json();
    dbFarmer = await prisma.user.findUnique({ where: { id: farmerId } });
    logResult('19. Reactivate Farmer', !dbFarmer?.isSuspended ? 'Reactivated' : 'Failed', data ? 'Success' : 'Failed', !dbFarmer?.isSuspended ? 'PASS' : 'FAIL');

    // 20. Verify Login Restored
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'farmer_test@example.com', password: 'Password123!' })
    });
    data = await res.json();
    logResult('20. Verify Login Restored', 'Verified state', data.success ? 'Success Token Generated' : 'Blocked', data.success ? 'PASS' : 'FAIL');

    console.log('\n--- AUDIT COMPLETE ---\n');
    report.forEach(r => console.log(r));

    // Cleanup
    await prisma.notification.deleteMany({ where: { userId: { in: [farmerId, ownerId] } } });
    await prisma.booking.deleteMany({ where: { id: bookingId } });
    await prisma.equipment.deleteMany({ where: { id: equipmentId } });
    await prisma.user.deleteMany({ where: { email: { in: ['owner_test@example.com', 'farmer_test@example.com', 'admin_test@example.com', 'admin_test2@example.com'] } } });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
