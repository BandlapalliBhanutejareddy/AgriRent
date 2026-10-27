const http = require('http');
const fs = require('fs');
const path = require('path');
const XLSX = require('../../backend/node_modules/xlsx');

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 4000;
const CONCURRENCY = 100; // 100 Virtual Users
const DURATION_SECONDS = 60; // 1 Minute

const ENDPOINTS = [
  { path: '/api/health', method: 'GET', weight: 40 },
  { path: '/api/ready', method: 'GET', weight: 30 },
  { path: '/api/equipment/nearby?latitude=13.0827&longitude=80.2707', method: 'GET', weight: 30 }
];

console.log('===============================================================');
console.log('    AGRORENT AI - DEDICATED BACKEND 100-VU LOAD TEST (60s)     ');
console.log('===============================================================');
console.log(`Target: http://${TARGET_HOST}:${TARGET_PORT}`);
console.log(`Virtual Users: ${CONCURRENCY}`);
console.log(`Duration: ${DURATION_SECONDS} seconds`);

function pickEndpoint() {
  const rand = Math.random() * 100;
  let cum = 0;
  for (const ep of ENDPOINTS) {
    cum += ep.weight;
    if (rand <= cum) return ep;
  }
  return ENDPOINTS[0];
}

const latencies = [];
let totalRequests = 0;
let successRequests = 0;
let errorRequests = 0;
const endpointStats = {};

ENDPOINTS.forEach(e => {
  endpointStats[e.path] = { count: 0, successes: 0, errors: 0, latencies: [] };
});

const keepAliveAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 150,
  maxFreeSockets: 100
});

function sendRequest() {
  return new Promise((resolve) => {
    const ep = pickEndpoint();
    const start = process.hrtime.bigint();

    const options = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: ep.path,
      method: ep.method,
      agent: keepAliveAgent,
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;

        totalRequests++;
        latencies.push(durationMs);
        endpointStats[ep.path].count++;
        endpointStats[ep.path].latencies.push(durationMs);

        if (res.statusCode >= 200 && res.statusCode < 400) {
          successRequests++;
          endpointStats[ep.path].successes++;
        } else {
          errorRequests++;
          endpointStats[ep.path].errors++;
        }
        resolve();
      });
    });

    req.on('timeout', () => {
      req.destroy();
      totalRequests++;
      errorRequests++;
      endpointStats[ep.path].count++;
      endpointStats[ep.path].errors++;
      resolve();
    });

    req.on('error', (err) => {
      totalRequests++;
      errorRequests++;
      endpointStats[ep.path].count++;
      endpointStats[ep.path].errors++;
      resolve();
    });

    req.end();
  });
}

function calculatePercentiles(arr) {
  if (arr.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const avg = (sum / sorted.length).toFixed(2);
  const p = (pct) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * (pct / 100)))].toFixed(2);

  return {
    min: sorted[0].toFixed(2),
    max: sorted[sorted.length - 1].toFixed(2),
    avg,
    p50: p(50),
    p90: p(90),
    p95: p(95),
    p99: p(99)
  };
}

async function worker(stopTime) {
  while (Date.now() < stopTime) {
    await sendRequest();
  }
}

async function main() {
  const startTime = Date.now();
  const stopTime = startTime + (DURATION_SECONDS * 1000);

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(stopTime));
  }

  const interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const rps = elapsed > 0 ? (totalRequests / elapsed).toFixed(1) : 0;
    process.stdout.write(`Elapsed: ${elapsed}s / ${DURATION_SECONDS}s | Requests: ${totalRequests} | Success: ${successRequests} | Errors: ${errorRequests} | RPS: ${rps}\r`);
  }, 1000);

  await Promise.all(workers);
  clearInterval(interval);
  console.log('\n\nLoad test completed! Processing results...');

  const actualDuration = (Date.now() - startTime) / 1000;
  const rps = (totalRequests / actualDuration).toFixed(2);
  const errorRate = totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(2) : 0;
  const overallPercentiles = calculatePercentiles(latencies);

  console.log('===============================================================');
  console.log('                     FINAL METRICS SUMMARY                     ');
  console.log('===============================================================');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful:     ${successRequests}`);
  console.log(`Errors:         ${errorRequests}`);
  console.log(`Throughput:     ${rps} req/sec`);
  console.log(`Error Rate:     ${errorRate}%`);
  console.log(`Latencies:      Avg=${overallPercentiles.avg}ms, p50=${overallPercentiles.p50}ms, p95=${overallPercentiles.p95}ms, p99=${overallPercentiles.p99}ms`);
  console.log('===============================================================');

  // Excel Generation
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const wb = XLSX.utils.book_new();

  const summarySheetData = [
    { Parameter: 'Target Host', Measurement: `http://${TARGET_HOST}:${TARGET_PORT}` },
    { Parameter: 'Concurrent Virtual Users (VUs)', Measurement: CONCURRENCY },
    { Parameter: 'Test Duration (s)', Measurement: actualDuration.toFixed(2) },
    { Parameter: 'Total Requests Processed', Measurement: totalRequests },
    { Parameter: 'Successful Requests', Measurement: successRequests },
    { Parameter: 'Failed / Timed Out Requests', Measurement: errorRequests },
    { Parameter: 'Throughput (RPS)', Measurement: `${rps} req/sec` },
    { Parameter: 'Error Rate (%)', Measurement: `${errorRate}%` },
    { Parameter: 'Min Latency (ms)', Measurement: overallPercentiles.min },
    { Parameter: 'Average Latency (ms)', Measurement: overallPercentiles.avg },
    { Parameter: '50th Percentile (p50) (ms)', Measurement: overallPercentiles.p50 },
    { Parameter: '90th Percentile (p90) (ms)', Measurement: overallPercentiles.p90 },
    { Parameter: '95th Percentile (p95) (ms)', Measurement: overallPercentiles.p95 },
    { Parameter: '99th Percentile (p99) (ms)', Measurement: overallPercentiles.p99 },
    { Parameter: 'Max Latency (ms)', Measurement: overallPercentiles.max },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  const endpointSheetData = Object.keys(endpointStats).map(ep => {
    const stats = endpointStats[ep];
    const p = calculatePercentiles(stats.latencies);
    return {
      Endpoint: ep,
      Requests: stats.count,
      Success: stats.successes,
      Errors: stats.errors,
      'Error Rate (%)': stats.count > 0 ? ((stats.errors / stats.count) * 100).toFixed(2) : '0.00',
      'Avg Latency (ms)': p.avg,
      'p50 (ms)': p.p50,
      'p90 (ms)': p.p90,
      'p95 (ms)': p.p95,
      'p99 (ms)': p.p99,
      'Max (ms)': p.max
    };
  });
  const wsEndpoints = XLSX.utils.json_to_sheet(endpointSheetData);
  XLSX.utils.book_append_sheet(wb, wsEndpoints, 'Per-Endpoint Breakdown');

  const reportFile = path.join(reportsDir, 'AgroRent_Backend_Load_Test_Report.xlsx');
  XLSX.writeFile(wb, reportFile);
  console.log(`Excel load test report saved to: ${reportFile}`);
}

main().catch(err => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
