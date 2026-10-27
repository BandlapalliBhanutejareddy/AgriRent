const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function run() {
  console.log('===============================================================');
  console.log('   AGRORENT AI: EQUIPMENT NAVIGATION & CALL PRIVACY TESTS     ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // Helper to extract items and pagination regardless of response wrapper
  function extractData(resData) {
    if (resData.data && Array.isArray(resData.data.data)) {
      return { items: resData.data.data, pagination: resData.data.pagination };
    }
    if (Array.isArray(resData.data)) {
      return { items: resData.data, pagination: resData.pagination };
    }
    return { items: [], pagination: {} };
  }

  // 1. Health check
  try {
    const health = await axios.get(`${API_BASE}/health`);
    assert('Backend Health Endpoint is UP', health.status === 200);
  } catch (e) {
    assert('Backend Health Endpoint is UP', false, e.message);
  }

  // 2. Test All Equipment (No category filter)
  let allCount = 0;
  try {
    const res = await axios.get(`${API_BASE}/equipment?page=1&limit=20`);
    const { items, pagination } = extractData(res.data);
    assert('General Marketplace returns equipment', items.length > 0, `Returned: ${items.length}`);
    allCount = pagination?.total || items.length;
    assert('Total equipment count is positive', allCount > 0, `Total: ${allCount}`);
  } catch (e) {
    assert('General Marketplace returns equipment', false, e.message);
  }

  // 3. Test Category: TRACTOR
  try {
    const res = await axios.get(`${API_BASE}/equipment?category=TRACTOR&page=1&limit=20`);
    const { items } = extractData(res.data);
    assert('TRACTOR category returns results', items.length > 0, `Count: ${items.length}`);
    const allMatch = items.every(i => ['TRACTOR', 'TRACTORS'].includes(i.category.toUpperCase()));
    assert('All returned items match TRACTOR canonical group', allMatch);
  } catch (e) {
    assert('TRACTOR category query', false, e.message);
  }

  // 4. Test Category: HARVESTER
  try {
    const res = await axios.get(`${API_BASE}/equipment?category=HARVESTER&page=1&limit=20`);
    const { items } = extractData(res.data);
    assert('HARVESTER category returns results', items.length > 0, `Count: ${items.length}`);
    const allMatch = items.every(i => ['HARVESTER', 'HARVESTERS'].includes(i.category.toUpperCase()));
    assert('All returned items match HARVESTER canonical group', allMatch);
  } catch (e) {
    assert('HARVESTER category query', false, e.message);
  }

  // 5. Test Category: POWER_TILLERS
  try {
    const res = await axios.get(`${API_BASE}/equipment?category=POWER_TILLERS&page=1&limit=20`);
    const { items } = extractData(res.data);
    const allMatch = items.every(i => ['POWER_TILLERS', 'POWER_TILLER', 'TILLER', 'POWER TILLER'].includes(i.category.toUpperCase()));
    assert('POWER_TILLERS returns valid matching equipment or empty without fallbacks', allMatch);
  } catch (e) {
    assert('POWER_TILLERS category query', false, e.message);
  }

  // 6. Test Category: IRRIGATION / PUMP
  try {
    const res = await axios.get(`${API_BASE}/equipment?category=IRRIGATION&page=1&limit=20`);
    const { items } = extractData(res.data);
    const allMatch = items.every(i => ['IRRIGATION', 'PUMP', 'PUMPS', 'WATER PUMP'].includes(i.category.toUpperCase()));
    assert('IRRIGATION category returns only irrigation/pump equipment', allMatch);
  } catch (e) {
    assert('IRRIGATION category query', false, e.message);
  }

  // 7. Test Empty Category Behavior: Non-existent category MUST return 0 items and NEVER fallback to all
  try {
    const res = await axios.get(`${API_BASE}/equipment?category=NON_EXISTENT_CATEGORY_XYZ&page=1&limit=20`);
    const { items } = extractData(res.data);
    assert('Empty category returns empty array without fallback', items.length === 0, `Returned: ${items.length}`);
  } catch (e) {
    assert('Empty category query', false, e.message);
  }

  // 8. Test Search within Category
  try {
    const res = await axios.get(`${API_BASE}/equipment?category=TRACTOR&search=Mahindra&page=1&limit=20`);
    assert('Search within category returns valid response', res.status === 200);
  } catch (e) {
    assert('Search within category', false, e.message);
  }

  // 9. Test Sorting with Category
  try {
    const res = await axios.get(`${API_BASE}/equipment?category=TRACTOR&sort=lowest_price&page=1&limit=20`);
    const { items } = extractData(res.data);
    if (items.length >= 2) {
      assert('Sorting by lowest_price preserves price order', items[0].pricePerDay <= items[1].pricePerDay);
    } else {
      assert('Sorting with category returns valid response', res.status === 200);
    }
  } catch (e) {
    assert('Sorting with category', false, e.message);
  }

  // 10. Privacy & Private Calling Tests
  // 10a. Unauthenticated Call Request rejected
  try {
    await axios.post(`${API_BASE}/calls/initiate`, { equipmentId: 'any-id' });
    assert('Unauthenticated call initiation is rejected', false, 'Expected 401');
  } catch (e) {
    assert('Unauthenticated call initiation is rejected (401)', e.response?.status === 401);
  }

  // 10b. Authenticate Farmer and Owner
  let farmerToken = null;
  let ownerToken = null;
  try {
    const fRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'farmer.b.1788354195151@agrorent.ai',
      password: 'Password123!',
      role: 'FARMER',
    });
    farmerToken = fRes.data.token || fRes.data.data?.token;
    assert('Farmer login successful', Boolean(farmerToken));
  } catch (e) {
    assert('Farmer login successful', false, e.message);
  }

  try {
    const oRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'web_owner_1787209581213@test.com',
      password: 'Password123!',
      role: 'OWNER',
    });
    ownerToken = oRes.data.token || oRes.data.data?.token;
    assert('Owner login successful', Boolean(ownerToken));
  } catch (e) {
    assert('Owner login successful', false, e.message);
  }

  // 10c. Missing equipmentId and bookingId returns 400
  if (farmerToken) {
    try {
      await axios.post(
        `${API_BASE}/calls/initiate`,
        {},
        { headers: { Authorization: `Bearer ${farmerToken}` } }
      );
      assert('Empty call body rejected', false, 'Expected 400');
    } catch (e) {
      assert('Empty call payload rejected (400)', e.response?.status === 400);
    }
  }

  // 10d. Test Private Calling on Real Equipment
  try {
    const eqListRes = await axios.get(`${API_BASE}/equipment?page=1&limit=5`);
    const { items: eqList } = extractData(eqListRes.data);
    if (eqList.length > 0 && farmerToken) {
      const eq = eqList[0];
      const callRes = await axios.post(
        `${API_BASE}/calls/initiate`,
        { equipmentId: eq.id },
        { headers: { Authorization: `Bearer ${farmerToken}` } }
      );
      assert('Private call bridge endpoint returns 200', callRes.status === 200);
      const callData = callRes.data.data;
      assert('Call response contains targetRole OWNER', callData.targetRole === 'OWNER');
      assert('Call response contains privacyMode ANONYMOUS_RELAY', callData.privacyMode === 'ANONYMOUS_RELAY');
      assert('Call response contains relayAvailable boolean', typeof callData.relayAvailable === 'boolean');
      
      // CRITICAL PRIVACY CHECKS: No raw phone number leaked
      const rawResponseStr = JSON.stringify(callRes.data);
      const phoneRegex = /[6-9]\d{9}/;
      const phoneLeaked = phoneRegex.test(rawResponseStr.replace(callData.relayNumber || 'NONE', ''));
      assert('Privacy preservation: Recipient phone number is NOT in API response', !phoneLeaked);
    }
  } catch (e) {
    assert('Private call bridge test', false, e.response?.data?.message || e.message);
  }

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
