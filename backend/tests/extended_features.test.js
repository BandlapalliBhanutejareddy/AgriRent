const test = require('node:test');
const assert = require('node:assert');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE_URL = 'http://127.0.0.1:4000/api';

test('AgroRent Extended Suite: Crop Registration, Trends, Public Profile, Weather', async (t) => {
  let farmerA, farmerB, tokenA, tokenB;

  t.after(async () => {
    try {
      if (farmerA?.id) {
        await prisma.farmCrop.deleteMany({ where: { farm: { ownerId: { in: [farmerA.id, farmerB?.id || ''].filter(Boolean) } } } });
        await prisma.farm.deleteMany({ where: { ownerId: { in: [farmerA.id, farmerB?.id || ''].filter(Boolean) } } });
        await prisma.user.deleteMany({ where: { id: { in: [farmerA.id, farmerB?.id || ''].filter(Boolean) } } });
      }
      await prisma.$disconnect();
    } catch (_) {}
  });

  await t.test('1. Setup Farmers with farms and authenticate', async () => {
    const hash = await bcrypt.hash('TestPass123!', 10);
    const ts = Date.now();

    farmerA = await prisma.user.create({
      data: {
        email: `crop_farmer_a_${ts}@agrorent.test`,
        name: 'Ravi Crops A',
        phone: '9876543220',
        password: hash,
        role: 'FARMER',
        isVerified: true,
      }
    });

    farmerB = await prisma.user.create({
      data: {
        email: `crop_farmer_b_${ts}@agrorent.test`,
        name: 'Suresh Crops B',
        phone: '9876543221',
        password: hash,
        role: 'FARMER',
        isVerified: true,
      }
    });

    // Login A
    const resA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: farmerA.email, password: 'TestPass123!' })
    });
    const dataA = await resA.json();
    assert.strictEqual(resA.status, 200);
    tokenA = dataA.token || dataA.accessToken || dataA.data?.token || dataA.data?.accessToken;

    // Login B
    const resB = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: farmerB.email, password: 'TestPass123!' })
    });
    const dataB = await resB.json();
    assert.strictEqual(resB.status, 200);
    tokenB = dataB.token || dataB.accessToken || dataB.data?.token || dataB.data?.accessToken;

    assert.ok(tokenA, 'Token A should exist');
    assert.ok(tokenB, 'Token B should exist');
  });

  await t.test('2. Farmer A registers Current Crop (Rice) and Next Planned Crop (Cotton)', async () => {
    const res = await fetch(`${BASE_URL}/community/my-crops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        currentCrop: {
          cropName: 'Rice',
          stage: 'SOWING',
          season: 'Kharif',
          farmLocation: 'Guntur, Andhra Pradesh',
          area: 5.0
        },
        nextCrop: {
          cropName: 'Cotton',
          season: 'Rabi'
        }
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.currentCrop.cropName, 'Rice');
    assert.strictEqual(body.currentCrop.status, 'ACTIVE');
    assert.strictEqual(body.nextCrop.cropName, 'Cotton');
    assert.strictEqual(body.nextCrop.status, 'PLANNED');
  });

  await t.test('3. Farmer B registers Current Crop (Chilli)', async () => {
    const res = await fetch(`${BASE_URL}/community/my-crops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        currentCrop: {
          cropName: 'Chilli',
          stage: 'VEGETATIVE',
          season: 'Kharif',
          farmLocation: 'Warangal, Telangana',
          area: 3.5
        }
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.currentCrop.cropName, 'Chilli');
  });

  await t.test('4. GET /community/members reflects registered crops and strict privacy', async () => {
    const res = await fetch(`${BASE_URL}/community/members`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const members = Array.isArray(json) ? json : (json.data || []);
    assert.ok(Array.isArray(members), 'Members should be an array');

    const memberA = members.find(m => m.id === farmerA.id);
    assert.ok(memberA, 'Farmer A must be in members list');
    assert.strictEqual(memberA.name, 'Ravi Crops A');
    assert.strictEqual(memberA.currentCrop?.cropName, 'Rice');
    assert.strictEqual(memberA.nextCrop?.cropName, 'Cotton');

    // Strict privacy verification: NO phone, NO email exposed
    assert.strictEqual(memberA.phone, undefined);
    assert.strictEqual(memberA.email, undefined);
  });

  await t.test('5. GET /community/members/:id returns detailed Farmer Public Profile', async () => {
    const res = await fetch(`${BASE_URL}/community/members/${farmerA.id}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const profile = json.data || json;
    assert.strictEqual(profile.id, farmerA.id);
    assert.strictEqual(profile.currentCrop.cropName, 'Rice');
    assert.strictEqual(profile.currentCrop.stage, 'SOWING');
    assert.strictEqual(profile.nextCrop.cropName, 'Cotton');
    assert.ok(profile.farmSummary);

    // Strict privacy verification
    assert.strictEqual(profile.phone, undefined);
    assert.strictEqual(profile.email, undefined);
    assert.strictEqual(profile.password, undefined);
  });

  await t.test('6. GET /community/crop-trends returns real counts and no fake prices', async () => {
    const res = await fetch(`${BASE_URL}/community/crop-trends`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const trends = json.data || json;
    assert.ok(trends.cropTrends.length >= 2, 'Should track at least Rice and Chilli');
    assert.ok(trends.aiExplanation, 'Ollama or fallback explanation must be present');
    assert.strictEqual(trends.marketPriceDisclaimer, 'A reliable selling-price estimate is unavailable because current market-price data is not connected.');

    const riceItem = trends.cropTrends.find(c => c.cropName === 'Rice');
    assert.ok(riceItem);
    assert.ok(riceItem.activeFarmerCount >= 1);
    assert.strictEqual(riceItem.marketPriceStatus, 'UNAVAILABLE');
    assert.strictEqual(riceItem.marketPriceMessage, 'A reliable selling-price estimate is unavailable because current market-price data is not connected.');
  });

  await t.test('7. GET /farms/weather/lookup returns real Open-Meteo weather data', async () => {
    const res = await fetch(`${BASE_URL}/farms/weather/lookup?location=Guntur`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });

    assert.strictEqual(res.status, 200);
    const weather = await res.json();
    assert.strictEqual(weather.success, true);
    assert.ok(weather.data.current, 'Should have current weather');
    assert.ok(typeof weather.data.current.temperature === 'number');
    assert.ok(Array.isArray(weather.data.forecast));
  });
});
