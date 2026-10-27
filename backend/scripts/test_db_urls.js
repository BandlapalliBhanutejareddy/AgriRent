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
  const url1 = 'postgresql://postgres.ezylxyrtnodxthdgynvn:Sup%40b%40se%4023@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const url2 = 'postgresql://postgres:Sup%40b%40se%4023@db.ezylxyrtnodxthdgynvn.supabase.co:5432/postgres?sslmode=require';
  const url3 = 'postgresql://postgres.ezylxyrtnodxthdgynvn:Sup%40b%40se%4023@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';

  console.log('Testing DB connection URLs...');
  await tryUrl(url1, 'Pooler 6543 (pgbouncer)');
  await tryUrl(url2, 'Direct db.ezylxyrtnodxthdgynvn.supabase.co:5432');
  await tryUrl(url3, 'Session pooler 5432');
}

run();
