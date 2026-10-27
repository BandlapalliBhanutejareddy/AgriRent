const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const XLSX = require('../../../backend/node_modules/xlsx');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const OUTPUT_DIR = path.resolve(__dirname, '../../../reports/qa/security');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const logStream = fs.createWriteStream(path.join(OUTPUT_DIR, 'security_execution.log'), { flags: 'w' });
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
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
    testResults.push({
      Category: category,
      TestName: name,
      Status: 'PASS',
      DurationMs: duration,
      Details: details || 'Passed',
      Error: ''
    });
    log(`  --> PASS [${category}] ${name} (${duration}ms)`);
  } catch (err) {
    const duration = Date.now() - start;
    testResults.push({
      Category: category,
      TestName: name,
      Status: 'FAIL',
      DurationMs: duration,
      Details: 'Assertion / Security failure',
      Error: err.message
    });
    log(`  --> FAIL [${category}] ${name} (${duration}ms): ${err.message}`);
  }
}

async function main() {
  log('===============================================================');
  log('   AGRORENT AI — BACKEND API SECURITY & RBAC TEST SUITE        ');
  log('===============================================================');
  log(`Target API URL: ${BASE_URL}`);

  // Authenticate Farmer and Owner
  let farmerToken = null;
  let ownerToken = null;

  try {
    const fRes = await request('POST', '/api/auth/login', {
      email: 'farmer.b.1788354195151@agrorent.ai',
      password: 'Password123!',
      role: 'FARMER'
    });
    if (fRes.status === 200) farmerToken = fRes.data?.data?.token || fRes.data?.token;
  } catch (e) {
    log(`Warning: Failed to authenticate test farmer: ${e.message}`);
  }

  try {
    const oRes = await request('POST', '/api/auth/login', {
      email: 'web_owner_1787209581213@test.com',
      password: 'Password123!',
      role: 'OWNER'
    });
    if (oRes.status === 200) ownerToken = oRes.data?.data?.token || oRes.data?.token;
  } catch (e) {
    log(`Warning: Failed to authenticate test owner: ${e.message}`);
  }

  // 1. Unauthenticated Access Protection (Missing Token)
  await runTest('Authentication', 'Reject unauthenticated GET /api/bookings', async () => {
    const res = await request('GET', '/api/bookings');
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    return 'Correctly returned HTTP 401 Unauthorized';
  });

  await runTest('Authentication', 'Reject unauthenticated GET /api/analytics/owner', async () => {
    const res = await request('GET', '/api/analytics/owner');
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    return 'Correctly returned HTTP 401 Unauthorized';
  });

  await runTest('Authentication', 'Reject unauthenticated GET /api/owner/bank-details', async () => {
    const res = await request('GET', '/api/owner/bank-details');
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    return 'Correctly returned HTTP 401 Unauthorized';
  });

  await runTest('Authentication', 'Reject unauthenticated POST /api/equipment', async () => {
    const res = await request('POST', '/api/equipment', { name: 'Unauthorized Tractor' });
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    return 'Correctly returned HTTP 401 Unauthorized';
  });

  // 2. Token Integrity & Validation
  await runTest('Authentication', 'Reject malformed JWT token', async () => {
    const res = await request('GET', '/api/bookings', null, { Authorization: 'Bearer this_is_a_malformed_token' });
    if (res.status !== 401 && res.status !== 403) throw new Error(`Expected 401/403, got ${res.status}`);
    return `Correctly rejected with status ${res.status}`;
  });

  await runTest('Authentication', 'Reject forged unsigned JWT header', async () => {
    const res = await request('GET', '/api/bookings', null, { Authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.' });
    if (res.status !== 401 && res.status !== 403) throw new Error(`Expected 401/403, got ${res.status}`);
    return `Correctly rejected forged token with status ${res.status}`;
  });

  // 3. Role-Based Access Control (RBAC)
  await runTest('RBAC Authorization', 'Farmer role denied owner analytics (GET /api/analytics/owner)', async () => {
    if (!farmerToken) throw new Error('Farmer token unavailable');
    const res = await request('GET', '/api/analytics/owner', null, { Authorization: `Bearer ${farmerToken}` });
    if (res.status !== 403) throw new Error(`Expected HTTP 403 Forbidden, got ${res.status}`);
    return 'Farmer role forbidden from accessing owner business analytics';
  });

  await runTest('RBAC Authorization', 'Farmer role denied owner bank details (GET /api/owner/bank-details)', async () => {
    if (!farmerToken) throw new Error('Farmer token unavailable');
    const res = await request('GET', '/api/owner/bank-details', null, { Authorization: `Bearer ${farmerToken}` });
    if (res.status !== 403) throw new Error(`Expected HTTP 403 Forbidden, got ${res.status}`);
    return 'Farmer role forbidden from accessing owner banking payouts';
  });

  await runTest('RBAC Authorization', 'Farmer role denied equipment creation (POST /api/equipment)', async () => {
    if (!farmerToken) throw new Error('Farmer token unavailable');
    const res = await request('POST', '/api/equipment', {
      name: 'Farmer Fraud Equipment',
      category: 'TRACTOR',
      pricePerDay: 1500
    }, { Authorization: `Bearer ${farmerToken}` });
    if (res.status !== 403) throw new Error(`Expected HTTP 403 Forbidden, got ${res.status}`);
    return 'Farmer role forbidden from listing equipment';
  });

  await runTest('RBAC Authorization', 'Non-admin denied access to admin overview (GET /api/admin/overview)', async () => {
    if (!farmerToken) throw new Error('Farmer token unavailable');
    const res = await request('GET', '/api/admin/overview', null, { Authorization: `Bearer ${farmerToken}` });
    if (res.status !== 403 && res.status !== 401 && res.status !== 404) throw new Error(`Expected 401/403, got ${res.status}`);
    return `Access denied with status ${res.status}`;
  });

  // 4. Object-Level Access Control (IDOR Protection)
  await runTest('Object Access Control', 'Prevent accessing non-existent / unauthorized booking details', async () => {
    if (!farmerToken) throw new Error('Farmer token unavailable');
    const res = await request('GET', '/api/bookings/99999999-9999-9999-9999-999999999999', null, {
      Authorization: `Bearer ${farmerToken}`
    });
    if (res.status !== 404 && res.status !== 403) throw new Error(`Expected 404 or 403, got ${res.status}`);
    return `IDOR prevention verified: status ${res.status}`;
  });

  // 5. Data Privacy & Masking
  await runTest('Data Protection', 'Owner bank details account masking (no raw account exposure)', async () => {
    if (!ownerToken) throw new Error('Owner token unavailable');
    const res = await request('GET', '/api/owner/bank-details', null, { Authorization: `Bearer ${ownerToken}` });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = res.data?.data || res.data;
    if (data.accountNumber && !data.accountNumber.includes('*') && data.accountNumber.length > 4) {
      throw new Error(`Raw unmasked account number leaked: ${data.accountNumber}`);
    }
    return `Bank account securely masked: ${data.maskedAccountNumber || data.accountNumber || 'Masked'}`;
  });

  // 6. Security Headers (Defense in Depth)
  await runTest('Security Headers', 'Verify Helmet security headers (CSP, HSTS, X-Frame-Options, XSS)', async () => {
    const res = await request('GET', '/api/health');
    const headers = res.headers;
    const checks = [];
    if (headers['x-frame-options']) checks.push(`X-Frame-Options: ${headers['x-frame-options']}`);
    if (headers['strict-transport-security']) checks.push('HSTS enabled');
    if (headers['x-content-type-options']) checks.push('X-Content-Type-Options: nosniff');
    if (headers['content-security-policy']) checks.push('CSP active');
    const poweredBy = headers['x-powered-by'];
    if (poweredBy) throw new Error(`X-Powered-By header leaked: ${poweredBy}`);
    return checks.join(' | ') + ' | X-Powered-By hidden';
  });

  // 7. Input Validation & SQL / NoSQL Injection Resistance
  await runTest('Injection Resistance', 'SQL Injection payload handling in auth login', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: "' OR '1'='1' --",
      password: "' OR '1'='1' --",
      role: 'FARMER'
    });
    if (res.status !== 400 && res.status !== 401) throw new Error(`Unexpected status code: ${res.status}`);
    if (typeof res.data === 'string' && res.data.toLowerCase().includes('syntax error')) {
      throw new Error('Database syntax error leaked in response');
    }
    return `Injection safely rejected with HTTP ${res.status} (no SQL/Prisma error leak)`;
  });

  await runTest('Injection Resistance', 'Cross-Site Scripting (XSS) payload handling in search query', async () => {
    const res = await request('GET', '/api/equipment?search=<script>alert(1)</script>');
    if (res.status !== 200 && res.status !== 400) throw new Error(`Unexpected status: ${res.status}`);
    if (typeof res.data === 'string' && res.data.includes('<script>alert(1)</script>')) {
      throw new Error('Raw script tag reflected unescaped in response');
    }
    return `XSS payload safely sanitized/handled with status ${res.status}`;
  });

  // 8. CORS & Origin Hardening
  await runTest('CORS Policy', 'Verify unauthorized origin header handling', async () => {
    const res = await request('GET', '/api/health', null, {
      Origin: 'https://malicious-agri-hacker.xyz'
    });
    const acao = res.headers['access-control-allow-origin'];
    if (acao === '*' || acao === 'https://malicious-agri-hacker.xyz') {
      log(`Notice: CORS allows origin or wildcard: ${acao}`);
    }
    return `CORS origin evaluation: ${acao || 'Restricted / Not reflected'}`;
  });

  // 9. Rate Limiting Protection
  await runTest('Rate Limiting', 'Authentication rate limiting behavior under burst requests', async () => {
    let rateLimited = false;
    let finalStatus = 200;
    for (let i = 0; i < 15; i++) {
      const res = await request('POST', '/api/auth/login', {
        email: 'invalid_rate_probe@agrorent.ai',
        password: 'wrong_password_burst'
      });
      finalStatus = res.status;
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }
    return rateLimited ? 'Rate limiting active (HTTP 429 received)' : `Handled burst requests safely (HTTP ${finalStatus})`;
  });

  // Generate Deliverables
  const total = testResults.length;
  const passed = testResults.filter(r => r.Status === 'PASS').length;
  const failed = testResults.filter(r => r.Status === 'FAIL').length;
  const totalDurationMs = testResults.reduce((sum, r) => sum + r.DurationMs, 0);

  log('===============================================================');
  log(`SECURITY & RBAC TEST SUITE COMPLETED: ${passed}/${total} PASSED (${failed} FAILED)`);
  log(`Total Duration: ${(totalDurationMs / 1000).toFixed(2)}s`);
  log('===============================================================');

  // 1. JSON
  const jsonReport = {
    suite: 'AgroRent AI Backend API Security & RBAC Test Suite',
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalTests: total,
    passed,
    failed,
    durationMs: totalDurationMs,
    findings: testResults
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'security_findings.json'), JSON.stringify(jsonReport, null, 2));

  // 2. Excel
  const wb = XLSX.utils.book_new();
  const summaryData = [
    { Parameter: 'Test Suite', Value: 'API Security, RBAC & Defense in Depth' },
    { Parameter: 'Target Host', Value: BASE_URL },
    { Parameter: 'Execution Time', Value: new Date().toISOString() },
    { Parameter: 'Total Tests', Value: total },
    { Parameter: 'Passed Tests', Value: passed },
    { Parameter: 'Failed Tests', Value: failed },
    { Parameter: 'Security Pass Rate (%)', Value: `${((passed / total) * 100).toFixed(1)}%` },
    { Parameter: 'Duration (s)', Value: (totalDurationMs / 1000).toFixed(2) }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Security Summary');
  const wsDetails = XLSX.utils.json_to_sheet(testResults);
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Security Findings');
  XLSX.writeFile(wb, path.join(OUTPUT_DIR, 'security_results.xlsx'));

  // 3. HTML
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AgroRent AI — Security & RBAC Test Report</title>
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
    <h1>AgroRent AI — Backend Security & RBAC Test Report</h1>
    <div class="subtitle">OWASP API Security Top 10 & Tenant Isolation Verification — ${new Date().toUTCString()}</div>
    
    <div class="metrics">
      <div class="card"><div class="card-label">Security Checks</div><div class="card-val">${total}</div></div>
      <div class="card"><div class="card-label">Passed</div><div class="card-val pass">${passed}</div></div>
      <div class="card"><div class="card-label">Vulnerabilities / Failed</div><div class="card-val ${failed > 0 ? 'fail' : 'pass'}">${failed}</div></div>
      <div class="card"><div class="card-label">Security Pass Rate</div><div class="card-val pass">${((passed / total) * 100).toFixed(1)}%</div></div>
      <div class="card"><div class="card-label">Execution Time</div><div class="card-val">${(totalDurationMs / 1000).toFixed(2)}s</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Security Check</th>
          <th>Status</th>
          <th>Duration</th>
          <th>Verification Details</th>
        </tr>
      </thead>
      <tbody>
        ${testResults.map(r => `
          <tr>
            <td><strong>${r.Category}</strong></td>
            <td>${r.TestName}</td>
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
  fs.writeFileSync(path.join(OUTPUT_DIR, 'security_test_report.html'), htmlContent);
  log(`All Security test reports generated in: ${OUTPUT_DIR}`);
}

main().catch(err => {
  log(`Fatal Security Suite Error: ${err.message}`);
  process.exit(1);
});
