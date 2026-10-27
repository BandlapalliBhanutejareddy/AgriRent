const dns = require('dns');
const net = require('net');

const hosts = [
  { host: 'aws-1-ap-northeast-1.pooler.supabase.com', port: 6543 },
  { host: 'aws-1-ap-northeast-1.pooler.supabase.com', port: 5432 },
  { host: 'aws-0-ap-northeast-1.pooler.supabase.com', port: 6543 },
  { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 6543 },
  { host: 'db.ezylxyrtnodxthdgynvn.supabase.co', port: 5432 },
  { host: 'ezylxyrtnodxthdgynvn.supabase.co', port: 443 }
];

async function check() {
  for (const item of hosts) {
    dns.lookup(item.host, { all: true }, (err, addresses) => {
      console.log(`DNS for ${item.host}:`, err ? err.message : addresses);
      if (!err && addresses.length > 0) {
        const socket = new net.Socket();
        socket.setTimeout(3000);
        socket.on('connect', () => {
          console.log(`SUCCESS: Connected to ${item.host}:${item.port} (${addresses[0].address})`);
          socket.destroy();
        });
        socket.on('timeout', () => {
          console.log(`TIMEOUT: ${item.host}:${item.port}`);
          socket.destroy();
        });
        socket.on('error', (e) => {
          console.log(`ERROR connecting to ${item.host}:${item.port}:`, e.message);
        });
        socket.connect(item.port, item.host);
      }
    });
  }
}

check();
