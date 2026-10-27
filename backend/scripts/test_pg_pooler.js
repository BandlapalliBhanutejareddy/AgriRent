const { Client } = require('pg');

async function testPg() {
  const connectionStrings = [
    "postgresql://postgres.ezylxyrtnodxthdgynvn:Sup%40b%40se%4023@aws-1-ap-northeast-1.pooler.supabase.com:443/postgres?sslmode=require",
    "postgresql://postgres.ezylxyrtnodxthdgynvn:Sup%40b%40se%4023@aws-0-ap-northeast-1.pooler.supabase.com:443/postgres?sslmode=require",
    "postgresql://postgres.ezylxyrtnodxthdgynvn:Sup%40b%40se%4023@aws-0-ap-south-1.pooler.supabase.com:443/postgres?sslmode=require",
    "postgresql://postgres.ezylxyrtnodxthdgynvn:Sup%40b%40se%4023@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require",
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
