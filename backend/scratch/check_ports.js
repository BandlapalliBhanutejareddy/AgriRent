const net = require('net');

const hosts = [
  { host: 'db.ezylxyrtnodxthdgynvn.supabase.co', port: 5432 },
  { host: 'aws-1-ap-northeast-1.pooler.supabase.com', port: 5432 },
  { host: 'aws-1-ap-northeast-1.pooler.supabase.com', port: 6543 }
];

hosts.forEach(({ host, port }) => {
  const socket = new net.Socket();
  socket.setTimeout(2000);
  
  socket.on('connect', () => {
    console.log(`✅ ${host}:${port} is REACHABLE`);
    socket.destroy();
  });
  
  socket.on('timeout', () => {
    console.log(`❌ ${host}:${port} TIMEOUT`);
    socket.destroy();
  });
  
  socket.on('error', (err) => {
    console.log(`❌ ${host}:${port} ERROR: ${err.message}`);
  });
  
  socket.connect(port, host);
});
