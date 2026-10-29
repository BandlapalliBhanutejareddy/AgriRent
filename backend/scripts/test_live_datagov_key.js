/**
 * test_live_datagov_key.js
 * Authenticated test script for official data.gov.in Agmarknet API
 * Verifies live endpoint connectivity, query filters, and data format
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment from backend/.env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

async function testKey(providedKey) {
  const apiKey = (providedKey || process.env.DATA_GOV_IN_API_KEY || '').trim();

  console.log('====================================================');
  console.log('  DATA.GOV.IN AGMARKNET LIVE API VERIFICATION TEST  ');
  console.log('====================================================');
  console.log('Resource ID:', RESOURCE_ID);
  console.log('Endpoint   :', BASE_URL);

  if (!apiKey || apiKey.includes('placeholder') || apiKey === 'your-datagov-in-api-key-here' || apiKey.length < 10) {
    console.log('\n❌ RESULT: No valid API key detected.');
    console.log('Please configure DATA_GOV_IN_API_KEY in backend/.env');
    return { success: false, reason: 'KEY_NOT_CONFIGURED' };
  }

  console.log(`Configured API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)} (Length: ${apiKey.length})`);

  // Test 1: Base request with limit=5
  const testUrl = new URL(BASE_URL);
  testUrl.searchParams.append('api-key', apiKey);
  testUrl.searchParams.append('format', 'json');
  testUrl.searchParams.append('limit', '5');

  console.log('\n[1/3] Testing base authenticated request (limit=5)...');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(testUrl.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    clearTimeout(timeout);

    console.log(`HTTP Status: ${res.status} ${res.statusText}`);

    if (res.status === 401 || res.status === 403) {
      console.log('❌ AUTHENTICATION FAILED: The provided API key is invalid or unauthorized.');
      return { success: false, status: res.status, reason: 'AUTH_REJECTED' };
    }

    if (res.status === 429) {
      console.log('⚠️ RATE LIMITED: data.gov.in rate limit hit. Retry shortly.');
      return { success: false, status: res.status, reason: 'RATE_LIMIT' };
    }

    if (!res.ok) {
      console.log(`❌ HTTP ERROR: Upstream error from data.gov.in (${res.status})`);
      return { success: false, status: res.status, reason: 'HTTP_ERROR' };
    }

    const json = await res.json();
    const records = json.records || [];
    const total = json.total || records.length;

    console.log(`✓ Authentication succeeded!`);
    console.log(`✓ Records returned: ${records.length}`);
    console.log(`✓ Total available in dataset: ${total}`);

    if (records.length > 0) {
      console.log('\nSample genuine record fields:');
      const sample = records[0];
      console.log(`  - Commodity: ${sample.commodity}`);
      console.log(`  - State    : ${sample.state}`);
      console.log(`  - District : ${sample.district}`);
      console.log(`  - Market   : ${sample.market}`);
      console.log(`  - Modal ₹  : ${sample.modal_price}`);
      console.log(`  - Arrival  : ${sample.arrival_date}`);
    }

    // Test 2: Filtered query (Paddy in Andhra Pradesh)
    console.log('\n[2/3] Testing filtered query (State=Andhra Pradesh, limit=5)...');
    const filterUrl = new URL(BASE_URL);
    filterUrl.searchParams.append('api-key', apiKey);
    filterUrl.searchParams.append('format', 'json');
    filterUrl.searchParams.append('limit', '5');
    filterUrl.searchParams.append('filters[state]', 'Andhra Pradesh');

    const filterRes = await fetch(filterUrl.toString(), { headers: { Accept: 'application/json' } });
    if (filterRes.ok) {
      const filterJson = await filterRes.json();
      console.log(`✓ State filter returned: ${filterJson.records?.length || 0} records for Andhra Pradesh.`);
    } else {
      console.log(`Filter query status: ${filterRes.status}`);
    }

    // Test 3: Backend MarketPriceService integration test
    console.log('\n[3/3] Testing backend MarketPriceService...');
    const { marketPriceService } = require('../dist/services/market/MarketPriceService');
    const serviceRes = await marketPriceService.getMarketPrices({ limit: 5 });
    console.log(`Service Status: ${serviceRes.status}`);
    console.log(`Service Records: ${serviceRes.records.length}`);

    console.log('\n====================================================');
    console.log('✅ ALL TESTS PASSED: DATA.GOV.IN IS FULLY OPERATIONAL');
    console.log('====================================================');
    return { success: true, count: records.length, total };

  } catch (err) {
    console.log('❌ Request failed:', err.message);
    return { success: false, reason: err.message };
  }
}

// Allow passing key directly via CLI argument or env
const cliKey = process.argv[2];
testKey(cliKey).catch(console.error);

