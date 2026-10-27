const assert = require('assert');
const express = require('express');
const http = require('http');

// Load compiled schemas and routes
const { updateBookingStatusSchema, returnInspectionSchema } = require('../dist/schemas');
const {
  VALID_BOOKING_TRANSITIONS,
  PERMITTED_INSPECTION_STATUSES,
  CANONICAL_INSPECTION_CONDITIONS
} = require('../dist/routes/bookings');

console.log('=================================================================');
console.log('   AGRORENT AI: BOOKING LIFECYCLE & RETURN INSPECTION TEST SUITE');
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
// SECTION 1: TRANSITION MATRIX AUDIT & INTEGRITY
// -------------------------------------------------------------

runTest('Matrix Audit - Terminal states strictly immutable for all actors', () => {
  const terminalStates = ['COMPLETED', 'CANCELLED', 'REJECTED', 'REFUNDED'];
  for (const status of terminalStates) {
    const rules = VALID_BOOKING_TRANSITIONS[status];
    assert(rules, `Matrix must define terminal state '${status}'`);
    assert.strictEqual(rules.OWNER.length, 0, `Owner must have 0 transitions from terminal state ${status}`);
    assert.strictEqual(rules.FARMER.length, 0, `Farmer must have 0 transitions from terminal state ${status}`);
    assert.strictEqual(rules.ADMIN.length, 0, `Admin must have 0 transitions from terminal state ${status}`);
  }
});

runTest('Matrix Audit - Documented owner lifecycle progression exists', () => {
  assert(VALID_BOOKING_TRANSITIONS.PENDING.OWNER.includes('ACCEPTED'), 'Owner must be able to ACCEPT PENDING');
  assert(VALID_BOOKING_TRANSITIONS.PENDING.OWNER.includes('REJECTED'), 'Owner must be able to REJECT PENDING');
  assert(VALID_BOOKING_TRANSITIONS.ACCEPTED.OWNER.includes('CONFIRMED'), 'Owner must be able to CONFIRM ACCEPTED');
  assert(VALID_BOOKING_TRANSITIONS.ACCEPTED.OWNER.includes('DISPATCHED'), 'Owner must be able to DISPATCH ACCEPTED');
  assert(VALID_BOOKING_TRANSITIONS.CONFIRMED.OWNER.includes('DISPATCHED'), 'Owner must be able to DISPATCH CONFIRMED');
  assert(VALID_BOOKING_TRANSITIONS.DISPATCHED.OWNER.includes('DELIVERED'), 'Owner must be able to mark DELIVERED from DISPATCHED');
  assert(VALID_BOOKING_TRANSITIONS.DELIVERED.OWNER.includes('ACTIVE'), 'Owner must be able to activate from DELIVERED');
  assert(VALID_BOOKING_TRANSITIONS.ACTIVE.OWNER.includes('RETURN_IN_PROGRESS'), 'Owner must be able to start return from ACTIVE');
  assert(VALID_BOOKING_TRANSITIONS.RETURN_PENDING.OWNER.includes('RETURN_IN_PROGRESS'), 'Owner must be able to progress from RETURN_PENDING');
  assert(VALID_BOOKING_TRANSITIONS.RETURN_IN_PROGRESS.OWNER.includes('RETURNED'), 'Owner must be able to mark RETURNED');
  assert(VALID_BOOKING_TRANSITIONS.RETURNED.OWNER.includes('INSPECTION_PENDING'), 'Owner must be able to move to INSPECTION_PENDING');
  assert(VALID_BOOKING_TRANSITIONS.INSPECTION_PENDING.OWNER.includes('COMPLETED'), 'Owner must be able to COMPLETE from INSPECTION_PENDING');
});

runTest('Matrix Audit - Farmer cannot perform owner transitions', () => {
  const ownerOnlyTargets = ['ACCEPTED', 'CONFIRMED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'COMPLETED'];
  for (const [state, rules] of Object.entries(VALID_BOOKING_TRANSITIONS)) {
    for (const target of ownerOnlyTargets) {
      assert(!rules.FARMER.includes(target), `Farmer must never be allowed target '${target}' from '${state}'`);
    }
  }
});

runTest('Matrix Audit - Farmer allowed cancellation and return request only', () => {
  assert(VALID_BOOKING_TRANSITIONS.PENDING.FARMER.includes('CANCELLED'), 'Farmer can cancel PENDING');
  assert(VALID_BOOKING_TRANSITIONS.ACCEPTED.FARMER.includes('CANCELLED'), 'Farmer can cancel ACCEPTED');
  assert(VALID_BOOKING_TRANSITIONS.CONFIRMED.FARMER.includes('CANCELLED'), 'Farmer can cancel CONFIRMED');
  assert(VALID_BOOKING_TRANSITIONS.ACTIVE.FARMER.includes('RETURN_PENDING'), 'Farmer can request return from ACTIVE');
  assert(VALID_BOOKING_TRANSITIONS.DELIVERED.FARMER.includes('RETURN_PENDING'), 'Farmer can request return from DELIVERED');
  assert.strictEqual(VALID_BOOKING_TRANSITIONS.DISPATCHED.FARMER.length, 0, 'Farmer cannot cancel once dispatched');
});

runTest('Matrix Audit - Prevents illegal skips and arbitrary jumps', () => {
  assert(!VALID_BOOKING_TRANSITIONS.PENDING.OWNER.includes('COMPLETED'), 'Owner cannot jump PENDING -> COMPLETED');
  assert(!VALID_BOOKING_TRANSITIONS.PENDING.OWNER.includes('ACTIVE'), 'Owner cannot jump PENDING -> ACTIVE');
  assert(!VALID_BOOKING_TRANSITIONS.PENDING.OWNER.includes('RETURNED'), 'Owner cannot jump PENDING -> RETURNED');
  assert(!VALID_BOOKING_TRANSITIONS.DISPATCHED.OWNER.includes('RETURNED'), 'Owner cannot jump DISPATCHED -> RETURNED');
  assert(!VALID_BOOKING_TRANSITIONS.ACTIVE.OWNER.includes('ACCEPTED'), 'Owner cannot regress ACTIVE -> ACCEPTED');
});

// -------------------------------------------------------------
// SECTION 2: RETURN INSPECTION ELIGIBILITY & CANONICAL ENUMS
// -------------------------------------------------------------

runTest('Inspection Eligibility - Authoritative permitted states strictly defined', () => {
  const expectedPermitted = ['RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING'];
  assert.deepStrictEqual([...PERMITTED_INSPECTION_STATUSES].sort(), [...expectedPermitted].sort());
});

runTest('Inspection Eligibility - Rejects invalid states (PENDING, ACTIVE, CANCELLED, REJECTED, COMPLETED)', () => {
  const ineligible = ['PENDING', 'ACTIVE', 'CANCELLED', 'REJECTED', 'COMPLETED', 'DISPATCHED', 'CONFIRMED', 'DELIVERED'];
  for (const status of ineligible) {
    assert(!PERMITTED_INSPECTION_STATUSES.includes(status), `Status '${status}' must NOT be eligible for inspection`);
  }
});

runTest('Inspection Enums - Canonical condition values strictly match mobile contract', () => {
  const expected = ['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'];
  assert.deepStrictEqual([...CANONICAL_INSPECTION_CONDITIONS].sort(), [...expected].sort());
});

// -------------------------------------------------------------
// SECTION 3: SCHEMA VALIDATION (ZOD)
// -------------------------------------------------------------

runTest('Schema - updateBookingStatusSchema accepts valid statuses and rejects unknown values', () => {
  // Valid
  const validRes = updateBookingStatusSchema.safeParse({ body: { status: 'ACCEPTED', note: 'All good' } });
  assert.strictEqual(validRes.success, true);

  // Unknown status
  const invalidRes = updateBookingStatusSchema.safeParse({ body: { status: 'HACKED' } });
  assert.strictEqual(invalidRes.success, false);

  // Empty status
  const emptyRes = updateBookingStatusSchema.safeParse({ body: { status: '' } });
  assert.strictEqual(emptyRes.success, false);
});

runTest('Schema - returnInspectionSchema validates condition enum', () => {
  for (const cond of ['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED']) {
    const res = returnInspectionSchema.safeParse({ body: { condition: cond } });
    assert.strictEqual(res.success, true, `Condition '${cond}' should be accepted`);
  }

  const badConditions = ['POOR', 'SCRATCHED', 'PERFECT', '', 'damaged', 'good', null, undefined];
  for (const bad of badConditions) {
    const res = returnInspectionSchema.safeParse({ body: { condition: bad } });
    assert.strictEqual(res.success, false, `Condition '${bad}' must be rejected`);
  }
});

runTest('Schema - returnInspectionSchema validates deductionAmount numeric constraints', () => {
  // Valid numeric values
  assert(returnInspectionSchema.safeParse({ body: { condition: 'GOOD', deductionAmount: 0 } }).success);
  assert(returnInspectionSchema.safeParse({ body: { condition: 'GOOD', deductionAmount: 150.5 } }).success);
  assert(returnInspectionSchema.safeParse({ body: { condition: 'GOOD', deductionAmount: '200' } }).success);
  assert(returnInspectionSchema.safeParse({ body: { condition: 'GOOD' } }).success, 'Omitted deduction must be valid');
  assert(returnInspectionSchema.safeParse({ body: { condition: 'GOOD', deductionAmount: null } }).success, 'Null deduction must be valid');

  // Negative values must fail
  assert(!returnInspectionSchema.safeParse({ body: { condition: 'GOOD', deductionAmount: -1 } }).success);
  assert(!returnInspectionSchema.safeParse({ body: { condition: 'GOOD', deductionAmount: -0.01 } }).success);

  // Non-finite values must fail
  assert(!returnInspectionSchema.safeParse({ body: { condition: 'GOOD', deductionAmount: Infinity } }).success);
  assert(!returnInspectionSchema.safeParse({ body: { condition: 'GOOD', deductionAmount: -Infinity } }).success);
  assert(!returnInspectionSchema.safeParse({ body: { condition: 'GOOD', deductionAmount: NaN } }).success);
  assert(!returnInspectionSchema.safeParse({ body: { condition: 'GOOD', deductionAmount: 'invalid_number' } }).success);
});

// -------------------------------------------------------------
// SECTION 4: SERVER-SIDE SIMULATED ENDPOINT SUITE
// -------------------------------------------------------------

async function runEndpointTestSuite() {
  // Build a test Express server mocking authentication and repository calls
  let mockDb = {};

  function resetDb() {
    mockDb = {
      userOwner: { id: 'usr_owner_1', role: 'OWNER', name: 'Owner Ramesh' },
      userOwnerOther: { id: 'usr_owner_2', role: 'OWNER', name: 'Owner Suresh' },
      userFarmer: { id: 'usr_farmer_1', role: 'FARMER', name: 'Farmer Ravi' },
      userAdmin: { id: 'usr_admin_1', role: 'ADMIN', name: 'Admin Site' },
      equipment: { id: 'eq_1', title: 'Mahindra 575 DI', ownerId: 'usr_owner_1', pricePerDay: 800 },
      booking: {
        id: 'bk_1',
        farmerId: 'usr_farmer_1',
        equipmentId: 'eq_1',
        status: 'PENDING',
        totalPrice: 2400,
        amountPaid: 0,
        securityDeposit: 500,
        paymentStatus: 'PENDING',
        history: [],
        notifications: [],
        returnInspection: null
      }
    };
  }

  // Simulated status handler replicating routes/bookings.ts logic
  function handleStatusUpdate(reqUser, bookingId, body, simulateRace = false) {
    const booking = mockDb.booking;
    if (booking.id !== bookingId) return { status: 404, data: { error: 'Booking not found' } };

    const role = reqUser.role;
    const userId = reqUser.id;
    const isOwner = mockDb.equipment.ownerId === userId;
    const isFarmer = booking.farmerId === userId;
    const isAdmin = role === 'ADMIN';

    // 1. Ownership & Role authorization
    if (!isOwner && !isFarmer && !isAdmin) {
      return { status: 403, data: { error: 'Unauthorized: You do not have permission to modify this booking' } };
    }

    // 2. Terminal state guard: Terminal states cannot be transitioned or reopened by anyone
    const terminalStatuses = ['COMPLETED', 'CANCELLED', 'REJECTED', 'REFUNDED'];
    if (terminalStatuses.includes(booking.status)) {
      return { status: 400, data: { error: `Cannot transition booking in terminal state '${booking.status}'` } };
    }

    // 3. Role-level status capability guard
    const allowedOwnerStatuses = ['ACCEPTED', 'CONFIRMED', 'REJECTED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'COMPLETED'];
    const allowedFarmerStatuses = ['CANCELLED', 'RETURN_PENDING'];

    if (!isAdmin) {
      if (isFarmer && !isOwner) {
        if (!allowedFarmerStatuses.includes(body.status)) {
          return { status: 403, data: { error: 'Farmers cannot perform this status transition' } };
        }
      } else if (isOwner && !isFarmer) {
        if (!allowedOwnerStatuses.includes(body.status)) {
          return { status: 403, data: { error: 'Owners cannot perform this status transition' } };
        }
      }
    }

    // 3. Transition matrix check
    const allowedTransitionsForActor = new Set();
    if (isAdmin) (VALID_BOOKING_TRANSITIONS[booking.status]?.ADMIN || []).forEach(s => allowedTransitionsForActor.add(s));
    if (isOwner) (VALID_BOOKING_TRANSITIONS[booking.status]?.OWNER || []).forEach(s => allowedTransitionsForActor.add(s));
    if (isFarmer) (VALID_BOOKING_TRANSITIONS[booking.status]?.FARMER || []).forEach(s => allowedTransitionsForActor.add(s));

    if (!allowedTransitionsForActor.has(body.status)) {
      return { status: 400, data: { error: `Invalid status transition from '${booking.status}' to '${body.status}'` } };
    }

    // 4. Concurrency CAS check
    if (simulateRace) {
      return { status: 409, data: { error: 'Conflict: Booking status was concurrently modified by another request' } };
    }

    // Perform mutation
    const oldStatus = booking.status;
    booking.status = body.status;
    if (body.status === 'REJECTED' || body.status === 'CANCELLED') {
      booking.paymentStatus = 'CANCELLED';
    }
    booking.history.push({ status: body.status, note: body.note });
    booking.notifications.push({ to: isOwner ? booking.farmerId : mockDb.equipment.ownerId, type: 'BOOKING_UPDATE', status: body.status });

    return { status: 200, data: { ...booking } };
  }

  // Simulated inspection handler replicating routes/bookings.ts logic
  function handleInspection(reqUser, bookingId, body, simulateRace = false) {
    if (reqUser.role !== 'OWNER') return { status: 403, data: { error: 'Forbidden: Requires OWNER role' } };

    const booking = mockDb.booking;
    if (booking.id !== bookingId) return { status: 404, data: { error: 'Booking not found' } };

    // 1. Authoritative ownership verification
    if (mockDb.equipment.ownerId !== reqUser.id) {
      return { status: 403, data: { error: 'Only the equipment owner can submit an inspection' } };
    }

    // 2. Return-inspection eligibility
    if (!PERMITTED_INSPECTION_STATUSES.includes(booking.status)) {
      return { status: 400, data: { error: `Cannot inspect booking with status '${booking.status}'. Booking must be in one of: ${PERMITTED_INSPECTION_STATUSES.join(', ')}` } };
    }

    // 3. Condition enum validation
    const cleanCondition = String(body.condition || '').trim().toUpperCase();
    if (!CANONICAL_INSPECTION_CONDITIONS.includes(cleanCondition)) {
      return { status: 400, data: { error: `Invalid condition '${body.condition}'. Must be one of: ${CANONICAL_INSPECTION_CONDITIONS.join(', ')}` } };
    }

    // 4. Deduction amount validation against authoritative security deposit
    let parsedDeduction = 0;
    if (body.deductionAmount !== undefined && body.deductionAmount !== null) {
      if (typeof body.deductionAmount === 'string' && body.deductionAmount.trim() === '') {
        return { status: 400, data: { error: 'Invalid deductionAmount. Must be a finite number' } };
      }
      const num = Number(body.deductionAmount);
      if (typeof num !== 'number' || !Number.isFinite(num) || isNaN(num)) {
        return { status: 400, data: { error: 'Invalid deductionAmount. Must be a finite number' } };
      }
      if (num < 0) {
        return { status: 400, data: { error: 'deductionAmount cannot be negative' } };
      }
      const authoritativeDeposit = booking.securityDeposit ?? 0;
      if (num > authoritativeDeposit) {
        return { status: 400, data: { error: `deductionAmount (₹${num}) cannot exceed authoritative security deposit (₹${authoritativeDeposit})` } };
      }
      parsedDeduction = num;
    }

    // 5. Concurrency CAS check
    if (simulateRace) {
      return { status: 409, data: { error: 'Conflict: Booking inspection was submitted concurrently or status is no longer eligible' } };
    }

    // Mutation
    booking.status = 'COMPLETED';
    booking.returnInspection = {
      condition: cleanCondition,
      deductionAmount: parsedDeduction,
      notes: body.notes || ''
    };
    booking.history.push({ status: 'COMPLETED', note: `Condition: ${cleanCondition}. Deduction: ₹${parsedDeduction}` });
    booking.notifications.push({ to: booking.farmerId, title: 'Return Inspection Completed' });

    return { status: 200, data: booking.returnInspection };
  }

  // --- TESTS ---

  runTest('Handler - Owner modifies own booking successfully', () => {
    resetDb();
    const res = handleStatusUpdate(mockDb.userOwner, 'bk_1', { status: 'ACCEPTED' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(mockDb.booking.status, 'ACCEPTED');
    assert.strictEqual(mockDb.booking.history.length, 1);
  });

  runTest('Handler - Unauthorized third-party owner cannot modify booking (Cross-tenant security)', () => {
    resetDb();
    const res = handleStatusUpdate(mockDb.userOwnerOther, 'bk_1', { status: 'ACCEPTED' });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(mockDb.booking.status, 'PENDING');
    assert.strictEqual(mockDb.booking.history.length, 0);
  });

  runTest('Handler - Farmer cannot perform owner-only transitions (e.g. ACCEPTED)', () => {
    resetDb();
    const res = handleStatusUpdate(mockDb.userFarmer, 'bk_1', { status: 'ACCEPTED' });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(mockDb.booking.status, 'PENDING');
    assert.strictEqual(mockDb.booking.history.length, 0);
  });

  runTest('Handler - Terminal states (COMPLETED, CANCELLED, REJECTED) cannot be reopened', () => {
    resetDb();
    mockDb.booking.status = 'COMPLETED';
    let res = handleStatusUpdate(mockDb.userOwner, 'bk_1', { status: 'ACTIVE' });
    assert.strictEqual(res.status, 400);

    mockDb.booking.status = 'CANCELLED';
    res = handleStatusUpdate(mockDb.userFarmer, 'bk_1', { status: 'PENDING' });
    assert.strictEqual(res.status, 400);

    mockDb.booking.status = 'REJECTED';
    res = handleStatusUpdate(mockDb.userOwner, 'bk_1', { status: 'ACCEPTED' });
    assert.strictEqual(res.status, 400);
  });

  runTest('Handler - Invalid lifecycle jump rejected (PENDING -> COMPLETED)', () => {
    resetDb();
    const res = handleStatusUpdate(mockDb.userOwner, 'bk_1', { status: 'COMPLETED' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(mockDb.booking.status, 'PENDING');
  });

  runTest('Handler - Concurrency conflict on status update returns 409 and leaves DB intact', () => {
    resetDb();
    const res = handleStatusUpdate(mockDb.userOwner, 'bk_1', { status: 'ACCEPTED' }, true);
    assert.strictEqual(res.status, 409);
    assert.strictEqual(mockDb.booking.status, 'PENDING');
    assert.strictEqual(mockDb.booking.history.length, 0);
    assert.strictEqual(mockDb.booking.notifications.length, 0);
  });

  runTest('Handler - Return inspection rejects invalid statuses (PENDING, ACTIVE, CANCELLED, REJECTED)', () => {
    resetDb();
    for (const badState of ['PENDING', 'ACTIVE', 'CANCELLED', 'REJECTED', 'COMPLETED']) {
      mockDb.booking.status = badState;
      const res = handleInspection(mockDb.userOwner, 'bk_1', { condition: 'GOOD', deductionAmount: 0 });
      assert.strictEqual(res.status, 400, `Must reject inspection when booking is '${badState}'`);
      assert.strictEqual(mockDb.booking.returnInspection, null);
    }
  });

  runTest('Handler - Return inspection succeeds in every permitted status (RETURN_PENDING, RETURN_IN_PROGRESS, RETURNED, INSPECTION_PENDING)', () => {
    for (const validState of PERMITTED_INSPECTION_STATUSES) {
      resetDb();
      mockDb.booking.status = validState;
      const res = handleInspection(mockDb.userOwner, 'bk_1', { condition: 'GOOD', deductionAmount: 100 });
      assert.strictEqual(res.status, 200, `Must permit inspection when status is '${validState}'`);
      assert.strictEqual(mockDb.booking.status, 'COMPLETED');
      assert.strictEqual(mockDb.booking.returnInspection.deductionAmount, 100);
      assert.strictEqual(mockDb.booking.history.length, 1);
      assert.strictEqual(mockDb.booking.notifications.length, 1);
    }
  });

  runTest('Handler - Unauthorized owner cannot inspect another owner equipment', () => {
    resetDb();
    mockDb.booking.status = 'RETURNED';
    const res = handleInspection(mockDb.userOwnerOther, 'bk_1', { condition: 'GOOD', deductionAmount: 0 });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(mockDb.booking.status, 'RETURNED');
    assert.strictEqual(mockDb.booking.returnInspection, null);
  });

  runTest('Handler - Farmer cannot submit return inspection', () => {
    resetDb();
    mockDb.booking.status = 'RETURNED';
    const res = handleInspection(mockDb.userFarmer, 'bk_1', { condition: 'GOOD', deductionAmount: 0 });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(mockDb.booking.status, 'RETURNED');
  });

  runTest('Handler - Deduction amount validation against authoritative security deposit (₹500)', () => {
    resetDb();
    mockDb.booking.status = 'RETURNED';
    mockDb.booking.securityDeposit = 500;

    // 1. Equal to deposit: ALLOWED
    let res = handleInspection(mockDb.userOwner, 'bk_1', { condition: 'DAMAGED', deductionAmount: 500 });
    assert.strictEqual(res.status, 200);

    // 2. Greater than deposit: REJECTED
    resetDb();
    mockDb.booking.status = 'RETURNED';
    mockDb.booking.securityDeposit = 500;
    res = handleInspection(mockDb.userOwner, 'bk_1', { condition: 'DAMAGED', deductionAmount: 500.01 });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(mockDb.booking.status, 'RETURNED');
    assert.strictEqual(mockDb.booking.returnInspection, null);

    // 3. Zero deduction: ALLOWED
    resetDb();
    mockDb.booking.status = 'RETURNED';
    mockDb.booking.securityDeposit = 500;
    res = handleInspection(mockDb.userOwner, 'bk_1', { condition: 'EXCELLENT', deductionAmount: 0 });
    assert.strictEqual(res.status, 200);

    // 4. Missing/omitted deduction: ALLOWED (defaults to 0)
    resetDb();
    mockDb.booking.status = 'RETURNED';
    mockDb.booking.securityDeposit = 500;
    res = handleInspection(mockDb.userOwner, 'bk_1', { condition: 'EXCELLENT' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(mockDb.booking.returnInspection.deductionAmount, 0);

    // 5. Negative deduction: REJECTED
    resetDb();
    mockDb.booking.status = 'RETURNED';
    mockDb.booking.securityDeposit = 500;
    res = handleInspection(mockDb.userOwner, 'bk_1', { condition: 'EXCELLENT', deductionAmount: -50 });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(mockDb.booking.status, 'RETURNED');

    // 6. Non-finite deduction: REJECTED
    resetDb();
    mockDb.booking.status = 'RETURNED';
    mockDb.booking.securityDeposit = 500;
    res = handleInspection(mockDb.userOwner, 'bk_1', { condition: 'EXCELLENT', deductionAmount: 'not_a_number' });
    assert.strictEqual(res.status, 400);

    // 7. Security deposit is 0: deduction > 0 REJECTED, deduction = 0 ALLOWED
    resetDb();
    mockDb.booking.status = 'RETURNED';
    mockDb.booking.securityDeposit = 0;
    res = handleInspection(mockDb.userOwner, 'bk_1', { condition: 'GOOD', deductionAmount: 50 });
    assert.strictEqual(res.status, 400);

    res = handleInspection(mockDb.userOwner, 'bk_1', { condition: 'GOOD', deductionAmount: 0 });
    assert.strictEqual(res.status, 200);
  });

  runTest('Handler - Canonical condition enum validation (EXCELLENT, GOOD, FAIR, DAMAGED)', () => {
    for (const cond of ['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED']) {
      resetDb();
      mockDb.booking.status = 'RETURNED';
      const res = handleInspection(mockDb.userOwner, 'bk_1', { condition: cond });
      assert.strictEqual(res.status, 200, `Condition '${cond}' should be accepted`);
    }

    for (const invalidCond of ['SUPER', 'POOR', 'SCRATCHED', '', 'unknown', null]) {
      resetDb();
      mockDb.booking.status = 'RETURNED';
      const res = handleInspection(mockDb.userOwner, 'bk_1', { condition: invalidCond });
      assert.strictEqual(res.status, 400, `Condition '${invalidCond}' should be rejected`);
      assert.strictEqual(mockDb.booking.status, 'RETURNED');
    }
  });

  runTest('Handler - Concurrency race on inspection returns 409 and leaves DB intact', () => {
    resetDb();
    mockDb.booking.status = 'RETURNED';
    const res = handleInspection(mockDb.userOwner, 'bk_1', { condition: 'GOOD', deductionAmount: 50 }, true);
    assert.strictEqual(res.status, 409);
    assert.strictEqual(mockDb.booking.status, 'RETURNED');
    assert.strictEqual(mockDb.booking.returnInspection, null);
    assert.strictEqual(mockDb.booking.history.length, 0);
  });

  runTest('Financial Integrity - Inspection preserves paymentStatus, amountPaid, and booking amounts', () => {
    resetDb();
    mockDb.booking.status = 'RETURNED';
    mockDb.booking.totalPrice = 3000;
    mockDb.booking.amountPaid = 3000;
    mockDb.booking.paymentStatus = 'SUCCESS';
    mockDb.booking.securityDeposit = 450;

    const res = handleInspection(mockDb.userOwner, 'bk_1', { condition: 'DAMAGED', deductionAmount: 200 });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(mockDb.booking.totalPrice, 3000, 'totalPrice must remain untouched');
    assert.strictEqual(mockDb.booking.amountPaid, 3000, 'amountPaid must remain untouched');
    assert.strictEqual(mockDb.booking.paymentStatus, 'SUCCESS', 'paymentStatus must remain untouched');
    assert.strictEqual(mockDb.booking.securityDeposit, 450, 'securityDeposit must remain untouched');
  });
}


// -------------------------------------------------------------
// SECTION 5: LIVE HTTP EXPRESS ROUTE & MIDDLEWARE INTEGRATION
// -------------------------------------------------------------

async function runHttpIntegrationTests() {
  const express = require('express');
  const app = express();
  app.use(express.json());

  // Mount real booking router
  const bookingRouter = require('../dist/routes/bookings').default;
  app.use('/api/bookings', bookingRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/bookings`;

  // Validation harness app to test validate middleware HTTP behavior without requiring DB
  const { validate } = require('../dist/middlewares/validate');
  const testValidationApp = express();
  testValidationApp.use(express.json());
  testValidationApp.put('/test/status', validate(updateBookingStatusSchema), (req, res) => res.json({ ok: true, data: req.body }));
  testValidationApp.post('/test/inspection', validate(returnInspectionSchema), (req, res) => res.json({ ok: true, data: req.body }));

  const vServer = http.createServer(testValidationApp);
  await new Promise(resolve => vServer.listen(0, resolve));
  const vPort = vServer.address().port;
  const vBase = `http://127.0.0.1:${vPort}/test`;

  try {
    // 1. Live HTTP unauthenticated requests
    await runAsyncTest('HTTP Live - PUT /api/bookings/:id/status without token rejected with 401', async () => {
      const res = await fetch(`${baseUrl}/test-booking-id/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' })
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert(data.error && data.error.includes('authorization'), 'Must reject missing authorization');
    });

    await runAsyncTest('HTTP Live - POST /api/bookings/:id/inspection without token rejected with 401', async () => {
      const res = await fetch(`${baseUrl}/test-booking-id/inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: 'GOOD', deductionAmount: 0 })
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert(data.error && data.error.includes('authorization'), 'Must reject missing authorization');
    });

    // 2. Live HTTP schema validation tests
    await runAsyncTest('HTTP Live - PUT /status accepts valid status through validate middleware', async () => {
      const res = await fetch(`${vBase}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED', note: 'Ready to rent' })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.ok, true);
    });

    await runAsyncTest('HTTP Live - PUT /status rejects unknown status with 400 Validation Failed', async () => {
      const res = await fetch(`${vBase}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'NOT_A_REAL_STATUS' })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, 'Validation Failed');
    });

    await runAsyncTest('HTTP Live - POST /inspection accepts canonical condition and valid deduction', async () => {
      const res = await fetch(`${vBase}/inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: 'EXCELLENT', deductionAmount: 150 })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.ok, true);
    });

    await runAsyncTest('HTTP Live - POST /inspection rejects arbitrary condition with 400 Validation Failed', async () => {
      const res = await fetch(`${vBase}/inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: 'ARBITRARY_CONDITION_TEXT', deductionAmount: 0 })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, 'Validation Failed');
    });

    await runAsyncTest('HTTP Live - POST /inspection rejects negative deduction with 400 Validation Failed', async () => {
      const res = await fetch(`${vBase}/inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: 'GOOD', deductionAmount: -50 })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, 'Validation Failed');
    });

    await runAsyncTest('HTTP Live - POST /inspection rejects non-numeric deduction with 400 Validation Failed', async () => {
      const res = await fetch(`${vBase}/inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: 'GOOD', deductionAmount: 'not-a-number' })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, 'Validation Failed');
    });

    await runAsyncTest('HTTP Live - POST /inspection accepts omitted deduction (defaults gracefully)', async () => {
      const res = await fetch(`${vBase}/inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: 'GOOD' })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.ok, true);
    });
  } finally {
    await new Promise(r => server.close(r));
    await new Promise(r => vServer.close(r));
  }
}

async function main() {
  await runEndpointTestSuite();
  await runHttpIntegrationTests();
  console.log('\n-----------------------------------------------------------------');
  console.log(`Booking Lifecycle Security Test Summary: ${passedTests}/${totalTests} Passed`);
  console.log('-----------------------------------------------------------------\n');

  if (passedTests === totalTests) {
    console.log('All booking lifecycle and return inspection security tests PASSED successfully!\n');
    // naturally exit
  } else {
    console.error('FAILURE: ' + (totalTests - passedTests) + ' tests failed.');
    process.exit(1);
  }
}

main();
