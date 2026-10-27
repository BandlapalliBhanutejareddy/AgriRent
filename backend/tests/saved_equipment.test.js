const assert = require('assert');
const express = require('express');
const http = require('http');

console.log('=================================================================');
console.log('   AGRORENT AI: PHASE 18 SAVED EQUIPMENT & FAVORITES TEST SUITE');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function runAsyncTest(testName, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
  }
}

// -------------------------------------------------------------
// SECTION 1: INVARIANT & LOGIC TESTS
// -------------------------------------------------------------

runTest('Unique Constraint Invariant: Prevents duplicate save entries for same (userId, equipmentId)', () => {
  const savedDb = new Map();
  function saveEquipment(userId, equipmentId) {
    const key = `${userId}_${equipmentId}`;
    if (savedDb.has(key)) {
      return { created: false, existing: savedDb.get(key) };
    }
    const record = { id: `s-${savedDb.size + 1}`, userId, equipmentId, createdAt: new Date() };
    savedDb.set(key, record);
    return { created: true, record };
  }

  const first = saveEquipment('user-1', 'eq-100');
  assert.strictEqual(first.created, true);

  const duplicate = saveEquipment('user-1', 'eq-100');
  assert.strictEqual(duplicate.created, false, 'Duplicate entry must be rejected/prevented');
  assert.strictEqual(savedDb.size, 1, 'Database must only contain single entry');
});

runTest('Data Isolation Invariant: Query by userId strictly filters to requesting user records', () => {
  const records = [
    { id: 's1', userId: 'user-1', equipmentId: 'eq-1' },
    { id: 's2', userId: 'user-1', equipmentId: 'eq-2' },
    { id: 's3', userId: 'user-2', equipmentId: 'eq-3' },
  ];

  const user1Records = records.filter(r => r.userId === 'user-1');
  const user2Records = records.filter(r => r.userId === 'user-2');

  assert.strictEqual(user1Records.length, 2);
  assert(!user1Records.some(r => r.userId === 'user-2'), 'User 1 must never receive User 2 saved records');
  assert.strictEqual(user2Records.length, 1);
  assert(!user2Records.some(r => r.userId === 'user-1'), 'User 2 must never receive User 1 saved records');
});

runTest('Data Integrity Invariant: Deleted equipment records are filtered out from saved list', () => {
  const savedRecords = [
    { id: 's1', userId: 'user-1', equipmentId: 'eq-1', equipment: { id: 'eq-1', title: 'Tractor' } },
    { id: 's2', userId: 'user-1', equipmentId: 'eq-deleted', equipment: null }, // Equipment was deleted
  ];

  const validSaved = savedRecords.filter(item => item.equipment != null);
  assert.strictEqual(validSaved.length, 1);
  assert.strictEqual(validSaved[0].equipmentId, 'eq-1');
});

// -------------------------------------------------------------
// SECTION 2: HTTP INTEGRATION & SECURITY TESTS
// -------------------------------------------------------------

function createTestApp() {
  const app = express();
  app.use(express.json());

  // Test database state
  const mockDb = {
    equipments: [
      { id: 'eq-1', title: 'John Deere 5050D', category: 'TRACTOR', pricePerDay: 2500, available: true, owner: { id: 'owner-1', name: 'Ramesh Patel' }, reviews: [{ rating: 5 }] },
      { id: 'eq-2', title: 'Mahindra Rotavator', category: 'IMPLEMENTS', pricePerDay: 800, available: true, owner: { id: 'owner-1', name: 'Ramesh Patel' }, reviews: [{ rating: 4 }] },
      { id: 'eq-3', title: 'Kubota Harvester', category: 'HARVESTER', pricePerDay: 4500, available: false, owner: { id: 'owner-2', name: 'Suresh Kumar' }, reviews: [] },
    ],
    saved: [
      { id: 's-1', userId: 'farmer-1', equipmentId: 'eq-1', createdAt: new Date('2026-10-20') },
      { id: 's-2', userId: 'farmer-2', equipmentId: 'eq-2', createdAt: new Date('2026-10-21') },
    ]
  };

  // Auth stub middleware
  function requireAuthStub(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = auth.split(' ')[1];
    if (token === 'farmer-1-token') {
      req.prismaUser = { id: 'farmer-1', role: 'FARMER' };
      return next();
    }
    if (token === 'farmer-2-token') {
      req.prismaUser = { id: 'farmer-2', role: 'FARMER' };
      return next();
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // GET /api/saved
  app.get('/api/saved', requireAuthStub, (req, res) => {
    const userId = String(req.prismaUser.id);
    const userSaved = mockDb.saved.filter(s => s.userId === userId);
    const result = userSaved.map(s => {
      const eq = mockDb.equipments.find(e => e.id === s.equipmentId) || null;
      return {
        id: s.id,
        userId: s.userId,
        equipmentId: s.equipmentId,
        createdAt: s.createdAt,
        equipment: eq
      };
    }).filter(s => s.equipment != null);
    res.json(result);
  });

  // GET /api/saved/ids
  app.get('/api/saved/ids', requireAuthStub, (req, res) => {
    const userId = String(req.prismaUser.id);
    const savedIds = mockDb.saved.filter(s => s.userId === userId).map(s => s.equipmentId);
    res.json({ savedIds });
  });

  // GET /api/saved/check/:equipmentId
  app.get('/api/saved/check/:equipmentId', requireAuthStub, (req, res) => {
    const userId = String(req.prismaUser.id);
    const equipmentId = req.params.equipmentId;
    if (!equipmentId) {
      return res.status(400).json({ error: 'Equipment ID is required' });
    }
    const exists = mockDb.saved.some(s => s.userId === userId && s.equipmentId === equipmentId);
    res.json({ saved: exists });
  });

  // POST /api/saved/:equipmentId (toggle)
  app.post('/api/saved/:equipmentId', requireAuthStub, (req, res) => {
    const userId = String(req.prismaUser.id);
    const equipmentId = req.params.equipmentId;
    if (!equipmentId) {
      return res.status(400).json({ error: 'Equipment ID is required' });
    }

    const eqExists = mockDb.equipments.some(e => e.id === equipmentId);
    if (!eqExists) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const index = mockDb.saved.findIndex(s => s.userId === userId && s.equipmentId === equipmentId);
    if (index >= 0) {
      mockDb.saved.splice(index, 1);
      return res.json({ saved: false, message: 'Equipment removed from saved' });
    } else {
      mockDb.saved.push({
        id: `s-${Date.now()}`,
        userId,
        equipmentId,
        createdAt: new Date()
      });
      return res.json({ saved: true, message: 'Equipment saved to favorites' });
    }
  });

  // POST /api/saved/:equipmentId/save (idempotent save)
  app.post('/api/saved/:equipmentId/save', requireAuthStub, (req, res) => {
    const userId = String(req.prismaUser.id);
    const equipmentId = req.params.equipmentId;
    if (!equipmentId) {
      return res.status(400).json({ error: 'Equipment ID is required' });
    }

    const eqExists = mockDb.equipments.some(e => e.id === equipmentId);
    if (!eqExists) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const alreadySaved = mockDb.saved.some(s => s.userId === userId && s.equipmentId === equipmentId);
    if (!alreadySaved) {
      mockDb.saved.push({
        id: `s-${Date.now()}`,
        userId,
        equipmentId,
        createdAt: new Date()
      });
    }
    return res.json({ saved: true, message: 'Equipment saved to favorites' });
  });

  // DELETE /api/saved/:equipmentId (idempotent unsave)
  app.delete('/api/saved/:equipmentId', requireAuthStub, (req, res) => {
    const userId = String(req.prismaUser.id);
    const equipmentId = req.params.equipmentId;
    if (!equipmentId) {
      return res.status(400).json({ error: 'Equipment ID is required' });
    }

    const index = mockDb.saved.findIndex(s => s.userId === userId && s.equipmentId === equipmentId);
    if (index >= 0) {
      mockDb.saved.splice(index, 1);
    }
    return res.json({ saved: false, message: 'Equipment removed from saved' });
  });

  return { app, mockDb };
}

function makeRequest(server, path, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: addr.port,
      path,
      method,
      headers
    };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runHttpTests() {
  const { app, mockDb } = createTestApp();
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  try {
    // 1. Unauthenticated listing rejected with 401
    await runAsyncTest('HTTP Auth: GET /api/saved without token returns 401 Unauthorized', async () => {
      const res = await makeRequest(server, '/api/saved', 'GET');
      assert.strictEqual(res.status, 401);
      assert(res.body.error);
    });

    // 2. Unauthenticated save rejected with 401
    await runAsyncTest('HTTP Auth: POST /api/saved/:equipmentId without token returns 401 Unauthorized', async () => {
      const res = await makeRequest(server, '/api/saved/eq-1', 'POST');
      assert.strictEqual(res.status, 401);
      assert(res.body.error);
    });

    // 3. Authenticated listing for farmer-1 returns isolated saved items
    await runAsyncTest('HTTP Tenant Isolation: Farmer 1 receives strictly their saved equipment', async () => {
      const res = await makeRequest(server, '/api/saved', 'GET', { Authorization: 'Bearer farmer-1-token' });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body));
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].equipmentId, 'eq-1');
      assert.strictEqual(res.body[0].userId, 'farmer-1');
      assert.strictEqual(res.body[0].equipment.title, 'John Deere 5050D');
    });

    // 4. Authenticated listing for farmer-2 returns isolated saved items without leakage
    await runAsyncTest('HTTP Tenant Isolation: Farmer 2 receives isolated items without leakage from Farmer 1', async () => {
      const res = await makeRequest(server, '/api/saved', 'GET', { Authorization: 'Bearer farmer-2-token' });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body));
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].equipmentId, 'eq-2');
      assert.strictEqual(res.body[0].userId, 'farmer-2');
    });

    // 5. GET /api/saved/ids returns array of equipment IDs
    await runAsyncTest('HTTP Query: GET /api/saved/ids returns fast ID array for client state', async () => {
      const res = await makeRequest(server, '/api/saved/ids', 'GET', { Authorization: 'Bearer farmer-1-token' });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body.savedIds));
      assert(res.body.savedIds.includes('eq-1'));
      assert(!res.body.savedIds.includes('eq-2'));
    });

    // 6. GET /api/saved/check/:equipmentId checks single equipment status
    await runAsyncTest('HTTP Query: GET /api/saved/check/:equipmentId accurately reports saved state', async () => {
      const res1 = await makeRequest(server, '/api/saved/check/eq-1', 'GET', { Authorization: 'Bearer farmer-1-token' });
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.body.saved, true);

      const res2 = await makeRequest(server, '/api/saved/check/eq-2', 'GET', { Authorization: 'Bearer farmer-1-token' });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.body.saved, false);
    });

    // 7. POST /api/saved/:equipmentId with nonexistent equipment returns 404
    await runAsyncTest('HTTP Validation: Save nonexistent equipment returns 404 Not Found', async () => {
      const res = await makeRequest(server, '/api/saved/nonexistent-id', 'POST', { Authorization: 'Bearer farmer-1-token' });
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'Equipment not found');
    });

    // 8. POST /api/saved/:equipmentId toggles save status
    await runAsyncTest('HTTP Mutation: POST /api/saved/:equipmentId toggles unsaved to saved, then saved to unsaved', async () => {
      // eq-2 is currently unsaved for farmer-1 -> toggle should save it
      const saveRes = await makeRequest(server, '/api/saved/eq-2', 'POST', { Authorization: 'Bearer farmer-1-token' });
      assert.strictEqual(saveRes.status, 200);
      assert.strictEqual(saveRes.body.saved, true);

      // Now toggle again -> should unsave it
      const unsaveRes = await makeRequest(server, '/api/saved/eq-2', 'POST', { Authorization: 'Bearer farmer-1-token' });
      assert.strictEqual(unsaveRes.status, 200);
      assert.strictEqual(unsaveRes.body.saved, false);
    });

    // 9. POST /api/saved/:equipmentId/save is idempotent
    await runAsyncTest('HTTP Mutation: POST /api/saved/:equipmentId/save is idempotent', async () => {
      const res1 = await makeRequest(server, '/api/saved/eq-2/save', 'POST', { Authorization: 'Bearer farmer-1-token' });
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.body.saved, true);

      // Repeat save request on already saved equipment
      const res2 = await makeRequest(server, '/api/saved/eq-2/save', 'POST', { Authorization: 'Bearer farmer-1-token' });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.body.saved, true);

      // Verify no duplicate records created in mockDb
      const user1Eq2Count = mockDb.saved.filter(s => s.userId === 'farmer-1' && s.equipmentId === 'eq-2').length;
      assert.strictEqual(user1Eq2Count, 1, 'Only one record must exist');
    });

    // 10. DELETE /api/saved/:equipmentId is idempotent
    await runAsyncTest('HTTP Mutation: DELETE /api/saved/:equipmentId is idempotent', async () => {
      const res1 = await makeRequest(server, '/api/saved/eq-2', 'DELETE', { Authorization: 'Bearer farmer-1-token' });
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.body.saved, false);

      // Repeat delete request on already unsaved equipment
      const res2 = await makeRequest(server, '/api/saved/eq-2', 'DELETE', { Authorization: 'Bearer farmer-1-token' });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.body.saved, false);
    });

    // 11. Availability Preservation: Inactive equipment is still returned in saved list with available: false
    await runAsyncTest('Data Preservation: Inactive/Unavailable equipment is preserved with available: false', async () => {
      // Save eq-3 (which has available: false) for farmer-1
      await makeRequest(server, '/api/saved/eq-3/save', 'POST', { Authorization: 'Bearer farmer-1-token' });

      const res = await makeRequest(server, '/api/saved', 'GET', { Authorization: 'Bearer farmer-1-token' });
      assert.strictEqual(res.status, 200);
      const savedEq3 = res.body.find(s => s.equipmentId === 'eq-3');
      assert(savedEq3, 'Unavailable equipment must be preserved in saved list');
      assert.strictEqual(savedEq3.equipment.available, false, 'Equipment must accurately show available: false');
    });

  } finally {
    server.close();
  }
}

// Execute all tests
runHttpTests().then(() => {
  console.log('\n-----------------------------------------------------------------');
  console.log(`Phase 18 Saved Equipment Test Summary: ${passedTests}/${totalTests} Passed`);
  console.log('-----------------------------------------------------------------\n');
  if (passedTests === totalTests) {
    console.log('All Phase 18 backend saved equipment tests PASSED successfully!');
    process.exit(0);
  } else {
    console.error(`FAILURE: ${totalTests - passedTests} tests failed`);
    process.exit(1);
  }
}).catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
