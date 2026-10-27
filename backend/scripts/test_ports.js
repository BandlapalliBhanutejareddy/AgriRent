const net = require('net');

const poolers = [
  'aws-0-ap-northeast-1.pooler.supabase.com',
  'aws-1-ap-northeast-1.pooler.supabase.com',
  'aws-0-ap-south-1.pooler.supabase.com',
];

const ports = [443, 5432, 6543];

for (const host of poolers) {
  for (const port of ports) {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    socket.on('connect', () => {
      console.log(`PORT OPEN: ${host}:${port}`);
      socket.destroy();
    });
    socket.on('timeout', () => {
      socket.destroy();
    });
    socket.on('error', () => {});
    socket.connect(port, host);
  }
}
