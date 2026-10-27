const axios = require('axios');
const assert = require('assert');

const API_BASE = 'http://localhost:4000/api';

async function verifyOwnerPortalLive() {
  console.log('=================================================================');
  console.log('   AGRORENT AI: LIVE OWNER PORTAL DATA & SECURITY AUDIT');
  console.log('=================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ✗ FAIL: ${name}: ${e.message}`);
    }
  }

  // 1. Authenticate Owner
  console.log('1. Authenticating Owner web_owner_1787209581213@test.com...');
  const ownerLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'web_owner_1787209581213@test.com',
    password: 'Password123!',
    role: 'OWNER',
  });

  const ownerToken = ownerLoginRes.data.token || ownerLoginRes.data.data?.token;
  const ownerUser = ownerLoginRes.data.user || ownerLoginRes.data.data?.user;
  test('Owner login successful and returns token', () => {
    assert(ownerToken, 'Owner token must exist');
    assert(ownerUser, 'Owner user must exist');
    assert(ownerUser.id, 'Owner user ID must exist');
  });

  const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

  // 2. Authenticate second user (Farmer) to verify strict data isolation
  console.log('2. Authenticating Farmer to test data isolation...');
  const farmerLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'farmer.b.1788354195151@agrorent.ai',
    password: 'Password123!',
    role: 'FARMER',
  });
  const farmerToken = farmerLoginRes.data.token || farmerLoginRes.data.data?.token;
  const farmerHeaders = { Authorization: `Bearer ${farmerToken}` };

  // 3. Test GET /api/equipment/owner and GET /api/equipment/my
  console.log('3. Checking live Owner Equipment endpoints...');
  const eqOwnerRes = await axios.get(`${API_BASE}/equipment/owner`, { headers: ownerHeaders });
  const eqMyRes = await axios.get(`${API_BASE}/equipment/my`, { headers: ownerHeaders });

  test('GET /api/equipment/owner returns HTTP 200', () => {
    assert.strictEqual(eqOwnerRes.status, 200);
  });

  test('GET /api/equipment/my returns HTTP 200', () => {
    assert.strictEqual(eqMyRes.status, 200);
  });

  const ownerEquipments = eqOwnerRes.data.data || eqOwnerRes.data;
  test('Equipment records returned are an array', () => {
    assert(Array.isArray(ownerEquipments), 'Equipment data must be an array');
  });

  const dynamicEquipCount = ownerEquipments.length;
  console.log(`     -> Live Owner Equipment Count: ${dynamicEquipCount} items`);

  test('Owner data isolation: all returned equipment belongs strictly to this owner', () => {
    for (const eq of ownerEquipments) {
      assert.strictEqual(eq.ownerId, ownerUser.id, `Equipment ${eq.id} ownerId ${eq.ownerId} must match logged-in owner ${ownerUser.id}`);
    }
  });

  // 4. Test GET /api/bookings/owner
  console.log('4. Checking live Owner Bookings endpoint...');
  const bookingsRes = await axios.get(`${API_BASE}/bookings/owner`, { headers: ownerHeaders });

  test('GET /api/bookings/owner returns HTTP 200', () => {
    assert.strictEqual(bookingsRes.status, 200);
  });

  const ownerBookings = bookingsRes.data.data || bookingsRes.data;
  test('Bookings records returned are an array', () => {
    assert(Array.isArray(ownerBookings), 'Bookings data must be an array');
  });

  const dynamicBookingsCount = ownerBookings.length;
  console.log(`     -> Live Owner Bookings Count: ${dynamicBookingsCount} bookings`);

  test('Booking ownership isolation: all bookings belong to this owner equipment', () => {
    for (const b of ownerBookings) {
      if (b.equipment) {
        assert.strictEqual(b.equipment.ownerId, ownerUser.id, `Booking ${b.id} equipment owner must match logged-in owner`);
      }
    }
  });

  // 5. Test Access Control & Privacy: Farmer cannot view Owner Bookings
  console.log('5. Verifying cross-role and cross-user authorization enforcement...');
  try {
    const unauthorizedRes = await axios.get(`${API_BASE}/bookings/owner`, { headers: farmerHeaders });
    // If not rejected, check if empty or forbidden
    test('Farmer calling /bookings/owner receives forbidden or empty isolation', () => {
      const data = unauthorizedRes.data.data || unauthorizedRes.data;
      assert.strictEqual(data.length, 0, 'Farmer must not see any owner bookings');
    });
  } catch (err) {
    test('Farmer calling /bookings/owner is rejected with 403 or 401', () => {
      assert([401, 403].includes(err.response?.status), `Expected 401/403, got ${err.response?.status}`);
    });
  }

  // 6. Test Unauthenticated Requests
  console.log('6. Verifying unauthenticated requests rejection...');
  try {
    await axios.get(`${API_BASE}/equipment/owner`);
    test('Unauthenticated /equipment/owner is rejected', () => {
      assert.fail('Should have failed with 401');
    });
  } catch (err) {
    test('Unauthenticated /equipment/owner returns 401', () => {
      assert.strictEqual(err.response?.status, 401);
    });
  }

  try {
    await axios.get(`${API_BASE}/bookings/owner`);
    test('Unauthenticated /bookings/owner is rejected', () => {
      assert.fail('Should have failed with 401');
    });
  } catch (err) {
    test('Unauthenticated /bookings/owner returns 401', () => {
      assert.strictEqual(err.response?.status, 401);
    });
  }

  console.log('\n-----------------------------------------------------------------');
  console.log(`Owner Portal Live Verification: ${passed}/${total} Passed`);
  console.log(`Verified Live Dynamic Counts: Equipment: ${dynamicEquipCount}, Bookings: ${dynamicBookingsCount}`);
  console.log('-----------------------------------------------------------------\n');

  if (passed !== total) process.exit(1);
}

verifyOwnerPortalLive().catch(e => {
  console.error('Fatal error in verifyOwnerPortalLive:', e);
  process.exit(1);
});
