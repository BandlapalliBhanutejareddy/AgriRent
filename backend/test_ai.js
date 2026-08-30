const { aiProvider } = require('./dist/services/aiProvider');
const dotenv = require('dotenv');
dotenv.config();

async function runTests() {
  console.log('Testing Qwen:0.5b');
  const start = Date.now();
  
  try {
    console.log('\n--- 1. Search Intent ---');
    let t0 = Date.now();
    let res = await aiProvider.getSearchIntent('ట్రాక్టర్ కావాలి');
    console.log(`Result: ${res}`);
    console.log(`Latency: ${(Date.now() - t0)/1000}s`);

    console.log('\n--- 2. Translation ---');
    t0 = Date.now();
    res = await aiProvider.translateListing('Tractor for rent', 'Good condition 50HP tractor');
    console.log(`Result:`, res);
    console.log(`Latency: ${(Date.now() - t0)/1000}s`);

    console.log('\n--- 3. Recommendations ---');
    t0 = Date.now();
    res = await aiProvider.getEquipmentRecommendations('Rice', 'Clay', '5');
    console.log(`Result:`, res);
    console.log(`Latency: ${(Date.now() - t0)/1000}s`);

    console.log('\n--- 4. Advisor (Telugu) ---');
    t0 = Date.now();
    res = await aiProvider.getAdvisorAdvice('How to stop insects?', 'Telugu', [{name: 'Sprayer'}]);
    console.log(`Result length: ${res.length} chars`);
    console.log(`Latency: ${(Date.now() - t0)/1000}s`);
    
    const totalLatency = (Date.now() - start)/1000;
    console.log(`\nTotal Time: ${totalLatency}s`);
    console.log(`Average Latency per call: ${totalLatency/4}s`);
  } catch(e) {
    console.error(e);
  }
}

runTests();
