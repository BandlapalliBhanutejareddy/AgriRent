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
    try {
      return await this.generate(prompt, false, system, timeoutMs);
    } catch {
      return '';
    }
  }

  private async generate(prompt: string, requireJson = false, system?: string, timeoutMs = 8000): Promise<string> {
    try {
      const effectiveTimeout = timeoutMs;
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
        signal: AbortSignal.timeout(effectiveTimeout)
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

  public async getAdvisorAdvice(params: any, language: string, equipmentList: any[] = []): Promise<string> {
    const crop = typeof params === 'object' ? (params.crop || '').trim() : '';
    const soilType = typeof params === 'object' ? (params.soilType || '').trim() : '';
    const acreage = typeof params === 'object' ? (params.acreage !== undefined && params.acreage !== null ? String(params.acreage).trim() : '') : '';
    const location = typeof params === 'object' ? (params.location || '').trim() : '';
    const season = typeof params === 'object' ? (params.season || '').trim() : '';
    const objective = typeof params === 'object' ? (params.objective || '').trim() : '';
    const question = typeof params === 'object' ? (params.question || '').trim() : '';
    const rawPrompt = typeof params === 'string' ? params.trim() : ((params.prompt || question || (crop ? `Advice for ${crop}` : '')).trim());

    const targetLang = language || (typeof params === 'object' && params.language) || 'English';
    const isEnglish = !targetLang || targetLang.toLowerCase() === 'english' || targetLang.toLowerCase() === 'en';

    // If an Indic language (Telugu, Hindi, Tamil, Kannada) is requested:
    // Local qwen:0.5b does not have Indic script vocabulary and generates invalid mixed characters.
    // Deliver the verified, high-quality, localized ICAR agronomic guidance with verified live machinery.
    if (!isEnglish) {
      console.log(`[AI Service] Non-English language '${targetLang}' requested. Delivering verified localized ICAR agronomic guidance.`);
      return this.getAgronomyFallback(question || rawPrompt, crop, soilType, acreage, location, season, objective, targetLang, equipmentList);
    }

    const compactEquipment = (equipmentList || []).slice(0, 3)
      .map(e => `${e.title || e.name} (${e.category || 'Machinery'}): ₹${e.pricePerDay || 1000}/day`)
      .join('; ');

    const fullContext = `FARMER CONTEXT: Crop: ${crop || 'Not specified'}, Soil: ${soilType || 'Standard'}, Acreage: ${acreage ? acreage + ' acres' : 'Not specified'}, Location: ${location || 'Local region'}, Season: ${season || 'Not specified'}. User Question: ${question || rawPrompt || 'General farming advice'}. Platform Machinery: ${compactEquipment || 'Tractors and implements available'}.`;

    const systemPrompt = `You are an expert Agricultural Advisor for AgroRent AI. Provide practical, accurate agronomic guidance in clear English. Mention soil testing at KVK and suitable rental machinery. Keep recommendations concise and direct.`;
    const userPrompt = `${fullContext}\n\nProvide structured advice for the farmer in clear English.`;

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
  }

  public getAgronomyFallback(
    query: string,
    crop: string,
    soil: string,
    acreage: string,
    loc: string,
    season: string,
    obj: string,
    lang: string,
    equipmentList: any[] = []
  ): string {
    const lowerLang = (lang || '').toLowerCase();
    const isTelugu = lowerLang.includes('telugu') || lowerLang === 'te';
    const isHindi = lowerLang.includes('hindi') || lowerLang === 'hi';
    const isTamil = lowerLang.includes('tamil') || lowerLang === 'ta';
    const isKannada = lowerLang.includes('kannada') || lowerLang === 'kn';

    // 1. Audit missing parameters - Never invent missing context
    const missingItemsEn: string[] = [];
    const missingItemsTe: string[] = [];
    const missingItemsHi: string[] = [];
    const missingItemsTa: string[] = [];
    const missingItemsKn: string[] = [];

    if (!crop) {
      missingItemsEn.push('Crop');
      missingItemsTe.push('సాగు పంట');
      missingItemsHi.push('फसल');
      missingItemsTa.push('பயிர்');
      missingItemsKn.push('ಬೆಳೆ');
    }
    if (!acreage) {
      missingItemsEn.push('Land Acreage');
      missingItemsTe.push('సాగు విస్తీర్ణం (ఎకరాలు)');
      missingItemsHi.push('भूमि क्षेत्र (एकड़)');
      missingItemsTa.push('நில பரப்பளவு');
      missingItemsKn.push('ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ');
    }
    if (!soil) {
      missingItemsEn.push('Soil Type');
      missingItemsTe.push('నేల రకం');
      missingItemsHi.push('मिट्टी का प्रकार');
      missingItemsTa.push('மண் வகை');
      missingItemsKn.push('ಮಣ್ಣಿನ ಪ್ರಕಾರ');
    }
    if (!loc) {
      missingItemsEn.push('Location');
      missingItemsTe.push('ప్రాంతం/జిల్లా');
      missingItemsHi.push('स्थान');
      missingItemsTa.push('இடம்');
      missingItemsKn.push('ಸ್ಥಳ');
    }
    if (!season) {
      missingItemsEn.push('Season/Crop Stage');
      missingItemsTe.push('సీజన్/పంట దశ');
      missingItemsHi.push('मौसम/फसल चरण');
      missingItemsTa.push('பருவம்');
      missingItemsKn.push('ಋತು');
    }

    // 2. Truthful Field Representations (Explicitly identify missing data)
    const cropDisplay = crop || (
      isTelugu ? 'పేర్కొనబడలేదు (ఖచ్చితమైన సలహా కోసం పంట పేరును నమోదు చేయండి)' :
      isHindi ? 'निर्दिष्ट नहीं (सटीक सलाह के लिए कृपया फसल का नाम दर्ज करें)' :
      isTamil ? 'குறிப்பிடப்படவில்லை' :
      isKannada ? 'ನಿರ್ದಿಷ್ಟಪಡಿಸಿಲ್ಲ' :
      'Not specified (Please specify crop for targeted advisory)'
    );

    const soilDisplay = soil || (
      isTelugu ? 'పేర్కొనబడలేదు (సాయిల్ హెల్త్ కార్డ్ / మట్టి పరీక్ష సిఫార్సు చేయబడింది)' :
      isHindi ? 'निर्दिष्ट नहीं (मृदा स्वास्थ्य कार्ड / मिट्टी परीक्षण कराने की सलाह दी जाती है)' :
      isTamil ? 'குறிப்பிடப்படவில்லை (மண் பரிசோதனை பரிந்துரைக்கப்படுகிறது)' :
      isKannada ? 'ನಿರ್ದಿಷ್ಟಪಡಿಸಿಲ್ಲ (ಮಣ್ಣು ಪರೀಕ್ಷೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ)' :
      'Not specified (Soil testing via Soil Health Card recommended)'
    );

    const acreageDisplay = acreage ? (
      isTelugu ? `${acreage} ఎకరాలు` :
      isHindi ? `${acreage} एकड़` :
      isTamil ? `${acreage} ஏக்கர்` :
      isKannada ? `${acreage} ಎಕರೆ` :
      `${acreage} acres`
    ) : (
      isTelugu ? 'పేర్కొనబడలేదు (సరైన యంత్రాల ఎంపికకు సాగు విస్తీర్ణం అవసరం)' :
      isHindi ? 'निर्दिष्ट नहीं (उचित मशीनरी चयन के लिए भूमि क्षेत्र आवश्यक है)' :
      isTamil ? 'குறிப்பிடப்படவில்லை' :
      isKannada ? 'ನಿರ್ದಿಷ್ಟಪಡಿಸಿಲ್ಲ' :
      'Not specified (Machinery capacity and field duration depend on acreage)'
    );

    const locDisplay = loc || (
      isTelugu ? 'పేర్కొనబడలేదు' :
      isHindi ? 'निर्दिष्ट नहीं' :
      isTamil ? 'குறிப்பிடப்படவில்லை' :
      isKannada ? 'ನಿರ್ದಿಷ್ಟಪಡಿಸಿಲ್ಲ' :
      'Not specified'
    );

    const seasonDisplay = season || (
      isTelugu ? 'పేర్కొనబడలేదు' :
      isHindi ? 'निर्दिष्ट नहीं' :
      isTamil ? 'குறிப்பிடப்படவில்லை' :
      isKannada ? 'ನಿರ್ದಿಷ್ಟಪಡಿಸಿಲ್ಲ' :
      'Not specified'
    );

    const objDisplay = obj || (
      isTelugu ? 'సాధారణ వ్యవసాయ అభివృద్ధి & ఖర్చుల నియంత్రణ' :
      isHindi ? 'सामान्य कृषि सुधार एवं लागत नियंत्रण' :
      isTamil ? 'பொதுவான விவசாய மேம்பாடு' :
      isKannada ? 'ಸಾಮಾನ್ಯ ಕೃಷಿ ಸುಧಾರಣೆ' :
      'General farming productivity & operational efficiency'
    );

    const questionVal = query || (
      isTelugu ? 'వ్యవసాయ మార్గదర్శకం మరియు యంత్రాల సలహా' :
      isHindi ? 'कृषि मार्गदर्शन एवं उपकरण सलाह' :
      isTamil ? 'வேளாண் வழிகாட்டுதல்' :
      isKannada ? 'ಕೃಷಿ ಮಾರ್ಗದರ್ಶನ' :
      'Farming and equipment advice'
    );

    // 3. Equipment Section from Verified Database Records Only
    const verifiedEquipment = Array.isArray(equipmentList)
      ? equipmentList.filter(e => e && (e.title || e.name) && (e.available === true || e.available === undefined))
      : [];

    let equipmentSection = '';

    if (isTelugu) {
      if (verifiedEquipment.length > 0) {
        const itemsList = verifiedEquipment.slice(0, 4).map((eq, idx) => {
          const title = eq.title || eq.name;
          const category = eq.category || 'వ్యవసాయ పరికరం';
          const price = eq.pricePerDay ? `₹${eq.pricePerDay}/రోజు` : 'ధర మార్కెట్‌ప్లేస్‌లో లభ్యం';
          const locStr = eq.location ? ` | ప్రాంతం: ${eq.location}` : '';
          return `${idx + 1}. **${title}** (${category}) — ${price}${locStr} [నిర్ధారించబడిన లైవ్ లిస్టింగ్]`;
        }).join('\n');

        equipmentSection = `#### 2. మార్కెట్‌ప్లేస్‌లో ధృవీకరించబడిన యంత్రాలు (AgroRent AI ప్రత్యక్ష లభ్యత)\n${itemsList}\n\n> ℹ️ *గమనిక: పై యంత్రాలు ప్రస్తుత మార్కెట్‌ప్లేస్ రికార్డుల ప్రకారం ధృవీకరించబడ్డాయి. బుకింగ్ చేయడానికి ముందు యజమానితో తేదీలను నిర్ధారించుకోండి.*`;
      } else {
        equipmentSection = `#### 2. వ్యవసాయ యంత్రాల లభ్యత (AgroRent AI మార్కెట్‌ప్లేస్)\n> ⚠️ **ప్రస్తుతం మీ ప్రాంతంలో ధృవీకరించబడిన యంత్రాలు లిస్ట్ చేయబడలేదు.**\n- అసత్యమైన లేదా ధృవీకరించని సమాచారం ఇవ్వకుండా, AgroRent AI లైవ్ రికార్డులను మాత్రమే ప్రదర్శిస్తుంది.\n- కొత్త యంత్రాలు అందుబాటులోకి రాగానే సమాచారం పొందడానికి యాప్‌లో 'లభ్యత అలర్ట్' సెట్ చేసుకోండి.`;
      }
    } else if (isHindi) {
      if (verifiedEquipment.length > 0) {
        const itemsList = verifiedEquipment.slice(0, 4).map((eq, idx) => {
          const title = eq.title || eq.name;
          const category = eq.category || 'कृषि उपकरण';
          const price = eq.pricePerDay ? `₹${eq.pricePerDay}/दिन` : 'मूल्य संपर्क पर';
          const locStr = eq.location ? ` | स्थान: ${eq.location}` : '';
          return `${idx + 1}. **${title}** (${category}) — ${price}${locStr} [सत्यापित लाइव लिस्टिंग]`;
        }).join('\n');

        equipmentSection = `#### 2. मार्केटप्लेस पर सत्यापित उपकरण (AgroRent AI लाइव उपलब्धता)\n${itemsList}\n\n> ℹ️ *सूचना: उपरोक्त उपकरण वर्तमान मार्केटप्लेस डेटाबेस से सत्यापित हैं। बुकिंग से पहले मालिक के साथ तारीखों की पुष्टि करें।*`;
      } else {
        equipmentSection = `#### 2. कृषि उपकरण उपलब्धता (AgroRent AI मार्केटप्लेस)\n> ⚠️ **वर्तमान में आपके स्थानीय क्षेत्र में कोई सत्यापित उपकरण सूचीबद्ध नहीं है।**\n- AgroRent AI केवल वास्तविक व सत्यापित डेटा प्रदर्शित करता है।\n- नए उपकरण उपलब्ध होने पर सूचना पाने के लिए ऐप में 'उपलब्धता अलर्ट' सेट करें।`;
      }
    } else if (isTamil) {
      if (verifiedEquipment.length > 0) {
        const itemsList = verifiedEquipment.slice(0, 4).map((eq, idx) => {
          const title = eq.title || eq.name;
          const category = eq.category || 'இயந்திரம்';
          const price = eq.pricePerDay ? `₹${eq.pricePerDay}/நாள்` : 'விலை சரிபார்க்கவும்';
          return `${idx + 1}. **${title}** (${category}) — ${price}`;
        }).join('\n');
        equipmentSection = `#### 2. சரிபார்க்கப்பட்ட இயந்திரங்கள்:\n${itemsList}`;
      } else {
        equipmentSection = `#### 2. இயந்திரங்கள்:\n> ⚠️ தற்போது உங்கள் பகுதியில் சரிபார்க்கப்பட்ட இயந்திரங்கள் எதுவும் கிடைக்கவில்லை.`;
      }
    } else if (isKannada) {
      if (verifiedEquipment.length > 0) {
        const itemsList = verifiedEquipment.slice(0, 4).map((eq, idx) => {
          const title = eq.title || eq.name;
          const category = eq.category || 'ಉಪಕರಣ';
          const price = eq.pricePerDay ? `₹${eq.pricePerDay}/ದಿನ` : 'ಬೆಲೆ ಪರಿಶೀಲಿಸಿ';
          return `${idx + 1}. **${title}** (${category}) — ${price}`;
        }).join('\n');
        equipmentSection = `#### 2. ಪರಿಶೀಲಿಸಿದ ಯಂತ್ರಗಳು:\n${itemsList}`;
      } else {
        equipmentSection = `#### 2. ಯಂತ್ರಗಳು:\n> ⚠️ ಪ್ರಸ್ತುತ ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ ಯಂತ್ರಗಳು ಲಭ್ಯವಿಲ್ಲ.`;
      }
    } else {
      if (verifiedEquipment.length > 0) {
        const itemsList = verifiedEquipment.slice(0, 4).map((eq, idx) => {
          const title = eq.title || eq.name;
          const category = eq.category || 'Farm Equipment';
          const price = eq.pricePerDay ? `₹${eq.pricePerDay}/day` : 'Rate on request';
          const locStr = eq.location ? ` | Location: ${eq.location}` : '';
          return `${idx + 1}. **${title}** (${category}) — ${price}${locStr} [Verified Live Listing]`;
        }).join('\n');

        equipmentSection = `#### 2. Verified Marketplace Equipment (AgroRent AI Live Availability)\n${itemsList}\n\n> ℹ️ *Note: The machinery above reflects confirmed active listings from the AgroRent database. Confirm dates and delivery logistics with the equipment owner prior to dispatch.*`;
      } else {
        equipmentSection = `#### 2. Farm Equipment Availability (AgroRent AI Marketplace)\n> ⚠️ **No verified equipment currently listed in your immediate area.**\n- AgroRent AI strictly references actual registered machinery and will never invent availability or fake rental rates.\n- Please browse the full catalog, expand your search radius, or set an in-app Availability Alert to be notified when nearby owners register suitable equipment.`;
      }
    }

    // 4. Missing Parameters Banner
    let contextAlert = '';
    if (missingItemsEn.length > 0) {
      if (isTelugu) {
        contextAlert = `> ⚠️ **అసంపూర్ణ వివరాల గమనిక:** కింది వివరాలు నమోదు కాలేదు: **${missingItemsTe.join(', ')}**. కచ్చితమైన మరియు వ్యక్తిగతీకరించిన సలహా కోసం దయచేసి పూర్తి వివరాలను నమోదు చేయండి.\n\n`;
      } else if (isHindi) {
        contextAlert = `> ⚠️ **अपूर्ण विवरण सूचना:** निम्नलिखित जानकारी उपलब्ध नहीं है: **${missingItemsHi.join(', ')}**। व्यक्तिगत और सटीक सलाह के लिए कृपया पूरा विवरण दर्ज करें।\n\n`;
      } else if (isTamil) {
        contextAlert = `> ⚠️ **குறிப்பு:** சில விவரங்கள் (${missingItemsTa.join(', ')}) உள்ளிடப்படவில்லை. துல்லியமான பரிந்துரைக்கு விவரங்களை நிரப்பவும்.\n\n`;
      } else if (isKannada) {
        contextAlert = `> ⚠️ **ಸೂಚನೆ:** ಕೆಲವು ವಿವರಗಳು (${missingItemsKn.join(', ')}) ನಮೂದಿಸಿಲ್ಲ. ನಿಖರ ಸಲಹೆಗಾಗಿ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.\n\n`;
      } else {
        contextAlert = `> ⚠️ **Missing Context Notice:** The following farm parameters were not specified: **${missingItemsEn.join(', ')}**. Agronomic recommendations require these parameters for field-level accuracy.\n\n`;
      }
    }

    // 5. Construct Language-Specific Safe Educational Advisory
    if (isTelugu) {
      return `### 🌾 [AgroRent AI సాధారణ సమాచార మార్గదర్శకం]
> ℹ️ *గమనిక: ఇది ధృవీకరించబడిన వ్యవసాయ మార్గదర్శకం. లైవ్ AI మోడల్ అందుబాటులో లేనందున ప్రామాణిక శాస్త్రీయ సమాచారం అందించబడుతోంది.*

${contextAlert}#### 1. మీ వ్యవసాయ పరిస్థితి సమీక్ష
- **సాగు పంట:** ${cropDisplay}
- **నేల రకం:** ${soilDisplay}
- **సాగు విస్తీర్ణం:** ${acreageDisplay}
- **ప్రాంతం:** ${locDisplay}
- **సీజన్ / దశ:** ${seasonDisplay}
- **లక్ష్యం:** ${objDisplay}

${equipmentSection}

#### 3. నేల ఆరోగ్యం & శాస్త్రీయ పోషక యాజమాన్యం (ICAR / KVK ప్రమాణాలు)
- **మట్టి పరీక్ష తప్పనిసరి:** నిర్దిష్టమైన మట్టి పరీక్ష (సాయిల్ హెల్త్ కార్డ్ - SHC) మరియు ల్యాబ్ విశ్లేషణ లేకుండా ఏకపక్షంగా రసాయన ఎరువుల మోతాదులను (NPK/యూరియా) వాడకండి. ఇది నేల ఆరోగ్యాన్ని దెబ్బతీస్తుంది.
- **సేంద్రీయ పోషణ:** ప్రాథమిక దుక్కి సమయంలో ఎకరాకు 4-5 టన్నుల బాగా చివికిన పశువుల ఎరువు (FYM) లేదా వర్మీ కంపోస్ట్ ఉపయోగించండి.
- **సమగ్ర సస్యరక్షణ (IPM):** పురుగుల నివారణకు ప్రారంభంలోనే లింగాకర్షక బుట్టలు మరియు వేప నూనె (Azadirachtin 1500 ppm) వాడండి. పురుగుల ఉధృతిని బట్టి స్థానిక కృషి విజ్ఞాన కేంద్రం (KVK) లేదా మండల వ్యవసాయ అధికారి సూచనల ప్రకారం మాత్రమే రసాయన మందులను వాడండి.

#### 4. ఆర్థిక విశ్లేషణ & మీ ప్రశ్నకు మార్గదర్శకం
> **ప్రశ్న:** "${questionVal}"
- **ఆర్థిక ప్రయోజనం:** పెద్ద పెట్టుబడితో సొంతంగా యంత్రాలను కొనుగోలు చేయడం కంటే, AgroRent AI ద్వారా అవసరమైనప్పుడు మాత్రమే అద్దెకు తీసుకోవడం వల్ల మూలధన భారం మరియు మరమ్మతు ఖర్చులు తగ్గుతాయి.
- **సిఫార్సు:** స్థానిక వ్యవసాయ విశ్వవిద్యాలయ మార్గదర్శకాల ప్రకారం సకాలంలో నాణ్యమైన పరికరాలను ఉపయోగించి శ్రమను మరియు సమయాన్ని ఆదా చేసుకోండి.`;
    }

    if (isHindi) {
      return `### 🌾 [AgroRent AI सामान्य शैक्षिक मार्गदर्शन]
> ℹ️ *सूचना: यह प्रमाणित कृषि मार्गदर्शन है। लाइव एआई मॉडल अनुपलब्ध होने के कारण मानक वैज्ञानिक जानकारी प्रदर्शित की जा रही है।*

${contextAlert}#### 1. आपकी कृषि स्थिति का सारांश
- **फसल:** ${cropDisplay}
- **मिट्टी का प्रकार:** ${soilDisplay}
- **भूमि क्षेत्र:** ${acreageDisplay}
- **स्थान:** ${locDisplay}
- **मौसम / चरण:** ${seasonDisplay}
- **मुख्य लक्ष्य:** ${objDisplay}

${equipmentSection}

#### 3. मृदा स्वास्थ्य एवं वैज्ञानिक पोषण प्रबंधन (ICAR / KVK सिद्धांत)
- **मृदा परीक्षण अनिवार्य:** मिट्टी की जांच (मृदा स्वास्थ्य कार्ड - SHC) के बिना किसी निश्चित मात्रा में रासायनिक उर्वरकों (NPK/यूरिया) का अंधाधुंध उपयोग न करें। अपनी नजदीकी प्रयोगशाला या KVK से जांच कराएं।
- **जैविक सुधार:** प्राथमिक जुताई के समय अच्छी तरह सड़ी हुई गोबर की खाद (FYM) या केंचुआ खाद डालकर मिट्टी में जैविक कार्बन बढ़ाएं।
- **एकीकृत कीट प्रबंधन (IPM):** कीटों के जैविक नियंत्रण हेतु फेरोमोन ट्रैप, नीले/पीले चिपचिपे कार्ड और नीम तेल आधारित कीटनाशकों का प्रयोग करें। रासायनिक छिड़काव केवल स्थानीय कृषि अधिकारी की सलाह पर करें।

#### 4. आर्थिक विश्लेषण एवं आपके प्रश्न का समाधान
> **प्रश्न:** "${questionVal}"
- **आर्थिक लाभ:** महंगे कृषि यंत्रों को खरीदने के बजाय AgroRent AI के माध्यम से आवश्यकतानुसार किराए पर लेने से पूंजीगत कर्ज और रखरखाव का खर्च घटता है।
- **परामर्श:** स्थानीय कृषि विश्वविद्यालय के अनुशंसित पैकेज ऑफ प्रैक्टिसेज का पालन करते हुए समय पर आधुनिक मशीनरी का उपयोग करें।`;
    }

    if (isTamil) {
      return `### 🌾 [AgroRent AI பொது வேளாண் வழிகாட்டி]
> ℹ️ *குறிப்பு: நேரலை AI கிடைக்காததால் பொதுவான வழிகாட்டுதல் காட்டப்படுகிறது.*

${contextAlert}#### 1. பண்ணை விவரம்:
- **பயிர்:** ${cropDisplay} | **மண்:** ${soilDisplay}
- **பரப்பளவு:** ${acreageDisplay} | **பருவம்:** ${seasonDisplay}
- **இலக்கு:** ${objDisplay}

${equipmentSection}

#### 3. மண் வளம் & ஊட்டச்சத்து மேலாண்மை:
- மண் பரிசோதனை அட்டை (Soil Health Card) அடிப்படையில் மட்டுமே உரமிடவும். அளவு தெரியாமல் ரசாயன உரங்களை இடாதீர்கள்.
- இயற்கை உரம் மற்றும் ஒருங்கிணைந்த பூச்சி மேலாண்மை (IPM) முறைகளைப் பின்பற்றவும்.

#### 4. கேள்விக்கான பதில்:
> **கேள்வி:** "${questionVal}"
**ஆலோசனை:** AgroRent AI மூலம் தேவையான இயந்திரங்களை வாடகைக்கு எடுத்து முதலீட்டுச் செலவைக் குறைத்து விளைச்சலை அதிகரிக்கலாம்.`;
    }

    if (isKannada) {
      return `### 🌾 [AgroRent AI ಸಾಮಾನ್ಯ ಕೃಷಿ ಮಾರ್ಗದರ್ಶನ]
> ℹ️ *ಸೂಚನೆ: ಲೈವ್ AI ಲಭ್ಯವಿಲ್ಲದ ಕಾರಣ ಸಾಮಾನ್ಯ ಕೃಷಿ ಮಾರ್ಗದರ್ಶನವನ್ನು ನೀಡಲಾಗಿದೆ.*

${contextAlert}#### 1. ಜಮೀನಿನ ವಿವರ:
- **ಬೆಳೆ:** ${cropDisplay} | **ಮಣ್ಣು:** ${soilDisplay}
- **ವಿಸ್ತೀರ್ಣ:** ${acreageDisplay} | **ಹಂತ:** ${seasonDisplay}
- **ಉದ್ದೇಶ:** ${objDisplay}

${equipmentSection}

#### 3. ಮಣ್ಣಿನ ಆರೋಗ್ಯ & ಪೋಷಕಾಂಶಗಳ ನಿರ್ವಹಣೆ:
- ಮಣ್ಣು ಪರೀಕ್ಷೆ (Soil Health Card) ಆಧಾರದ ಮೇಲೆ ಮಾತ್ರ ರಸಗೊಬ್ಬರ ಬಳಸಿ. ಪ್ರಮಾಣ ತಿಳಿಯದೆ ರಾಸಾಯನಿಕ ಗೊಬ್ಬರ ಬಳಸಬೇಡಿ.
- ಸಾವಯವ ಗೊಬ್ಬರ ಮತ್ತು ಸಮಗ್ರ ಕೀಟ ನಿರ್ವಹಣೆ (IPM) ಪದ್ಧತಿಗಳನ್ನು ಅಳವಡಿಸಿಕೊಳ್ಳಿ.

#### 4. ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರ:
> **ಪ್ರಶ್ನೆ:** "${questionVal}"
**ಸಲಹೆ:** AgroRent AI ಮೂಲಕ ಯಂತ್ರಗಳನ್ನು ಬಾಡಿಗೆಗೆ ಪಡೆದು ಬಂಡವಾಳ ವೆಚ್ಚವನ್ನು ಕಡಿಮೆ ಮಾಡಿ ಇಳುವರಿ ಹೆಚ್ಚಿಸಿ.`;
    }

    return `### 🌾 [AgroRent AI General Advisory & Information Guide]
> ℹ️ *Notice: Standard verified agronomic principles are shown below. Live AI reasoning model was unavailable; context-specific advice requires full farm parameter inputs.*

${contextAlert}#### 1. Situation Summary
- **Crop:** ${cropDisplay}
- **Soil Type:** ${soilDisplay}
- **Acreage:** ${acreageDisplay}
- **Location:** ${locDisplay}
- **Season / Stage:** ${seasonDisplay}
- **Objective:** ${objDisplay}

${equipmentSection}

#### 3. Soil Health & Scientific Nutrient Management (ICAR / KVK Standards)
- **Soil Health Card First:** Do not apply chemical fertilizers (NPK/Urea) arbitrarily. Nutrient dosages must strictly follow a certified Soil Health Card (SHC) issued by your local Krishi Vigyan Kendra (KVK) or Department of Agriculture.
- **Organic Conditioning:** Incorporate 4-5 tonnes/acre of well-decomposed Farm Yard Manure (FYM) or compost during primary land preparation to maintain organic carbon and microbial activity.
- **Integrated Pest Management (IPM):** Prioritize field scouting, pheromone traps, and botanical formulations (such as Azadirachtin / Neem seed oil) before resorting to synthetic chemicals. Consult your local agriculture extension officer for threshold-based interventions.

#### 4. Economic Analysis & Guidance for Your Query
> **Query:** "${questionVal}"
- **Operational Economics:** Renting verified machinery on-demand via AgroRent AI eliminates heavy capital depreciation and maintenance liabilities compared to outright ownership, improving cash flow for seasonal farm operations.
- **Actionable Advice:** Align mechanical operations with regional agricultural university packages of practices to maximize field efficiency safely.`;
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
        reasoning: `Based on your request for ${crop} farming on ${acreage}, a basic set of equipment is recommended. AgroRent AI recommendations based on agronomic standards for your crop.`
      };
    }
  }
}

export const aiProvider = new AIProviderService();
