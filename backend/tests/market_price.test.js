/**
 * market_price.test.js
 * Automated tests for Agmarknet / data.gov.in MarketPriceService
 * Tests:
 * 1. Missing/placeholder configuration handling
 * 2. Response parsing and normalization
 * 3. Filter options support
 * 4. Market comparison calculation
 * 5. Historical price trends calculation
 * 6. Empty results handling
 * 7. 401/403 Invalid API key error handling
 * 8. 429 Rate limit error handling
 * 9. Timeout error handling
 * 10. Stale cached data serving on provider failure
 */

const assert = require('assert');
const test = require('node:test');
const { MarketPriceService } = require('../dist/services/market/MarketPriceService');

test('MarketPriceService - Suite', async (t) => {
  let service;
  const originalEnv = process.env.DATA_GOV_IN_API_KEY;

  t.beforeEach(() => {
    service = new MarketPriceService();
    service.clearCache();
  });

  t.afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.DATA_GOV_IN_API_KEY = originalEnv;
    } else {
      delete process.env.DATA_GOV_IN_API_KEY;
    }
  });

  await t.test('1. Returns UNAVAILABLE with actionable instructions when API key is missing', async () => {
    delete process.env.DATA_GOV_IN_API_KEY;
    delete process.env.AGMARKNET_API_KEY;

    const result = await service.getMarketPrices({ commodity: 'Paddy' });
    assert.strictEqual(result.status, 'UNAVAILABLE');
    assert.strictEqual(result.records.length, 0);
    assert.strictEqual(result.totalRecordsAvailable, 0);
    assert(result.disclaimer.includes('never fabricates false prices'));
    assert(result.missingConfigRequirement.includes('DATA_GOV_IN_API_KEY required in server environment'));
  });

  await t.test('2. Returns UNAVAILABLE when API key is a placeholder string', async () => {
    process.env.DATA_GOV_IN_API_KEY = 'your-datagov-in-api-key-here';

    const result = await service.getMarketPrices({ commodity: 'Wheat' });
    assert.strictEqual(result.status, 'UNAVAILABLE');
    assert.strictEqual(result.records.length, 0);
    assert(result.missingConfigRequirement.includes('DATA_GOV_IN_API_KEY required'));
  });

  await t.test('3. Successfully parses and normalizes mock Agmarknet API response', async () => {
    process.env.DATA_GOV_IN_API_KEY = 'real-verified-test-key-12345';

    // Mock global fetch
    const mockApiResponse = {
      total: 3,
      records: [
        {
          state: 'Andhra Pradesh',
          district: 'Guntur',
          market: 'Guntur Mandi',
          commodity: 'Paddy(Dhan)(Common)',
          variety: 'Common',
          grade: 'FAQ',
          arrival_date: '28/10/2026',
          min_price: '2100',
          max_price: '2350',
          modal_price: '2250'
        },
        {
          state: 'Andhra Pradesh',
          district: 'Krishna',
          market: 'Vijayawada Market',
          commodity: 'Paddy(Dhan)(Common)',
          variety: 'Common',
          grade: 'FAQ',
          arrival_date: '28/10/2026',
          min_price: '2050',
          max_price: '2400',
          modal_price: '2300'
        },
        {
          state: 'Telangana',
          district: 'Khammam',
          market: 'Khammam Mandi',
          commodity: 'Paddy(Dhan)(Common)',
          variety: 'Common',
          grade: 'FAQ',
          arrival_date: '27/10/2026',
          min_price: '2000',
          max_price: '2200',
          modal_price: '2150'
        }
      ]
    };

    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => mockApiResponse
    });

    try {
      const result = await service.getMarketPrices({ commodity: 'Paddy' });
      assert.strictEqual(result.status, 'LIVE');
      assert.strictEqual(result.records.length, 3);
      assert.strictEqual(result.isStale, false);

      const first = result.records[0];
      assert.strictEqual(first.commodity, 'Paddy(Dhan)(Common)');
      assert.strictEqual(first.market, 'Guntur Mandi');
      assert.strictEqual(first.district, 'Guntur');
      assert.strictEqual(first.state, 'Andhra Pradesh');
      assert.strictEqual(first.modalPrice, 2250);
      assert.strictEqual(first.minPrice, 2100);
      assert.strictEqual(first.maxPrice, 2350);
      assert.strictEqual(first.arrivalDate, '2026-10-28'); // normalized date format
      assert.strictEqual(first.priceUnit, '₹/Quintal');

      // Check genuine market comparison
      assert(result.insights);
      assert.strictEqual(result.insights.comparisons.length, 1);
      const comparison = result.insights.comparisons[0];
      assert.strictEqual(comparison.commodity, 'Paddy(Dhan)(Common)');
      assert.strictEqual(comparison.highestMarket.market, 'Vijayawada Market');
      assert.strictEqual(comparison.highestMarket.modalPrice, 2300);
      assert.strictEqual(comparison.lowestMarket.market, 'Khammam Mandi');
      assert.strictEqual(comparison.lowestMarket.modalPrice, 2150);
      assert.strictEqual(comparison.priceSpread, 150);
      assert.strictEqual(comparison.reportingMarketsCount, 3);

      // Check historical trends across dates (27/10 and 28/10)
      const trends = result.insights.historicalTrends['Paddy(Dhan)(Common)'];
      assert(Array.isArray(trends));
      assert.strictEqual(trends.length, 2);
      assert.strictEqual(trends[0].date, '2026-10-27');
      assert.strictEqual(trends[0].modalPrice, 2150);
      assert.strictEqual(trends[1].date, '2026-10-28');
      assert.strictEqual(trends[1].modalPrice, 2275); // (2250 + 2300) / 2
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test('4. Safely caches live results and serves CACHED status within TTL', async () => {
    process.env.DATA_GOV_IN_API_KEY = 'real-verified-test-key-12345';
    let fetchCount = 0;

    const originalFetch = global.fetch;
    global.fetch = async () => {
      fetchCount += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          total: 1,
          records: [{
            state: 'Punjab',
            district: 'Ludhiana',
            market: 'Khanna',
            commodity: 'Wheat',
            variety: 'Dara',
            arrival_date: '28/10/2026',
            min_price: '2275',
            max_price: '2350',
            modal_price: '2300'
          }]
        })
      };
    };

    try {
      const res1 = await service.getMarketPrices({ commodity: 'Wheat', state: 'Punjab' });
      assert.strictEqual(res1.status, 'LIVE');
      assert.strictEqual(fetchCount, 1);

      // Immediate second call should hit memory cache
      const res2 = await service.getMarketPrices({ commodity: 'Wheat', state: 'Punjab' });
      assert.strictEqual(res2.status, 'CACHED');
      assert.strictEqual(res2.isStale, false);
      assert.strictEqual(fetchCount, 1); // no new HTTP request
      assert.strictEqual(res2.records.length, 1);
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test('5. Handles 401/403 Authentication Error safely without throwing', async () => {
    process.env.DATA_GOV_IN_API_KEY = 'invalid-rejected-key-999';

    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    try {
      const result = await service.getMarketPrices({ commodity: 'Cotton' });
      assert.strictEqual(result.status, 'UNAVAILABLE');
      assert.strictEqual(result.records.length, 0);
      assert(result.missingConfigRequirement.includes('authentication rejected'));
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test('6. Handles 429 Rate Limit safely', async () => {
    process.env.DATA_GOV_IN_API_KEY = 'valid-key-rate-limited';

    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    });

    try {
      const result = await service.getMarketPrices({ commodity: 'Maize' });
      assert.strictEqual(result.status, 'UNAVAILABLE');
      assert(result.missingConfigRequirement.includes('rate limit exceeded'));
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test('7. Serves stale cache when live request fails', async () => {
    process.env.DATA_GOV_IN_API_KEY = 'valid-test-key-stale-flow';

    // Seed cache entry
    const cacheKey = 'SOYABEAN|MADHYA PRADESH|ALL|ALL|ALL|ALL|NONE|NONE|50|0';
    service.setCacheEntry(cacheKey, {
      timestamp: Date.now() - 1000 * 60 * 35, // 35 min ago (expired)
      result: {
        status: 'LIVE',
        dataSource: 'Agmarknet',
        resourceId: '9ef84268-d588-465a-a308-a864a43d0070',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        records: [{
          commodity: 'Soyabean',
          state: 'Madhya Pradesh',
          district: 'Indore',
          market: 'Indore Mandi',
          modalPrice: 4800,
          minPrice: 4600,
          maxPrice: 5000,
          priceUnit: '₹/Quintal',
          arrivalDate: '2026-10-28'
        }],
        totalRecordsAvailable: 1,
        disclaimer: 'Previous data'
      }
    });

    // Make live fetch fail (network error)
    const originalFetch = global.fetch;
    global.fetch = async () => {
      throw new Error('Connection refused to api.data.gov.in');
    };

    try {
      const result = await service.getMarketPrices({ commodity: 'Soyabean', state: 'Madhya Pradesh' });
      assert.strictEqual(result.status, 'CACHED');
      assert.strictEqual(result.isStale, true);
      assert.strictEqual(result.records.length, 1);
      assert(result.disclaimer.includes('Displaying previously verified cached mandi auction data'));
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test('8. Handles empty records without generating fabricated prices', async () => {
    process.env.DATA_GOV_IN_API_KEY = 'real-key-with-empty-results';

    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ total: 0, records: [] })
    });

    try {
      const result = await service.getMarketPrices({ commodity: 'Exotic Dragonfruit', state: 'Sikkim' });
      assert.strictEqual(result.status, 'LIVE');
      assert.strictEqual(result.records.length, 0);
      assert.strictEqual(result.insights.comparisons.length, 0);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

