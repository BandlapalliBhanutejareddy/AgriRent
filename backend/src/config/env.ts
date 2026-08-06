import dotenv from 'dotenv';
dotenv.config();

const requiredEnvs = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RESEND_API_KEY',
  'GEMINI_API_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
];

export function validateEnv() {
  const missing = requiredEnvs.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ FATAL ERROR: Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('The server cannot start without these configurations.');
    process.exit(1);
  }

  console.log('✅ Environment validation passed.');
}
