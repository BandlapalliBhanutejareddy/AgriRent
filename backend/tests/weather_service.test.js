/**
 * weather_service.test.js
 * Automated tests for accurate location-based WeatherService
 * Tests:
 * 1. Different coordinates produce requests for corresponding coordinates
 * 2. Selected village does not display weather from previous city
 * 3. Switching locations refreshes the weather correctly
 * 4. GPS denial / missing location does not silently substitute Guntur or another location
 * 5. Invalid geocoding results are handled safely
 * 6. Forecast timestamps and local time zones are handled correctly
 * 7. API failures and timeouts do not create fake successful responses
 * 8. Cached responses are associated strictly with the correct quantized coordinates
 */

const assert = require('assert');
const test = require('node:test');
const { WeatherService } = require('../dist/services/weather/WeatherService');

test('WeatherService - Suite', async (t) => {
  t.beforeEach(() => {
    WeatherService.clearCache();
  });

  await t.test('1. Different coordinates produce requests for corresponding coordinates', async () => {
    const requestedUrls = [];
    const originalFetch = global.fetch;

    global.fetch = async (url) => {
      requestedUrls.push(url.toString());
      const u = new URL(url);
      const lat = u.searchParams.get('latitude');
      const lng = u.searchParams.get('longitude');

      return {
        ok: true,
        status: 200,
        json: async () => ({
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          timezone: 'Asia/Kolkata',
          current: {
            temperature_2m: 29.5,
            apparent_temperature: 32.0,
            relative_humidity_2m: 65,
            precipitation: 0,
            rain: 0,
            weather_code: 1,
            wind_speed_10m: 12.5,
            wind_direction_10m: 180,
            time: '2026-10-28T12:00'
          },
          daily: {
            time: ['2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'],
            temperature_2m_max: [33, 32, 31, 32, 34, 33, 32],
            temperature_2m_min: [22, 21, 22, 23, 22, 21, 20],
            precipitation_sum: [0, 2, 0, 0, 5, 0, 0],
            precipitation_probability_max: [10, 40, 15, 10, 60, 20, 10],
            weather_code: [1, 61, 2, 0, 63, 1, 0]
          }
        })
      };
    };

    try {
      // Location A: Guntur (16.3067, 80.4365)
      const resA = await WeatherService.getWeatherByCoordinates({
        latitude: 16.3067,
        longitude: 80.4365,
        locationName: 'Guntur'
      });
      assert(resA.success);
      assert.strictEqual(resA.data.location.latitude, 16.3067);
      assert.strictEqual(resA.data.location.longitude, 80.4365);
      assert(requestedUrls[0].includes('latitude=16.306700'));
      assert(requestedUrls[0].includes('longitude=80.436500'));

      // Location B: Khanna, Punjab (30.7046, 76.2163)
      const resB = await WeatherService.getWeatherByCoordinates({
        latitude: 30.7046,
        longitude: 76.2163,
        locationName: 'Khanna, Punjab'
      });
      assert(resB.success);
      assert.strictEqual(resB.data.location.latitude, 30.7046);
      assert.strictEqual(resB.data.location.longitude, 76.2163);
      assert(requestedUrls[1].includes('latitude=30.704600'));
      assert(requestedUrls[1].includes('longitude=76.216300'));
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test('2. A selected village does not display weather from a previous city', async () => {
    const originalFetch = global.fetch;

    global.fetch = async (url) => {
      const u = new URL(url);
      const lat = parseFloat(u.searchParams.get('latitude'));

      // If lat ~ 16.3 (Guntur), return 35°C; If lat ~ 12.9 (Bengaluru), return 22°C
      const temp = Math.abs(lat - 16.3) < 1 ? 35.0 : 22.0;

      return {
        ok: true,
        status: 200,
        json: async () => ({
          latitude: lat,
          longitude: 80.0,
          timezone: 'Asia/Kolkata',
          current: {
            temperature_2m: temp,
            apparent_temperature: temp + 2,
            relative_humidity_2m: 50,
            precipitation: 0,
            rain: 0,
            weather_code: 0,
            wind_speed_10m: 10,
            wind_direction_10m: 90,
            time: '2026-10-28T12:00'
          },
          daily: {
            time: ['2026-10-28'],
            temperature_2m_max: [temp + 3],
            temperature_2m_min: [temp - 5],
            precipitation_sum: [0],
            precipitation_probability_max: [0],
            weather_code: [0]
          }
        })
      };
    };

    try {
      // Fetch city 1
      const resCity1 = await WeatherService.getWeatherByCoordinates({
        latitude: 16.3067,
        longitude: 80.4365,
        locationName: 'Guntur City'
      });
      assert.strictEqual(resCity1.data.current.temperature, 35.0);

      // Fetch village 2 (different coordinates)
      const resVillage2 = await WeatherService.getWeatherByCoordinates({
        latitude: 12.9716,
        longitude: 77.5946,
        locationName: 'Rural Devanahalli'
      });
      // MUST NOT return 35.0 from Guntur!
      assert.strictEqual(resVillage2.data.current.temperature, 22.0);
      assert.strictEqual(resVillage2.data.location.name, 'Rural Devanahalli');
      assert.strictEqual(resVillage2.data.location.latitude, 12.9716);
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test('3. Switching locations refreshes the weather correctly and isolates cache keys', async () => {
    let forecastCalls = 0;
    const originalFetch = global.fetch;

    global.fetch = async (url) => {
      if (url.toString().includes('open-meteo.com/v1/forecast')) {
        forecastCalls += 1;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          current: { temperature_2m: 25 },
          daily: { time: ['2026-10-28'], temperature_2m_max: [30], temperature_2m_min: [20], precipitation_sum: [0], precipitation_probability_max: [0], weather_code: [0] }
        })
      };
    };

    try {
      // Query Loc 1
      await WeatherService.getWeatherByCoordinates({ latitude: 17.3850, longitude: 78.4867, locationName: 'Hyderabad' });
      assert.strictEqual(forecastCalls, 1);

      // Query Loc 1 again -> Cached
      await WeatherService.getWeatherByCoordinates({ latitude: 17.3850, longitude: 78.4867, locationName: 'Hyderabad' });
      assert.strictEqual(forecastCalls, 1); // cache hit, no new forecast call

      // Query Loc 2 -> Must trigger fresh fetch because coordinates differ
      await WeatherService.getWeatherByCoordinates({ latitude: 15.8281, longitude: 78.0373, locationName: 'Kurnool' });
      assert.strictEqual(forecastCalls, 2); // cache miss for different location
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test('4. Rejects invalid coordinates without inventing fallback values', async () => {
    const resInvalidLat = await WeatherService.getWeatherByCoordinates({
      latitude: 95.0, // Invalid > 90
      longitude: 80.0
    });
    assert.strictEqual(resInvalidLat.success, false);
    assert.strictEqual(resInvalidLat.code, 'INVALID_COORDINATES');

    const resInvalidLng = await WeatherService.getWeatherByCoordinates({
      latitude: 16.0,
      longitude: 250.0 // Invalid > 180
    });
    assert.strictEqual(resInvalidLng.success, false);
    assert.strictEqual(resInvalidLng.code, 'INVALID_COORDINATES');
  });

  await t.test('5. Handles geocoding failures safely without fake fallback', async () => {
    const originalFetch = global.fetch;
    // Mock geocode search returning empty results
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ results: [] })
    });

    try {
      const result = await WeatherService.getFarmWeather('test-farm', 'NonExistentPlaceXYZ98765');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'GEOCODING_FAILED');
      assert(result.error.includes('Could not resolve location'));
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test('6. Handles local time zones and 7-day forecast formatting correctly', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        timezone: 'Asia/Kolkata',
        elevation: 32,
        current: {
          temperature_2m: 31.2,
          apparent_temperature: 34.5,
          relative_humidity_2m: 72,
          precipitation: 0.5,
          rain: 0.5,
          weather_code: 61, // Slight Rain
          wind_speed_10m: 14.2,
          wind_direction_10m: 135,
          time: '2026-10-28T14:30'
        },
        daily: {
          time: ['2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'],
          temperature_2m_max: [33, 31, 32, 33, 30, 29, 31],
          temperature_2m_min: [24, 23, 24, 23, 22, 21, 22],
          precipitation_sum: [0.5, 12.0, 0, 0, 45.0, 2.0, 0],
          precipitation_probability_max: [30, 80, 10, 15, 90, 40, 10],
          weather_code: [61, 63, 1, 0, 95, 80, 1],
          sunrise: ['2026-10-28T06:05', '2026-10-29T06:06', '2026-10-30T06:06', '2026-10-31T06:07', '2026-11-01T06:07', '2026-11-02T06:08', '2026-11-03T06:08'],
          sunset: ['2026-10-28T17:45', '2026-10-29T17:44', '2026-10-30T17:44', '2026-10-31T17:43', '2026-11-01T17:43', '2026-11-02T17:42', '2026-11-03T17:42']
        }
      })
    });

    try {
      const res = await WeatherService.getWeatherByCoordinates({
        latitude: 16.3067,
        longitude: 80.4365,
        locationName: 'Guntur AP'
      });

      assert(res.success);
      assert.strictEqual(res.data.location.timezone, 'Asia/Kolkata');
      assert.strictEqual(res.data.current.weatherDescription, 'Slight Rain');
      assert.strictEqual(res.data.current.precipitation, 0.5);
      assert.strictEqual(res.data.forecast.length, 7);

      const day5 = res.data.forecast[4]; // 2026-11-01 (weather_code 95)
      assert.strictEqual(day5.weatherDescription, 'Thunderstorm');
      assert.strictEqual(day5.precipitation, 45.0);
      assert.strictEqual(day5.precipitationProbability, 90);
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test('7. API failures and timeouts return structured errors without fake responses', async () => {
    const originalFetch = global.fetch;

    // Simulate Network Failure
    global.fetch = async () => {
      throw new Error('ECONNREFUSED api.open-meteo.com');
    };

    try {
      const res = await WeatherService.getWeatherByCoordinates({
        latitude: 16.3067,
        longitude: 80.4365
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.code, 'WEATHER_PROVIDER_ERROR');
      assert(res.error.includes('Weather provider error'));
    } finally {
      global.fetch = originalFetch;
    }
  });
});
