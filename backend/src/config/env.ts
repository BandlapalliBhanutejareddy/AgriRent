import dotenv from 'dotenv';
dotenv.config();

const requiredEnvs = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

export function validateEnv() {
  const missing = requiredEnvs.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn('Ã¢Å¡Â Ã¯Â¸Â Warning: Some Supabase/Database environment variables are not set:');
    missing.forEach((key) => console.warn(`   - ${key}`));
  } else {
    console.log('Ã¢Å“â€¦ Environment validation passed for Supabase Auth & Database.');
  }
}
