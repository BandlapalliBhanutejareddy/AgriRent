const assert = require('assert');
const { aiProvider } = require('../dist/services/aiProvider');

console.log('Testing AI Advisor across all 5 languages: Telugu, Tamil, Hindi, Kannada, English');

async function testAllLanguages() {
  const languages = [
    { code: 'te', name: 'Telugu', scriptRegex: /[\u0C00-\u0C7F]/g, minChars: 15 },
    { code: 'ta', name: 'Tamil', scriptRegex: /[\u0B80-\u0BFF]/g, minChars: 15 },
    { code: 'hi', name: 'Hindi', scriptRegex: /[\u0900-\u097F]/g, minChars: 15 },
    { code: 'kn', name: 'Kannada', scriptRegex: /[\u0C80-\u0CFF]/g, minChars: 15 },
    { code: 'en', name: 'English', scriptRegex: /[a-zA-Z]/g, minChars: 50 },
  ];

  let passed = 0;

  for (const lang of languages) {
    console.log(`\nTesting ${lang.name} (${lang.code})...`);
    const response = await aiProvider.getAdvisorAdvice(
      {
        crop: 'Paddy',
        soilType: 'Clay Loam',
        acreage: '4',
        season: 'Kharif',
        question: 'What is the recommended machinery and irrigation for paddy cultivation?'
      },
      lang.name,
      []
    );

    assert(response && response.length > 50, `Response for ${lang.name} should not be empty`);
    
    const scriptMatches = (response.match(lang.scriptRegex) || []).length;
    console.log(`  -> Response length: ${response.length} characters, script match count: ${scriptMatches}`);
    assert(
      scriptMatches >= lang.minChars,
      `Expected at least ${lang.minChars} native script characters for ${lang.name}, got ${scriptMatches}`
    );
    console.log(`  ✓ ${lang.name} validation successful`);
    passed++;
  }

  console.log(`\n=========================================`);
  console.log(`All ${passed}/${languages.length} Language Tests Passed!`);
  console.log(`=========================================`);
}

testAllLanguages().catch(err => {
  console.error('Language test failed:', err);
  process.exit(1);
});
