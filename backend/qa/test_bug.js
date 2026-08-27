const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api/auth';

async function testBug() {
  const testEmail = 'bug_test_' + Date.now() + '@example.com';
  try {
    console.log('--- TESTING PASSWORD RESET FLOW ---');
    
    // 1. Create User
    await prisma.user.create({
      data: { name: 'Bug Test', email: testEmail, password: await bcrypt.hash('OldPassword@123', 10), role: 'FARMER', isVerified: true }
    });
    console.log('User created.');

    // 2. Instead of API, simulate API inserting the OTP so we know the plaintext
    const plaintextOtp = '123456';
    const hashedOtp = await bcrypt.hash(plaintextOtp, 10);
    await prisma.oTPVerification.create({
      data: {
        id: 'pwd-reset-' + Date.now(),
        email: testEmail,
        otp: hashedOtp,
        purpose: 'FORGOT_PASSWORD',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      }
    });
    console.log('OTP generated and hashed in DB.');

    // 3. Verify OTP
    const verifyRes = await fetch(API_URL + '/verify-otp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: plaintextOtp, purpose: 'FORGOT_PASSWORD' })
    });
    const verifyData = await verifyRes.json();
    console.log('Verify OTP Response:', verifyData);
    
    if (!verifyData.success) throw new Error('Verify failed');

    // 4. Reset Password
    const resetRes = await fetch(API_URL + '/reset-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, resetToken: verifyData.resetToken, newPassword: 'NewPassword@123' })
    });
    const resetData = await resetRes.json();
    console.log('Reset Password Response:', resetData);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
testBug();
