const net = require('net');

const regions = [
  'aws-0-ap-south-1',
  'aws-1-ap-south-1',
  'aws-0-ap-southeast-1',
  'aws-1-ap-southeast-1',
  'aws-0-ap-northeast-1',
  'aws-1-ap-northeast-1',
  'aws-0-us-east-1',
  'aws-0-eu-central-1',
];

async function scan() {
  for (const r of regions) {
    const host = `${r}.pooler.supabase.com`;
    for (const port of [6543, 5432]) {
      const s = new net.Socket();
      s.setTimeout(2000);
      s.on('connect', () => {
        console.log(`FOUND OPEN: ${host}:${port}`);
        s.destroy();
      });
      s.on('timeout', () => { s.destroy(); });
      s.on('error', () => { s.destroy(); });
      s.connect(port, host);
    }
  }
}

scan();
