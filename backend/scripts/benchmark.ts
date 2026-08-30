import axios from 'axios';
import { aiProvider } from '../src/services/aiProvider';

async function measure(name: string, fn: () => Promise<any>) {
  const start = Date.now();
  try {
    const res = await fn();
    const duration = (Date.now() - start) / 1000;
    console.log(`[${name}] PASS - ${duration.toFixed(2)} seconds`);
    return { status: 'PASS', duration, result: res };
  } catch (e: any) {
    const duration = (Date.now() - start) / 1000;
    console.log(`[${name}] FAIL - ${duration.toFixed(2)} seconds - ${e.message}`);
    return { status: 'FAIL', duration, error: e.message };
  }
}

async function runBenchmark() {
  console.log("=== OLLAMA PERFORMANCE BENCHMARK ===");
  console.log(`Target: ${process.env.OLLAMA_URL || 'http://localhost:11434'}\\n`);

  const results: any = {};

  results.cold_start = await measure("1. Cold Start (Small Prompt)", async () => {
    return axios.post(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
      model: process.env.OLLAMA_MODEL || 'qwen3.5:9b',
      prompt: 'Hello.',
      stream: false
    });
  });

  results.warm_model = await measure("2. Warm Model (Small Prompt)", async () => {
    return axios.post(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
      model: process.env.OLLAMA_MODEL || 'qwen3.5:9b',
      prompt: 'Hello again.',
      stream: false
    });
  });

  const agriculturalPrompt = "Crop: Paddy, Soil: Clay, Land: 2 acres, Location: Nellore, Andhra Pradesh, Season: Kharif, Objective: Increase yield. Question: Give me a practical cultivation plan from land preparation to harvesting.";

  results.advisor = await measure("3. Full AI Advisor (English)", async () => {
    return aiProvider.getAdvisorAdvice(agriculturalPrompt, "English", [{ name: "Tractor" }]);
  });

  results.consecutive = await measure("4. Five Consecutive Requests", async () => {
    for (let i = 1; i <= 5; i++) {
      await axios.post(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
        model: process.env.OLLAMA_MODEL || 'qwen3.5:9b',
        prompt: `Count to ${i}`,
        stream: false
      });
    }
  });

  results.concurrent = await measure("5. Three Concurrent Requests", async () => {
    const p1 = aiProvider.getSearchIntent("tractor near me");
    const p2 = aiProvider.getSearchIntent("harvester for rent");
    const p3 = aiProvider.getSearchIntent("seeder machine");
    await Promise.all([p1, p2, p3]);
  });

  console.log("\\n=== BENCHMARK SUMMARY ===");
  console.log("Cold Start:       ", results.cold_start.duration, "s");
  console.log("Warm Model:       ", results.warm_model.duration, "s");
  console.log("AI Advisor:       ", results.advisor.duration, "s");
  console.log("5 Consecutive:    ", results.consecutive.duration, "s");
  console.log("3 Concurrent:     ", results.concurrent.duration, "s");
}

runBenchmark();
