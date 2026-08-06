const test = require('node:test');
const assert = require('node:assert');
const { startTestServer, stopTestServer, request } = require('./utils');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

test('Auth Verification Suite', async (t) => {
  let serverStarted = false;
  try {
    await startTestServer();
    serverStarted = true;
  } catch (err) {
    assert.fail('Failed to start test server: ' + err.message);
  }

  let testUser;
  let accessToken;
  let refreshToken;

  await t.test('Setup Test User', async () => {
    const email = `test-${Date.now()}@example.com`;
    const password = await bcrypt.hash('Password123', 10);
    testUser = await prisma.user.create({
      data: {
        email,
        name: 'Test User',
        password,
        role: 'FARMER',
        isVerified: true
      }
    });
    assert.ok(testUser.id, 'User created');
  });

  await t.test('Login returns JWT and Refresh Token', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUser.email, password: 'Password123' })
    });
    
    assert.strictEqual(res.status, 200, 'Login failed');
    assert.ok(res.data.token, 'Missing access token');
    assert.ok(res.data.refreshToken, 'Missing refresh token');
    
    accessToken = res.data.token;
    refreshToken = res.data.refreshToken;
  });

  await t.test('Access Protected Endpoint', async () => {
    const res = await request('/api/auth/me', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    assert.strictEqual(res.status, 200, 'Access token failed: ' + JSON.stringify(res.data));
    assert.strictEqual(res.data.email, testUser.email, 'Wrong user returned');
  });

  await t.test('Refresh Token rotates session', async () => {
    const res = await request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    
    assert.strictEqual(res.status, 200, 'Refresh failed: ' + JSON.stringify(res.data));
    assert.ok(res.data.token, 'Missing new access token');
    assert.ok(res.data.refreshToken, 'Missing new refresh token');
    assert.notStrictEqual(res.data.refreshToken, refreshToken, 'Refresh token did not rotate');
    
    refreshToken = res.data.refreshToken; // Save the new one
  });

  await t.test('Logout revokes session', async () => {
    const res = await request('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    
    assert.strictEqual(res.status, 200, 'Logout failed');
    
    // Attempting to refresh again should fail
    const refreshRes = await request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    assert.strictEqual(refreshRes.status, 401, 'Should fail to refresh after logout');
  });

  await t.test('Cleanup Test User', async () => {
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  if (serverStarted) {
    stopTestServer();
  }
});
