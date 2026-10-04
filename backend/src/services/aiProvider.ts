const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://localhost:11434').trim();
const OLLAMA_MODEL = (process.env.OLLAMA_MODEL || 'qwen:0.5b').trim();

interface TranslationResult {
  titleEn: string;
  titleTe: string;
  titleHi: string;
  titleTa: string;
  titleKn: string;
  descriptionEn: string;
  descriptionTe: string;
  descriptionHi: string;
  descriptionTa: string;
  descriptionKn: string;
}

export class AIProviderService {

  public async generateText(prompt: string, system?: string, timeoutMs?: number): Promise<string> {
    return this.generate(prompt, false, system, timeoutMs);
  }

  private async generate(prompt: string, requireJson = false, system?: string, timeoutMs = 300000): Promise<string> {
    try {
      const payload: any = {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        keep_alive: '5m',
        options: {
          num_ctx: 1024,
          num_predict: 250,
          temperature: 0.1
        }
      };

      if (system) {
        payload.system = system;
      }

      if (requireJson) {
        payload.format = 'json';
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (!response.ok) {
        throw new Error(`Ollama HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;
      if (!data || !data.response) {
        throw new Error('Empty or invalid response from Ollama.');
      }

      return data.response;
    } catch (error: any) {
      console.error('[AI Provider] Generation failed:', error.message || 'Unknown error');
      throw error;
    }
  }

  private validateResponseLanguage(text: string, lang: string): boolean {
    if (!text || text.trim().length < 10) return false;

    // 1. REJECT if Chinese character contamination is detected
    if (/[\u4e00-\u9fa5]/.test(text)) {
      console.warn('[AI Language Validator] Rejected response due to Chinese text contamination.');
      return false;
    }

    // 2. REJECT if model echoed prompt instructions or boilerplate instead of generating real agronomic advice
    if (
      text.includes('Treat all supplied farmer context') ||
      text.includes('Respond strictly and entirely in') ||
      text.includes('Sure, I can') ||
      text.includes('Please provide') ||
      text.includes('The situation summary, suitable machinery') ||
      text.includes('This means that') ||
      text.includes('based on 6') ||
      text.includes('based on 50')
    ) {
      console.warn('[AI Language Validator] Rejected response: Model echoed prompt instructions or boilerplate.');
      return false;
    }

    const lowerLang = (lang || '').toLowerCase();

    // 2. Check for target script density when non-English language requested
    if (lowerLang.includes('telugu') || lowerLang === 'te') {
      const teluguCount = (text.match(/[\u0C00-\u0C7F]/g) || []).length;
      if (teluguCount < 10) {
        console.warn(`[AI Language Validator] Rejected response: Expected Telugu script, got only ${teluguCount} chars.`);
        return false;
      }
    } else if (lowerLang.includes('hindi') || lowerLang === 'hi') {
      const hindiCount = (text.match(/[\u0900-\u097F]/g) || []).length;
      if (hindiCount < 10) {
        console.warn(`[AI Language Validator] Rejected response: Expected Hindi script, got only ${hindiCount} chars.`);
        return false;
      }
    } else if (lowerLang.includes('tamil') || lowerLang === 'ta') {
      const tamilCount = (text.match(/[\u0B80-\u0BFF]/g) || []).length;
      if (tamilCount < 10) {
        console.warn(`[AI Language Validator] Rejected response: Expected Tamil script, got only ${tamilCount} chars.`);
        return false;
      }
    } else if (lowerLang.includes('kannada') || lowerLang === 'kn') {
      const kannadaCount = (text.match(/[\u0C80-\u0CFF]/g) || []).length;
      if (kannadaCount < 10) {
        console.warn(`[AI Language Validator] Rejected response: Expected Kannada script, got only ${kannadaCount} chars.`);
        return false;
      }
    }

    return true;
  }

  public async getAdvisorAdvice(params: any, language: string, equipmentList: any[]): Promise<string> {
    const crop = typeof params === 'object' ? (params.crop || '') : '';
    const soilType = typeof params === 'object' ? (params.soilType || '') : '';
    const acreage = typeof params === 'object' ? (params.acreage || '') : '';
    const location = typeof params === 'object' ? (params.location || '') : '';
    const season = typeof params === 'object' ? (params.season || '') : '';
    const objective = typeof params === 'object' ? (params.objective || '') : '';
    const question = typeof params === 'object' ? (params.question || '') : '';
    const rawPrompt = typeof params === 'string' ? params : (params.prompt || question || `Advice for ${crop}`);

    const targetLang = language || (typeof params === 'object' && params.language) || 'English';

    const fullContext = `FARMER AGRICULTURAL CONTEXT:
- Crop: ${crop || 'Not specified'}
- Soil Type: ${soilType || 'Not specified'}
- Land Area / Acreage: ${acreage ? acreage + ' acres' : 'Not specified'}
- Location: ${location || 'Not specified'}
- Season: ${season || 'Kharif'}
- Farming Objective: ${objective || 'Maximize yield'}
- User Question: ${question || rawPrompt || 'General advice'}
- Target Response Language: ${targetLang}`;

    const systemPrompt = `You are an expert Agricultural AI Advisor for AgroRent AI. Provide accurate, highly practical farming advice incorporating crop type, soil, acreage, location, season, and farming objective.
STRICT INSTRUCTION: Respond ENTIRELY in the ${targetLang} language script. DO NOT include any Chinese characters, Japanese characters, or invalid mixed scripts under any circumstances.`;

    const userPrompt = `${fullContext}

Available Equipment on AgroRent Platform: ${JSON.stringify((equipmentList || []).slice(0, 5))}

INSTRUCTIONS:
1. Treat ALL supplied farmer context as important.
2. Directly address how to optimize ${crop || 'farming'} in ${soilType || 'the specified'} soil for ${acreage || 'the'} acres during ${season || 'this'} season in ${location || 'your region'}.
3. Recommend suitable machinery to rent on AgroRent AI based on ${acreage || 'the acreage'}.
4. Provide structured advice covering: Situation Summary, Suitable Machinery, Soil & Fertilizer Plan, and Specific Question Answer.
5. Respond strictly and entirely in ${targetLang}.`;

    try {
      const response = await this.generate(userPrompt, false, systemPrompt);
      if (this.validateResponseLanguage(response, targetLang)) {
        return response;
      }
      console.warn(`[AI Service] Model output failed language validation for ${targetLang}. Retrying once with strict prompt...`);

      // Retry once with an explicit strict prompt
      const retryResponse = await this.generate(`TRANSLATE AND RESPOND IN ${targetLang} SCRIPT ONLY:\n${userPrompt}`, false, systemPrompt);
      if (this.validateResponseLanguage(retryResponse, targetLang)) {
        return retryResponse;
      }

      throw new Error(`Model response failed script validation for ${targetLang}`);
    } catch (err: any) {
      console.warn('[AI Service] Ollama model unavailable or failed validation, engaging localized fallback engine:', err.message);
      return this.getAgronomyFallback(question || rawPrompt, crop, soilType, acreage, location, season, objective, targetLang);
    }
  }

  private getAgronomyFallback(query: string, crop: string, soil: string, acreage: string, loc: string, season: string, obj: string, lang: string): string {
    const cropName = crop || 'Crop / Ã Â°ÂªÃ Â±Ë†Ã Â°Â°Ã Â±Â';
    const soilName = soil || 'Standard Soil';
    const acreageVal = acreage || '5';
    const locName = loc ? `${loc}` : 'Your Region';
    const seasonName = season || 'Kharif';
    const objName = obj || 'Maximize yield & efficiency';
    const questionVal = query || 'Equipment and yield advice';
    const numAcreage = parseFloat(acreageVal) || 5;

    const lowerLang = (lang || '').toLowerCase();
    const isHindi = lowerLang.includes('hindi') || lowerLang === 'hi';
    const isTelugu = lowerLang.includes('telugu') || lowerLang === 'te';
    const isTamil = lowerLang.includes('tamil') || lowerLang === 'ta';
    const isKannada = lowerLang.includes('kannada') || lowerLang === 'kn';

    const acreageAdviceTelugu = numAcreage <= 10
      ? `${acreageVal} Ã Â°Å½Ã Â°â€¢Ã Â°Â°Ã Â°Â¾Ã Â°Â² Ã Â°Â®Ã Â°Â§Ã Â±ÂÃ Â°Â¯Ã Â°Â¸Ã Â±ÂÃ Â°Â¥ Ã Â°ÂµÃ Â°Â¿Ã Â°Â¸Ã Â±ÂÃ Â°Â¤Ã Â±â‚¬Ã Â°Â°Ã Â±ÂÃ Â°Â£Ã Â°Â¾Ã Â°Â¨Ã Â°Â¿Ã Â°â€¢Ã Â°Â¿ Ã Â°â€¢Ã Â±Å Ã Â°Â¨Ã Â±ÂÃ Â°â€”Ã Â±â€¹Ã Â°Â²Ã Â±Â Ã Â°â€¢Ã Â°â€šÃ Â°Å¸Ã Â±â€¡ AgroRent AI Ã Â°Â¦Ã Â±ÂÃ Â°ÂµÃ Â°Â¾Ã Â°Â°Ã Â°Â¾ Ã Â°Â¯Ã Â°â€šÃ Â°Â¤Ã Â±ÂÃ Â°Â°Ã Â°Â¾Ã Â°Â²Ã Â°Â¨Ã Â±Â Ã Â°â€¦Ã Â°Â¦Ã Â±ÂÃ Â°Â¦Ã Â±â€ Ã Â°â€¢Ã Â±Â Ã Â°Â¤Ã Â±â‚¬Ã Â°Â¸Ã Â±ÂÃ Â°â€¢Ã Â±â€¹Ã Â°ÂµÃ Â°Â¡Ã Â°â€š 65% Ã Â°ÂµÃ Â°Â°Ã Â°â€¢Ã Â±Â Ã Â°â€“Ã Â°Â°Ã Â±ÂÃ Â°Å¡Ã Â±Â Ã Â°Â¤Ã Â°â€”Ã Â±ÂÃ Â°â€”Ã Â°Â¿Ã Â°Â¸Ã Â±ÂÃ Â°Â¤Ã Â±ÂÃ Â°â€šÃ Â°Â¦Ã Â°Â¿.`
      : `${acreageVal} Ã Â°Å½Ã Â°â€¢Ã Â°Â°Ã Â°Â¾Ã Â°Â² Ã Â°Â­Ã Â°Â¾Ã Â°Â°Ã Â±â‚¬ Ã Â°ÂµÃ Â°Â¿Ã Â°Â¸Ã Â±ÂÃ Â°Â¤Ã Â±â‚¬Ã Â°Â°Ã Â±ÂÃ Â°Â£Ã Â°Â¾Ã Â°Â¨Ã Â°Â¿Ã Â°â€¢Ã Â°Â¿ Ã Â°Â¹Ã Â±â€ Ã Â°ÂµÃ Â±â‚¬-Ã Â°Â¡Ã Â±ÂÃ Â°Â¯Ã Â±â€šÃ Â°Å¸Ã Â±â‚¬ 50+ HP Ã Â°Å¸Ã Â±ÂÃ Â°Â°Ã Â°Â¾Ã Â°â€¢Ã Â±ÂÃ Â°Å¸Ã Â°Â°Ã Â±Â Ã Â°Â®Ã Â°Â°Ã Â°Â¿Ã Â°Â¯Ã Â±Â Ã Â°â€¢Ã Â°â€šÃ Â°Â¬Ã Â±Ë†Ã Â°Â¨Ã Â±Â Ã Â°Â¹Ã Â°Â¾Ã Â°Â°Ã Â±ÂÃ Â°ÂµÃ Â±â€ Ã Â°Â¸Ã Â±ÂÃ Â°Å¸Ã Â°Â°Ã Â±ÂÃ Â°Â²Ã Â°Â¨Ã Â±Â Ã Â°â€¦Ã Â°Â¦Ã Â±ÂÃ Â°Â¦Ã Â±â€ Ã Â°â€¢Ã Â±Â Ã Â°Â¤Ã Â±â‚¬Ã Â°Â¸Ã Â±ÂÃ Â°â€¢Ã Â±â€¹Ã Â°ÂµÃ Â°Â¡Ã Â°â€š Ã Â°â€¦Ã Â°Â¨Ã Â±ÂÃ Â°â€¢Ã Â±â€šÃ Â°Â²Ã Â°â€š.`;

    const acreageAdviceEnglish = numAcreage <= 10
      ? `For ${acreageVal} acres, renting machinery via AgroRent AI is 65% more cost-effective than capital purchasing.`
      : `For a large area of ${acreageVal} acres, hiring heavy-duty 50+ HP tractors and combine harvesters is recommended.`;

    const acreageAdviceHindi = numAcreage <= 10
      ? `${acreageVal} Ã Â¤ÂÃ Â¤â€¢Ã Â¤Â¡Ã Â¤Â¼ Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â²Ã Â¤Â¿Ã Â¤Â Ã Â¤ÂÃ Â¤â€”Ã Â¥ÂÃ Â¤Â°Ã Â¥â€¹Ã Â¤Â°Ã Â¥â€¡Ã Â¤â€šÃ Â¤Å¸ AI Ã Â¤Â¸Ã Â¥â€¡ Ã Â¤Â®Ã Â¤Â¶Ã Â¥â‚¬Ã Â¤Â¨Ã Â¤Â°Ã Â¥â‚¬ Ã Â¤â€¢Ã Â¤Â¿Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â Ã Â¤ÂªÃ Â¤Â° Ã Â¤Â²Ã Â¥â€¡Ã Â¤Â¨Ã Â¤Â¾ Ã Â¤â€“Ã Â¤Â°Ã Â¥â‚¬Ã Â¤Â¦Ã Â¤Â¨Ã Â¥â€¡ Ã Â¤â€¢Ã Â¥â‚¬ Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â²Ã Â¤Â¨Ã Â¤Â¾ Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š 65% Ã Â¤Â¤Ã Â¤â€¢ Ã Â¤â€¢Ã Â¤Â¿Ã Â¤Â«Ã Â¤Â¾Ã Â¤Â¯Ã Â¤Â¤Ã Â¥â‚¬ Ã Â¤Â¹Ã Â¥Ë†Ã Â¥Â¤`
      : `${acreageVal} Ã Â¤ÂÃ Â¤â€¢Ã Â¤Â¡Ã Â¤Â¼ Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â¬Ã Â¤Â¡Ã Â¤Â¼Ã Â¥â€¡ Ã Â¤â€¢Ã Â¥ÂÃ Â¤Â·Ã Â¥â€¡Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â²Ã Â¤Â¿Ã Â¤Â 50+ HP Ã Â¤Å¸Ã Â¥ÂÃ Â¤Â°Ã Â¥Ë†Ã Â¤â€¢Ã Â¥ÂÃ Â¤Å¸Ã Â¤Â° Ã Â¤â€Ã Â¤Â° Ã Â¤â€¢Ã Â¤â€šÃ Â¤Â¬Ã Â¤Â¾Ã Â¤â€¡Ã Â¤Â¨ Ã Â¤Â¹Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤ÂµÃ Â¥â€¡Ã Â¤Â¸Ã Â¥ÂÃ Â¤Å¸Ã Â¤Â° Ã Â¤â€¢Ã Â¤Â¿Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â Ã Â¤ÂªÃ Â¤Â° Ã Â¤Â²Ã Â¥â€¡Ã Â¤Â¨Ã Â¤Â¾ Ã Â¤â€°Ã Â¤ÂªÃ Â¤Â¯Ã Â¥ÂÃ Â¤â€¢Ã Â¥ÂÃ Â¤Â¤ Ã Â¤Â¹Ã Â¥Ë†Ã Â¥Â¤`;

    if (isTelugu) {
      return `### Ã°Å¸Å’Â¾ Ã Â°ÂµÃ Â±ÂÃ Â°Â¯Ã Â°ÂµÃ Â°Â¸Ã Â°Â¾Ã Â°Â¯ Ã Â°Â¸Ã Â°Â²Ã Â°Â¹Ã Â°Â¾ & Ã Â°Â¯Ã Â°â€šÃ Â°Â¤Ã Â±ÂÃ Â°Â°Ã Â°Â¾Ã Â°Â² Ã Â°Â®Ã Â°Â¾Ã Â°Â°Ã Â±ÂÃ Â°â€”Ã Â°Â¦Ã Â°Â°Ã Â±ÂÃ Â°Â¶Ã Â°â€¢Ã Â°â€š (${cropName} - ${locName})

#### 1. Ã Â°Â®Ã Â±â‚¬ Ã Â°ÂµÃ Â±ÂÃ Â°Â¯Ã Â°ÂµÃ Â°Â¸Ã Â°Â¾Ã Â°Â¯ Ã Â°ÂªÃ Â°Â°Ã Â°Â¿Ã Â°Â¸Ã Â±ÂÃ Â°Â¥Ã Â°Â¿Ã Â°Â¤Ã Â°Â¿ Ã Â°Â¸Ã Â°Â®Ã Â±â‚¬Ã Â°â€¢Ã Â±ÂÃ Â°Â·
- **Ã Â°Â¸Ã Â°Â¾Ã Â°â€”Ã Â±Â Ã Â°ÂªÃ Â°â€šÃ Â°Å¸:** ${cropName}
- **Ã Â°Â¨Ã Â±â€¡Ã Â°Â² Ã Â°Â°Ã Â°â€¢Ã Â°â€š:** ${soilName}
- **Ã Â°Â¸Ã Â°Â¾Ã Â°â€”Ã Â±Â Ã Â°ÂµÃ Â°Â¿Ã Â°Â¸Ã Â±ÂÃ Â°Â¤Ã Â±â‚¬Ã Â°Â°Ã Â±ÂÃ Â°Â£Ã Â°â€š:** ${acreageVal} Ã Â°Å½Ã Â°â€¢Ã Â°Â°Ã Â°Â¾Ã Â°Â²Ã Â±Â
- **Ã Â°ÂªÃ Â±ÂÃ Â°Â°Ã Â°Â¾Ã Â°â€šÃ Â°Â¤Ã Â°â€š & Ã Â°Â¸Ã Â±â‚¬Ã Â°Å“Ã Â°Â¨Ã Â±Â:** ${locName} (${seasonName} Ã Â°Â¸Ã Â±â‚¬Ã Â°Â¸Ã Â°Â¨Ã Â±Â)
- **Ã Â°Â²Ã Â°â€¢Ã Â±ÂÃ Â°Â·Ã Â±ÂÃ Â°Â¯Ã Â°â€š:** ${objName}

> Ã°Å¸â€™Â¡ **Ã Â°ÂµÃ Â°Â¿Ã Â°Â¸Ã Â±ÂÃ Â°Â¤Ã Â±â‚¬Ã Â°Â°Ã Â±ÂÃ Â°Â£ Ã Â°ÂµÃ Â°Â¿Ã Â°Â¶Ã Â±ÂÃ Â°Â²Ã Â±â€¡Ã Â°Â·Ã Â°Â£:** ${acreageAdviceTelugu}

#### 2. Ã Â°Â¸Ã Â°Â¿Ã Â°Â«Ã Â°Â¾Ã Â°Â°Ã Â±ÂÃ Â°Â¸Ã Â±Â Ã Â°Å¡Ã Â±â€¡Ã Â°Â¸Ã Â°Â¿Ã Â°Â¨ Ã Â°Â¯Ã Â°â€šÃ Â°Â¤Ã Â±ÂÃ Â°Â°Ã Â°Â¾Ã Â°Â²Ã Â±Â (AgroRent AI Ã Â°â€¦Ã Â°Â¦Ã Â±ÂÃ Â°Â¦Ã Â±â€  Ã Â°Å½Ã Â°â€šÃ Â°ÂªÃ Â°Â¿Ã Â°â€¢Ã Â°Â²Ã Â±Â)
1. **Ã Â°Â¦Ã Â±ÂÃ Â°â€¢Ã Â±ÂÃ Â°â€¢Ã Â°Â¿ Ã Â°Å¸Ã Â±ÂÃ Â°Â°Ã Â°Â¾Ã Â°â€¢Ã Â±ÂÃ Â°Å¸Ã Â°Â°Ã Â±Â (45-50 HP):** ${soilName} Ã Â°Â¨Ã Â±â€¡Ã Â°Â²Ã Â°Â²Ã Â±â€¹ Ã Â°Â²Ã Â±â€¹Ã Â°Â¤Ã Â±Ë†Ã Â°Â¨ Ã Â°Â¦Ã Â±ÂÃ Â°â€¢Ã Â±ÂÃ Â°â€¢Ã Â°Â¿Ã Â°â€¢Ã Â°Â¿ Ã Â°Â®Ã Â°Â°Ã Â°Â¿Ã Â°Â¯Ã Â±Â Ã Â°ÂªÃ Â±ÂÃ Â°Â°Ã Â°Â¾Ã Â°Â¥Ã Â°Â®Ã Â°Â¿Ã Â°â€¢ Ã Â°Â­Ã Â±â€šÃ Â°Â®Ã Â°Â¿ Ã Â°Â¤Ã Â°Â¯Ã Â°Â¾Ã Â°Â°Ã Â±â‚¬Ã Â°â€¢Ã Â°Â¿ Ã Â°Å¡Ã Â°Â¾Ã Â°Â²Ã Â°Â¾ Ã Â°â€¦Ã Â°Â¨Ã Â±ÂÃ Â°â€¢Ã Â±â€šÃ Â°Â²Ã Â°â€š.
2. **Ã Â°Â°Ã Â±â€¹Ã Â°Å¸Ã Â°ÂµÃ Â±â€¡Ã Â°Å¸Ã Â°Â°Ã Â±Â & Ã Â°Â¸Ã Â±â‚¬Ã Â°Â¡Ã Â±Â Ã Â°Â¡Ã Â±ÂÃ Â°Â°Ã Â°Â¿Ã Â°Â²Ã Â±Â:** Ã Â°ÂµÃ Â°Â¿Ã Â°Â¤Ã Â±ÂÃ Â°Â¤Ã Â°Â¨Ã Â°Â¾Ã Â°Â²Ã Â±Â Ã Â°Â¸Ã Â°Â®Ã Â°â€šÃ Â°â€”Ã Â°Â¾ Ã Â°ÂªÃ Â°Â¡Ã Â°Å¸Ã Â°Â¾Ã Â°Â¨Ã Â°Â¿Ã Â°â€¢Ã Â°Â¿ Ã Â°Â®Ã Â°Â°Ã Â°Â¿Ã Â°Â¯Ã Â±Â Ã Â°Â¨Ã Â±â€¡Ã Â°Â² Ã Â°Â¸Ã Â°Â®Ã Â°Â¤Ã Â°Â²Ã Â°â€š Ã Â°Å¡Ã Â±â€¡Ã Â°Â¯Ã Â°Â¡Ã Â°Â¾Ã Â°Â¨Ã Â°Â¿Ã Â°â€¢Ã Â°Â¿ Ã Â°â€°Ã Â°Â¦Ã Â±ÂÃ Â°Â¦Ã Â±â€¡Ã Â°Â¶Ã Â°Â¿Ã Â°â€šÃ Â°Å¡Ã Â°Â¿Ã Â°Â¨Ã Â°Â¦Ã Â°Â¿.
3. **Ã Â°â€¢Ã Â°â€šÃ Â°Â¬Ã Â±Ë†Ã Â°Â¨Ã Â±Â Ã Â°Â¹Ã Â°Â¾Ã Â°Â°Ã Â±ÂÃ Â°ÂµÃ Â±â€ Ã Â°Â¸Ã Â±ÂÃ Â°Å¸Ã Â°Â°Ã Â±Â:** ${cropName} Ã Â°â€¢Ã Â±â€¹Ã Â°Â¤ Ã Â°â€¢Ã Â°Â¾Ã Â°Â²Ã Â°â€šÃ Â°Â²Ã Â±â€¹ Ã Â°Â¸Ã Â°Â®Ã Â°Â¯Ã Â°â€š Ã Â°Â®Ã Â°Â°Ã Â°Â¿Ã Â°Â¯Ã Â±Â Ã Â°Â¶Ã Â±ÂÃ Â°Â°Ã Â°Â® Ã Â°â€ Ã Â°Â¦Ã Â°Â¾ Ã Â°Å¡Ã Â±â€¡Ã Â°Â¯Ã Â°Â¡Ã Â°Â¾Ã Â°Â¨Ã Â°Â¿Ã Â°â€¢Ã Â°Â¿.

#### 3. Ã Â°Å½Ã Â°Â°Ã Â±ÂÃ Â°ÂµÃ Â±ÂÃ Â°Â² & Ã Â°Â¸Ã Â°Â¾Ã Â°â€”Ã Â±Â Ã Â°Â¯Ã Â°Â¾Ã Â°Å“Ã Â°Â®Ã Â°Â¾Ã Â°Â¨Ã Â±ÂÃ Â°Â¯Ã Â°â€š
- **Ã Â°Å½Ã Â°Â°Ã Â±ÂÃ Â°ÂµÃ Â±ÂÃ Â°Â² Ã Â°ÂªÃ Â±ÂÃ Â°Â²Ã Â°Â¾Ã Â°Â¨Ã Â±Â:** Ã Â°ÂµÃ Â°Â¿Ã Â°Â¤Ã Â±ÂÃ Â°Â¤Ã Â±â€¡ Ã Â°Â¸Ã Â°Â®Ã Â°Â¯Ã Â°â€šÃ Â°Â²Ã Â±â€¹ NPK 12:32:16 (Ã Â°Å½Ã Â°â€¢Ã Â°Â°Ã Â°Â¾Ã Â°Â¨Ã Â°Â¿Ã Â°â€¢Ã Â°Â¿ 50 Ã Â°â€¢Ã Â°Â¿Ã Â°Â²Ã Â±â€¹Ã Â°Â²Ã Â±Â), 21-25 Ã Â°Â°Ã Â±â€¹Ã Â°Å“Ã Â±ÂÃ Â°Â² Ã Â°Â¤Ã Â°Â°Ã Â±ÂÃ Â°ÂµÃ Â°Â¾Ã Â°Â¤ Ã Â°Â¯Ã Â±ÂÃ Â°Â°Ã Â°Â¿Ã Â°Â¯Ã Â°Â¾ Ã Â°ÂªÃ Â±ÂÃ Â°Â°Ã Â°Â¯Ã Â±â€¹Ã Â°â€”Ã Â°Â¿Ã Â°â€šÃ Â°Å¡Ã Â°â€šÃ Â°Â¡Ã Â°Â¿.
- **Ã Â°Â¨Ã Â±â‚¬Ã Â°Å¸Ã Â°Â¿ Ã Â°Â¯Ã Â°Â¾Ã Â°Å“Ã Â°Â®Ã Â°Â¾Ã Â°Â¨Ã Â±ÂÃ Â°Â¯Ã Â°â€š:** ${seasonName} Ã Â°Â¸Ã Â°Â®Ã Â°Â¯Ã Â°â€šÃ Â°Â²Ã Â±â€¹ Ã Â°Â¨Ã Â±â‚¬Ã Â°Â°Ã Â±Â Ã Â°Â¨Ã Â°Â¿Ã Â°Â²Ã Â±ÂÃ Â°ÂµÃ Â°â€¢Ã Â±ÂÃ Â°â€šÃ Â°Â¡Ã Â°Â¾ Ã Â°Å¡Ã Â±â€šÃ Â°Â¸Ã Â±ÂÃ Â°â€¢Ã Â±Å Ã Â°Â¨Ã Â°Â¿, 10-12 Ã Â°Â°Ã Â±â€¹Ã Â°Å“Ã Â±ÂÃ Â°Â²Ã Â°â€¢Ã Â±Â Ã Â°â€™Ã Â°â€¢Ã Â°Â¸Ã Â°Â¾Ã Â°Â°Ã Â°Â¿ Ã Â°Â¤Ã Â±â€¡Ã Â°Â²Ã Â°Â¿Ã Â°â€¢Ã Â°ÂªÃ Â°Â¾Ã Â°Å¸Ã Â°Â¿ Ã Â°Â¨Ã Â±â‚¬Ã Â°Å¸Ã Â°Â¿ Ã Â°Â¤Ã Â°Â¡Ã Â±ÂÃ Â°Â²Ã Â±Â Ã Â°â€¡Ã Â°ÂµÃ Â±ÂÃ Â°ÂµÃ Â°â€šÃ Â°Â¡Ã Â°Â¿.
- **Ã Â°Â¸Ã Â°Â¸Ã Â±ÂÃ Â°Â¯Ã Â°Â°Ã Â°â€¢Ã Â±ÂÃ Â°Â·Ã Â°Â£:** Ã Â°ÂªÃ Â°Â¿Ã Â°Å¡Ã Â°Â¿Ã Â°â€¢Ã Â°Â¾Ã Â°Â°Ã Â±â‚¬ Ã Â°Â®Ã Â°Â°Ã Â°Â¿Ã Â°Â¯Ã Â±Â Ã Â°ÂµÃ Â±â€¡Ã Â°Âª Ã Â°Â¨Ã Â±â€šÃ Â°Â¨Ã Â±â€  Ã Â°â€ Ã Â°Â§Ã Â°Â¾Ã Â°Â°Ã Â°Â¿Ã Â°Â¤ Ã Â°Â®Ã Â°â€šÃ Â°Â¦Ã Â±ÂÃ Â°Â²Ã Â±Â Ã Â°â€°Ã Â°ÂªÃ Â°Â¯Ã Â±â€¹Ã Â°â€”Ã Â°Â¿Ã Â°â€šÃ Â°Å¡Ã Â°Â¿ Ã Â°ÂªÃ Â±ÂÃ Â°Â°Ã Â±ÂÃ Â°â€”Ã Â±ÂÃ Â°Â² Ã Â°Â¨Ã Â°Â¿Ã Â°ÂµÃ Â°Â¾Ã Â°Â°Ã Â°Â£ Ã Â°Å¡Ã Â±â€¡Ã Â°Â¯Ã Â°â€šÃ Â°Â¡Ã Â°Â¿.

#### 4. Ã Â°Â®Ã Â±â‚¬ Ã Â°ÂªÃ Â±ÂÃ Â°Â°Ã Â°Â¶Ã Â±ÂÃ Â°Â¨Ã Â°â€¢Ã Â±Â Ã Â°Â¸Ã Â°Â²Ã Â°Â¹Ã Â°Â¾
> **Ã Â°ÂªÃ Â±ÂÃ Â°Â°Ã Â°Â¶Ã Â±ÂÃ Â°Â¨:** "${questionVal}"
**Ã Â°Â¸Ã Â°Â²Ã Â°Â¹Ã Â°Â¾:** ${cropName} Ã Â°Â¸Ã Â°Â¾Ã Â°â€”Ã Â±ÂÃ Â°Â²Ã Â±â€¹ ${objName} Ã Â°Â¸Ã Â°Â¾Ã Â°Â§Ã Â°Â¿Ã Â°â€šÃ Â°Å¡Ã Â°Â¡Ã Â°Â¾Ã Â°Â¨Ã Â°Â¿Ã Â°â€¢Ã Â°Â¿ Ã Â°Â¨Ã Â°Â¾Ã Â°Â£Ã Â±ÂÃ Â°Â¯Ã Â°Â®Ã Â±Ë†Ã Â°Â¨ Ã Â°ÂªÃ Â°Â°Ã Â°Â¿Ã Â°â€¢Ã Â°Â°Ã Â°Â¾Ã Â°Â²Ã Â°Â¨Ã Â±Â Ã Â°Â¸Ã Â°â€¢Ã Â°Â¾Ã Â°Â²Ã Â°â€šÃ Â°Â²Ã Â±â€¹ Ã Â°â€¦Ã Â°Â¦Ã Â±ÂÃ Â°Â¦Ã Â±â€ Ã Â°â€¢Ã Â±Â Ã Â°Â¤Ã Â±â‚¬Ã Â°Â¸Ã Â±ÂÃ Â°â€¢Ã Â±ÂÃ Â°Â¨Ã Â°Â¿, Ã Â°Â¸Ã Â°Â°Ã Â±Ë†Ã Â°Â¨ Ã Â°Å½Ã Â°Â°Ã Â±ÂÃ Â°ÂµÃ Â±ÂÃ Â°Â² Ã Â°Â¯Ã Â°Å“Ã Â°Â®Ã Â°Â¾Ã Â°Â¨Ã Â±ÂÃ Â°Â¯Ã Â°â€šÃ Â°Â¤Ã Â±â€¹ Ã Â°ÂªÃ Â°Â¾Ã Â°Å¸Ã Â±Â Ã Â°Â¶Ã Â±ÂÃ Â°Â°Ã Â°Â®Ã Â°Â¨Ã Â±Â Ã Â°â€ Ã Â°Â¦Ã Â°Â¾ Ã Â°Å¡Ã Â±â€¡Ã Â°Â¸Ã Â±ÂÃ Â°â€¢Ã Â±â€¹Ã Â°ÂµÃ Â°Â¡Ã Â°â€š Ã Â°Â¶Ã Â±ÂÃ Â°Â°Ã Â±â€¡Ã Â°Â¯Ã Â°Â¸Ã Â±ÂÃ Â°â€¢Ã Â°Â°Ã Â°â€š.`;
    }

    if (isHindi) {
      return `### Ã°Å¸Å’Â¾ Ã Â¤â€¢Ã Â¥Æ’Ã Â¤Â·Ã Â¤Â¿ Ã Â¤Â¸Ã Â¤Â²Ã Â¤Â¾Ã Â¤Â¹Ã Â¤â€¢Ã Â¤Â¾Ã Â¤Â° Ã Â¤ÂÃ Â¤ÂµÃ Â¤â€š Ã Â¤â€°Ã Â¤ÂªÃ Â¤â€¢Ã Â¤Â°Ã Â¤Â£ Ã Â¤Â®Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤â€”Ã Â¤Â¦Ã Â¤Â°Ã Â¥ÂÃ Â¤Â¶Ã Â¤Â¨ (${cropName} - ${locName})

#### 1. Ã Â¤â€ Ã Â¤ÂªÃ Â¤â€¢Ã Â¥â‚¬ Ã Â¤â€¢Ã Â¥Æ’Ã Â¤Â·Ã Â¤Â¿ Ã Â¤Â¸Ã Â¥ÂÃ Â¤Â¥Ã Â¤Â¿Ã Â¤Â¤Ã Â¤Â¿ Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤Â¸Ã Â¤Â¾Ã Â¤Â°Ã Â¤Â¾Ã Â¤â€šÃ Â¤Â¶
- **Ã Â¤Â«Ã Â¤Â¸Ã Â¤Â²:** ${cropName}
- **Ã Â¤Â®Ã Â¤Â¿Ã Â¤Å¸Ã Â¥ÂÃ Â¤Å¸Ã Â¥â‚¬ Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤â€¢Ã Â¤Â¾Ã Â¤Â°:** ${soilName}
- **Ã Â¤Â­Ã Â¥â€šÃ Â¤Â®Ã Â¤Â¿ Ã Â¤â€¢Ã Â¥ÂÃ Â¤Â·Ã Â¥â€¡Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â°:** ${acreageVal} Ã Â¤ÂÃ Â¤â€¢Ã Â¤Â¡Ã Â¤Â¼
- **Ã Â¤Â¸Ã Â¥ÂÃ Â¤Â¥Ã Â¤Â¾Ã Â¤Â¨ Ã Â¤ÂÃ Â¤ÂµÃ Â¤â€š Ã Â¤Â®Ã Â¥Å’Ã Â¤Â¸Ã Â¤Â®:** ${locName} (${seasonName} Ã Â¤Â®Ã Â¥Å’Ã Â¤Â¸Ã Â¤Â®)
- **Ã Â¤Â®Ã Â¥ÂÃ Â¤â€“Ã Â¥ÂÃ Â¤Â¯ Ã Â¤Â²Ã Â¤â€¢Ã Â¥ÂÃ Â¤Â·Ã Â¥ÂÃ Â¤Â¯:** ${objName}

> Ã°Å¸â€™Â¡ **Ã Â¤â€¢Ã Â¥ÂÃ Â¤Â·Ã Â¥â€¡Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤ÂµÃ Â¤Â¿Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â²Ã Â¥â€¡Ã Â¤Â·Ã Â¤Â£:** ${acreageAdviceHindi}

#### 2. Ã Â¤â€¦Ã Â¤Â¨Ã Â¥ÂÃ Â¤Â¶Ã Â¤â€šÃ Â¤Â¸Ã Â¤Â¿Ã Â¤Â¤ Ã Â¤â€¢Ã Â¥Æ’Ã Â¤Â·Ã Â¤Â¿ Ã Â¤â€°Ã Â¤ÂªÃ Â¤â€¢Ã Â¤Â°Ã Â¤Â£ (AgroRent AI Ã Â¤â€¢Ã Â¤Â¿Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤ÂµÃ Â¤Â¿Ã Â¤â€¢Ã Â¤Â²Ã Â¥ÂÃ Â¤Âª)
1. **Ã Â¤Å¸Ã Â¥ÂÃ Â¤Â°Ã Â¥Ë†Ã Â¤â€¢Ã Â¥ÂÃ Â¤Å¸Ã Â¤Â° (45-50 HP):** ${soilName} Ã Â¤Â®Ã Â¤Â¿Ã Â¤Å¸Ã Â¥ÂÃ Â¤Å¸Ã Â¥â‚¬ Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š Ã Â¤â€”Ã Â¤Â¹Ã Â¤Â°Ã Â¥â‚¬ Ã Â¤Å“Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â¾Ã Â¤Ë† Ã Â¤â€Ã Â¤Â° Ã Â¤Â­Ã Â¥â€šÃ Â¤Â®Ã Â¤Â¿ Ã Â¤Â¤Ã Â¥Ë†Ã Â¤Â¯Ã Â¤Â¾Ã Â¤Â°Ã Â¥â‚¬ Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â²Ã Â¤Â¿Ã Â¤Â Ã Â¤â€°Ã Â¤ÂªÃ Â¤Â¯Ã Â¥ÂÃ Â¤â€¢Ã Â¥ÂÃ Â¤Â¤Ã Â¥Â¤
2. **Ã Â¤Â°Ã Â¥â€¹Ã Â¤Å¸Ã Â¤Â¾Ã Â¤ÂµÃ Â¥â€¡Ã Â¤Å¸Ã Â¤Â° / Ã Â¤Â¸Ã Â¥â‚¬Ã Â¤Â¡ Ã Â¤Â¡Ã Â¥ÂÃ Â¤Â°Ã Â¤Â¿Ã Â¤Â²:** Ã Â¤Â¬Ã Â¥ÂÃ Â¤ÂµÃ Â¤Â¾Ã Â¤Ë† Ã Â¤â€Ã Â¤Â° Ã Â¤Â®Ã Â¤Â¿Ã Â¤Å¸Ã Â¥ÂÃ Â¤Å¸Ã Â¥â‚¬ Ã Â¤â€¢Ã Â¥â€¹ Ã Â¤Â¸Ã Â¤Â®Ã Â¤Â¤Ã Â¤Â² Ã Â¤â€¢Ã Â¤Â°Ã Â¤Â¨Ã Â¥â€¡ Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â²Ã Â¤Â¿Ã Â¤ÂÃ Â¥Â¤
3. **Ã Â¤â€¢Ã Â¤â€šÃ Â¤Â¬Ã Â¤Â¾Ã Â¤â€¡Ã Â¤Â¨ Ã Â¤Â¹Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤ÂµÃ Â¥â€¡Ã Â¤Â¸Ã Â¥ÂÃ Â¤Å¸Ã Â¤Â°:** ${cropName} Ã Â¤â€¢Ã Â¥â‚¬ Ã Â¤â€¢Ã Â¤Å¸Ã Â¤Â¾Ã Â¤Ë† Ã Â¤â€Ã Â¤Â° Ã Â¤Â®Ã Â¤Â¡Ã Â¤Â¼Ã Â¤Â¾Ã Â¤Ë† Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š Ã Â¤Â¸Ã Â¤Â®Ã Â¤Â¯ Ã Â¤â€Ã Â¤Â° Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â°Ã Â¤Â® Ã Â¤Â¬Ã Â¤Å¡Ã Â¤Â¾Ã Â¤Â¨Ã Â¥â€¡ Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â²Ã Â¤Â¿Ã Â¤ÂÃ Â¥Â¤

#### 3. Ã Â¤â€°Ã Â¤Â°Ã Â¥ÂÃ Â¤ÂµÃ Â¤Â°Ã Â¤â€¢ Ã Â¤ÂÃ Â¤ÂµÃ Â¤â€š Ã Â¤Â«Ã Â¤Â¸Ã Â¤Â² Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¬Ã Â¤â€šÃ Â¤Â§Ã Â¤Â¨
- **Ã Â¤â€°Ã Â¤Â°Ã Â¥ÂÃ Â¤ÂµÃ Â¤Â°Ã Â¤â€¢ Ã Â¤Â¯Ã Â¥â€¹Ã Â¤Å“Ã Â¤Â¨Ã Â¤Â¾:** Ã Â¤Â¬Ã Â¥ÂÃ Â¤ÂµÃ Â¤Â¾Ã Â¤Ë† Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â¸Ã Â¤Â®Ã Â¤Â¯ NPK 12:32:16 (50 Ã Â¤â€¢Ã Â¤Â¿Ã Â¤â€”Ã Â¥ÂÃ Â¤Â°Ã Â¤Â¾/Ã Â¤ÂÃ Â¤â€¢Ã Â¤Â¡Ã Â¤Â¼) Ã Â¤â€Ã Â¤Â° 21-25 Ã Â¤Â¦Ã Â¤Â¿Ã Â¤Â¨Ã Â¥â€¹Ã Â¤â€š Ã Â¤Â¬Ã Â¤Â¾Ã Â¤Â¦ Ã Â¤Â¯Ã Â¥â€šÃ Â¤Â°Ã Â¤Â¿Ã Â¤Â¯Ã Â¤Â¾ Ã Â¤Â¦Ã Â¥â€¡Ã Â¤â€šÃ Â¥Â¤
- **Ã Â¤Â¸Ã Â¤Â¿Ã Â¤â€šÃ Â¤Å¡Ã Â¤Â¾Ã Â¤Ë†:** ${seasonName} Ã Â¤Â®Ã Â¥Å’Ã Â¤Â¸Ã Â¤Â® Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š Ã Â¤Å“Ã Â¤Â²Ã Â¤Â­Ã Â¤Â°Ã Â¤Â¾Ã Â¤Âµ Ã Â¤Â¸Ã Â¥â€¡ Ã Â¤Â¬Ã Â¤Å¡Ã Â¥â€¡Ã Â¤â€š Ã Â¤â€Ã Â¤Â° Ã Â¤â€ Ã Â¤ÂµÃ Â¤Â¶Ã Â¥ÂÃ Â¤Â¯Ã Â¤â€¢Ã Â¤Â¤Ã Â¤Â¾Ã Â¤Â¨Ã Â¥ÂÃ Â¤Â¸Ã Â¤Â¾Ã Â¤Â° 10-12 Ã Â¤Â¦Ã Â¤Â¿Ã Â¤Â¨Ã Â¥â€¹Ã Â¤â€š Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š Ã Â¤Â¸Ã Â¤Â¿Ã Â¤â€šÃ Â¤Å¡Ã Â¤Â¾Ã Â¤Ë† Ã Â¤â€¢Ã Â¤Â°Ã Â¥â€¡Ã Â¤â€šÃ Â¥Â¤
- **Ã Â¤â€¢Ã Â¥â‚¬Ã Â¤Å¸ Ã Â¤Â¨Ã Â¤Â¿Ã Â¤Â¯Ã Â¤â€šÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â°Ã Â¤Â£:** Ã Â¤Â¨Ã Â¥â‚¬Ã Â¤Â® Ã Â¤â€ Ã Â¤Â§Ã Â¤Â¾Ã Â¤Â°Ã Â¤Â¿Ã Â¤Â¤ Ã Â¤Å“Ã Â¥Ë†Ã Â¤ÂµÃ Â¤Â¿Ã Â¤â€¢ Ã Â¤Â¸Ã Â¥ÂÃ Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¥â€¡ Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤â€°Ã Â¤ÂªÃ Â¤Â¯Ã Â¥â€¹Ã Â¤â€” Ã Â¤â€¢Ã Â¤Â°Ã Â¥â€¡Ã Â¤â€šÃ Â¥Â¤

#### 4. Ã Â¤â€ Ã Â¤ÂªÃ Â¤â€¢Ã Â¥â€¡ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨ Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤â€°Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â°
> **Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨:** "${questionVal}"
**Ã Â¤Â¸Ã Â¤Â²Ã Â¤Â¾Ã Â¤Â¹:** ${cropName} Ã Â¤â€¢Ã Â¥â‚¬ Ã Â¤â€“Ã Â¥â€¡Ã Â¤Â¤Ã Â¥â‚¬ Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š ${objName} Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¾Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â¤ Ã Â¤â€¢Ã Â¤Â°Ã Â¤Â¨Ã Â¥â€¡ Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â²Ã Â¤Â¿Ã Â¤Â Ã Â¤ÂÃ Â¤â€”Ã Â¥ÂÃ Â¤Â°Ã Â¥â€¹Ã Â¤Â°Ã Â¥â€¡Ã Â¤â€šÃ Â¤Å¸ AI Ã Â¤Â¸Ã Â¥â€¡ Ã Â¤Â¸Ã Â¤Â¹Ã Â¥â‚¬ Ã Â¤Â¸Ã Â¤Â®Ã Â¤Â¯ Ã Â¤ÂªÃ Â¤Â° Ã Â¤â€°Ã Â¤ÂªÃ Â¤â€¢Ã Â¤Â°Ã Â¤Â£ Ã Â¤â€¢Ã Â¤Â¿Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â Ã Â¤ÂªÃ Â¤Â° Ã Â¤Â²Ã Â¥â€¡Ã Â¤â€š Ã Â¤â€Ã Â¤Â° Ã Â¤â€°Ã Â¤Å¡Ã Â¤Â¿Ã Â¤Â¤ Ã Â¤Â¤Ã Â¤â€¢Ã Â¤Â¨Ã Â¥â‚¬Ã Â¤â€¢ Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤â€°Ã Â¤ÂªÃ Â¤Â¯Ã Â¥â€¹Ã Â¤â€” Ã Â¤â€¢Ã Â¤Â°Ã Â¥â€¡Ã Â¤â€šÃ Â¥Â¤`;
    }

    if (isTamil) {
      return `### Ã°Å¸Å’Â¾ Ã Â®ÂµÃ Â¯â€¡Ã Â®Â³Ã Â®Â¾Ã Â®Â£Ã Â¯Â Ã Â®â€ Ã Â®Â²Ã Â¯â€¹Ã Â®Å¡Ã Â®Â©Ã Â¯Ë† (${cropName} - ${locName})

- **Ã Â®ÂªÃ Â®Â¯Ã Â®Â¿Ã Â®Â°Ã Â¯Â:** ${cropName} | **Ã Â®Â®Ã Â®Â£Ã Â¯Â:** ${soilName}
- **Ã Â®ÂªÃ Â®Â°Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â³Ã Â®ÂµÃ Â¯Â:** ${acreageVal} Ã Â®ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â°Ã Â¯Â | **Ã Â®ÂªÃ Â®Â°Ã Â¯ÂÃ Â®ÂµÃ Â®Â®Ã Â¯Â:** ${seasonName}
- **Ã Â®â€¡Ã Â®Â²Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â¯Â:** ${objName}

#### Ã Â®ÂªÃ Â®Â°Ã Â®Â¿Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â°Ã Â¯Ë†Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â¯ÂÃ Â®Å¸ Ã Â®â€¡Ã Â®Â¯Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â°Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â:
1. **Ã Â®Å¸Ã Â®Â¿Ã Â®Â°Ã Â®Â¾Ã Â®â€¢Ã Â¯ÂÃ Â®Å¸Ã Â®Â°Ã Â¯Â (45-50 HP):** Ã Â®Â¨Ã Â®Â¿Ã Â®Â²Ã Â®Â®Ã Â¯Â Ã Â®â€°Ã Â®Â´Ã Â¯ÂÃ Â®ÂµÃ Â®Â¤Ã Â®Â±Ã Â¯ÂÃ Â®â€¢Ã Â¯Â Ã Â®Å¡Ã Â®Â¿Ã Â®Â±Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â®Â¤Ã Â¯Â.
2. **Ã Â®Å¡Ã Â¯â‚¬Ã Â®Å¸Ã Â¯Â Ã Â®Å¸Ã Â®Â¿Ã Â®Â°Ã Â®Â¿Ã Â®Â²Ã Â¯Â / Ã Â®Â°Ã Â¯Å Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®ÂµÃ Â¯â€¡Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®Â°Ã Â¯Â:** Ã Â®ÂµÃ Â®Â¿Ã Â®Â¤Ã Â¯Ë†Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯Â Ã Â®Â®Ã Â®Â±Ã Â¯ÂÃ Â®Â±Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®Â®Ã Â®Â£Ã Â¯Â Ã Â®Å¡Ã Â¯â‚¬Ã Â®Â°Ã Â®Â®Ã Â¯Ë†Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¿Ã Â®Â±Ã Â¯ÂÃ Â®â€¢Ã Â¯Â.
3. **Ã Â®â€¦Ã Â®Â±Ã Â¯ÂÃ Â®ÂµÃ Â®Å¸Ã Â¯Ë† Ã Â®â€¡Ã Â®Â¯Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â°Ã Â®Â®Ã Â¯Â:** Ã Â®â€¢Ã Â¯ÂÃ Â®Â±Ã Â¯Ë†Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤ Ã Â®Â¨Ã Â¯â€¡Ã Â®Â°Ã Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â²Ã Â¯Â Ã Â®â€¦Ã Â®Â±Ã Â¯ÂÃ Â®ÂµÃ Â®Å¸Ã Â¯Ë† Ã Â®Å¡Ã Â¯â€ Ã Â®Â¯Ã Â¯ÂÃ Â®Â¯.

#### Ã Â®â€¢Ã Â¯â€¡Ã Â®Â³Ã Â¯ÂÃ Â®ÂµÃ Â®Â¿Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â¾Ã Â®Â© Ã Â®ÂªÃ Â®Â¤Ã Â®Â¿Ã Â®Â²Ã Â¯Â:
> **Ã Â®â€¢Ã Â¯â€¡Ã Â®Â³Ã Â¯ÂÃ Â®ÂµÃ Â®Â¿:** "${questionVal}"
**Ã Â®ÂªÃ Â®Â¤Ã Â®Â¿Ã Â®Â²Ã Â¯Â:** AgroRent AI Ã Â®Â®Ã Â¯â€šÃ Â®Â²Ã Â®Â®Ã Â¯Â Ã Â®Â¤Ã Â¯â€¡Ã Â®ÂµÃ Â¯Ë†Ã Â®Â¯Ã Â®Â¾Ã Â®Â© Ã Â®â€¡Ã Â®Â¯Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â°Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Ë† Ã Â®ÂµÃ Â®Â¾Ã Â®Å¸Ã Â®â€¢Ã Â¯Ë†Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â¯Â Ã Â®Å½Ã Â®Å¸Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯Â Ã Â®ÂµÃ Â®Â¿Ã Â®Â³Ã Â¯Ë†Ã Â®Å¡Ã Â¯ÂÃ Â®Å¡Ã Â®Â²Ã Â¯Ë† Ã Â®â€¦Ã Â®Â¤Ã Â®Â¿Ã Â®â€¢Ã Â®Â°Ã Â®Â¿Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â²Ã Â®Â¾Ã Â®Â®Ã Â¯Â.`;
    }

    if (isKannada) {
      return `### Ã°Å¸Å’Â¾ Ã Â²â€¢Ã Â³Æ’Ã Â²Â·Ã Â²Â¿ Ã Â²Â¸Ã Â²Â²Ã Â²Â¹Ã Â³â€ Ã Â²â€”Ã Â²Â¾Ã Â²Â° (${cropName} - ${locName})

- **Ã Â²Â¬Ã Â³â€ Ã Â²Â³Ã Â³â€ :** ${cropName} | **Ã Â²Â®Ã Â²Â£Ã Â³ÂÃ Â²Â£Ã Â³Â:** ${soilName}
- **Ã Â²ÂµÃ Â²Â¿Ã Â²Â¸Ã Â³ÂÃ Â²Â¤Ã Â³â‚¬Ã Â²Â°Ã Â³ÂÃ Â²Â£:** ${acreageVal} Ã Â²Å½Ã Â²â€¢Ã Â²Â°Ã Â³â€  | **Ã Â²â€¹Ã Â²Â¤Ã Â³Â:** ${seasonName}
- **Ã Â²â€°Ã Â²Â¦Ã Â³ÂÃ Â²Â¦Ã Â³â€¡Ã Â²Â¶:** ${objName}

#### Ã Â²â€°Ã Â²ÂªÃ Â²â€¢Ã Â²Â°Ã Â²Â£Ã Â²â€”Ã Â²Â³ Ã Â²Â¸Ã Â²Â²Ã Â²Â¹Ã Â³â€ :
1. **Ã Â²Å¸Ã Â³ÂÃ Â²Â°Ã Â²Â¾Ã Â²â€¢Ã Â³ÂÃ Â²Å¸Ã Â²Â°Ã Â³Â (45-50 HP):** Ã Â²Â­Ã Â³â€šÃ Â²Â®Ã Â²Â¿ Ã Â²Â¸Ã Â²Â¿Ã Â²Â¦Ã Â³ÂÃ Â²Â§Ã Â²Â¤Ã Â³â€ Ã Â²â€”Ã Â³â€  Ã Â²Â¸Ã Â³â€šÃ Â²â€¢Ã Â³ÂÃ Â²Â¤Ã Â²ÂµÃ Â²Â¾Ã Â²â€”Ã Â²Â¿Ã Â²Â¦Ã Â³â€ .
2. **Ã Â²Â¸Ã Â³â‚¬Ã Â²Â¡Ã Â³Â Ã Â²Â¡Ã Â³ÂÃ Â²Â°Ã Â²Â¿Ã Â²Â²Ã Â³Â / Ã Â²Â°Ã Â³â€¹Ã Â²Å¸Ã Â²ÂµÃ Â³â€¡Ã Â²Å¸Ã Â²Â°Ã Â³Â:** Ã Â²Â¬Ã Â²Â¿Ã Â²Â¤Ã Â³ÂÃ Â²Â¤Ã Â²Â¨Ã Â³â€ Ã Â²â€”Ã Â²Â¾Ã Â²â€”Ã Â²Â¿.
3. **Ã Â²Â¹Ã Â²Â¾Ã Â²Â°Ã Â³ÂÃ Â²ÂµÃ Â³â€ Ã Â²Â¸Ã Â³ÂÃ Â²Å¸Ã Â²Â°Ã Â³Â:** Ã Â²Â¸Ã Â³ÂÃ Â²Â²Ã Â²Â­ Ã Â²â€¢Ã Â³Å Ã Â²Â¯Ã Â³ÂÃ Â²Â²Ã Â²Â¿Ã Â²â€”Ã Â²Â¾Ã Â²â€”Ã Â²Â¿.

#### Ã Â²Â¨Ã Â²Â¿Ã Â²Â®Ã Â³ÂÃ Â²Â® Ã Â²ÂªÃ Â³ÂÃ Â²Â°Ã Â²Â¶Ã Â³ÂÃ Â²Â¨Ã Â³â€ Ã Â²â€”Ã Â³â€  Ã Â²â€°Ã Â²Â¤Ã Â³ÂÃ Â²Â¤Ã Â²Â°:
> **Ã Â²ÂªÃ Â³ÂÃ Â²Â°Ã Â²Â¶Ã Â³ÂÃ Â²Â¨Ã Â³â€ :** "${questionVal}"
**Ã Â²â€°Ã Â²Â¤Ã Â³ÂÃ Â²Â¤Ã Â²Â°:** AgroRent AI Ã Â²Â®Ã Â³â€šÃ Â²Â²Ã Â²â€¢ Ã Â²Â¯Ã Â²â€šÃ Â²Â¤Ã Â³ÂÃ Â²Â°Ã Â²â€”Ã Â²Â³Ã Â²Â¨Ã Â³ÂÃ Â²Â¨Ã Â³Â Ã Â²Â¬Ã Â²Â¾Ã Â²Â¡Ã Â²Â¿Ã Â²â€”Ã Â³â€ Ã Â²â€”Ã Â³â€  Ã Â²ÂªÃ Â²Â¡Ã Â³â€ Ã Â²Â¦Ã Â³Â Ã Â²â€¡Ã Â²Â³Ã Â³ÂÃ Â²ÂµÃ Â²Â°Ã Â²Â¿ Ã Â²Â¹Ã Â³â€ Ã Â²Å¡Ã Â³ÂÃ Â²Å¡Ã Â²Â¿Ã Â²Â¸Ã Â²Â¿.`;
    }

    return `### Ã°Å¸Å’Â¾ Agricultural Advisory & Equipment Guide (${cropName} - ${locName})

#### 1. Situation Summary
- **Crop:** ${cropName}
- **Soil Type:** ${soilName}
- **Acreage:** ${acreageVal} acres
- **Location & Season:** ${locName} (${seasonName} Season)
- **Objective:** ${objName}

> Ã°Å¸â€™Â¡ **Acreage Insights:** ${acreageAdviceEnglish}

#### 2. Recommended Machinery (AgroRent AI Rental Options)
1. **Tractor (45-50 HP):** Ideal for deep ploughing and primary seedbed preparation in ${soilName} soil.
2. **Rotavator & Seed Drill:** Ensures uniform seed placement and soil pulverization.
3. **Combine Harvester:** Speeds up harvesting and threshing for ${cropName}.

#### 3. Soil & Fertilizer Management
- **Fertilizer Plan:** Apply NPK 12:32:16 (50 kg/acre) as basal dose during sowing. Top-dress with Urea at 21-25 days after first irrigation.
- **Irrigation:** Schedule light irrigation every 10-12 days; prevent waterlogging during the ${seasonName} season.
- **Pest Control:** Use neem-based organic sprays and monitor crops regularly.

#### 4. Answer to Your Query
> **Question:** "${questionVal}"
**Advice:** To achieve your goal of "${objName}" for ${cropName} on ${acreageVal} acres, renting machinery on AgroRent AI ensures optimal productivity at minimal operational cost.`;
  }

  public async getSearchIntent(query: string): Promise<string> {
    const prompt = `
      You are a search intent parser for an agricultural equipment platform.
      Extract the main equipment keyword (in English) from this user query. The query might be in a regional Indian language (Telugu, Hindi, etc.) or complex natural language.
      Query: "${query}"

      Return ONLY a single English keyword (e.g., tractor, harvester, cultivator, seed drill) in plain text. Do not include markdown or extra text.
    `;

    const result = await this.generate(prompt, false);
    return result.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
  }

  public async translateListing(title: string, description: string): Promise<TranslationResult> {
    const prompt = `
      Translate the following agricultural equipment listing into English (en), Telugu (te), Hindi (hi), Tamil (ta), and Kannada (kn).
      Respond strictly in valid JSON format exactly matching this schema, without markdown blocks:
      {
        "titleEn": "...", "titleTe": "...", "titleHi": "...", "titleTa": "...", "titleKn": "...",
        "descriptionEn": "...", "descriptionTe": "...", "descriptionHi": "...", "descriptionTa": "...", "descriptionKn": "..."
      }

      Title: ${title}
      Description: ${description}
    `;

    const result = await this.generate(prompt, true);

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : result;

      const parsed = JSON.parse(cleanJson.trim());

      if (parsed.titleEn === '...' || parsed.titleEn === 'string') {
          throw new Error('Model returned schema template');
      }

      return {
        titleEn: parsed.titleEn || title,
        titleTe: parsed.titleTe || title,
        titleHi: parsed.titleHi || title,
        titleTa: parsed.titleTa || title,
        titleKn: parsed.titleKn || title,
        descriptionEn: parsed.descriptionEn || description,
        descriptionTe: parsed.descriptionTe || description,
        descriptionHi: parsed.descriptionHi || description,
        descriptionTa: parsed.descriptionTa || description,
        descriptionKn: parsed.descriptionKn || description,
      };
    } catch (error: any) {
      console.warn('AI Translation parsing failed, using fallback:', error.message);
      return {
        titleEn: title,
        titleTe: title,
        titleHi: title,
        titleTa: title,
        titleKn: title,
        descriptionEn: description,
        descriptionTe: description,
        descriptionHi: description,
        descriptionTa: description,
        descriptionKn: description,
      };
    }
  }

  public async getEquipmentRecommendations(crop: string, soilType: string, acreage: string): Promise<any> {
    const prompt = `
      You are an expert agronomist AI for a platform called AgroRent AI.
      A farmer is planting ${crop}.
      ${soilType ? `The soil type is ${soilType}.` : ""}
      ${acreage ? `They have ${acreage} acres of land.` : ""}

      Based on this, what are the top 3 types of farming equipment they will need to rent throughout the crop lifecycle?
      Respond strictly in valid JSON format matching this schema:
      {
        "recommendations": [
          {
            "name": "Tractor",
            "category": "TRACTOR",
            "why": "Used for initial ploughing."
          }
        ],
        "reasoning": "A paragraph explaining."
      }
      Do NOT return the schema definition. Fill in the JSON with REAL data for ${crop}.
    `;

    const result = await this.generate(prompt, true);

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : result;

      const parsed = JSON.parse(cleanJson.trim());

      // If the model just repeated the schema (qwen:0.5b behavior)
      if (parsed.recommendations && parsed.recommendations[0] && parsed.recommendations[0].name === "Tractor" && parsed.recommendations[0].why === "Used for initial ploughing.") {
          throw new Error("Model returned schema template instead of data");
      }

      return parsed;
    } catch (error: any) {
      console.warn('AI Recommendations parsing failed or template returned, using fallback logic:', error.message);
      // Fallback logic for weak CPU models
      return {
        recommendations: [
          {
            name: "Tractor",
            category: "TRACTOR",
            why: `Essential equipment for ${crop} farming.`
          },
          {
            name: "Cultivator",
            category: "IMPLEMENT",
            why: `Useful for preparing the ${soilType} soil.`
          }
        ],
        reasoning: `Based on your request for ${crop} farming on ${acreage}, a basic set of equipment is recommended. Our tiny CPU AI model could not generate a custom response, so this is a standard fallback.`
      };
    }
  }
}

export const aiProvider = new AIProviderService();
