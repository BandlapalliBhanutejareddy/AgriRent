const { Client } = require('pg');

async function testPort(port, label) {
  const client = new Client({
    host: '127.0.0.1',
    port,
    user: 'postgres.ezylxyrtnodxthdgynvn',
    password: 'Sup@b@se@23',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT count(*) FROM "User"');
    console.log(`✅ [${label}] Port ${port} SUCCESS! User count:`, res.rows[0].count);
  } catch (err) {
    console.error(`❌ [${label}] Port ${port} FAILED:`, err.message);
  } finally {
    try { await client.end(); } catch {}
  }
}

async function main() {
  await testPort(6543, 'Transaction Pooler');
  await testPort(5432, 'Session Pooler');
}

main();
