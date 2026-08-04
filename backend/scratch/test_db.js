const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ezylxyrtnodxthdgynvn:Tej%40%40database2@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
});

client.connect()
  .then(() => {
    console.log('Connected successfully');
    client.end();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
  });
