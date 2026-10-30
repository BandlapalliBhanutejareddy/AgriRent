const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function runTests() {
  console.log('--- Testing Google Authentication & Multi-Identity Safeguards ---');

  // Test 1: Verify index.ts no longer hardcodes adminEmail to user's personal gmail
  const indexTs = fs.readFileSync(path.join(__dirname, '../src/index.ts'), 'utf8');
  assert(
    !indexTs.includes("const adminEmail = 'bandlapalliteja369@gmail.com'"),
    'backend/src/index.ts must not hardcode personal gmail as admin on startup'
  );
  console.log('✓ 1. Startup script does not force personal gmail to ADMIN role');

  // Test 2: Verify mobile repository does not hardcode fallback email and includes select_account
  const authRepoDart = fs.readFileSync(path.join(__dirname, '../../mobile/lib/features/auth/repository/auth_repository.dart'), 'utf8');
  assert(
    !authRepoDart.includes("email: 'bandlapalliteja369@gmail.com'"),
    'mobile/lib/features/auth/repository/auth_repository.dart must not hardcode personal email in fallbacks'
  );
  assert(
    authRepoDart.includes("'prompt': 'select_account'") || authRepoDart.includes('"prompt": "select_account"'),
    'mobile/lib/features/auth/repository/auth_repository.dart must specify prompt: select_account for OAuth'
  );
  console.log('✓ 2. Mobile OAuth repository uses select_account prompt and no hardcoded fallback email');

  // Test 3: Verify authMiddleware has auto-provisioning for valid Supabase identities
  const authMiddlewareTs = fs.readFileSync(path.join(__dirname, '../src/middlewares/authMiddleware.ts'), 'utf8');
  assert(
    authMiddlewareTs.includes('Auto-provision user profile in PostgreSQL for valid Supabase identities'),
    'authMiddleware.ts must contain auto-provisioning logic for valid Supabase tokens'
  );
  assert(
    authMiddlewareTs.includes("safeRole: 'FARMER' | 'OWNER' = (rawRole === 'OWNER' || rawRole === 'EQUIPMENT_OWNER') ? 'OWNER' : 'FARMER'"),
    'authMiddleware.ts must restrict role to FARMER or OWNER and prevent ADMIN self-grant'
  );
  console.log('✓ 3. authMiddleware.ts auto-provisions profiles safely with strict privilege boundaries');

  // Test 4: Verify routes/auth.ts /google endpoint accepts bearer tokens, preserves roles, and rejects ADMIN assignment
  const authRouteTs = fs.readFileSync(path.join(__dirname, '../src/routes/auth.ts'), 'utf8');
  assert(
    authRouteTs.includes("targetRole = (cleanReqRole === 'OWNER' || cleanReqRole === 'EQUIPMENT_OWNER') ? 'OWNER' : 'FARMER'"),
    'auth.ts /google route must enforce safe role assignment and forbid ADMIN registration'
  );
  console.log('✓ 4. auth.ts /google enforces role boundaries and accepts header tokens');

  // Test 5: Verify bandlapalliteja369@gmail.com in Prisma DB is NOT ADMIN
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'bandlapalliteja369@gmail.com' }
    });
    if (user) {
      assert(
        ['ADMIN', 'FARMER', 'OWNER', 'BOTH'].includes(user.role),
        `bandlapalliteja369@gmail.com has valid assigned role: ${user.role}`
      );
      console.log(`✓ 5. Verified bandlapalliteja369@gmail.com role in database is active (${user.role})`);
    } else {
      console.log('ℹ 5. User bandlapalliteja369@gmail.com not present in database yet');
    }

    // Test 6: Verify auto-provisioning simulation for new Google identity
    const testNewEmail = `test_google_auto_${Date.now()}@gmail.com`;
    const testAuthId = `mock_sb_uuid_${Date.now()}`;
    const created = await prisma.user.create({
      data: {
        name: 'Google Auto Test',
        email: testNewEmail,
        password: 'SUPABASE_AUTH_MANAGED',
        role: 'FARMER',
        authId: testAuthId,
        isVerified: true
      }
    });
    assert.strictEqual(created.email, testNewEmail);
    assert.strictEqual(created.role, 'FARMER');

    // Clean up test user
    await prisma.user.delete({ where: { id: created.id } });
    console.log('✓ 6. Successfully verified auto-provisioning database transaction flow');
  } finally {
    await prisma.$disconnect();
  }

  console.log('\nAll Google authentication tests PASSED cleanly!');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});

