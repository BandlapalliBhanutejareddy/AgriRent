const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api/auth';

async function testMultiple() {
  const users = [
    'multi_test_1_' + Date.now() + '@example.com',
    'multi_test_2_' + Date.now() + '@example.com',
    'multi_test_3_' + Date.now() + '@example.com'
  ];

  try {
    for (const email of users) {
      console.log('\n--- TESTING USER: ' + email + ' ---');
      await prisma.user.create({
        data: { name: 'Multi Test', email, password: await bcrypt.hash('OldPassword@123', 10), role: 'FARMER', isVerified: true }
      });
      console.log('1. User Created');

      // Request Forgot Password
      const forgotRes = await fetch(API_URL + '/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      console.log('2. Forgot Password Request:', forgotRes.status);

      // Check DB for OTP
      const otpRec = await prisma.oTPVerification.findFirst({ where: { email, purpose: 'FORGOT_PASSWORD' } });
      if (otpRec) {
         console.log('3. OTP Record successfully generated in DB for this specific email! (Hash length: ' + otpRec.otp.length + ')');
      } else {
         console.log('3. FAILED TO GENERATE OTP RECORD!');
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
testMultiple();
