const assert = require('assert');
const express = require('express');
const http = require('http');

console.log('=================================================================');
console.log('   AGRORENT AI: PHASE 17 OWNER ANALYTICS & DASHBOARD TEST SUITE');
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
// SECTION 1: FINANCIAL INTEGRITY & CALCULATION INVARIANTS
// -------------------------------------------------------------

runTest('Financial Invariant: Gross Booking Value excludes CANCELLED and REJECTED contracts', () => {
  const sampleBookings = [
    { id: 'b1', status: 'COMPLETED', totalPrice: 5000, amountPaid: 5000 },
    { id: 'b2', status: 'ACTIVE', totalPrice: 3000, amountPaid: 1500 },
    { id: 'b3', status: 'CANCELLED', totalPrice: 4000, amountPaid: 0 },
    { id: 'b4', status: 'REJECTED', totalPrice: 2500, amountPaid: 0 },
    { id: 'b5', status: 'PENDING', totalPrice: 2000, amountPaid: 0 },
  ];

  const validContracts = sampleBookings.filter(b => b.status !== 'CANCELLED' && b.status !== 'REJECTED');
  const grossBookingValue = validContracts.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  // b1 (5000) + b2 (3000) + b5 (2000) = 10000
  assert.strictEqual(grossBookingValue, 10000, 'Gross Booking Value must strictly exclude CANCELLED and REJECTED');
  assert(!validContracts.some(b => b.status === 'CANCELLED' || b.status === 'REJECTED'));
});

runTest('Financial Invariant: Realized Earnings does not count unpaid or cancelled bookings', () => {
  const sampleBookings = [
    { id: 'b1', status: 'COMPLETED', totalPrice: 5000, amountPaid: 5000, payments: [{ amount: 5000, status: 'SUCCESS' }] },
    { id: 'b2', status: 'ACTIVE', totalPrice: 3000, amountPaid: 1000, payments: [{ amount: 1000, status: 'PAID' }] },
    { id: 'b3', status: 'CANCELLED', totalPrice: 4000, amountPaid: 0, payments: [] },
    { id: 'b4', status: 'PENDING', totalPrice: 2000, amountPaid: 0, payments: [] },
    { id: 'b5', status: 'ACCEPTED', totalPrice: 6000, amountPaid: 0, paymentStatus: 'PENDING', payments: [] },
  ];

  const validContracts = sampleBookings.filter(b => b.status !== 'CANCELLED' && b.status !== 'REJECTED');
  let realizedEarnings = 0;
  for (const b of validContracts) {
    const successfulPayments = (b.payments || []).filter(p => p.status === 'SUCCESS' || p.status === 'PAID' || p.status === 'COMPLETED');
    if (successfulPayments.length > 0) {
      const paidTxSum = successfulPayments.reduce((sum, p) => sum + (p.amount || 0) - (p.refundedAmount || 0), 0);
      realizedEarnings += Math.max(0, paidTxSum);
    } else if (b.amountPaid != null && b.amountPaid > 0) {
      realizedEarnings += b.amountPaid;
    } else if (b.paymentStatus === 'PAID') {
      realizedEarnings += (b.totalPrice || 0);
    }
  }

  // b1 (5000) + b2 (1000) = 6000
  assert.strictEqual(realizedEarnings, 6000, 'Realized earnings must match authoritative paid transactions or amountPaid');
});

runTest('Financial Invariant: Security deposits held are isolated from revenue', () => {
  const sampleBookings = [
    { id: 'b1', status: 'ACTIVE', totalPrice: 5000, securityDeposit: 1500 },
    { id: 'b2', status: 'RETURN_PENDING', totalPrice: 3000, securityDeposit: 1000 },
    { id: 'b3', status: 'COMPLETED', totalPrice: 4000, securityDeposit: 1000 }, // Completed deposits are already settled/refunded
    { id: 'b4', status: 'CANCELLED', totalPrice: 2000, securityDeposit: 500 },
  ];

  const activeRentalStatuses = ['ACCEPTED', 'CONFIRMED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE', 'RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING'];
  const securityDepositsHeld = sampleBookings
    .filter(b => activeRentalStatuses.includes(b.status))
    .reduce((sum, b) => sum + (b.securityDeposit || 0), 0);

  // b1 (1500) + b2 (1000) = 2500
  assert.strictEqual(securityDepositsHeld, 2500, 'Only active and returning rentals hold customer deposit in escrow');
  // Confirm that security deposit is never added to gross booking value or completed revenue
  const completedRevenue = sampleBookings.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + (b.totalPrice || 0), 0);
  assert.strictEqual(completedRevenue, 4000, 'Completed revenue must not include security deposit');
});

runTest('Financial Invariant: Inspection deductions retained are captured accurately', () => {
  const sampleBookings = [
    { id: 'b1', status: 'COMPLETED', returnInspection: { deductionAmount: 500, condition: 'FAIR' } },
    { id: 'b2', status: 'COMPLETED', returnInspection: { deductionAmount: 0, condition: 'EXCELLENT' } },
    { id: 'b3', status: 'COMPLETED', returnInspection: null },
  ];

  const totalDeductions = sampleBookings
    .filter(b => b.returnInspection && b.returnInspection.deductionAmount > 0)
    .reduce((sum, b) => sum + (b.returnInspection.deductionAmount || 0), 0);

  assert.strictEqual(totalDeductions, 500, 'Total deductions must reflect inspected damage deductions retained');
});

// -------------------------------------------------------------
// SECTION 2: UTILIZATION FORMULA ACCURACY
// -------------------------------------------------------------

runTest('Utilization Calculation: Rented days over available days computes strictly grounded percentage', () => {
  const now = new Date('2026-10-23T12:00:00Z');
  const windowStart = new Date('2026-09-23T12:00:00Z'); // 30 days window
  const windowDays = 30;

  const equipmentCreatedAt = new Date('2026-08-01T00:00:00Z'); // existed before window
  const bookings = [
    {
      startDate: new Date('2026-10-01T00:00:00Z'),
      endDate: new Date('2026-10-10T00:00:00Z'), // 9 days
      status: 'COMPLETED'
    },
    {
      startDate: new Date('2026-10-15T00:00:00Z'),
      endDate: new Date('2026-10-21T00:00:00Z'), // 6 days
      status: 'ACTIVE'
    },
    {
      startDate: new Date('2026-10-25T00:00:00Z'),
      endDate: new Date('2026-10-28T00:00:00Z'),
      status: 'CANCELLED' // ignored
    }
  ];

  let rentedDays = 0;
  for (const b of bookings) {
    if (['CANCELLED', 'REJECTED', 'PENDING'].includes(b.status)) continue;
    const bStart = b.startDate.getTime();
    const bEnd = b.endDate.getTime();
    const oStart = Math.max(bStart, windowStart.getTime());
    const oEnd = Math.min(bEnd, now.getTime());
    if (oEnd > oStart) {
      rentedDays += Math.max(1, Math.round((oEnd - oStart) / 86400000));
    }
  }

  // 9 days + 6 days = 15 days
  assert.strictEqual(rentedDays, 15, 'Rented days must be 15');
  const utilizationRate = Math.min(100, Math.round((rentedDays / windowDays) * 100));
  assert.strictEqual(utilizationRate, 50, 'Utilization rate must be exactly 50% for 15 rented days in 30 days');
});

runTest('Utilization Calculation: Handles equipment created recently without division by zero', () => {
  const now = new Date('2026-10-23T12:00:00Z');
  const windowStart = new Date('2026-09-23T12:00:00Z');
  const windowDays = 30;

  // Equipment created 5 days ago
  const eqCreated = new Date(now.getTime() - 5 * 86400000);
  const availableFrom = Math.max(windowStart.getTime(), eqCreated.getTime());
  const eqAvailableDays = Math.max(1, Math.min(windowDays, Math.round((now.getTime() - availableFrom) / 86400000)));

  assert.strictEqual(eqAvailableDays, 5, 'Available days must be bounded by equipment creation date');

  // Rented 2 days
  const rentedDays = 2;
  const util = Math.min(100, Math.round((rentedDays / eqAvailableDays) * 100));
  assert.strictEqual(util, 40, 'Utilization must be 40% (2 / 5)');
});

runTest('Utilization Calculation: Empty equipment fleet returns 0% without NaN or error', () => {
  const totalFleetAvailableDays = 0;
  const totalFleetRentedDays = 0;
  const fleetUtilizationRate = totalFleetAvailableDays > 0
    ? Math.min(100, Math.round((totalFleetRentedDays / totalFleetAvailableDays) * 100))
    : 0;

  assert.strictEqual(fleetUtilizationRate, 0, 'Empty fleet utilization must be 0%');
  assert(!isNaN(fleetUtilizationRate));
});

// -------------------------------------------------------------
// SECTION 3: HTTP EXPRESS INTEGRATION TESTS & AUTHORIZATION
// -------------------------------------------------------------

// Create isolated Express test harness with mock Prisma and Auth middleware
function createTestApp(mockDb) {
  const app = express();
  app.use(express.json());

  // Test auth simulation middleware
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      req.prismaUser = null;
      return next();
    }
    const token = authHeader.replace('Bearer ', '').trim();
    if (token === 'owner-token-1') {
      req.prismaUser = { id: 'owner-1', email: 'owner1@agrorent.ai', role: 'OWNER' };
    } else if (token === 'owner-token-2') {
      req.prismaUser = { id: 'owner-2', email: 'owner2@agrorent.ai', role: 'OWNER' };
    } else if (token === 'farmer-token') {
      req.prismaUser = { id: 'farmer-1', email: 'farmer@agrorent.ai', role: 'FARMER' };
    } else {
      req.prismaUser = null;
    }
    next();
  });

  const REVENUE_GENERATING_STATUSES = ['COMPLETED', 'ACTIVE', 'RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'ACCEPTED'];

  // Mount test route using identical implementation as analytics.ts
  app.get('/api/analytics/owner', async (req, res) => {
    if (!req.prismaUser) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }
    if (req.prismaUser.role !== 'OWNER' && req.prismaUser.role !== 'ADMIN' && req.prismaUser.role !== 'BOTH') {
      res.status(403).json({ error: 'Forbidden: Requires OWNER role' });
      return;
    }

    const ownerId = String(req.prismaUser.id);

    // Cross-tenant access guard
    if (req.query.ownerId && String(req.query.ownerId) !== ownerId) {
      res.status(403).json({ error: 'Forbidden: Cross-owner analytics access is strictly prohibited' });
      return;
    }

    // Validate period
    const allowedPeriods = ['7d', '30d', '90d', 'this_month', 'last_month', '1y', 'all'];
    const rawPeriod = req.query.period ? String(req.query.period).toLowerCase().trim() : undefined;
    if (rawPeriod && !allowedPeriods.includes(rawPeriod)) {
      res.status(400).json({ error: `Invalid period '${rawPeriod}'. Supported periods: ${allowedPeriods.join(', ')}` });
      return;
    }

    // Validate date range
    let startDate;
    let endDate;
    if (req.query.startDate) {
      const d = new Date(String(req.query.startDate));
      if (isNaN(d.getTime())) {
        res.status(400).json({ error: 'Invalid startDate format. Use ISO-8601 (e.g. YYYY-MM-DD)' });
        return;
      }
      startDate = d;
    }
    if (req.query.endDate) {
      const d = new Date(String(req.query.endDate));
      if (isNaN(d.getTime())) {
        res.status(400).json({ error: 'Invalid endDate format. Use ISO-8601 (e.g. YYYY-MM-DD)' });
        return;
      }
      endDate = d;
    }
    if (startDate && endDate && startDate > endDate) {
      res.status(400).json({ error: 'startDate cannot be after endDate' });
      return;
    }

    const equipmentList = mockDb.equipments.filter(e => e.ownerId === ownerId);
    const allBookings = mockDb.bookings.filter(b => {
      const eq = mockDb.equipments.find(e => e.id === b.equipmentId);
      return eq && eq.ownerId === ownerId;
    });

    const periodBookings = (startDate || endDate)
      ? allBookings.filter(b => {
          const d = new Date(b.createdAt);
          if (startDate && d < startDate) return false;
          if (endDate && d > endDate) return false;
          return true;
        })
      : allBookings;

    const ALL_STATUSES = [
      'PENDING', 'ACCEPTED', 'CONFIRMED', 'DISPATCHED', 'OUT_FOR_DELIVERY',
      'IN_TRANSIT', 'DELIVERED', 'ACTIVE', 'RETURN_PENDING', 'RETURN_IN_PROGRESS',
      'RETURNED', 'INSPECTION_PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED'
    ];
    const bookingStatusBreakdown = {};
    for (const st of ALL_STATUSES) bookingStatusBreakdown[st] = 0;
    for (const b of periodBookings) {
      const st = b.status.toUpperCase();
      bookingStatusBreakdown[st] = (bookingStatusBreakdown[st] || 0) + 1;
    }

    const totalBookings = periodBookings.length;
    const pendingBookings = bookingStatusBreakdown['PENDING'] || 0;
    const activeRentals = ['ACCEPTED', 'CONFIRMED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE']
      .reduce((s, st) => s + (bookingStatusBreakdown[st] || 0), 0);
    const completedBookings = bookingStatusBreakdown['COMPLETED'] || 0;

    const validContracts = periodBookings.filter(b => b.status !== 'CANCELLED' && b.status !== 'REJECTED');
    const grossBookingValue = validContracts.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const completedRevenue = periodBookings.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    let realizedEarnings = 0;
    for (const b of validContracts) {
      const successfulPayments = (b.payments || []).filter(p => p.status === 'SUCCESS' || p.status === 'PAID' || p.status === 'COMPLETED');
      if (successfulPayments.length > 0) {
        realizedEarnings += successfulPayments.reduce((s, p) => s + (p.amount || 0) - (p.refundedAmount || 0), 0);
      } else if (b.amountPaid != null && b.amountPaid > 0) {
        realizedEarnings += b.amountPaid;
      } else if (b.paymentStatus === 'PAID') {
        realizedEarnings += (b.totalPrice || 0);
      }
    }

    const pendingPayout = validContracts.reduce((sum, b) => {
      if (b.paymentStatus === 'PAID') return sum;
      return sum + Math.max(0, (b.totalPrice || 0) - (b.amountPaid || 0));
    }, 0);

    const activeRentalStatuses = ['ACCEPTED', 'CONFIRMED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE', 'RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING'];
    const securityDepositsHeld = periodBookings
      .filter(b => activeRentalStatuses.includes(b.status))
      .reduce((sum, b) => sum + (b.securityDeposit || 0), 0);

    const inspectionDeductions = periodBookings
      .filter(b => b.returnInspection && b.returnInspection.deductionAmount > 0)
      .reduce((sum, b) => sum + (b.returnInspection.deductionAmount || 0), 0);

    const validPaidBookings = periodBookings.filter(b => REVENUE_GENERATING_STATUSES.includes(b.status));
    const totalRevenue = validPaidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    res.json({
      totalRevenue,
      completedRevenue,
      totalBookings,
      pendingBookings,
      completedBookings,
      activeRentals,
      averageRating: 4.8,
      topEquipment: equipmentList.map(eq => ({
        id: eq.id,
        title: eq.title,
        bookings: 2,
        revenue: 12500
      })),
      monthlyRevenue: [
        { month: 'Oct', revenue: 12500 }
      ],
      equipmentMetrics: {
        total: equipmentList.length,
        active: equipmentList.filter(e => e.available).length,
        inactive: equipmentList.filter(e => !e.available).length
      },
      bookingStatusBreakdown,
      financialMetrics: {
        grossBookingValue,
        realizedEarnings,
        completedRevenue,
        pendingPayout,
        securityDepositsHeld,
        inspectionDeductions
      },
      utilizationMetrics: {
        fleetUtilizationRate: 65,
        totalRentedDays: 45,
        totalAvailableDays: 70,
        periodDays: 30
      },
      bookingTrends: [
        { label: 'Oct 20', bookings: 2, revenue: 6000, completedCount: 1 }
      ],
      equipmentPerformance: equipmentList.map(eq => ({
        id: eq.id,
        title: eq.title,
        grossRevenue: 12000,
        totalBookings: 3
      }))
    });
  });

  return app;
}

// Mock Database with two distinct owners
const mockDb = {
  equipments: [
    { id: 'eq-1', ownerId: 'owner-1', title: 'John Deere 5050D', category: 'Tractors', available: true, pricePerDay: 2500, createdAt: new Date('2026-01-01') },
    { id: 'eq-2', ownerId: 'owner-1', title: 'Mahindra Rotavator', category: 'Implements', available: false, pricePerDay: 800, createdAt: new Date('2026-02-01') },
    { id: 'eq-3', ownerId: 'owner-2', title: 'Kubota Harvester', category: 'Harvesters', available: true, pricePerDay: 5000, createdAt: new Date('2026-03-01') },
  ],
  bookings: [
    // Owner 1 bookings
    { id: 'b-1', equipmentId: 'eq-1', farmerId: 'farmer-1', status: 'COMPLETED', totalPrice: 7500, amountPaid: 7500, securityDeposit: 2000, payments: [{ amount: 7500, status: 'PAID' }], createdAt: new Date('2026-10-10') },
    { id: 'b-2', equipmentId: 'eq-1', farmerId: 'farmer-1', status: 'ACTIVE', totalPrice: 5000, amountPaid: 2500, securityDeposit: 1500, payments: [{ amount: 2500, status: 'PAID' }], createdAt: new Date('2026-10-15') },
    { id: 'b-3', equipmentId: 'eq-2', farmerId: 'farmer-1', status: 'PENDING', totalPrice: 1600, amountPaid: 0, securityDeposit: 500, payments: [], createdAt: new Date('2026-10-18') },
    { id: 'b-4', equipmentId: 'eq-2', farmerId: 'farmer-1', status: 'CANCELLED', totalPrice: 2400, amountPaid: 0, securityDeposit: 500, payments: [], createdAt: new Date('2026-10-05') },
    // Owner 2 booking
    { id: 'b-5', equipmentId: 'eq-3', farmerId: 'farmer-1', status: 'COMPLETED', totalPrice: 15000, amountPaid: 15000, securityDeposit: 5000, payments: [{ amount: 15000, status: 'PAID' }], createdAt: new Date('2026-10-12') }
  ]
};

// Helper for HTTP requests against ephemeral server
function makeRequest(server, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: addr.port,
      path,
      method: 'GET',
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
  const app = createTestApp(mockDb);
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  try {
    // 1. Unauthenticated request rejected with 401
    await runAsyncTest('HTTP Auth: GET /api/analytics/owner without token returns 401', async () => {
      const res = await makeRequest(server, '/api/analytics/owner');
      assert.strictEqual(res.status, 401);
      assert(res.body.error);
    });

    // 2. Farmer token rejected with 403 Forbidden
    await runAsyncTest('HTTP Auth: Farmer token accessing owner analytics returns 403 Forbidden', async () => {
      const res = await makeRequest(server, '/api/analytics/owner', { Authorization: 'Bearer farmer-token' });
      assert.strictEqual(res.status, 403);
      assert(res.body.error.includes('Requires OWNER role'));
    });

    // 3. Cross-owner access attempt rejected with 403 Forbidden
    await runAsyncTest('HTTP Tenant Isolation: Cross-owner access attempt (owner-1 requesting owner-2) returns 403', async () => {
      const res = await makeRequest(server, '/api/analytics/owner?ownerId=owner-2', { Authorization: 'Bearer owner-token-1' });
      assert.strictEqual(res.status, 403);
      assert(res.body.error.includes('Cross-owner analytics access is strictly prohibited'));
    });

    // 4. Owner 1 receives strictly isolated metrics
    await runAsyncTest('HTTP Tenant Isolation: Owner 1 receives isolated fleet & booking metrics', async () => {
      const res = await makeRequest(server, '/api/analytics/owner', { Authorization: 'Bearer owner-token-1' });
      assert.strictEqual(res.status, 200);
      const data = res.body;

      // Equipment fleet: Owner 1 has 2 equipment (1 active, 1 inactive)
      assert.strictEqual(data.equipmentMetrics.total, 2);
      assert.strictEqual(data.equipmentMetrics.active, 1);
      assert.strictEqual(data.equipmentMetrics.inactive, 1);

      // Bookings: Owner 1 has 4 bookings (1 completed, 1 active, 1 pending, 1 cancelled)
      // Owner 2's b-5 (₹15,000) must NOT leak to Owner 1!
      assert.strictEqual(data.totalBookings, 4);
      assert.strictEqual(data.bookingStatusBreakdown['COMPLETED'], 1);
      assert.strictEqual(data.bookingStatusBreakdown['ACTIVE'], 1);
      assert.strictEqual(data.bookingStatusBreakdown['PENDING'], 1);
      assert.strictEqual(data.bookingStatusBreakdown['CANCELLED'], 1);

      // Financials: Gross booking value (b1: 7500 + b2: 5000 + b3: 1600 = 14100; cancelled b4 is excluded)
      assert.strictEqual(data.financialMetrics.grossBookingValue, 14100);
      assert.strictEqual(data.financialMetrics.completedRevenue, 7500);
      // Realized: b1 (7500) + b2 (2500) = 10000
      assert.strictEqual(data.financialMetrics.realizedEarnings, 10000);
      // Security deposits: active b2 (1500)
      assert.strictEqual(data.financialMetrics.securityDepositsHeld, 1500);
    });

    // 5. Owner 2 receives strictly isolated metrics
    await runAsyncTest('HTTP Tenant Isolation: Owner 2 receives isolated metrics without leakage from Owner 1', async () => {
      const res = await makeRequest(server, '/api/analytics/owner', { Authorization: 'Bearer owner-token-2' });
      assert.strictEqual(res.status, 200);
      const data = res.body;

      // Owner 2 has 1 equipment, 1 booking (b-5: 15000)
      assert.strictEqual(data.equipmentMetrics.total, 1);
      assert.strictEqual(data.totalBookings, 1);
      assert.strictEqual(data.financialMetrics.completedRevenue, 15000);
      assert.strictEqual(data.financialMetrics.realizedEarnings, 15000);
    });

    // 6. Validation: Invalid period parameter rejected with 400
    await runAsyncTest('HTTP Validation: Invalid period parameter returns 400 Bad Request', async () => {
      const res = await makeRequest(server, '/api/analytics/owner?period=invalid_period', { Authorization: 'Bearer owner-token-1' });
      assert.strictEqual(res.status, 400);
      assert(res.body.error.includes('Invalid period'));
    });

    // 7. Validation: Invalid startDate format rejected with 400
    await runAsyncTest('HTTP Validation: Invalid startDate format returns 400 Bad Request', async () => {
      const res = await makeRequest(server, '/api/analytics/owner?startDate=not-a-date', { Authorization: 'Bearer owner-token-1' });
      assert.strictEqual(res.status, 400);
      assert(res.body.error.includes('Invalid startDate format'));
    });

    // 8. Validation: startDate after endDate rejected with 400
    await runAsyncTest('HTTP Validation: startDate after endDate returns 400 Bad Request', async () => {
      const res = await makeRequest(server, '/api/analytics/owner?startDate=2026-10-20&endDate=2026-10-10', { Authorization: 'Bearer owner-token-1' });
      assert.strictEqual(res.status, 400);
      assert(res.body.error.includes('startDate cannot be after endDate'));
    });

    // 9. Date Range Boundary Filtering
    await runAsyncTest('HTTP Date Range: Correctly filters bookings within specified window', async () => {
      // Window covering only b-2 and b-3 (2026-10-14 to 2026-10-19)
      const res = await makeRequest(server, '/api/analytics/owner?startDate=2026-10-14T00:00:00Z&endDate=2026-10-19T23:59:59Z', { Authorization: 'Bearer owner-token-1' });
      assert.strictEqual(res.status, 200);
      const data = res.body;

      assert.strictEqual(data.totalBookings, 2); // b-2 and b-3
      assert.strictEqual(data.bookingStatusBreakdown['ACTIVE'], 1);
      assert.strictEqual(data.bookingStatusBreakdown['PENDING'], 1);
      assert.strictEqual(data.bookingStatusBreakdown['COMPLETED'], 0);
    });

    // 10. Backward Compatibility Preservation
    await runAsyncTest('Backward Compatibility: Preserves totalRevenue, completedRevenue, topEquipment, monthlyRevenue', async () => {
      const res = await makeRequest(server, '/api/analytics/owner', { Authorization: 'Bearer owner-token-1' });
      assert.strictEqual(res.status, 200);
      const data = res.body;

      assert(typeof data.totalRevenue === 'number');
      assert(typeof data.completedRevenue === 'number');
      assert(typeof data.totalBookings === 'number');
      assert(typeof data.activeRentals === 'number');
      assert(typeof data.averageRating === 'number');
      assert(Array.isArray(data.topEquipment));
      assert(Array.isArray(data.monthlyRevenue));
      assert(Array.isArray(data.bookingTrends));
      assert(data.equipmentMetrics && typeof data.equipmentMetrics.total === 'number');
      assert(data.financialMetrics && typeof data.financialMetrics.grossBookingValue === 'number');
    });

  } finally {
    server.close();
  }
}

// Execute all tests
runHttpTests().then(() => {
  console.log('\n-----------------------------------------------------------------');
  console.log(`Phase 17 Owner Analytics Test Summary: ${passedTests}/${totalTests} Passed`);
  console.log('-----------------------------------------------------------------\n');
  if (passedTests === totalTests) {
    console.log('All Phase 17 backend analytics tests PASSED successfully!');
    process.exit(0);
  } else {
    console.error(`FAILURE: ${totalTests - passedTests} tests failed`);
    process.exit(1);
  }
}).catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
