const { PrismaClient } = require('@prisma/client');

async function tryUrl(url, label) {
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const c = await p.user.count();
    console.log(label, 'SUCCESS! User count:', c);
    return true;
  } catch (e) {
    console.log(label, 'FAILED:', e.message.substring(0, 150));
    return false;
  } finally {
    try { await p.$disconnect(); } catch (x) {}
  }
}

async function run() {
  const url1 = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/agrorent';
  const url2 = process.env.DIRECT_URL || url1;

  console.log('Testing DB connection URLs...');
  await tryUrl(url1, 'DATABASE_URL');
  await tryUrl(url2, 'DIRECT_URL');
}

run();
