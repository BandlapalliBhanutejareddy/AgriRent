const http = require('http');
const fs = require('fs');
const path = require('path');
let XLSX;
try {
  XLSX = require('xlsx');
} catch (e1) {
  try {
    XLSX = require('../../backend/node_modules/xlsx');
  } catch (e2) {
    XLSX = null;
  }
}

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 4000;
const CONCURRENCY = 100; // 100 Virtual Users
const DURATION_SECONDS = 30; // 30s High-throughput Concurrency

const OUTPUT_DIR = path.resolve(__dirname, '../../reports/qa/performance');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const logStream = fs.createWriteStream(path.join(OUTPUT_DIR, 'performance_execution.log'), { flags: 'w' });
function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  logStream.write(line + '\n');
}

const ENDPOINTS = [
  { path: '/api/health', method: 'GET', weight: 40 },
  { path: '/api/ready', method: 'GET', weight: 30 },
  { path: '/api/equipment/nearby?lat=13.0827&lng=80.2707', method: 'GET', weight: 30 }
];

log('===============================================================');
log('    AGRORENT AI - DEDICATED BACKEND 100-VU LOAD TEST (30s)     ');
log('===============================================================');
log(`Target: http://${TARGET_HOST}:${TARGET_PORT}`);
log(`Virtual Users (VUs): ${CONCURRENCY}`);
log(`Duration: ${DURATION_SECONDS} seconds`);

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
  maxSockets: 200,
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
  log('\nLoad test completed! Processing results...');

  const actualDuration = (Date.now() - startTime) / 1000;
  const rps = (totalRequests / actualDuration).toFixed(2);
  const errorRate = totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(2) : 0;
  const overallPercentiles = calculatePercentiles(latencies);

  log('===============================================================');
  log('                     FINAL METRICS SUMMARY                     ');
  log('===============================================================');
  log(`Total Requests: ${totalRequests}`);
  log(`Successful:     ${successRequests}`);
  log(`Errors:         ${errorRequests}`);
  log(`Throughput:     ${rps} req/sec`);
  log(`Error Rate:     ${errorRate}%`);
  log(`Latencies:      Avg=${overallPercentiles.avg}ms, p50=${overallPercentiles.p50}ms, p95=${overallPercentiles.p95}ms, p99=${overallPercentiles.p99}ms`);
  log('===============================================================');

  // 1. JSON Report
  const jsonReport = {
    suite: 'AgroRent AI Backend 100-VU Load & Concurrency Test',
    timestamp: new Date().toISOString(),
    target: `http://${TARGET_HOST}:${TARGET_PORT}`,
    concurrency: CONCURRENCY,
    durationSeconds: actualDuration,
    totalRequests,
    successRequests,
    errorRequests,
    throughputRps: parseFloat(rps),
    errorRatePct: parseFloat(errorRate),
    overallPercentiles,
    endpointBreakdown: Object.keys(endpointStats).map(ep => {
      const stats = endpointStats[ep];
      const p = calculatePercentiles(stats.latencies);
      return {
        endpoint: ep,
        requests: stats.count,
        successes: stats.successes,
        errors: stats.errors,
        errorRatePct: stats.count > 0 ? parseFloat(((stats.errors / stats.count) * 100).toFixed(2)) : 0,
        ...p
      };
    })
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'performance_results.json'), JSON.stringify(jsonReport, null, 2));

  // 2. Excel Report
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
  XLSX.writeFile(wb, path.join(OUTPUT_DIR, 'performance_results.xlsx'));

  // 3. HTML Report
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AgroRent AI — 100-VU Load & Concurrency Performance Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1329; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #38bdf8; margin-bottom: 8px; }
    .subtitle { color: #94a3b8; margin-bottom: 24px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: #1e293b; border-radius: 8px; padding: 16px; border: 1px solid #334155; }
    .card-label { font-size: 13px; color: #94a3b8; text-transform: uppercase; }
    .card-val { font-size: 28px; font-weight: bold; margin-top: 4px; color: #38bdf8; }
    .card-val.pass { color: #4ade80; }
    .card-val.warn { color: #fbbf24; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; border: 1px solid #334155; margin-bottom: 24px; }
    th, td { padding: 12px 16px; text-align: left; }
    th { background: #0f172a; color: #cbd5e1; font-weight: 600; border-bottom: 1px solid #334155; }
    tr:not(:last-child) td { border-bottom: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="container">
    <h1>AgroRent AI — 100-VU Load & Concurrency Performance Report</h1>
    <div class="subtitle">Concurrent Load Simulation (100 Virtual Users) — ${new Date().toUTCString()}</div>
    
    <div class="metrics">
      <div class="card"><div class="card-label">Virtual Users</div><div class="card-val">${CONCURRENCY}</div></div>
      <div class="card"><div class="card-label">Total Requests</div><div class="card-val">${totalRequests}</div></div>
      <div class="card"><div class="card-label">Throughput (RPS)</div><div class="card-val pass">${rps} req/s</div></div>
      <div class="card"><div class="card-label">Error Rate</div><div class="card-val pass">${errorRate}%</div></div>
      <div class="card"><div class="card-label">Median Latency (p50)</div><div class="card-val">${overallPercentiles.p50}ms</div></div>
      <div class="card"><div class="card-label">95th Percentile (p95)</div><div class="card-val warn">${overallPercentiles.p95}ms</div></div>
    </div>

    <h2>Per-Endpoint Performance Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Endpoint</th>
          <th>Requests</th>
          <th>Success</th>
          <th>Errors</th>
          <th>Avg Latency</th>
          <th>p50 (Median)</th>
          <th>p95</th>
          <th>p99</th>
        </tr>
      </thead>
      <tbody>
        ${endpointSheetData.map(r => `
          <tr>
            <td><code>${r.Endpoint}</code></td>
            <td>${r.Requests}</td>
            <td style="color:#4ade80;">${r.Success}</td>
            <td style="color:${r.Errors > 0 ? '#f87171' : '#94a3b8'};">${r.Errors}</td>
            <td>${r['Avg Latency (ms)']}ms</td>
            <td>${r['p50 (ms)']}ms</td>
            <td>${r['p95 (ms)']}ms</td>
            <td>${r['p99 (ms)']}ms</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'performance_report.html'), htmlContent);
  log(`All Performance test reports generated in: ${OUTPUT_DIR}`);
}

main().catch(err => {
  log(`Fatal load test error: ${err.message}`);
  process.exit(1);
});
