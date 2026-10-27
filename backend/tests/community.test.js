const test = require('node:test');
const assert = require('node:assert');
const { startTestServer, stopTestServer, request } = require('./utils');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

test('AgroRent Farmer Community Suite', async (t) => {
  let serverStarted = false;
  try {
    await startTestServer();
    serverStarted = true;
  } catch (err) {
    assert.fail('Failed to start test server: ' + err.message);
  }

  let farmerA, farmerB, ownerUser;
  let tokenFarmerA, tokenFarmerB, tokenOwner;
  let messageAId, messageBId;

  t.after(async () => {
    stopTestServer();
    // Cleanup created test records
    try {
      if (farmerA?.id) await prisma.communityMessage.deleteMany({ where: { senderId: { in: [farmerA.id, farmerB?.id || ''].filter(Boolean) } } });
      if (farmerA?.id) await prisma.user.deleteMany({ where: { id: { in: [farmerA.id, farmerB?.id || '', ownerUser?.id || ''].filter(Boolean) } } });
      await prisma.$disconnect();
    } catch (e) {}
  });

  await t.test('1. Setup Accounts: Farmer A, Farmer B, and Owner', async () => {
    const passwordHash = await bcrypt.hash('SecurePass123!', 10);
    const ts = Date.now();

    // Register Farmer A
    farmerA = await prisma.user.create({
      data: {
        email: `farmer_a_${ts}@agrorent.test`,
        name: 'Ravi Farmer A',
        phone: '9876543210',
        password: passwordHash,
        role: 'FARMER',
        isVerified: true
      }
    });

    // Register Farmer B
    farmerB = await prisma.user.create({
      data: {
        email: `farmer_b_${ts}@agrorent.test`,
        name: 'Suresh Farmer B',
        phone: '9876543211',
        password: passwordHash,
        role: 'FARMER',
        isVerified: true
      }
    });

    // Register Owner
    ownerUser = await prisma.user.create({
      data: {
        email: `owner_${ts}@agrorent.test`,
        name: 'Kiran Owner',
        phone: '9876543212',
        password: passwordHash,
        role: 'OWNER',
        isVerified: true
      }
    });

    // Login Farmer A
    const loginARes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: farmerA.email, password: 'SecurePass123!' })
    });
    assert.strictEqual(loginARes.status, 200, 'Farmer A login failed');
    tokenFarmerA = loginARes.data.token || loginARes.data.data?.token;
    assert.ok(tokenFarmerA, 'Token for Farmer A received');

    // Login Farmer B
    const loginBRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: farmerB.email, password: 'SecurePass123!' })
    });
    assert.strictEqual(loginBRes.status, 200, 'Farmer B login failed');
    tokenFarmerB = loginBRes.data.token || loginBRes.data.data?.token;
    assert.ok(tokenFarmerB, 'Token for Farmer B received');

    // Login Owner
    const loginOwnerRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: ownerUser.email, password: 'SecurePass123!' })
    });
    assert.strictEqual(loginOwnerRes.status, 200, 'Owner login failed');
    tokenOwner = loginOwnerRes.data.token || loginOwnerRes.data.data?.token;
    assert.ok(tokenOwner, 'Token for Owner received');
  });

  await t.test('2. Verify Newly Registered Farmer Receives Community Access Automatically (Idempotent)', async () => {
    // Calling GET /api/community without any manual "join" step
    const resA = await request('/api/community', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenFarmerA}` }
    });
    assert.strictEqual(resA.status, 200, 'Farmer A should have immediate community access');
    const dataA = resA.data.data || resA.data;
    assert.strictEqual(dataA.isMember, true, 'isMember must be true automatically');
    assert.ok(dataA.memberCount >= 2, 'memberCount must include registered farmers');

    // Repeated call is idempotent
    const resA2 = await request('/api/community', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenFarmerA}` }
    });
    assert.strictEqual(resA2.status, 200, 'Repeated access check must be idempotent');
  });

  await t.test('3. Unauthenticated Access is Rejected (401)', async () => {
    const res = await request('/api/community/messages', {
      method: 'GET'
    });
    assert.strictEqual(res.status, 401, 'Unauthenticated GET /api/community/messages must return 401');

    const postRes = await request('/api/community/messages', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello unauth' })
    });
    assert.strictEqual(postRes.status, 401, 'Unauthenticated POST /api/community/messages must return 401');
  });

  await t.test('4. Owner / Admin Participation is Rejected (403)', async () => {
    // Owner trying to GET community
    const getRes = await request('/api/community', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenOwner}` }
    });
    assert.strictEqual(getRes.status, 403, 'Owner cannot participate in Farmer Community (expected 403)');

    // Owner trying to POST message
    const postRes = await request('/api/community/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenOwner}` },
      body: JSON.stringify({ text: 'I am an owner posting to farmer community' })
    });
    assert.strictEqual(postRes.status, 403, 'Owner message post must be rejected with 403');
  });

  await t.test('5. Farmer A Can Send a Message (Identity cannot be spoofed)', async () => {
    // Attempt spoofing by sending a malicious senderId in the body
    const msgText = 'Hello fellow farmers! Does anyone have experience with paddy sowing this season?';
    const res = await request('/api/community/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenFarmerA}` },
      body: JSON.stringify({ text: msgText, senderId: 'fake-spoofed-id-999' })
    });
    if (res.status !== 201) console.log('STEP 5 DEBUG RES:', res.status, JSON.stringify(res.data)); assert.strictEqual(res.status, 201, 'Message post should succeed with 201');
    const msg = res.data.data || res.data;
    assert.strictEqual(msg.text, msgText);
    assert.strictEqual(msg.senderId, farmerA.id, 'Sender identity must be derived from auth token, NOT spoofed body');
    assert.strictEqual(msg.sender.name, farmerA.name);
    messageAId = msg.id;
  });

  await t.test('6. Farmer B Can Read Messages and Reply', async () => {
    // Farmer B reads messages
    const listRes = await request('/api/community/messages', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenFarmerB}` }
    });
    assert.strictEqual(listRes.status, 200, 'Farmer B should be able to list messages');
    const messages = listRes.data.data || listRes.data;
    assert.ok(Array.isArray(messages), 'Messages must be an array');
    const foundA = messages.find((m) => m.id === messageAId);
    assert.ok(foundA, 'Farmer B must see Farmer A message');
    assert.strictEqual(foundA.text, 'Hello fellow farmers! Does anyone have experience with paddy sowing this season?');

    // Farmer B replies
    const replyText = 'Hi Ravi, yes! Sowing in Kharif season requires well-levelled seedbeds.';
    const replyRes = await request('/api/community/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenFarmerB}` },
      body: JSON.stringify({ text: replyText })
    });
    assert.strictEqual(replyRes.status, 201, 'Farmer B reply should succeed');
    const replyMsg = replyRes.data.data || replyRes.data;
    assert.strictEqual(replyMsg.senderId, farmerB.id);
    messageBId = replyMsg.id;
  });

  await t.test('7. Farmer A Can See Farmer B Reply (Cross-Account Persistence)', async () => {
    const listRes = await request('/api/community/messages', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenFarmerA}` }
    });
    assert.strictEqual(listRes.status, 200);
    const messages = listRes.data.data || listRes.data;
    const foundB = messages.find((m) => m.id === messageBId);
    assert.ok(foundB, 'Farmer A must see Farmer B reply');
    assert.strictEqual(foundB.sender.name, farmerB.name);
  });

  await t.test('8. Messages Remain Persistent Across Invocations', async () => {
    // Query directly from database to confirm persistence in PostgreSQL
    const dbMsgA = await prisma.communityMessage.findUnique({ where: { id: messageAId } });
    assert.ok(dbMsgA, 'Message A must persist in PostgreSQL database');

    const dbMsgB = await prisma.communityMessage.findUnique({ where: { id: messageBId } });
    assert.ok(dbMsgB, 'Message B must persist in PostgreSQL database');
  });

  await t.test('9. Private Contact Information is NOT Exposed in Member List', async () => {
    const membersRes = await request('/api/community/members', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenFarmerA}` }
    });
    assert.strictEqual(membersRes.status, 200);
    const members = membersRes.data.data || membersRes.data;
    assert.ok(Array.isArray(members) && members.length > 0);

    for (const member of members) {
      assert.strictEqual(member.phone, undefined, 'Phone number MUST NOT be exposed in community members');
      assert.strictEqual(member.email, undefined, 'Email MUST NOT be exposed in community members');
      assert.ok(member.id, 'Member id should be present');
      assert.ok(member.name, 'Member name should be present');
    }
  });

  await t.test('10. Validation Limits (Empty message & length limits)', async () => {
    const emptyRes = await request('/api/community/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenFarmerA}` },
      body: JSON.stringify({ text: '   ' })
    });
    assert.strictEqual(emptyRes.status, 400, 'Empty message must return 400');

    const longText = 'a'.repeat(1001);
    const longRes = await request('/api/community/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenFarmerA}` },
      body: JSON.stringify({ text: longText })
    });
    assert.strictEqual(longRes.status, 400, 'Exceeding 1000 characters must return 400');
  });
});
