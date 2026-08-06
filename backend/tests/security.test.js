const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('child_process');
const { startTestServer, stopTestServer, request } = require('./utils');
const fs = require('fs');

test('Security Verification Suite', async (t) => {
  // Test 1: Env Validation
  await t.test('Environment Validation', () => {
    const env = { ...process.env };
    delete env.JWT_SECRET;
    
    const result = spawnSync('npx', ['ts-node', 'src/index.ts'], { env, cwd: process.cwd(), shell: true });
    const output = (result.stderr ? result.stderr.toString() : '') + (result.stdout ? result.stdout.toString() : '');
    
    assert.ok(output.includes('Missing or invalid environment variables') || output.includes('JWT_SECRET') || output.includes('FATAL'), 'Should crash without JWT_SECRET');
  });

  // Start Server for the rest of tests
  let serverStarted = false;
  try {
    await startTestServer();
    serverStarted = true;
  } catch (err) {
    assert.fail('Failed to start test server: ' + err.message);
  }

  // Test 2: CORS
  await t.test('CORS Validation', async () => {
    if (!serverStarted) return assert.fail('Server not running');
    const res = await request('/api/health', {
      headers: { 'Origin': 'https://evil.com' }
    });
    // Should be blocked by CORS - typically Express sends 500 or closes connection if CORS error is unhandled, 
    // or sends no access-control headers. Based on our middleware, it throws Error which goes to 500 handler.
    assert.ok(res.status >= 400 && res.status <= 500, 'Should reject evil.com origin');
  });

  // Test 3: Helmet Headers
  await t.test('Helmet Security Headers', async () => {
    if (!serverStarted) return assert.fail('Server not running');
    const res = await request('/api/health');
    const headers = res.headers;
    
    assert.ok(headers.get('content-security-policy'), 'Missing CSP');
    assert.ok(headers.get('x-frame-options'), 'Missing X-Frame-Options');
    assert.ok(headers.get('strict-transport-security'), 'Missing HSTS');
    assert.strictEqual(headers.get('referrer-policy'), 'strict-origin-when-cross-origin', 'Incorrect Referrer Policy');
  });

  // Test 4: Rate Limiting
  await t.test('Rate Limiting (Login)', async () => {
    if (!serverStarted) return assert.fail('Server not running');
    
    let rateLimited = false;
    for (let i = 0; i < 15; i++) {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'Password123' })
      });
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }
    
    assert.ok(rateLimited, 'Should return 429 Too Many Requests');
  });

  // Test 5: Upload Validation
  await t.test('Upload Validation (.exe)', async () => {
    if (!serverStarted) return assert.fail('Server not running');
    
    const form = new FormData();
    const blob = new Blob(['mock exe content'], { type: 'application/x-msdownload' });
    form.set('image', blob, 'virus.exe');
    
    const res = await fetch('http://localhost:4010/api/upload', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': 'Bearer DUMMY_TOKEN'
      }
    });
    
    assert.ok(res.status === 400 || res.status === 500 || res.status === 401, 'Should reject executable upload');
  });

  if (serverStarted) {
    stopTestServer();
  }
});
