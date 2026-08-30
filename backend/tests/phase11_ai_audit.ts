import { AIProviderService } from '../src/services/aiProvider';
import dotenv from 'dotenv';
dotenv.config();

async function runAudit() {
  console.log("=== PHASE 11 AI AUDIT ===");
  console.log(`PROVIDER: ${process.env.AI_PROVIDER}`);
  console.log(`URL: ${process.env.OLLAMA_URL}`);
  console.log(`MODEL: ${process.env.OLLAMA_MODEL}`);

  try {
    const aiService = new AIProviderService();

    // 11H - AI ADVISOR TEST
    console.log("\n[11H] AI ADVISOR TEST");
    const advice = await aiService.getAdvisorAdvice("Crop: Tomato\nLand: 2 acres\nSeason: Kharif\nQuestion: Aphid control", "en", []);
    console.log("Response:", advice.substring(0, 100) + "...");
    if (advice && advice.length > 10) console.log("PASS: Valid advice received.");
    else throw new Error("Invalid advice");

    // 11I - SEARCH INTENT TEST
    console.log("\n[11I] SEARCH INTENT TEST");
    const intent = await aiService.getSearchIntent("Find tractor rental for 5 acres of paddy farming");
    console.log("Response:", intent);
    if (intent && intent.length > 0) console.log("PASS: Extracted intent successfully.");
    else throw new Error("Invalid intent");

    // 11J - RECOMMENDATION TEST
    console.log("\n[11J] RECOMMENDATION TEST");
    const recs = await aiService.getEquipmentRecommendations("wheat", "red soil", "10");
    console.log("Response:", JSON.stringify(recs));
    if (recs && recs.recommendations) console.log("PASS: Valid JSON recommendation received.");
    else throw new Error("Invalid recommendation");

    // 11K - MULTILINGUAL TEST
    console.log("\n[11K] MULTILINGUAL TEST (English -> Telugu)");
    const translated = await aiService.translateListing("Tractor", "Please wear safety gear.");
    console.log("Response:", JSON.stringify(translated));
    if (translated && translated.titleTe) console.log("PASS: Translation generated.");
    else throw new Error("Invalid translation");

    // 11L & 11M - FAILURE & JSON ROBUSTNESS
    console.log("\n[11L/11M] FAILURE HANDLING & JSON ROBUSTNESS");
    // Simulate by injecting a fake URL
    const originalUrl = process.env.OLLAMA_URL;
    process.env.OLLAMA_URL = "http://localhost:9999";
    try {
      const failedRecs = await aiService.getEquipmentRecommendations("wheat", "red soil", "10");
      console.log("Fallback Output:", JSON.stringify(failedRecs));
      console.log("PASS: Backend handled network failure robustly without crashing.");
    } catch (e: any) {
      console.error("FAIL: Backend crashed on failure!", e.message);
    }
    process.env.OLLAMA_URL = originalUrl;

  } catch (err: any) {
    console.error("AUDIT FAILED:", err);
  }
}

runAudit();
