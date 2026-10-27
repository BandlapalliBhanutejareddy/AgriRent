const http = require('http');

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
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
  console.log('Logging in as owner11@gmail.com...');
  const loginRes = await makeRequest('POST', '/api/auth/login', {
    'Content-Type': 'application/json'
  }, {
    email: 'owner11@gmail.com',
    password: 'Password123!'
  });

  console.log('Login Status:', loginRes.status);
  const token = loginRes.body.token || loginRes.body.accessToken || (loginRes.body.data && loginRes.body.data.token);
  if (!token) {
    console.error('Login failed:', loginRes.body);
    process.exit(1);
  }
  console.log('Token acquired successfully.');

  const authHeader = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 1. Equipment/my
  console.log('\n--- 1. Testing GET /api/equipment/my ---');
  const equipRes = await makeRequest('GET', '/api/equipment/my', authHeader);
  console.log('Status:', equipRes.status);
  console.log('Is Array?', Array.isArray(equipRes.body));
  console.log('Body keys:', typeof equipRes.body === 'object' ? Object.keys(equipRes.body) : 'primitive');
  const equipData = Array.isArray(equipRes.body) ? equipRes.body : (equipRes.body.data || equipRes.body.equipment || []);
  console.log('Equipment count:', equipData.length);
  if (equipData.length > 0) {
    console.log('Sample equipment item keys:', Object.keys(equipData[0]));
    console.log('Sample equipment id:', equipData[0].id, 'title:', equipData[0].title, 'available:', equipData[0].available);
  }

  // 2. Bookings/owner
  console.log('\n--- 2. Testing GET /api/bookings/owner ---');
  const bookRes = await makeRequest('GET', '/api/bookings/owner', authHeader);
  console.log('Status:', bookRes.status);
  console.log('Is Array?', Array.isArray(bookRes.body));
  console.log('Body keys:', typeof bookRes.body === 'object' ? Object.keys(bookRes.body) : 'primitive');
  const bookData = Array.isArray(bookRes.body) ? bookRes.body : (bookRes.body.data || bookRes.body.bookings || []);
  console.log('Bookings count:', bookData.length);
  if (bookData.length > 0) {
    console.log('Sample booking item keys:', Object.keys(bookData[0]));
    console.log('Sample booking id:', bookData[0].id, 'status:', bookData[0].status, 'farmer:', bookData[0].farmer ? bookData[0].farmer.name : 'null');
  }

  // 3. Analytics/owner
  console.log('\n--- 3. Testing GET /api/analytics/owner ---');
  const analyticsRes = await makeRequest('GET', '/api/analytics/owner', authHeader);
  console.log('Status:', analyticsRes.status);
  console.log('Analytics payload keys:', Object.keys(analyticsRes.body));
}

run().catch(console.error);
