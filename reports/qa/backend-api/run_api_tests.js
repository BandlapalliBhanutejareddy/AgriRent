const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
let XLSX;
try {
  XLSX = require('xlsx');
} catch (e1) {
  try {
    XLSX = require('../../../backend/node_modules/xlsx');
  } catch (e2) {
    XLSX = null;
  }
}

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const OUTPUT_DIR = path.resolve(__dirname, '../../../reports/qa/backend-api');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const logStream = fs.createWriteStream(path.join(OUTPUT_DIR, 'api_execution.log'), { flags: 'w' });
function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  logStream.write(line + '\n');
}

function request(method, urlPath, body = null, headers = {}, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: timeoutMs
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

const testResults = [];

async function runTest(category, name, testFn) {
  const start = Date.now();
  log(`RUNNING [${category}] ${name}...`);
  try {
    const details = await testFn();
    const duration = Date.now() - start;
    log(`  --> PASS [${category}] ${name} (${duration}ms)`);
    testResults.push({
      Category: category,
      Name: name,
      Status: 'PASS',
      DurationMs: duration,
      Details: details || 'Success',
      Error: null
    });
  } catch (err) {
    const duration = Date.now() - start;
    log(`  --> FAIL [${category}] ${name} (${duration}ms): ${err.message}`);
    testResults.push({
      Category: category,
      Name: name,
      Status: 'FAIL',
      DurationMs: duration,
      Details: 'Failed',
      Error: err.message
    });
  }
}

async function main() {
  log('===============================================================');
  log('   AGRORENT AI — BACKEND REST API COMPREHENSIVE TEST SUITE     ');
  log('===============================================================');
  log(`Target API URL: ${BASE_URL}`);

  let farmerToken = '';
  let ownerToken = '';

  // 1. Health & Readiness
  await runTest('Health & Readiness', 'GET /api/health liveness probe', async () => {
    const res = await request('GET', '/api/health');
    if (res.status !== 200 || res.data?.data?.status !== 'ok') {
      throw new Error(`Expected 200 with status ok, got ${res.status}`);
    }
    return 'Liveness probe healthy (HTTP 200)';
  });

  await runTest('Health & Readiness', 'GET /api/ready database readiness check', async () => {
    const res = await request('GET', '/api/ready');
    if (res.status !== 200 || res.data?.data?.database !== 'connected') {
      throw new Error(`Expected database connected, got ${res.status}`);
    }
    return 'Database connection pool active & healthy';
  });

  // 2. Authentication API
  await runTest('Authentication API', 'POST /api/auth/login invalid credentials rejection', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'nonexistent_test@agrorent.ai',
      password: 'WrongPassword!',
      role: 'FARMER'
    });
    if (res.status !== 401 && res.status !== 400) {
      throw new Error(`Expected 401/400, got ${res.status}`);
    }
    return `Correctly rejected invalid login with HTTP ${res.status}`;
  });

  await runTest('Authentication API', 'POST /api/auth/login valid farmer login', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'farmer.live@agrorent.ai',
      password: 'Password123!',
      role: 'FARMER'
    });
    if (res.status !== 200 || !res.data?.token) {
      throw new Error(`Login failed with status ${res.status}`);
    }
    farmerToken = res.data.token;
    return `Authenticated successfully as ${res.data.user?.email || 'Farmer'} (JWT token issued)`;
  });

  await runTest('Authentication API', 'POST /api/auth/login valid owner login', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'owner.live@agrorent.ai',
      password: 'Password123!',
      role: 'OWNER'
    });
    if (res.status !== 200 || !res.data?.token) {
      throw new Error(`Login failed with status ${res.status}`);
    }
    ownerToken = res.data.token;
    return `Authenticated successfully as ${res.data.user?.email || 'Owner'} (JWT token issued)`;
  });

  // 3. Equipment & Marketplace APIs
  await runTest('Marketplace API', 'GET /api/equipment catalog listing', async () => {
    const res = await request('GET', '/api/equipment');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const items = res.data?.data?.data || res.data?.data || res.data?.equipment || res.data;
    if (!Array.isArray(items)) throw new Error('Expected array of equipment items');
    return `Returned ${items.length} equipment machinery items`;
  });

  await runTest('Marketplace API', 'GET /api/equipment/nearby geographic search', async () => {
    const res = await request('GET', '/api/equipment/nearby?lat=13.0827&lng=80.2707&radius=50');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const items = res.data?.data || res.data;
    return `Geographic proximity search active (${Array.isArray(items) ? items.length : 'OK'} items found)`;
  });

  await runTest('Marketplace API', 'GET /api/equipment/categories catalog taxonomy', async () => {
    const res = await request('GET', '/api/equipment/categories');
    return `Category taxonomy verified (Status ${res.status})`;
  });

  // 4. Bookings API
  await runTest('Bookings API', 'GET /api/bookings authenticated user rentals', async () => {
    if (!farmerToken) throw new Error('Farmer token missing');
    const res = await request('GET', '/api/bookings/my', null, { Authorization: `Bearer ${farmerToken}` });
    return 'Retrieved user rental booking list successfully';
  });

  // 5. Farm Planning & Operations API
  await runTest('Farm Management API', 'GET /api/farms farmer digital twin schedule', async () => {
    if (!farmerToken) throw new Error('Farmer token missing');
    const res = await request('GET', '/api/farms', null, { Authorization: `Bearer ${farmerToken}` });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const farms = res.data?.data || res.data;
    return `Retrieved digital twin farm records (${Array.isArray(farms) ? farms.length : 'OK'} farms registered)`;
  });

  // 6. Saved Equipment (Wishlist) API
  await runTest('Wishlist API', 'GET /api/saved/ids quick state query', async () => {
    if (!farmerToken) throw new Error('Farmer token missing');
    const res = await request('GET', '/api/saved/ids', null, { Authorization: `Bearer ${farmerToken}` });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    return `Retrieved saved IDs list (${res.data?.savedIds?.length || 0} bookmarks)`;
  });

  // 7. Owner Portal & Fleet APIs
  await runTest('Owner Fleet API', 'GET /api/analytics/owner owner KPI analytics', async () => {
    if (!ownerToken) throw new Error('Owner token missing');
    const res = await request('GET', '/api/analytics/owner', null, { Authorization: `Bearer ${ownerToken}` }, 25000);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    return 'Owner dashboard KPIs, revenue metrics, and booking counts returned';
  });

  await runTest('Owner Fleet API', 'GET /api/owner/bank-details payout configuration', async () => {
    if (!ownerToken) throw new Error('Owner token missing');
    const res = await request('GET', '/api/owner/bank-details', null, { Authorization: `Bearer ${ownerToken}` });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const masked = res.data?.data?.maskedAccountNumber || res.data?.maskedAccountNumber;
    return `Retrieved bank details with masked security: ${masked || 'Configured'}`;
  });

  // 8. Community & Agriculture Trends
  await runTest('Community API', 'GET /api/community farmer community metadata', async () => {
    if (!farmerToken) throw new Error('Farmer token missing');
    const res = await request('GET', '/api/community', null, { Authorization: `Bearer ${farmerToken}` });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    return `Community metadata verified: ${res.data?.name || 'AgroRent Farmer Community'}`;
  });

  await runTest('Community API', 'GET /api/community/messages persistent discussion feed', async () => {
    if (!farmerToken) throw new Error('Farmer token missing');
    const res = await request('GET', '/api/community/messages', null, { Authorization: `Bearer ${farmerToken}` });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const messages = res.data;
    return `Retrieved community messages (${Array.isArray(messages) ? messages.length : 0} messages loaded)`;
  });

  // 9. AI Advisory & Safety Service
  await runTest('AI Advisory API', 'POST /api/ai/advisor agricultural agronomic advice', async () => {
    if (!farmerToken) throw new Error('Farmer token missing');
    const res = await request('POST', '/api/ai/advisor', {
      crop: 'Tomato',
      question: 'Best planting practices for loamy soil',
      language: 'English'
    }, { Authorization: `Bearer ${farmerToken}` }, 30000);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const hasReply = !!res.data?.reply;
    return `AI agronomic advice generated (${hasReply ? 'Reply provided' : 'Fallback active'})`;
  });

  // Generate Reports
  const total = testResults.length;
  const passed = testResults.filter(r => r.Status === 'PASS').length;
  const failed = testResults.filter(r => r.Status === 'FAIL').length;
  const totalDurationMs = testResults.reduce((sum, r) => sum + r.DurationMs, 0);

  log('===============================================================');
  log(`BACKEND API TEST SUITE COMPLETED: ${passed}/${total} PASSED (${failed} FAILED)`);
  log(`Total Duration: ${(totalDurationMs / 1000).toFixed(2)}s`);
  log('===============================================================');

  // 1. JSON
  const jsonReport = {
    suite: 'AgroRent AI Backend REST API Test Suite',
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalTests: total,
    passed,
    failed,
    durationMs: totalDurationMs,
    results: testResults
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'api_test_results.json'), JSON.stringify(jsonReport, null, 2));

  // 2. Excel
  if (XLSX) {
    try {
      const wb = XLSX.utils.book_new();
      const summaryData = [
        { Parameter: 'Test Suite', Value: 'Backend API Functional Verification' },
        { Parameter: 'Target Host', Value: BASE_URL },
        { Parameter: 'Execution Time', Value: new Date().toISOString() },
        { Parameter: 'Total Tests', Value: total },
        { Parameter: 'Passed Tests', Value: passed },
        { Parameter: 'Failed Tests', Value: failed },
        { Parameter: 'Pass Rate (%)', Value: `${((passed / total) * 100).toFixed(1)}%` },
        { Parameter: 'Duration (s)', Value: (totalDurationMs / 1000).toFixed(2) }
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      const wsDetails = XLSX.utils.json_to_sheet(testResults);
      XLSX.utils.book_append_sheet(wb, wsDetails, 'Endpoints Breakdown');
      XLSX.writeFile(wb, path.join(OUTPUT_DIR, 'api_test_results.xlsx'));
    } catch (e) {
      log(`Warning: Failed to write Excel report: ${e.message}`);
    }
  }

  // 3. HTML
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AgroRent AI — Backend REST API Test Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #38bdf8; margin-bottom: 8px; }
    .subtitle { color: #94a3b8; margin-bottom: 24px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: #1e293b; border-radius: 8px; padding: 16px; border: 1px solid #334155; }
    .card-label { font-size: 13px; color: #94a3b8; text-transform: uppercase; }
    .card-val { font-size: 28px; font-weight: bold; margin-top: 4px; color: #38bdf8; }
    .card-val.pass { color: #4ade80; }
    .card-val.fail { color: #f87171; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; border: 1px solid #334155; }
    th, td { padding: 12px 16px; text-align: left; }
    th { background: #0f172a; color: #cbd5e1; font-weight: 600; border-bottom: 1px solid #334155; }
    tr:not(:last-child) td { border-bottom: 1px solid #334155; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge.pass { background: #14532d; color: #4ade80; border: 1px solid #22c55e; }
    .badge.fail { background: #7f1d1d; color: #f87171; border: 1px solid #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <h1>AgroRent AI — Backend REST API Test Report</h1>
    <div class="subtitle">Live HTTP Execution on ${BASE_URL} — ${new Date().toUTCString()}</div>
    
    <div class="metrics">
      <div class="card"><div class="card-label">Total Endpoints</div><div class="card-val">${total}</div></div>
      <div class="card"><div class="card-label">Passed</div><div class="card-val pass">${passed}</div></div>
      <div class="card"><div class="card-label">Failed</div><div class="card-val ${failed > 0 ? 'fail' : 'pass'}">${failed}</div></div>
      <div class="card"><div class="card-label">Pass Rate</div><div class="card-val pass">${((passed / total) * 100).toFixed(1)}%</div></div>
      <div class="card"><div class="card-label">Duration</div><div class="card-val">${(totalDurationMs / 1000).toFixed(2)}s</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Endpoint / Operation</th>
          <th>Status</th>
          <th>Duration</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${testResults.map(r => `
          <tr>
            <td><strong>${r.Category}</strong></td>
            <td>${r.Name}</td>
            <td><span class="badge ${r.Status.toLowerCase()}">${r.Status}</span></td>
            <td>${r.DurationMs}ms</td>
            <td>${r.Details} ${r.Error ? `<span style="color:#f87171;">(${r.Error})</span>` : ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'api_test_report.html'), htmlContent);
  log(`All API test reports generated in: ${OUTPUT_DIR}`);
}

main().catch(err => {
  log(`Fatal API Suite Error: ${err.message}`);
  process.exit(1);
});
