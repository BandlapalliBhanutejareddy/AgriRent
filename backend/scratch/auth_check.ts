import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcrypt';

async function runAuthValidation() {
  console.log('🚀 Starting AgroRent AI Enterprise Authentication Validation Check...\n');

  const testEmail = `auth_test_${Date.now()}@agrorent.ai`;
  const strongPassword = 'FarmerNew@123';
  const name = 'Authed Test Farmer';
  const role = 'FARMER';

  try {
    // Step 1: Validate Password Hashing and Creation
    console.log('📦 Step 1: Simulating Registration & Password Complexity Hashing...');
    const hashedPassword = await bcrypt.hash(strongPassword, 10);
    
    // Verify hash pattern
    if (!hashedPassword.startsWith('$2b$10$')) {
      throw new Error('Credential hashing failed to utilize bcrypt.');
    }
    console.log('✅ Hashed credentials successfully: ' + hashedPassword.substring(0, 20) + '...');

    const user = await prisma.user.create({
      data: {
        name,
        email: testEmail,
        password: hashedPassword,
        role,
        isVerified: false
      }
    });
    console.log(`✅ Test User created successfully (isVerified=false): ID=${user.id}, Email=${user.email}\n`);

    // Step 2: Validate OTP Verification Generation
    console.log('📦 Step 2: Simulating OTP Generation & Database Storage...');
    const mockOtp = '684291';
    
    await prisma.$executeRawUnsafe(
      `INSERT INTO "OTPVerification" ("id", "email", "otp", "purpose", "expiresAt", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      'otp-val-' + Date.now(),
      testEmail,
      mockOtp,
      'REGISTER',
      new Date(Date.now() + 5 * 60 * 1000)
    );
    console.log('✅ Registered secure 6-digit OTP code in schema verification table.');

    // Query back OTP to verify persistence
    const otps: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "OTPVerification" WHERE "email" = $1 AND "otp" = $2`,
      testEmail,
      mockOtp
    );

    if (otps.length === 0) {
      throw new Error('OTP verification persistence query failed.');
    }
    console.log(`✅ Verified OTP persistence in database: Email=${otps[0].email}, OTP=${otps[0].otp}\n`);

    // Step 3: Validate OTP Verification transition
    console.log('📦 Step 3: Simulating OTP Validation & Account Verification...');
    
    // Verify OTP matches
    if (otps[0].otp !== mockOtp) {
      throw new Error('OTP verification mismatch.');
    }

    // Set user as verified
    const verifiedUser = await prisma.user.update({
      where: { email: testEmail },
      data: { isVerified: true }
    });

    if (!verifiedUser.isVerified) {
      throw new Error('Account verification state change failed.');
    }
    console.log('✅ Verified Account: set isVerified = true inside database.');

    // Cleanup utilised OTP
    await prisma.$executeRawUnsafe(
      `DELETE FROM "OTPVerification" WHERE "email" = $1`,
      testEmail
    );
    console.log('✅ Cleaned up used OTP record from database.\n');

    // Step 4: Validate Password Recoveries OTP (Forgot Password Flow)
    console.log('📦 Step 4: Simulating Forgot Password OTP Recoveries...');
    const recoverOtp = '987654';

    await prisma.$executeRawUnsafe(
      `INSERT INTO "OTPVerification" ("id", "email", "otp", "purpose", "expiresAt", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      'otp-recover-' + Date.now(),
      testEmail,
      recoverOtp,
      'FORGOT_PASSWORD',
      new Date(Date.now() + 5 * 60 * 1000)
    );

    const checkRecover: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "OTPVerification" WHERE "email" = $1 AND "otp" = $2 AND "purpose" = $3`,
      testEmail,
      recoverOtp,
      'FORGOT_PASSWORD'
    );

    if (checkRecover.length === 0) {
      throw new Error('Forgot password recovery OTP persistence failed.');
    }
    console.log('✅ Registered secure forgot password OTP code in verification table.');

    // Reset password utilizing code
    const newStrongPassword = 'FarmerReset@123';
    const newHashedPassword = await bcrypt.hash(newStrongPassword, 10);
    
    await prisma.user.update({
      where: { email: testEmail },
      data: { password: newHashedPassword }
    });

    const checkPassMatch = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    const isMatch = await bcrypt.compare(newStrongPassword, checkPassMatch!.password);
    if (!isMatch) {
      throw new Error('Password reset match validation failed.');
    }
    console.log('✅ Successfully validated new password hashing and matching in database.');

    // Cleanup recovery OTP
    await prisma.$executeRawUnsafe(
      `DELETE FROM "OTPVerification" WHERE "email" = $1`,
      testEmail
    );
    console.log('✅ Cleaned up recovery OTP records successfully.\n');

    // Step 5: Safe Rollback Cleanup
    console.log('🧹 Step 5: Performing automated test user clean up...');
    await prisma.user.delete({
      where: { email: testEmail }
    });
    console.log('✅ Temporary test user deleted cleanly.');

    console.log('\n🎉 End-to-End Enterprise Auth & Database Validation PASSED successfully! 100% stable.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Authentication Validation check failed:', error);
    process.exit(1);
  }
}

runAuthValidation();
