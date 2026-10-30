const assert = require('assert');
const { WeatherService } = require('../dist/services/weather/WeatherService');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined
});

async function runVerification() {
  console.log('========================================================');
  console.log('AGRORENT AI — VERIFICATION: GOOGLE SIGN-IN & WEATHER');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    return fn()
      .then(() => {
        console.log(`[PASS] ${name}`);
        passed++;
      })
      .catch((err) => {
        console.error(`[FAIL] ${name}:`, err.message);
      });
  }

  // 1. Google Account verification in DB
  await test('Target Google account exists and has role ADMIN', async () => {
    const user = await prisma.user.findFirst({
      where: { email: { equals: 'bandlapalliteja369@gmail.com', mode: 'insensitive' } }
    });
    assert(user != null, 'User bandlapalliteja369@gmail.com must exist');
    assert.strictEqual(user.role, 'ADMIN', 'User must retain ADMIN role');
    assert.strictEqual(user.isVerified, true, 'User must be verified');
  });

  // 2. Weather by Coordinates
  await test('Weather by coordinates (Chennai: 13.0827, 80.2707) returns valid telemetry', async () => {
    const res = await WeatherService.getWeatherByCoordinates({
      latitude: 13.0827,
      longitude: 80.2707
    });
    assert.strictEqual(res.success, true);
    assert(res.data.current.temperature != null, 'Temperature must be present');
    assert(
      res.data.location?.name?.toLowerCase().includes('tamil nadu') ||
      res.data.location?.name?.toLowerCase().includes('chennai') ||
      res.data.location?.name?.toLowerCase().includes('india'),
      'Location must be resolved'
    );
  });

  // 3. Weather by Place Name Geocoding
  await test('Weather by city geocoding ("Hyderabad") resolves coordinates and weather', async () => {
    const res = await WeatherService.getFarmWeather('current-lookup', 'Hyderabad');
    assert.strictEqual(res.success, true);
    assert(res.data.current.temperature != null);
    assert(res.data.location.latitude > 17 && res.data.location.latitude < 18, 'Latitude must match Hyderabad');
  });

  // 4. Coordinate string with degree symbols and whitespace
  await test('Coordinate string with degree symbols ("13.0266°, 80.0156°") resolves correctly', async () => {
    const res = await WeatherService.getFarmWeather('current-lookup', '13.0266°, 80.0156°');
    assert.strictEqual(res.success, true);
    assert(res.data.current.temperature != null);
  });

  // 5. Invalid place name produces honest error
  await test('Invalid location name returns GEOCODING_FAILED without fake data', async () => {
    const res = await WeatherService.getFarmWeather('current-lookup', 'thisplacedoesnotexistinanyatlas999');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.code, 'GEOCODING_FAILED');
  });

  // 6. Coordinates boundary validation
  await test('Coordinates outside valid latitude [-90, 90] are rejected', async () => {
    const res = await WeatherService.getWeatherByCoordinates({
      latitude: 195.0,
      longitude: 80.0
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.code, 'INVALID_COORDINATES');
  });

  console.log(`\nVerification complete: ${passed}/${total} checks passed.`);
  await prisma.$disconnect();
  if (passed !== total) process.exit(1);
}

runVerification();

