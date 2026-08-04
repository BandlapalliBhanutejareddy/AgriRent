import { prisma } from '../lib/prisma';

async function getOtp() {
  const email = process.argv[2];
  const otpRecord = await prisma.oTPVerification.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' }
  });
  if (otpRecord) {
    console.log(`OTP_FOUND:${otpRecord.otp}`);
  } else {
    console.log(`OTP_NOT_FOUND`);
  }
  await prisma.$disconnect();
}

getOtp();
