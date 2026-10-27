const assert = require('assert');
const path = require('path');

// Import compiled AIProviderService
const { aiProvider } = require('../dist/services/aiProvider');

console.log('=================================================================');
console.log('   AGRORENT AI: AI FALLBACK & SAFETY REGRESSION TEST SUITE');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
  }
}

// -------------------------------------------------------------
// Test 1: Missing Context Auditing (Never invent 5 acres or Standard Soil)
// -------------------------------------------------------------
runTest('Missing Context - Never invent 5 acres, Standard Soil, or Kharif in English', () => {
  const result = aiProvider.getAgronomyFallback(
    'Need equipment advice',
    '', // missing crop
    '', // missing soil
    '', // missing acreage
    '', // missing loc
    '', // missing season
    '', // missing obj
    'en',
    []
  );

  // Must NOT invent dummy defaults
  assert(!result.includes('5 acres'), 'Must NOT invent 5 acres default when acreage is empty');
  assert(!result.includes('Standard Soil'), 'Must NOT invent Standard Soil when soil is empty');
  assert(!result.includes('(Kharif Season)'), 'Must NOT invent Kharif Season when season is empty');

  // Must flag missing parameters
  assert(result.includes('Missing Context Notice'), 'Must display Missing Context Notice banner');
  assert(result.includes('Land Acreage'), 'Must flag Land Acreage as missing');
  assert(result.includes('Soil Type'), 'Must flag Soil Type as missing');
  assert(result.includes('Not specified'), 'Must explicitly display Not specified for missing fields');
});

runTest('Missing Context - Flags missing context in Telugu truthfully', () => {
  const result = aiProvider.getAgronomyFallback(
    'సలహా కావాలి',
    '',
    '',
    '',
    '',
    '',
    '',
    'te',
    []
  );

  assert(!result.includes('5 ఎకరాలు'), 'Must NOT invent 5 acres in Telugu');
  assert(result.includes('అసంపూర్ణ వివరాల గమనిక'), 'Must display missing context note in Telugu');
  assert(result.includes('సాగు విస్తీర్ణం'), 'Must flag acreage in Telugu');
  assert(result.includes('పేర్కొనబడలేదు'), 'Must state not specified in Telugu');
});

// -------------------------------------------------------------
// Test 2: Fabricated Savings Claims (Remove 65% across all languages)
// -------------------------------------------------------------
runTest('Economic Claims - Zero occurrences of 65% cost savings in English, Telugu, or Hindi', () => {
  const enRes = aiProvider.getAgronomyFallback('rent vs buy', 'Cotton', 'Black Soil', '8', 'Warangal', 'Rabi', '', 'en', []);
  const teRes = aiProvider.getAgronomyFallback('అద్దె లేదా కొనుగోలు', 'వరి', 'నల్ల రేగడి', '8', 'ఖమ్మం', 'ఖరీఫ్', '', 'te', []);
  const hiRes = aiProvider.getAgronomyFallback('किराया या खरीद', 'गेहूं', 'दोमट', '8', 'भोपाल', 'रबी', '', 'hi', []);

  assert(!enRes.includes('65%'), 'English fallback must NOT claim 65% savings');
  assert(!teRes.includes('65%'), 'Telugu fallback must NOT claim 65% savings');
  assert(!hiRes.includes('65%'), 'Hindi fallback must NOT claim 65% savings');

  assert(!enRes.toLowerCase().includes('65% more cost-effective'), 'Must not have 65% more cost-effective');
  assert(!teRes.includes('65% వరకు ఖర్చు తగ్గిస్తుంది'), 'Must not have 65% Telugu savings claim');
  assert(!hiRes.includes('65% तक किफायती'), 'Must not have 65% Hindi savings claim');
});

// -------------------------------------------------------------
// Test 3: Grounded Nutrient & Fertilizer Advice (No unverified dosages, recommend Soil Health Card)
// -------------------------------------------------------------
runTest('Fertilizer Safety - Do not prescribe arbitrary chemical quantities (50 kg NPK / 21-25 days urea)', () => {
  const enRes = aiProvider.getAgronomyFallback('fertilizer advice', 'Chilli', 'Red Soil', '4', 'Guntur', 'Kharif', '', 'en', []);
  const teRes = aiProvider.getAgronomyFallback('ఎరువుల సలహా', 'మిర్చి', 'ఎర్ర నేల', '4', 'గుంటూరు', 'ఖరీఫ్', '', 'te', []);
  const hiRes = aiProvider.getAgronomyFallback('उर्वरक सलाह', 'मिर्च', 'लाल मिट्टी', '4', 'ग्वालियर', 'खरीफ', '', 'hi', []);

  // Assert NO arbitrary chemical dosages
  assert(!enRes.includes('50 kg/acre'), 'Must not prescribe 50 kg/acre NPK arbitrarily');
  assert(!enRes.includes('21-25 days'), 'Must not prescribe rigid 21-25 days top-dress without context');
  assert(!teRes.includes('50 కిలోలు'), 'Telugu must not prescribe 50 kg NPK arbitrarily');
  assert(!hiRes.includes('50 किग्रा'), 'Hindi must not prescribe 50 kg NPK arbitrarily');

  // Assert presence of Soil Health Card and KVK extension guidance
  assert(enRes.includes('Soil Health Card'), 'English must recommend Soil Health Card');
  assert(enRes.includes('KVK') || enRes.includes('Krishi Vigyan Kendra'), 'English must reference KVK');
  assert(teRes.includes('సాయిల్ హెల్త్ కార్డ్') || teRes.includes('మట్టి పరీక్ష'), 'Telugu must recommend soil testing');
  assert(teRes.includes('KVK') || teRes.includes('కృషి విజ్ఞాన కేంద్రం'), 'Telugu must reference KVK');
  assert(hiRes.includes('मृदा स्वास्थ्य कार्ड') || hiRes.includes('मिट्टी परीक्षण'), 'Hindi must recommend soil testing');
});

// -------------------------------------------------------------
// Test 4: Unavailable Equipment (Never fabricate machinery or unverified prices)
// -------------------------------------------------------------
runTest('Equipment - When equipmentList is empty, states no verified equipment listed', () => {
  const result = aiProvider.getAgronomyFallback('harvester needed', 'Paddy', 'Clay', '10', 'Nellore', 'Rabi', '', 'en', []);

  assert(result.includes('No verified equipment currently listed in your immediate area'), 'Must state no equipment is currently listed');
  assert(!result.includes('Tractor (45-50 HP): Ideal for deep ploughing'), 'Must NOT invent generic machinery rental options');
});

runTest('Equipment - Telugu states no verified equipment honestly when list is empty', () => {
  const result = aiProvider.getAgronomyFallback('ట్రాక్టర్ కావాలి', 'వరి', 'నల్ల రేగడి', '6', 'వరంగల్', 'ఖరీఫ్', '', 'te', []);

  assert(result.includes('ప్రస్తుతం మీ ప్రాంతంలో ధృవీకరించబడిన యంత్రాలు లిస్ట్ చేయబడలేదు'), 'Must state no verified equipment listed in Telugu');
  assert(result.includes('లభ్యత అలర్ట్'), 'Must suggest setting an availability alert');
});

// -------------------------------------------------------------
// Test 5: Verified Real Equipment Integration (Uses confirmed marketplace records)
// -------------------------------------------------------------
runTest('Equipment - When verified equipment is provided, displays actual listing details and live tag', () => {
  const sampleEquipment = [
    { title: 'John Deere 5050D Tractor', category: 'TRACTOR', pricePerDay: 1500, location: 'Kurnool', available: true },
    { title: 'Shaktiman Rotary Tiller', category: 'IMPLEMENT', pricePerDay: 800, location: 'Kurnool', available: true }
  ];

  const result = aiProvider.getAgronomyFallback(
    'Need tractor and rotavator',
    'Cotton',
    'Black Soil',
    '10',
    'Kurnool',
    'Kharif',
    '',
    'en',
    sampleEquipment
  );

  assert(result.includes('John Deere 5050D Tractor'), 'Must include confirmed equipment name');
  assert(result.includes('₹1500/day'), 'Must include confirmed price per day');
  assert(result.includes('Kurnool'), 'Must include confirmed location');
  assert(result.includes('Verified Live Listing'), 'Must indicate verified live listing');
  assert(result.includes('Shaktiman Rotary Tiller'), 'Must include second equipment item');
  assert(result.includes('₹800/day'), 'Must include second item price');
});

runTest('Equipment - Telugu displays verified equipment with Telugu labels', () => {
  const sampleEquipment = [
    { title: 'Mahindra 575 DI Tractor', category: 'ట్రాక్టర్', pricePerDay: 1400, location: 'ఖమ్మం', available: true }
  ];

  const result = aiProvider.getAgronomyFallback(
    'ట్రాక్టర్ అద్దెకు',
    'మిర్చి',
    'ఎర్ర నేల',
    '5',
    'ఖమ్మం',
    'ఖరీఫ్',
    '',
    'te',
    sampleEquipment
  );

  assert(result.includes('Mahindra 575 DI Tractor'), 'Must include equipment title');
  assert(result.includes('₹1400/రోజు'), 'Must format price per day in Telugu');
  assert(result.includes('ఖమ్మం'), 'Must include Telugu location');
  assert(result.includes('నిర్ధారించబడిన లైవ్ లిస్టింగ్'), 'Must tag as verified live listing in Telugu');
});

// -------------------------------------------------------------
// Test 6: Provider Failure & Educational Advisory Header Identification
// -------------------------------------------------------------
runTest('Header Identification - Clearly labels fallback as educational advisory and not disguised live model response', () => {
  const enRes = aiProvider.getAgronomyFallback('Advice', 'Groundnut', 'Sandy Loam', '3', 'Anantapur', 'Kharif', '', 'en', []);
  const teRes = aiProvider.getAgronomyFallback('సలహా', 'వేరుశనగ', 'ఎర్ర నేల', '3', 'అనంతపురం', 'ఖరీఫ్', '', 'te', []);
  const hiRes = aiProvider.getAgronomyFallback('सलाह', 'मूंगफली', 'बलुई', '3', 'झांसी', 'खरीफ', '', 'hi', []);

  assert(enRes.includes('[AgroRent AI General Advisory & Information Guide]'), 'English header must identify as General Advisory Guide');
  assert(enRes.includes('Live AI reasoning model was unavailable'), 'English must state live AI model was unavailable');

  assert(teRes.includes('[AgroRent AI సాధారణ సమాచార మార్గదర్శకం]'), 'Telugu header must identify as general guide');
  assert(teRes.includes('లైవ్ AI మోడల్ అందుబాటులో లేనందున'), 'Telugu must disclose live AI model was unavailable');

  assert(hiRes.includes('[AgroRent AI सामान्य शैक्षिक मार्गदर्शन]'), 'Hindi header must identify as general guide');
  assert(hiRes.includes('लाइव एआई मॉडल अनुपलब्ध होने के कारण'), 'Hindi must disclose live AI model was unavailable');
});

// -------------------------------------------------------------
// Test 7: Language Script Fidelity
// -------------------------------------------------------------
runTest('Language Scripts - High density of native script in Telugu and Hindi', () => {
  const teRes = aiProvider.getAgronomyFallback('సలహా', 'వరి', 'నల్ల నేల', '5', 'గుంటూరు', 'రబీ', '', 'te', []);
  const hiRes = aiProvider.getAgronomyFallback('सलाह', 'गेहूं', 'काली मिट्टी', '5', 'इंदौर', 'रबी', '', 'hi', []);

  const teChars = (teRes.match(/[\u0C00-\u0C7F]/g) || []).length;
  const hiChars = (hiRes.match(/[\u0900-\u097F]/g) || []).length;

  assert(teChars > 100, `Telugu script count must be substantial, got ${teChars}`);
  assert(hiChars > 100, `Hindi script count must be substantial, got ${hiChars}`);
});

console.log('\n-----------------------------------------------------------------');
console.log(`AI Fallback Safety Test Summary: ${passedTests}/${totalTests} Passed`);
console.log('-----------------------------------------------------------------\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log('All AI fallback safety regression tests PASSED successfully!\n');
}
