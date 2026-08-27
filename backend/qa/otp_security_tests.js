const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api/auth';

async function runTests() {
  console.log('--- OTP SECURITY TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('✅ PASS: ' + message);
      passed++;
    } else {
      console.log('❌ FAIL: ' + message);
      failed++;
    }
  }

  try {
    const testEmail = 'sec_test_' + Date.now() + '@example.com';

    // A. INVALID OTP
    console.log('\n[TEST A] INVALID OTP');
    const invalidRes = await fetch(API_URL + '/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '000000', purpose: 'REGISTER' })
    });
    const invalidData = await invalidRes.json();
    assert(!invalidData.success && invalidData.error === 'Invalid OTP verification code', 'Rejected invalid OTP');

    // Setup for next tests
    const plaintextOtp = '123456';
    const hashedOtp = await bcrypt.hash(plaintextOtp, 10);
    
    // B. EXPIRED OTP
    console.log('\n[TEST B] EXPIRED OTP');
    await prisma.oTPVerification.create({
      data: {
        id: 'otp-exp-' + Date.now(),
        email: testEmail,
        otp: hashedOtp,
        purpose: 'REGISTER',
        expiresAt: new Date(Date.now() - 1000) // expired 1s ago
      }
    });

    const expRes = await fetch(API_URL + '/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: plaintextOtp, purpose: 'REGISTER' })
    });
    const expData = await expRes.json();
    assert(!expData.success && expData.error === 'Expired OTP verification code', 'Rejected expired OTP');

    // C. REUSED OTP
    console.log('\n[TEST C] REUSED OTP (Single-use)');
    // First, register a user so we can verify them
    await prisma.user.create({
      data: {
        name: 'Test',
        email: testEmail,
        password: await bcrypt.hash('Test@123', 10),
        role: 'FARMER',
        isVerified: false
      }
    });

    await prisma.oTPVerification.deleteMany({ where: { email: testEmail } });
    await prisma.oTPVerification.create({
      data: {
        id: 'otp-reuse-' + Date.now(),
        email: testEmail,
        otp: hashedOtp,
        purpose: 'REGISTER',
        expiresAt: new Date(Date.now() + 60000)
      }
    });

    const validRes = await fetch(API_URL + '/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: plaintextOtp, purpose: 'REGISTER' })
    });
    const validData = await validRes.json();
    assert(validData.success, 'Successfully verified valid OTP');

    const reuseRes = await fetch(API_URL + '/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: plaintextOtp, purpose: 'REGISTER' })
    });
    const reuseData = await reuseRes.json();
    assert(!reuseData.success, 'Rejected reused OTP');

    // D & E. RESEND & COOLDOWN
    console.log('\n[TEST D/E] RESEND & COOLDOWN');
    await prisma.oTPVerification.create({
      data: {
        id: 'otp-cool-' + Date.now(),
        email: testEmail,
        otp: hashedOtp,
        purpose: 'FORGOT_PASSWORD',
        expiresAt: new Date(Date.now() + 60000)
      }
    });

    const coolRes = await fetch(API_URL + '/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, purpose: 'FORGOT_PASSWORD' })
    });
    assert(coolRes.status === 429, 'Cooldown enforced (HTTP 429)');

    // G. ACCOUNT ENUMERATION
    console.log('\n[TEST G] ACCOUNT ENUMERATION');
    const enumRes = await fetch(API_URL + '/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_' + Date.now() + '@example.com' })
    });
    const enumData = await enumRes.text();
    assert(enumRes.status === 429 || (enumRes.status === 200 && enumData.includes('If an account exists')), 'Protected against enumeration (or rate limited)');

    // Cleanup
    await prisma.oTPVerification.deleteMany({ where: { email: testEmail } });
    await prisma.user.deleteMany({ where: { email: testEmail } });

    console.log('\nSUMMARY: ' + passed + ' Passed, ' + failed + ' Failed');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
