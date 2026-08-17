const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function testAuth() {
  const email = `test-${Date.now()}@example.com`;
  const password = await bcrypt.hash('Password123', 10);
  const testUser = await prisma.user.create({
    data: {
      email,
      name: 'Test User',
      password,
      role: 'FARMER',
      isVerified: true
    }
  });

  const loginRes = await fetch('http://localhost:4010/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  console.log('Login Status:', loginRes.status, loginData);

  const meRes = await fetch('http://localhost:4010/api/auth/me', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await meRes.text();
  
  console.log('Me Status:', meRes.status, meData);

  await prisma.user.delete({ where: { id: testUser.id } });
}

testAuth().catch(console.error);
