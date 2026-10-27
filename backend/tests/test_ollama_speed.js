const http = require('http');

async function testOllamaTags() {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:11434/api/tags', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        try {
          const json = JSON.parse(data);
          resolve({ duration, models: json.models.map(m => m.name) });
        } catch (e) {
          resolve({ duration, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Tags request timed out'));
    });
  });
}

async function testOllamaInference(prompt, model = 'qwen:0.5b') {
  const start = Date.now();
  const payload = JSON.stringify({
    model,
    prompt,
    stream: false,
    options: {
      num_ctx: 1024,
      num_predict: 100,
      temperature: 0.1
    }
  });

  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        try {
          const json = JSON.parse(data);
          resolve({
            duration,
            responseSnippet: json.response ? json.response.slice(0, 150) : '',
            totalDurationSec: json.total_duration ? (json.total_duration / 1e9).toFixed(2) : 'N/A',
            evalCount: json.eval_count,
            evalDurationSec: json.eval_duration ? (json.eval_duration / 1e9).toFixed(2) : 'N/A'
          });
        } catch (e) {
          resolve({ duration, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Inference request timed out after 30s'));
    });
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Testing Ollama Connectivity and Inference:');
  try {
    const tags = await testOllamaTags();
    console.log(`Tags response in ${tags.duration}ms:`, tags.models);
  } catch (err) {
    console.error('Tags failed:', err.message);
  }

  try {
    console.log('\nRunning test inference prompt: "Explain crop rotation in 2 sentences."');
    const inf = await testOllamaInference('Explain crop rotation in 2 sentences.');
    console.log(`Inference completed in ${inf.duration}ms (${inf.evalDurationSec}s eval, ${inf.evalCount} tokens):`);
    console.log(`Response snippet: "${inf.responseSnippet.replace(/\n/g, ' ')}"`);
  } catch (err) {
    console.error('Inference failed:', err.message);
  }
}

run();
