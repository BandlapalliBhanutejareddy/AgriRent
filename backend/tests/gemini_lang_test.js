require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function runLangTests() {
  const baseUrl = 'http://localhost:4000/api';

  try {
    const user = await prisma.user.findFirst({ where: { email: 'farmer@agrorent.ai' } });
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '15m' });

    const langs = ['English', 'Telugu', 'Hindi', 'Tamil', 'Kannada'];
    let passed = true;

    for (const lang of langs) {
      const res = await fetch(`${baseUrl}/ai/advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ prompt: 'Recommend an equipment for paddy', language: lang })
      });
      
      const data = await res.json();
      if (res.status === 200 && data.reply) {
        console.log(`[${lang}] PASS - Length: ${data.reply.length}`);
      } else {
        console.log(`[${lang}] FAIL - Status: ${res.status}, Body: ${JSON.stringify(data)}`);
        passed = false;
      }
    }

    if (passed) console.log('MULTI-LANGUAGE AI: PASS');
    else console.log('MULTI-LANGUAGE AI: FAIL');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

runLangTests();
