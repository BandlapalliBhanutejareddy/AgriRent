const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/services/aiProvider.ts');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update generate method options and timeout
const oldGenerateSnippet = `      const payload: any = {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        keep_alive: '5m',
        options: {
          num_ctx: 1024,
          num_predict: 250,
          temperature: 0.1
        }
      };`;

const newGenerateSnippet = `      const effectiveTimeout = Math.max(5000, timeoutMs);
      const payload: any = {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        keep_alive: '5m',
        options: {
          num_ctx: 1024,
          num_predict: 120,
          temperature: 0.2
        }
      };`;

// 2. Update signal timeout in generate
const oldSignal = `signal: AbortSignal.timeout(timeoutMs)`;
const newSignal = `signal: AbortSignal.timeout(effectiveTimeout)`;

// 3. Update getAdvisorAdvice implementation
const oldAdvisorStart = `  public async getAdvisorAdvice(params: any, language: string, equipmentList: any[] = []): Promise<string> {`;
const oldAdvisorEnd = `      return this.getAgronomyFallback(question || rawPrompt, crop, soilType, acreage, location, season, objective, targetLang, equipmentList);\n    }\n  }`;

const newAdvisorBlock = `  public async getAdvisorAdvice(params: any, language: string, equipmentList: any[] = []): Promise<string> {
    const crop = typeof params === 'object' ? (params.crop || '').trim() : '';
    const soilType = typeof params === 'object' ? (params.soilType || '').trim() : '';
    const acreage = typeof params === 'object' ? (params.acreage !== undefined && params.acreage !== null ? String(params.acreage).trim() : '') : '';
    const location = typeof params === 'object' ? (params.location || '').trim() : '';
    const season = typeof params === 'object' ? (params.season || '').trim() : '';
    const objective = typeof params === 'object' ? (params.objective || '').trim() : '';
    const question = typeof params === 'object' ? (params.question || '').trim() : '';
    const rawPrompt = typeof params === 'string' ? params.trim() : ((params.prompt || question || (crop ? \`Advice for \${crop}\` : '')).trim());

    const targetLang = language || (typeof params === 'object' && params.language) || 'English';
    const isEnglish = !targetLang || targetLang.toLowerCase() === 'english' || targetLang.toLowerCase() === 'en';

    // If an Indic language (Telugu, Hindi, Tamil, Kannada) is requested:
    // Local qwen:0.5b does not have Indic script vocabulary and generates invalid mixed characters.
    // Deliver the verified, high-quality, localized ICAR agronomic guidance with verified live machinery.
    if (!isEnglish) {
      console.log(\`[AI Service] Non-English language '\${targetLang}' requested. Delivering verified localized ICAR agronomic guidance.\`);
      return this.getAgronomyFallback(question || rawPrompt, crop, soilType, acreage, location, season, objective, targetLang, equipmentList);
    }

    const compactEquipment = (equipmentList || []).slice(0, 3)
      .map(e => \`\${e.title || e.name} (\${e.category || 'Machinery'}): ₹\${e.pricePerDay || 1000}/day\`)
      .join('; ');

    const fullContext = \`FARMER CONTEXT: Crop: \${crop || 'Not specified'}, Soil: \${soilType || 'Standard'}, Acreage: \${acreage ? acreage + ' acres' : 'Not specified'}, Location: \${location || 'Local region'}, Season: \${season || 'Not specified'}. User Question: \${question || rawPrompt || 'General farming advice'}. Platform Machinery: \${compactEquipment || 'Tractors and implements available'}.\`;

    const systemPrompt = \`You are an expert Agricultural Advisor for AgroRent AI. Provide practical, accurate agronomic guidance in clear English. Mention soil testing at KVK and suitable rental machinery. Keep recommendations concise and direct.\`;
    const userPrompt = \`\${fullContext}\\n\\nProvide structured advice for the farmer in clear English.\`;

    try {
      const response = await this.generate(userPrompt, false, systemPrompt, 8000);
      if (this.validateResponseLanguage(response, 'English')) {
        return response;
      }
      console.warn('[AI Service] Model output failed language validation, engaging verified agronomic fallback.');
      return this.getAgronomyFallback(question || rawPrompt, crop, soilType, acreage, location, season, objective, targetLang, equipmentList);
    } catch (err: any) {
      console.warn('[AI Service] Ollama model unavailable or timed out, engaging verified fallback:', err.message);
      return this.getAgronomyFallback(question || rawPrompt, crop, soilType, acreage, location, season, objective, targetLang, equipmentList);
    }
  }`;

// Normalize line endings to \n for matching
let norm = content.replace(/\r\n/g, '\n');

if (norm.includes(oldGenerateSnippet.replace(/\r\n/g, '\n'))) {
  norm = norm.replace(oldGenerateSnippet.replace(/\r\n/g, '\n'), newGenerateSnippet);
  console.log('1. Updated generate options & timeout.');
} else {
  console.log('1. Warning: oldGenerateSnippet not matched.');
}

if (norm.includes(oldSignal)) {
  norm = norm.replace(oldSignal, newSignal);
  console.log('2. Updated signal timeout.');
} else {
  console.log('2. Warning: oldSignal not matched.');
}

// Find getAdvisorAdvice
const startIdx = norm.indexOf(oldAdvisorStart);
const endIdx = norm.indexOf(oldAdvisorEnd, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  norm = norm.slice(0, startIdx) + newAdvisorBlock + norm.slice(endIdx + oldAdvisorEnd.length);
  console.log('3. Updated getAdvisorAdvice block.');
} else {
  console.log('3. Warning: getAdvisorAdvice boundaries not matched:', startIdx, endIdx);
}

// Restore CRLF
fs.writeFileSync(targetPath, norm.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully written to aiProvider.ts.');
