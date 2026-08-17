const { Client } = require('pg');

async function testConnection() {
  const connectionStrings = [
    // Original provided by user
    "postgresql://postgres.ezylxyrtnodxthdgynvn:Tej@@database2@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    // With URL encoded password
    "postgresql://postgres.ezylxyrtnodxthdgynvn:Tej%40%40database2@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    // Direct URL format
    "postgresql://postgres:Tej%40%40database2@db.ezylxyrtnodxthdgynvn.supabase.co:5432/postgres",
    // aws-0 ap-south-1
    "postgresql://postgres.ezylxyrtnodxthdgynvn:Tej%40%40database2@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  ];

  for (const str of connectionStrings) {
    console.log(`\nTesting: ${str.replace('Tej@@database2', '***').replace('Tej%40%40database2', '***')}`);
    const client = new Client({ connectionString: str, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      console.log('SUCCESS!');
      await client.end();
      return; // Exit if one succeeds
    } catch (e) {
      console.error(`FAILED: ${e.message}`);
    }
  }
}

testConnection();
