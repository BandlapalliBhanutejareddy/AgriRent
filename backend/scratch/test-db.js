const { Client } = require('pg');

async function testConnection() {
  const connectionString = "postgresql://postgres.ezylxyrtnodxthdgynvn:Tej%40%40database2@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Successfully connected!');
    const res = await client.query('SELECT NOW()');
    console.log('Current time from DB:', res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

testConnection();
