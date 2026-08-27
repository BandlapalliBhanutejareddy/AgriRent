require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function runGeminiTest() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = 'gemini-2.5-flash'; // Let's test the stable one as requested in prompt, or 3.6 if 2.5 is deprecated
    
    // As observed earlier, 2.5-flash is deprecated, I'll use 3.6-flash.
    const actualModel = 'gemini-3.6-flash';
    
    const generatePromise = ai.models.generateContent({
      model: actualModel,
      contents: "Give one short practical recommendation for a farmer growing tomatoes.",
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI Service Timeout')), 15000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);
    
    if (response && response.text) {
      console.log('GEMINI LIVE TEST: PASS');
      console.log(`MODEL: ${actualModel}`);
      console.log('RESPONSE RECEIVED: YES');
      console.log('TEXT:', response.text.substring(0, 50) + '...');
    } else {
      console.log('GEMINI LIVE TEST: FAIL - Empty response');
    }
  } catch (err) {
    console.error('GEMINI LIVE TEST: FAIL');
    console.error('ERROR:', err.message);
    if (err.status) console.error('STATUS:', err.status);
    process.exit(1);
  }
}

runGeminiTest();
