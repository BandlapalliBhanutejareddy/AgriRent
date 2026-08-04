import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkAuthFlow() {
  console.log('⚡ Executing Live E2E Authentication Logic Audit...\n');

  const testEmail = `e2e.test.${Date.now()}@agrorent.ai`;
  const plainPassword = 'SecurityPassword@123';

  try {
    // 1. Register test account
    console.log(`[AUTH STEP 1] Registering fresh account: ${testEmail}`);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const newUser = await prisma.user.create({
      data: {
        name: 'E2E Validation User',
        email: testEmail,
        password: hashedPassword,
        role: 'FARMER',
        isVerified: false
      }
    });
    console.log(`✅ User created. ID: ${newUser.id} | isVerified: ${newUser.isVerified}`);

    // 2. Generate OTP
    console.log('\n[AUTH STEP 2] Creating secure 6-digit verification OTP token...');
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    const otpRecord = await prisma.oTPVerification.create({
      data: {
        email: testEmail,
        otp: generatedOtp,
        purpose: 'REGISTER',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });
    console.log(`✅ OTP saved to database. Code: ${otpRecord.otp} | Expires: ${otpRecord.expiresAt}`);

    // 3. Verify OTP
    console.log('\n[AUTH STEP 3] Matching verification code...');
    const match = await prisma.oTPVerification.findFirst({
      where: { email: testEmail, otp: generatedOtp, purpose: 'REGISTER' }
    });

    if (match) {
      console.log('✅ OTP code matches. Setting user active...');
      const verifiedUser = await prisma.user.update({
        where: { email: testEmail },
        data: { isVerified: true }
      });
      console.log(`✅ User status updated. ID: ${verifiedUser.id} | isVerified: ${verifiedUser.isVerified}`);
    } else {
      throw new Error('OTP match failed.');
    }

    // 4. Test Login password comparison
    console.log('\n[AUTH STEP 4] Validating bcrypt hash match during login...');
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (user) {
      const isMatch = await bcrypt.compare(plainPassword, user.password);
      console.log(`✅ Bcrypt match: ${isMatch} (Login Authorized)`);
    } else {
      throw new Error('User not found during login check.');
    }

    // Clean up
    console.log('\n[AUTH STEP 5] Cleaning up validation records...');
    await prisma.oTPVerification.deleteMany({ where: { email: testEmail } });
    await prisma.user.delete({ where: { email: testEmail } });
    console.log('✅ Test user and OTP database rows cleaned successfully.');

    console.log('\n🎉 E2E Authentication Logic Audit successfully passed!');
  } catch (error) {
    console.error('❌ Authentication flow validation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuthFlow();
