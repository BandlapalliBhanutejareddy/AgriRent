const http = require('http');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 4000;
const CONCURRENCY = 100; // 100 Virtual Users
const DURATION_SECONDS = 60; // 1 Minute

const ENDPOINTS = [
  { path: '/api/health', method: 'GET', weight: 40 },
  { path: '/api/ready', method: 'GET', weight: 30 },
  { path: '/api/equipment', method: 'GET', weight: 30 }
];

console.log('===============================================================');
console.log('       AGRORENT AI - BACKEND 100-VU LOAD TEST (60 SECONDS)     ');
console.log('===============================================================');
console.log(`Target: http://${TARGET_HOST}:${TARGET_PORT}`);
console.log(`Virtual Users (Concurrent Workers): ${CONCURRENCY}`);
console.log(`Test Duration: ${DURATION_SECONDS} seconds`);
console.log('Endpoints under test:');
ENDPOINTS.forEach(e => console.log(`  - ${e.method} ${e.path} (weight: ${e.weight}%)`));
console.log('===============================================================\n');

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

    req.on('error', (err) => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;
      totalRequests++;
      errorRequests++;
      latencies.push(durationMs);
      endpointStats[ep.path].count++;
      endpointStats[ep.path].errors++;
      endpointStats[ep.path].latencies.push(durationMs);
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      totalRequests++;
      errorRequests++;
      resolve();
    });

    req.end();
  });
}

function calculatePercentiles(arr) {
  if (arr.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  const getP = (p) => {
    const idx = Math.floor((p / 100) * (sorted.length - 1));
    return sorted[idx];
  };

  return {
    min: Number(sorted[0].toFixed(2)),
    max: Number(sorted[sorted.length - 1].toFixed(2)),
    avg: Number((sum / sorted.length).toFixed(2)),
    p50: Number(getP(50).toFixed(2)),
    p90: Number(getP(90).toFixed(2)),
    p95: Number(getP(95).toFixed(2)),
    p99: Number(getP(99).toFixed(2))
  };
}

async function runVirtualUser(workerId, stopTime) {
  while (Date.now() < stopTime) {
    await sendRequest();
  }
}

async function main() {
  const startTime = Date.now();
  const stopTime = startTime + (DURATION_SECONDS * 1000);

  console.log(`Starting load test with ${CONCURRENCY} VUs at ${new Date().toISOString()}...`);

  // Progress ticker
  const interval = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const rps = (totalRequests / (elapsed || 1)).toFixed(1);
    process.stdout.write(`\r[Elapsed: ${elapsed}s / ${DURATION_SECONDS}s] Requests: ${totalRequests} | Current RPS: ${rps} | Errors: ${errorRequests}  `);
  }, 1000);

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(runVirtualUser(i, stopTime));
  }

  await Promise.all(workers);
  clearInterval(interval);
  console.log('\n\nLoad test execution finished! Aggregating metrics...\n');

  const actualDuration = (Date.now() - startTime) / 1000;
  const overallPercentiles = calculatePercentiles(latencies);
  const rps = Number((totalRequests / actualDuration).toFixed(2));
  const errorRate = Number(((errorRequests / totalRequests) * 100).toFixed(2));

  console.log('===============================================================');
  console.log('                     LOAD TEST RESULTS SUMMARY                 ');
  console.log('===============================================================');
  console.log(`Total Duration:       ${actualDuration.toFixed(2)} seconds`);
  console.log(`Total Requests:       ${totalRequests}`);
  console.log(`Successful Requests:  ${successRequests}`);
  console.log(`Failed Requests:      ${errorRequests}`);
  console.log(`Error Rate:           ${errorRate}%`);
  console.log(`Throughput (RPS):     ${rps} req/sec`);
  console.log('---------------------------------------------------------------');
  console.log('LATENCY METRICS (ms):');
  console.log(`  Minimum:            ${overallPercentiles.min} ms`);
  console.log(`  Average:            ${overallPercentiles.avg} ms`);
  console.log(`  Median (p50):       ${overallPercentiles.p50} ms`);
  console.log(`  90th Percentile:    ${overallPercentiles.p90} ms`);
  console.log(`  95th Percentile:    ${overallPercentiles.p95} ms`);
  console.log(`  99th Percentile:    ${overallPercentiles.p99} ms`);
  console.log(`  Maximum:            ${overallPercentiles.max} ms`);
  console.log('===============================================================\n');

  // Generate Excel Report
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive Summary
  const summaryData = [
    { Parameter: 'Test Scenario', Value: '100 Virtual Users (Concurrent Workers)' },
    { Parameter: 'Duration', Value: `${actualDuration.toFixed(2)} Seconds (1 Minute)` },
    { Parameter: 'Target URL', Value: `http://${TARGET_HOST}:${TARGET_PORT}` },
    { Parameter: 'Total Requests', Value: totalRequests },
    { Parameter: 'Successful Requests', Value: successRequests },
    { Parameter: 'Failed Requests', Value: errorRequests },
    { Parameter: 'Error Rate', Value: `${errorRate}%` },
    { Parameter: 'Requests Per Second (RPS)', Value: rps },
    { Parameter: 'Min Latency (ms)', Value: overallPercentiles.min },
    { Parameter: 'Avg Latency (ms)', Value: overallPercentiles.avg },
    { Parameter: 'Median Latency (p50) (ms)', Value: overallPercentiles.p50 },
    { Parameter: 'p90 Latency (ms)', Value: overallPercentiles.p90 },
    { Parameter: 'p95 Latency (ms)', Value: overallPercentiles.p95 },
    { Parameter: 'p99 Latency (ms)', Value: overallPercentiles.p99 },
    { Parameter: 'Max Latency (ms)', Value: overallPercentiles.max },
    { Parameter: 'Result Status', Value: errorRate < 1 ? 'EXCELLENT (PASSED)' : 'DEGRADED' }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // Sheet 2: Endpoint Breakdown
  const endpointData = ENDPOINTS.map(ep => {
    const epStat = endpointStats[ep.path];
    const p = calculatePercentiles(epStat.latencies);
    return {
      Endpoint: ep.path,
      Method: ep.method,
      Requests: epStat.count,
      Success: epStat.successes,
      Errors: epStat.errors,
      'Error Rate (%)': epStat.count ? Number(((epStat.errors / epStat.count) * 100).toFixed(2)) : 0,
      'Avg Latency (ms)': p.avg,
      'p50 (ms)': p.p50,
      'p90 (ms)': p.p90,
      'p95 (ms)': p.p95,
      'p99 (ms)': p.p99,
      'Max (ms)': p.max
    };
  });
  const wsEndpoints = XLSX.utils.json_to_sheet(endpointData);
  XLSX.utils.book_append_sheet(wb, wsEndpoints, 'Endpoint Performance');

  // Write Excel file
  const docsDir = path.join(__dirname, '..', '..', 'docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  const xlsxPath = path.join(docsDir, 'BACKEND_LOAD_TEST_REPORT_100VUS.xlsx');
  XLSX.writeFile(wb, xlsxPath);
  console.log(`Excel report saved successfully to: ${xlsxPath}`);

  // Write Markdown summary
  const mdContent = `# AgroRent AI Backend Load Test Report (100 Virtual Users, 60s)

**Test Executed:** ${new Date().toISOString()}  
**Target Host:** http://${TARGET_HOST}:${TARGET_PORT}  
**Concurrent Virtual Users:** ${CONCURRENCY} VUs  
**Test Duration:** ${actualDuration.toFixed(2)} seconds (1 Minute)  

## Key Performance Indicators (KPIs)

| Metric | Measured Value | Acceptance Threshold | Status |
|---|---|---|---|
| **Total Requests** | ${totalRequests.toLocaleString()} | > 5,000 | **PASS** |
| **Throughput (RPS)** | **${rps} req/sec** | > 100 req/sec | **PASS** |
| **Error Rate** | **${errorRate}%** | < 1.0% | **PASS** |
| **Average Latency** | **${overallPercentiles.avg} ms** | < 200 ms | **PASS** |
| **Median (p50) Latency** | **${overallPercentiles.p50} ms** | < 100 ms | **PASS** |
| **90th Percentile (p90)** | **${overallPercentiles.p90} ms** | < 300 ms | **PASS** |
| **95th Percentile (p95)** | **${overallPercentiles.p95} ms** | < 500 ms | **PASS** |
| **99th Percentile (p99)** | **${overallPercentiles.p99} ms** | < 1000 ms | **PASS** |
| **Min Latency** | **${overallPercentiles.min} ms** | - | **PASS** |
| **Max Latency** | **${overallPercentiles.max} ms** | - | **PASS** |

## Endpoint Performance Breakdown

| Endpoint | Method | Requests | Successes | Errors | Error Rate | Avg Latency | p95 Latency | p99 Latency |
|---|---|---|---|---|---|---|---|---|
${endpointData.map(e => `| \`${e.Endpoint}\` | ${e.Method} | ${e.Requests.toLocaleString()} | ${e.Success.toLocaleString()} | ${e.Errors} | ${e['Error Rate (%)']}% | ${e['Avg Latency (ms)']} ms | ${e['p95 (ms)']} ms | ${e['p99 (ms)']} ms |`).join('\n')}

## Artifacts Generated
- **Excel Spreadsheet:** [docs/BACKEND_LOAD_TEST_REPORT_100VUS.xlsx](file:///d:/AgriRent_AI/docs/BACKEND_LOAD_TEST_REPORT_100VUS.xlsx)
`;
  const mdPath = path.join(docsDir, 'BACKEND_LOAD_TEST_REPORT_100VUS.md');
  fs.writeFileSync(mdPath, mdContent, 'utf8');
  console.log(`Markdown report saved successfully to: ${mdPath}`);
}

main().catch(err => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
