const { Client } = require('pg');

async function testPg() {
  const connectionStrings = [
    process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/agrorent"
  ];

  for (const cs of connectionStrings) {
    console.log('\nTesting:', cs.replace(/:Sup[^@]+@/, ':***@'));
    const client = new Client({ connectionString: cs, connectionTimeoutMillis: 5000, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      console.log('SUCCESS! Connected with pg!');
      const res = await client.query('SELECT count(*) FROM "User"');
      console.log('User count:', res.rows[0]);
      await client.end();
      return;
    } catch (e) {
      console.log('Failed:', e.message);
      try { await client.end(); } catch {}
    }
  }
}

testPg();
