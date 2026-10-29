/**
 * farmer_alerts.test.js
 * Automated tests for Phase 5: Actionable Weather & Crop Alerts, Preferences, and Deduplication
 */

const assert = require('assert');
const test = require('node:test');
const { prisma } = require('../dist/lib/prisma');
const { WeatherAlertService } = require('../dist/services/weather/WeatherAlertService');

test('Farmer Alerts & Risk Engine - Suite', async (t) => {
  let testUser;
  let testFarm;

  t.before(async () => {
    testUser = await prisma.user.findFirst({ where: { role: 'FARMER' } });
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          name: 'Alert Test Farmer',
          email: `alert_farmer_${Date.now()}@agrorent.ai`,
          password: 'hashed_password',
          role: 'FARMER'
        }
      });
    }

    testFarm = await prisma.farm.findFirst({ where: { ownerId: testUser.id } });
    if (!testFarm) {
      testFarm = await prisma.farm.create({
        data: {
          ownerId: testUser.id,
          name: 'Green Alert Field',
          location: 'Tenali, Guntur AP',
          latitude: 16.2435,
          longitude: 80.6400,
          area: 5,
          soilType: 'Black Soil'
        }
      });
    }

    // Clear test alerts for this user
    await prisma.farmerAlert.deleteMany({ where: { userId: testUser.id } });
    await prisma.farmerAlertPreference.deleteMany({ where: { userId: testUser.id } });
  });

  t.after(async () => {
    await prisma.farmerAlert.deleteMany({ where: { userId: testUser.id } });
    await prisma.farmerAlertPreference.deleteMany({ where: { userId: testUser.id } });
  });

  await t.test('1. Evaluates Heavy Rain rule and generates CRITICAL alert for >=50mm', async () => {
    const mockWeather = {
      success: true,
      data: {
        farmId: testFarm.id,
        location: { latitude: 16.24, longitude: 80.64, name: 'Tenali', timezone: 'Asia/Kolkata' },
        current: {
          temperature: 28,
          apparentTemperature: 30,
          humidity: 85,
          precipitation: 5,
          rain: 5,
          weatherCode: 65,
          weatherDescription: 'Heavy Rain',
          windSpeed: 10,
          windDirection: 180,
          observedAt: new Date().toISOString()
        },
        forecast: [
          {
            date: '2026-10-29',
            minTemperature: 22,
            maxTemperature: 28,
            precipitation: 55, // >= 50 mm -> CRITICAL
            precipitationProbability: 95,
            weatherCode: 65,
            weatherDescription: 'Heavy Rain'
          }
        ],
        source: 'Open-Meteo',
        fetchedAt: new Date().toISOString()
      }
    };

    await WeatherAlertService.evaluate(testUser.id, testFarm.id, testFarm.name, mockWeather);

    const alerts = await prisma.farmerAlert.findMany({
      where: { userId: testUser.id, category: 'WEATHER_HEAVY_RAIN' }
    });

    assert.strictEqual(alerts.length, 1);
    assert.strictEqual(alerts[0].severity, 'CRITICAL');
    assert(alerts[0].title.includes('Severe Rainfall Warning'));
    assert(alerts[0].recommendedAction.includes('Postpone tractor tillage'));
  });

  await t.test('2. Deduplication: Does not generate duplicate alert for same condition within 24h', async () => {
    const mockWeather = {
      success: true,
      data: {
        farmId: testFarm.id,
        location: { latitude: 16.24, longitude: 80.64, name: 'Tenali', timezone: 'Asia/Kolkata' },
        current: {
          temperature: 28,
          apparentTemperature: 30,
          humidity: 85,
          precipitation: 5,
          rain: 5,
          weatherCode: 65,
          weatherDescription: 'Heavy Rain',
          windSpeed: 10,
          windDirection: 180,
          observedAt: new Date().toISOString()
        },
        forecast: [
          {
            date: '2026-10-29',
            minTemperature: 22,
            maxTemperature: 28,
            precipitation: 55,
            precipitationProbability: 95,
            weatherCode: 65,
            weatherDescription: 'Heavy Rain'
          }
        ],
        source: 'Open-Meteo',
        fetchedAt: new Date().toISOString()
      }
    };

    // Re-evaluate immediately
    await WeatherAlertService.evaluate(testUser.id, testFarm.id, testFarm.name, mockWeather);

    const alerts = await prisma.farmerAlert.findMany({
      where: { userId: testUser.id, category: 'WEATHER_HEAVY_RAIN' }
    });

    assert.strictEqual(alerts.length, 1, 'Duplicate alert must be prevented');
  });

  await t.test('3. Evaluates Strong Wind spray drift advisory rule (>= 20 km/h)', async () => {
    const mockWeatherWind = {
      success: true,
      data: {
        farmId: testFarm.id,
        location: { latitude: 16.24, longitude: 80.64, name: 'Tenali', timezone: 'Asia/Kolkata' },
        current: {
          temperature: 30,
          apparentTemperature: 32,
          humidity: 50,
          precipitation: 0,
          rain: 0,
          weatherCode: 0,
          weatherDescription: 'Clear',
          windSpeed: 24.5, // >= 20 km/h -> WARNING
          windDirection: 270,
          observedAt: new Date().toISOString()
        },
        forecast: [],
        source: 'Open-Meteo',
        fetchedAt: new Date().toISOString()
      }
    };

    await WeatherAlertService.evaluate(testUser.id, testFarm.id, testFarm.name, mockWeatherWind);

    const windAlerts = await prisma.farmerAlert.findMany({
      where: { userId: testUser.id, category: 'WEATHER_STRONG_WIND' }
    });

    assert.strictEqual(windAlerts.length, 1);
    assert.strictEqual(windAlerts[0].severity, 'WARNING');
    assert(windAlerts[0].title.includes('High Wind Spray Drift Risk'));
    assert(windAlerts[0].recommendedAction.includes('Pause all tractor boom sprayers'));
  });

  await t.test('4. Respects user preferences: Suppresses category if disabled in settings', async () => {
    // Disable frost alerts in user preferences
    await prisma.farmerAlertPreference.upsert({
      where: { userId: testUser.id },
      create: { userId: testUser.id, frostAlerts: false },
      update: { frostAlerts: false }
    });

    const mockWeatherFrost = {
      success: true,
      data: {
        farmId: testFarm.id,
        location: { latitude: 16.24, longitude: 80.64, name: 'Tenali', timezone: 'Asia/Kolkata' },
        current: { temperature: 3, apparentTemperature: 1, humidity: 40, precipitation: 0, rain: 0, weatherCode: 0, weatherDescription: 'Clear', windSpeed: 5, windDirection: 0, observedAt: new Date().toISOString() },
        forecast: [
          { date: '2026-10-29', minTemperature: 2, maxTemperature: 15, precipitation: 0, precipitationProbability: 0, weatherCode: 0, weatherDescription: 'Clear' }
        ],
        source: 'Open-Meteo',
        fetchedAt: new Date().toISOString()
      }
    };

    await WeatherAlertService.evaluate(testUser.id, testFarm.id, testFarm.name, mockWeatherFrost);

    const frostAlerts = await prisma.farmerAlert.findMany({
      where: { userId: testUser.id, category: 'WEATHER_FROST' }
    });

    assert.strictEqual(frostAlerts.length, 0, 'Frost alert should be suppressed by preference');
  });

  await t.test('5. Updates read and dismissed alert states cleanly', async () => {
    const alert = await prisma.farmerAlert.findFirst({ where: { userId: testUser.id } });
    assert(alert);

    // Mark as read
    const readUpdated = await prisma.farmerAlert.update({
      where: { id: alert.id },
      data: { isRead: true }
    });
    assert.strictEqual(readUpdated.isRead, true);

    // Dismiss alert
    const dismissedUpdated = await prisma.farmerAlert.update({
      where: { id: alert.id },
      data: { isDismissed: true }
    });
    assert.strictEqual(dismissedUpdated.isDismissed, true);
  });
});

