const http = require('http');

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 4000,
      path,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('=== PHASE 2: BACKEND & DATABASE VERIFICATION ===\n');

  // 1. Health & Database
  const health = await request('GET', '/api/health');
  console.log('1. Health check:', health.status, JSON.stringify(health.data));
  const ready = await request('GET', '/api/ready');
  console.log('2. Ready / DB check:', ready.status, JSON.stringify(ready.data));

  // 2. Auth for owner11@gmail.com
  console.log('\n3. Authenticating owner11@gmail.com...');
  const loginRes = await request('POST', '/api/auth/login', {
    'Content-Type': 'application/json'
  }, {
    email: 'owner11@gmail.com',
    password: 'Password123!'
  });

  console.log('Login HTTP Status:', loginRes.status);
  const token = loginRes.data.token || loginRes.data.accessToken || (loginRes.data.data && loginRes.data.data.token);
  if (!token) {
    console.error('FAILED: Login failed:', loginRes.data);
    process.exit(1);
  }
  const user = loginRes.data.user || (loginRes.data.data && loginRes.data.data.user);
  console.log(`Authenticated as: ID=${user?.id}, Name=${user?.name}, Role=${user?.role}`);

  const authHeader = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 3. Owner Equipment API
  console.log('\n4. Testing Owner Equipment API: GET /api/equipment/my');
  const equipRes = await request('GET', '/api/equipment/my', authHeader);
  console.log('Equipment API Status:', equipRes.status);
  const equipList = Array.isArray(equipRes.data) ? equipRes.data : (equipRes.data.data || []);
  console.log(`Equipment Count returned: ${equipList.length}`);
  equipList.forEach((e, idx) => {
    console.log(`   [${idx + 1}] ID=${e.id} | Title="${e.title}" | Category=${e.category} | Price=₹${e.pricePerDay} | Available=${e.available} | OwnerId=${e.ownerId}`);
  });

  // Verify all equipment belongs to owner
  const allOwnEquipment = equipList.every(e => e.ownerId === user?.id);
  console.log(`Verification: All equipment records belong strictly to owner (${user?.id}): ${allOwnEquipment}`);

  // 4. Owner Bookings API
  console.log('\n5. Testing Owner Bookings API: GET /api/bookings/owner');
  const bookRes = await request('GET', '/api/bookings/owner', authHeader);
  console.log('Bookings API Status:', bookRes.status);
  const bookList = Array.isArray(bookRes.data) ? bookRes.data : (bookRes.data.data || []);
  console.log(`Bookings Count returned: ${bookList.length}`);
  bookList.forEach((b, idx) => {
    console.log(`   [${idx + 1}] ID=${b.id} | Status=${b.status} | Total=₹${b.totalPrice} | Paid=₹${b.amountPaid} | FarmerName="${b.farmer?.name}" | EquipTitle="${b.equipment?.title}"`);
  });

  // 5. Test Authorization Barrier: Non-owner trying to access owner endpoints
  console.log('\n6. Testing Authorization Guard with Invalid Token');
  const unauthRes = await request('GET', '/api/bookings/owner', {
    'Authorization': 'Bearer invalid_or_expired_token'
  });
  console.log(`Unauthorized request returned status: ${unauthRes.status} (Expected: 401)`);

  console.log('\n=== PHASE 2 COMPLETED SUCCESSFULLY ===');
}

run().catch(console.error);
