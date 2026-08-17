const test = require('node:test');
const assert = require('node:assert');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startTestServer, stopTestServer, request } = require('./utils');
const bcrypt = require('bcrypt');

test('AuditLog Verification Suite', async (t) => {
  let serverStarted = false;
  try {
    await startTestServer();
    serverStarted = true;
  } catch (err) {
    assert.fail('Failed to start test server: ' + err.message);
  }

  let testUser;

  await t.test('Setup Test User', async () => {
    const email = `audit-${Date.now()}@example.com`;
    const password = await bcrypt.hash('Password123', 10);
    testUser = await prisma.user.create({
      data: {
        email,
        name: 'Audit User',
        password,
        role: 'FARMER',
        isVerified: true
      }
    });
  });

  await t.test('AuditLog records Failed Login', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUser.email, password: 'WrongPassword' })
    });
    
    assert.strictEqual(res.status, 401, 'Expected 401 Unauthorized: ' + JSON.stringify(res.data));

    // Wait for async log creation
    await new Promise(r => setTimeout(r, 1000));

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'FAILED_LOGIN',
        actorId: testUser.id
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    assert.strictEqual(logs.length, 1, 'Missing FAILED_LOGIN log');
  });

  await t.test('AuditLog records Successful Login', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUser.email, password: 'Password123' })
    });
    
    assert.strictEqual(res.status, 200, 'Expected 200 OK: ' + JSON.stringify(res.data));

    // Wait for async log creation
    await new Promise(r => setTimeout(r, 1000));

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'LOGIN',
        actorId: testUser.id
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    assert.strictEqual(logs.length, 1, 'Missing LOGIN log');
  });

  await t.test('Cleanup Test User', async () => {
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  if (serverStarted) {
    stopTestServer();
  }
});
