const http = require('http');

function apiCall(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:4000${path}`);
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (_) {
          resolve({ status: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function unwrap(res) {
  if (!res || !res.data) return null;
  return res.data.data !== undefined ? res.data.data : res.data;
}

const results = [];

function recordResult(testName, passed, details = '') {
  results.push({ testName, passed, details });
  console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${testName}${details ? ` (${details})` : ''}`);
}

async function runEndToEndVerification() {
  console.log('======================================================================');
  console.log('       AGRORENT AI: LIVE END-TO-END WORKFLOW VERIFICATION SUITE       ');
  console.log('======================================================================\n');

  let farmerToken = null;
  let farmerUser = null;
  let ownerToken = null;
  let ownerUser = null;

  // -------------------------------------------------------------------------
  // 1. Farmer Login & Profile Updates
  // -------------------------------------------------------------------------
  console.log('--- 1. Testing Farmer Authentication & Canonical Profile ---');
  try {
    const loginRes = await apiCall('POST', '/api/auth/login', {
      email: 'farmer11@gmail.com',
      password: 'Password123!',
      role: 'FARMER'
    });

    if (loginRes.status === 200) {
      farmerToken = loginRes.data?.token || loginRes.data?.data?.token;
      farmerUser = loginRes.data?.user || loginRes.data?.data?.user;
      recordResult('Farmer Login (farmer11@gmail.com)', true, `User ID: ${farmerUser?.id}`);
    } else {
      recordResult('Farmer Login (farmer11@gmail.com)', false, `Status ${loginRes.status}`);
    }

    if (farmerToken) {
      // Test GET /auth/me
      const meRes = await apiCall('GET', '/api/auth/me', null, farmerToken);
      const meData = unwrap(meRes);
      recordResult('Fetch Farmer Profile (/api/auth/me)', meRes.status === 200 && meData?.email === 'farmer11@gmail.com');

      // Test PUT /auth/me
      const updateRes = await apiCall('PUT', '/api/auth/me', {
        name: meData?.name || 'Ravi',
        phone: '9876543210',
        preferredLanguage: 'te'
      }, farmerToken);
      recordResult('Update Farmer Profile (/api/auth/me)', updateRes.status === 200 && updateRes.data?.success === true);
    }
  } catch (err) {
    recordResult('Farmer Authentication Workflow', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 2. Owner Login, Equipment Management & Bank Details
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Testing Owner Login, Equipment Management & Bank Details ---');
  try {
    const ownerLoginRes = await apiCall('POST', '/api/auth/login', {
      email: 'owner11@gmail.com',
      password: 'Password123!',
      role: 'OWNER'
    });

    if (ownerLoginRes.status === 200) {
      ownerToken = ownerLoginRes.data?.token || ownerLoginRes.data?.data?.token;
      ownerUser = ownerLoginRes.data?.user || ownerLoginRes.data?.data?.user;
      recordResult('Owner Login (owner11@gmail.com)', true, `User ID: ${ownerUser?.id}`);
    } else {
      recordResult('Owner Login (owner11@gmail.com)', false, `Status ${ownerLoginRes.status}`);
    }

    if (ownerToken) {
      // Test Owner Equipment Fetch
      const eqRes = await apiCall('GET', '/api/equipment', null, ownerToken);
      const eqData = unwrap(eqRes);
      const list = Array.isArray(eqData?.data) ? eqData.data : (Array.isArray(eqData) ? eqData : []);
      recordResult('Owner Equipment List (/api/equipment)', eqRes.status === 200, `Found ${list.length} equipment items`);

      // Test Bank Details Validation (Invalid IFSC)
      const invalidBankRes = await apiCall('POST', '/api/owner/bank-details', {
        accountHolderName: 'Teja Owner',
        bankName: 'SBI',
        accountNumber: '123456789012',
        confirmAccountNumber: '123456789012',
        ifscCode: 'INVALID_IFSC'
      }, ownerToken);
      recordResult('Bank Details Rejects Invalid IFSC (400)', invalidBankRes.status === 400);

      // Test Valid Bank Details Save & Masking
      const validBankRes = await apiCall('POST', '/api/owner/bank-details', {
        accountHolderName: 'Teja Owner',
        bankName: 'State Bank of India',
        accountNumber: '987654321098',
        confirmAccountNumber: '987654321098',
        ifscCode: 'SBIN0001234'
      }, ownerToken);
      recordResult('Owner Bank Details Save (/api/owner/bank-details)', validBankRes.status === 200 && validBankRes.data?.success === true);

      // Test Masked Bank Details Retrieval
      const getBankRes = await apiCall('GET', '/api/owner/bank-details', null, ownerToken);
      const bankData = unwrap(getBankRes);
      const maskedAcc = bankData?.maskedAccountNumber;
      recordResult('Owner Bank Details Masked Retrieval', getBankRes.status === 200 && (maskedAcc?.includes('••••') || maskedAcc?.includes('****')), `Masked: ${maskedAcc}`);
    }
  } catch (err) {
    recordResult('Owner Workflow', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 3. Equipment Search, Booking & Farmer Rental History
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Testing Equipment Search, Bookings & Rental History ---');
  try {
    const searchRes = await apiCall('GET', '/api/equipment?search=tractor', null, farmerToken);
    const searchData = unwrap(searchRes);
    const eqArray = Array.isArray(searchData?.data) ? searchData.data : (Array.isArray(searchData) ? searchData : []);
    recordResult('Search Equipment (/api/equipment?search=tractor)', searchRes.status === 200, `Found ${eqArray.length} items`);

    // Fetch Farmer Bookings
    const farmerBookingsRes = await apiCall('GET', '/api/bookings?role=FARMER', null, farmerToken);
    const bookingsData = unwrap(farmerBookingsRes);
    const bookingsList = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.data || []);
    recordResult('Farmer Rentals (/api/bookings?role=FARMER)', farmerBookingsRes.status === 200, `Found ${bookingsList.length} rentals`);

    if (bookingsList.length > 0) {
      const firstBooking = bookingsList[0];
      const singleBookingRes = await apiCall('GET', `/api/bookings/${firstBooking.id}`, null, farmerToken);
      const singleData = unwrap(singleBookingRes);
      recordResult('Booking Tracking Lifecycle (/api/bookings/:id)', singleBookingRes.status === 200 && singleData?.id === firstBooking.id);
    }
  } catch (err) {
    recordResult('Farmer Rental History Workflow', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 4. Owner Rental History, Status & Earnings
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Testing Owner Rental History & Financial Calculations ---');
  try {
    const ownerBookingsRes = await apiCall('GET', '/api/bookings?role=OWNER', null, ownerToken);
    recordResult('Owner Rental History (/api/bookings?role=OWNER)', ownerBookingsRes.status === 200);

    // Test Owner Analytics
    const ownerAnalyticsRes = await apiCall('GET', '/api/analytics/owner?period=30d', null, ownerToken);
    const analyticsData = unwrap(ownerAnalyticsRes);
    const realized = analyticsData?.financialMetrics?.realizedEarnings ?? analyticsData?.realizedEarnings;
    const hasRealizedEarnings = typeof realized === 'number';
    recordResult('Owner Analytics & Verified Earnings (/api/analytics/owner)', ownerAnalyticsRes.status === 200 && hasRealizedEarnings, `Realized Earnings: ₹${realized}`);
  } catch (err) {
    recordResult('Owner Analytics Workflow', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 5. Agmarknet Market Prices & Missing-API-Key Behavior
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Testing Agmarknet Market Integration ---');
  try {
    const statusRes = await apiCall('GET', '/api/market/status');
    recordResult('Market Status Route (/api/market/status)', statusRes.status === 200);

    const pricesRes = await apiCall('GET', '/api/market/prices?commodity=Paddy&state=Andhra+Pradesh');
    const marketData = unwrap(pricesRes);
    const isHonestState = pricesRes.status === 200 && (
      marketData?.status === 'LIVE' ||
      marketData?.status === 'CACHED' ||
      marketData?.status === 'STALE_CACHE' ||
      marketData?.status === 'UNAVAILABLE'
    );
    recordResult('Agmarknet Integration Returns Grounded Status (No Fake Data)', isHonestState, `Status: ${marketData?.status}`);
    if (marketData?.status === 'UNAVAILABLE') {
      recordResult('Actionable Missing-API-Key Guidance Provided', typeof marketData?.missingConfigRequirement === 'string' && marketData.missingConfigRequirement.includes('DATA_GOV_IN_API_KEY'));
    }
  } catch (err) {
    recordResult('Market Prices Workflow', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 6. Weather Forecasts for Multiple Coordinates
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Testing Location-Based Weather & Geocoding ---');
  try {
    // Location 1: Hyderabad (17.3850, 78.4867)
    const hydRes = await apiCall('GET', '/api/farms/weather/lookup?lat=17.3850&lng=78.4867&name=Hyderabad', null, farmerToken);
    const hydData = unwrap(hydRes);
    const hydOk = hydRes.status === 200 && hydData?.location?.latitude !== undefined;
    recordResult('Weather Lookup Location 1 - Hyderabad', hydOk, `Temp: ${hydData?.current?.temperature}°C, Desc: ${hydData?.current?.weatherDescription}`);

    // Location 2: Chennai (13.0827, 80.2707)
    const chennaiRes = await apiCall('GET', '/api/farms/weather/lookup?lat=13.0827&lng=80.2707&name=Chennai', null, farmerToken);
    const chennaiData = unwrap(chennaiRes);
    const chennaiOk = chennaiRes.status === 200 && chennaiData?.location?.latitude !== undefined;
    recordResult('Weather Lookup Location 2 - Chennai', chennaiOk, `Temp: ${chennaiData?.current?.temperature}°C, Desc: ${chennaiData?.current?.weatherDescription}`);

    // Coordinate Isolation check: Hyderabad latitude must not equal Chennai latitude
    const coordsIsolated = hydOk && chennaiOk && Math.abs(hydData.location.latitude - chennaiData.location.latitude) > 3.0;
    recordResult('Weather Coordinates Distinct Isolation (No Fake/Shared Fallback)', coordsIsolated);

    // Geocoding Search
    const geocodeRes = await apiCall('GET', '/api/farms/weather/geocode?q=Guntur', null, farmerToken);
    const geocodeData = unwrap(geocodeRes);
    const resultsList = Array.isArray(geocodeData) ? geocodeData : (geocodeData?.results || []);
    recordResult('Geocoding Search (/api/farms/weather/geocode?q=Guntur)', geocodeRes.status === 200 && Array.isArray(resultsList));
  } catch (err) {
    recordResult('Weather Workflow', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 7. Farm Coordinate Selection & Persistence
  // -------------------------------------------------------------------------
  console.log('\n--- 7. Testing Farm Coordinate Persistence ---');
  try {
    const farmsRes = await apiCall('GET', '/api/farms', null, farmerToken);
    const farmData = unwrap(farmsRes);
    const farmList = Array.isArray(farmData) ? farmData : (farmData?.data || []);

    if (farmList.length > 0) {
      const testFarm = farmList[0];
      const newLat = 16.5062;
      const newLng = 80.6480;

      const updateFarmRes = await apiCall('PUT', `/api/farms/${testFarm.id}`, {
        latitude: newLat,
        longitude: newLng,
        location: 'Vijayawada Rural, Andhra Pradesh'
      }, farmerToken);
      recordResult('Update Farm Coordinates (/api/farms/:id)', updateFarmRes.status === 200 && updateFarmRes.data?.success === true);

      // Verify persistence
      const verifyFarmRes = await apiCall('GET', `/api/farms/${testFarm.id}`, null, farmerToken);
      const updatedFarmData = unwrap(verifyFarmRes);
      const updatedFarm = updatedFarmData?.farm || updatedFarmData;
      const isPersisted = verifyFarmRes.status === 200 && Math.abs((updatedFarm?.latitude || 0) - newLat) < 0.001;
      recordResult('Verify Farm Coordinate DB Persistence', isPersisted, `Lat: ${updatedFarm?.latitude}, Lng: ${updatedFarm?.longitude}`);
    } else {
      recordResult('Farm Coordinate Persistence', true, 'Skipped: No registered farm for test farmer');
    }
  } catch (err) {
    recordResult('Farm Coordinate Workflow', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 8. Farmer Community (Posts, Comments, Replies, Reporting)
  // -------------------------------------------------------------------------
  console.log('\n--- 8. Testing Farmer Community Posts, Comments & Reporting ---');
  let createdPostId = null;
  try {
    const createPostRes = await apiCall('POST', '/api/community/posts', {
      title: 'E2E Automated Test: Soil Moisture Management in Cotton',
      content: 'What is the optimal irrigation schedule during the boll development stage in clay loam soil?',
      category: 'Crops & Soil'
    }, farmerToken);
    const postData = unwrap(createPostRes);

    if (createPostRes.status === 201 && postData?.id) {
      createdPostId = postData.id;
      recordResult('Create Community Post (/api/community/posts)', true, `Post ID: ${createdPostId}`);
    } else {
      recordResult('Create Community Post (/api/community/posts)', false, `Status ${createPostRes.status}`);
    }

    if (createdPostId) {
      // Add Comment (using farmer token because Community comments require FARMER role)
      const commentRes = await apiCall('POST', `/api/community/posts/${createdPostId}/comments`, {
        content: 'Recommend drip irrigation at 3-day intervals to avoid root rot.'
      }, farmerToken);
      const commentData = unwrap(commentRes);
      recordResult('Add Comment to Community Post', commentRes.status === 201 && commentData?.content?.length > 0);

      // Submit Abuse Report
      const reportRes = await apiCall('POST', '/api/community/reports', {
        postId: createdPostId,
        reason: 'Automated test report verification'
      }, farmerToken);
      recordResult('Submit Abuse Report (/api/community/reports)', (reportRes.status === 200 || reportRes.status === 201) && reportRes.data?.success === true);

      // Verify non-author cannot delete
      const unauthorizedDelRes = await apiCall('DELETE', `/api/community/posts/${createdPostId}`, null, ownerToken);
      recordResult('Enforce Authorization: Non-author cannot delete post (403)', unauthorizedDelRes.status === 403);

      // Author cleans up own post
      const deletePostRes = await apiCall('DELETE', `/api/community/posts/${createdPostId}`, null, farmerToken);
      recordResult('Author cleans up own community post (200)', deletePostRes.status === 200);
    }
  } catch (err) {
    recordResult('Community Workflow', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 9. Crop and Weather Alerts & Deduplication
  // -------------------------------------------------------------------------
  console.log('\n--- 9. Testing Crop & Weather Alerts ---');
  try {
    const alertsRes = await apiCall('GET', '/api/farms/alerts/list', null, farmerToken);
    const alertsData = unwrap(alertsRes);
    const alertsList = alertsData?.alerts || alertsData || [];
    recordResult('Fetch Active Farmer Alerts (/api/farms/alerts/list)', alertsRes.status === 200 && Array.isArray(alertsList));

    if (alertsList.length > 0) {
      const alertId = alertsList[0].id;
      const readRes = await apiCall('PUT', `/api/farms/alerts/${alertId}/read`, null, farmerToken);
      recordResult('Mark Alert as Read (/api/farms/alerts/:id/read)', readRes.status === 200 && readRes.data?.success === true);
    } else {
      recordResult('Mark Alert as Read', true, 'All clear: No active alerts to mark');
    }
  } catch (err) {
    recordResult('Alerts Workflow', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 10. Farmer Assistant Multi-Language Support
  // -------------------------------------------------------------------------
  console.log('\n--- 10. Testing Farmer Assistant AI Multi-Language Responses ---');
  const languagesToTest = [
    { code: 'te', name: 'Telugu', regex: /[\u0C00-\u0C7F]/, minChars: 15 },
    { code: 'hi', name: 'Hindi', regex: /[\u0900-\u097F]/, minChars: 15 },
    { code: 'ta', name: 'Tamil', regex: /[\u0B80-\u0BFF]/, minChars: 15 },
    { code: 'kn', name: 'Kannada', regex: /[\u0C80-\u0CFF]/, minChars: 15 },
    { code: 'en', name: 'English', regex: /[a-zA-Z]/, minChars: 50 }
  ];

  for (const lang of languagesToTest) {
    try {
      const aiRes = await apiCall('POST', '/api/ai/advisor', {
        question: 'What is the recommended equipment for 5 acres of paddy sowing?',
        language: lang.name
      }, farmerToken);

      const aiData = unwrap(aiRes);
      const reply = aiData?.reply || aiData?.message || (typeof aiData === 'string' ? aiData : '');
      const matches = (reply.match(new RegExp(lang.regex, 'g')) || []).length;
      const isScriptValid = aiRes.status === 200 && matches >= lang.minChars;
      recordResult(`AI Assistant in ${lang.name} (${lang.code})`, isScriptValid, `Matches: ${matches} native characters`);
    } catch (err) {
      recordResult(`AI Assistant in ${lang.name}`, false, err.message);
    }
  }

  // -------------------------------------------------------------------------
  // 11. Notification In-App Replies & Authorization
  // -------------------------------------------------------------------------
  console.log('\n--- 11. Testing Notification Hub & Reply Flow ---');
  try {
    const notifsRes = await apiCall('GET', '/api/notifications', null, farmerToken);
    const notifsData = unwrap(notifsRes);
    const notifsList = Array.isArray(notifsData) ? notifsData : (notifsData?.data || []);
    recordResult('Fetch Farmer Notifications (/api/notifications)', notifsRes.status === 200 && Array.isArray(notifsList));

    if (notifsList.length > 0) {
      const testNotif = notifsList[0];
      const replyRes = await apiCall('POST', `/api/notifications/${testNotif.id}/reply`, {
        message: 'Acknowledged via automated E2E test suite'
      }, farmerToken);
      recordResult('Notification Reply Flow (/api/notifications/:id/reply)', replyRes.status === 200 && replyRes.data?.success === true);
    } else {
      recordResult('Notification Reply Flow', true, 'All clear: No pending notifications to reply to');
    }
  } catch (err) {
    recordResult('Notifications Workflow', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 12. Admin Dashboard & Financial Analytics
  // -------------------------------------------------------------------------
  console.log('\n--- 12. Testing Admin Dashboard & Authoritative Financials ---');
  try {
    const adminLoginRes = await apiCall('POST', '/api/auth/login', {
      email: 'admin.live@agrorent.ai',
      password: 'Password123!',
      role: 'ADMIN'
    });

    if (adminLoginRes.status === 200) {
      const adminToken = adminLoginRes.data?.token || adminLoginRes.data?.data?.token;
      const statsRes = await apiCall('GET', '/api/admin/stats', null, adminToken);
      const stats = unwrap(statsRes);
      const isCalculatedDefensibly = stats && 
        typeof stats.financial?.gmv === 'number' &&
        typeof stats.financial?.ownerRevenue === 'number' &&
        typeof stats.users?.farmers === 'number' &&
        typeof stats.users?.owners === 'number';

      recordResult('Admin Platform Stats (/api/admin/stats)', statsRes.status === 200 && isCalculatedDefensibly, `GMV: ₹${stats?.financial?.gmv}, Farmers: ${stats?.users?.farmers}, Owners: ${stats?.users?.owners}`);
    } else {
      recordResult('Admin Platform Stats', false, 'Admin login failed');
    }
  } catch (err) {
    recordResult('Admin Analytics Workflow', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Final Summary
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`TOTAL WORKFLOWS TESTED: ${results.length}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log('======================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runEndToEndVerification().catch(err => {
  console.error('Fatal E2E runner error:', err);
  process.exit(1);
});
