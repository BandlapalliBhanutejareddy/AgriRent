const axios = require('axios');
const fs = require('fs');

async function ask(model, prompt, requireJson = false) {
    const t0 = Date.now();
    const payload = {
        model,
        prompt,
        stream: false,
        options: { num_predict: 150, temperature: 0.1 }
    };
    if (requireJson) payload.format = 'json';
    
    try {
        const res = await axios.post('http://localhost:11434/api/generate', payload, { timeout: 120000 });
        const latency = (Date.now() - t0) / 1000;
        return { success: true, response: res.data.response, latency };
    } catch (e) {
        return { success: false, error: e.message, latency: (Date.now() - t0) / 1000 };
    }
}

async function benchmark(model) {
    console.log(`\n=== BENCHMARKING ${model} ===`);
    
    console.log('\nA. Basic response');
    const a = await ask(model, "What is a tractor? Answer in one sentence.");
    console.log(`Latency: ${a.latency}s`);
    console.log(`Response: ${a.response}`);
    
    console.log('\nB. Agricultural advice');
    const b = await ask(model, "How do I control aphids on tomato plants? Give 3 simple steps.");
    console.log(`Latency: ${b.latency}s`);
    console.log(`Response: ${b.response}`);
    
    console.log('\nC. Search intent');
    const c = await ask(model, "Find the main agricultural keyword in: I need a tractor for ploughing my 5 acre rice field. Output ONLY the keyword.");
    console.log(`Latency: ${c.latency}s`);
    console.log(`Response: ${c.response}`);
    
    console.log('\nD. Translation (En->Te)');
    const d = await ask(model, "Translate to Telugu: The tractor is very powerful.");
    console.log(`Latency: ${d.latency}s`);
    console.log(`Response: ${d.response}`);
    
    console.log('\nE. Structured JSON');
    const e = await ask(model, "Recommend farming equipment for a 5 acre rice field. Require EXACTLY this JSON structure: {\"recommendation\": \"string\", \"equipment\": [\"string\"], \"reason\": \"string\"}", true);
    console.log(`Latency: ${e.latency}s`);
    console.log(`Response: ${e.response}`);
    
    let jsonValid = false;
    try {
        const p = JSON.parse(e.response);
        if (p.recommendation && p.equipment && p.reason) jsonValid = true;
    } catch (err) {}
    console.log(`JSON Validity: ${jsonValid ? 'PASS' : 'FAIL'}`);
    
    const latencies = [a.latency, b.latency, c.latency, d.latency, e.latency].filter(l => l > 0);
    const avg = latencies.length ? (latencies.reduce((x, y) => x + y, 0) / latencies.length).toFixed(2) : 0;
    
    console.log(`\nAverage Latency: ${avg}s`);
}

async function run() {
    await benchmark('qwen:0.5b');
}
run();
