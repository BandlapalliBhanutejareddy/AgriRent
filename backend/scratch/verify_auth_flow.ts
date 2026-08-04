import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000/api';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getTempEmail() {
  const res = await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1');
  return res.data[0];
}

async function checkInbox(login: string, domain: string) {
  const res = await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);
  return res.data; // Array of messages
}

async function main() {
  console.log("Starting Verification...");
  const tempEmail = await getTempEmail();
  console.log(`1. Generated temp email: ${tempEmail}`);
  const [login, domain] = tempEmail.split('@');

  let report = {
    emailReceived: 'NO',
    resendStatusCode: 'N/A (Missing RESEND_API_KEY)',
    dbOtpCreated: 'NO',
    verificationSuccessful: 'NO',
    loginBlockedBefore: 'NO',
    loginSuccessfulAfter: 'NO',
  };

  try {
    // 1. Register
    console.log("Registering account...");
    await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test Farmer',
      email: tempEmail,
      password: 'SecurePassword123!',
      role: 'FARMER'
    });

    // 2. Confirm OTP record created
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: { email: tempEmail, purpose: 'REGISTER' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (otpRecord) {
      report.dbOtpCreated = 'YES';
      console.log(`2. DB OTP Record found: ${otpRecord.otp}`);
    } else {
      console.log("2. DB OTP Record NOT found");
    }

    // 3 & 4. Confirm email arrives within 60s
    console.log("Waiting 30 seconds to check inbox...");
    await sleep(30000);
    const msgs = await checkInbox(login, domain);
    if (msgs.length > 0) {
      report.emailReceived = 'YES';
      console.log("3. Email received!");
    } else {
      console.log("3. Email NOT received.");
    }

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
      } else {
        console.log("6. Login not blocked properly:", err.response?.status);
      }
    }

    // 7. Verify and login
    if (otpRecord) {
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
