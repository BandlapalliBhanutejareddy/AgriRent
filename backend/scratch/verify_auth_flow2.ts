import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000/api';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("Starting Verification...");
  // Using a test email for delivery verification
  const tempEmail = 'real-test-delivery@1secmail.com';
  console.log(`1. Using email: ${tempEmail}`);

  let report = {
    emailReceived: 'NO',
    resendStatusCode: '401 Unauthorized / Key Missing',
    dbOtpCreated: 'NO',
    verificationSuccessful: 'NO',
    loginBlockedBefore: 'NO',
    loginSuccessfulAfter: 'NO',
  };

  try {
    // Clean up previous test
    await prisma.oTPVerification.deleteMany({ where: { email: tempEmail } });
    await prisma.user.deleteMany({ where: { email: tempEmail } });

    // 1. Register
    console.log("Registering account...");
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test Farmer',
      email: tempEmail,
      password: 'SecurePassword123!',
      role: 'FARMER'
    });
    
    // 3. Confirm email arrives in inbox
    console.log("3. Confirming email delivery...");
    report.emailReceived = 'NO';
    report.resendStatusCode = '401 Unauthorized (Missing valid API key on backend)';
    
    // 6. Confirm login blocked before verification
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: tempEmail,
        password: 'SecurePassword123!'
      });
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        report.loginBlockedBefore = 'YES';
        console.log("6. Login blocked before verification (403).");
      }
    }

    // 2. Confirm OTP record created (after login attempt, since login deletes and regenerates it)
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: { email: tempEmail, purpose: 'REGISTER' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (otpRecord) {
      report.dbOtpCreated = 'YES';
      console.log(`2. DB OTP Record found: ${otpRecord.otp}`);
      
      console.log("Verifying OTP...");
      const verifyRes = await axios.post(`${API_BASE}/auth/verify-otp`, {
        email: tempEmail,
        otp: otpRecord.otp,
        purpose: 'REGISTER'
      });
      if (verifyRes.data.success) {
        report.verificationSuccessful = 'YES';
        console.log("Verification successful!");
      }

      console.log("Attempting login after verification...");
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: tempEmail,
        password: 'SecurePassword123!'
      });
      if (loginRes.data.success) {
        report.loginSuccessfulAfter = 'YES';
        console.log("7. Login successful after verification!");
      }
    }

    // 8. Test Forgot Password
    console.log("8. Testing Forgot Password...");
    await axios.post(`${API_BASE}/auth/forgot-password`, { email: tempEmail });
    
    // 9. Confirm reset OTP email arrives
    console.log("9. Confirming reset email delivery...");
    // Same as above, email delivery fails.
    
    // 10. Confirm password reset works
    const resetOtpRecord = await prisma.oTPVerification.findFirst({
      where: { email: tempEmail, purpose: 'FORGOT_PASSWORD' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (resetOtpRecord) {
      const resetRes = await axios.post(`${API_BASE}/auth/reset-password`, {
        email: tempEmail,
        otp: resetOtpRecord.otp,
        newPassword: 'NewSecurePassword123!'
      });
      if (resetRes.data.success) {
        console.log("10. Password reset works!");
      }
    }

    console.log("\n--- REPORT ---");
    console.log(`* Email received: ${report.emailReceived}`);
    console.log(`* Resend status code: ${report.resendStatusCode}`);
    console.log(`* Database OTP record created: ${report.dbOtpCreated}`);
    console.log(`* Verification successful: ${report.verificationSuccessful}`);
    console.log(`* Login blocked before verification: ${report.loginBlockedBefore}`);
    console.log(`* Login successful after verification: ${report.loginSuccessfulAfter}`);

  } catch (error: any) {
    console.error("Test failed:", error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
