const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../mobile/lib/core/localization/app_localizations.dart');
let content = fs.readFileSync(filePath, 'utf8');

const keysToAdd = {
  en: {
    'crop_guides': 'Crop Guides',
    'modern_techniques': 'Modern Techniques',
    'crop_guide': 'Crop Guide',
    'technique': 'Technique',
    'search_articles': 'Search farming guides & techniques...',
    'no_articles_found': 'No guides found matching your search',
    'close_article': 'Close Guide',
    'ask_farming_ai': 'Ask Farming AI',
    'ask_question_hint': 'Ask a question about this crop (e.g. pests, watering)...',
    'step_progress': 'Step',
    'of_steps': 'of',
    'recommended_equipment_guide': 'Recommended Equipment for this stage',
    'farming_guides_header': 'Authoritative Extension Guides',
    'ask_ai_btn': 'Ask AI',
    'asking_ai': 'Consulting AI agronomist...',
    'ai_response_title': 'Farming AI Advice',
    'ask_another_question': 'Ask Another Question',
  },
  te: {
    'crop_guides': 'పంట మార్గదర్శకాలు',
    'modern_techniques': 'ఆధునిక పద్ధతులు',
    'crop_guide': 'పంట మార్గదర్శి',
    'technique': 'పద్ధతి',
    'search_articles': 'వ్యవసాయ మార్గదర్శకాలు మరియు పద్ధతులను వెతకండి...',
    'no_articles_found': 'మీ శోధనకు సరిపోలే మార్గదర్శకాలు ఏవీ కనుగొనబడలేదు',
    'close_article': 'మార్గదర్శకాన్ని మూసివేయి',
    'ask_farming_ai': 'వ్యవసాయ AI ని అడగండి',
    'ask_question_hint': 'ఈ పంట గురించి ప్రశ్న అడగండి (ఉదా. తెగుళ్ళు, నీరు)...',
    'step_progress': 'దశ',
    'of_steps': '/',
    'recommended_equipment_guide': 'ఈ దశకు సిఫార్సు చేయబడిన పరికరాలు',
    'farming_guides_header': 'ప్రామాణిక వ్యవసాయ మార్గదర్శకాలు',
    'ask_ai_btn': 'AI ని అడగండి',
    'asking_ai': 'AI వ్యవసాయ నిపుణుడిని సంప్రదిస్తోంది...',
    'ai_response_title': 'వ్యవసాయ AI సలహా',
    'ask_another_question': 'మరో ప్రశ్న అడగండి',
  },
  hi: {
    'crop_guides': 'फसल मार्गदर्शिका',
    'modern_techniques': 'आधुनिक तकनीकें',
    'crop_guide': 'फसल गाइड',
    'technique': 'तकनीक',
    'search_articles': 'खेती गाइड और तकनीकें खोजें...',
    'no_articles_found': 'आपकी खोज से मेल खाने वाली कोई मार्गदर्शिका नहीं मिली',
    'close_article': 'गाइड बंद करें',
    'ask_farming_ai': 'कृषि AI से पूछें',
    'ask_question_hint': 'इस फसल के बारे में प्रश्न पूछें (उदा. कीट, सिंचाई)...',
    'step_progress': 'चरण',
    'of_steps': '/',
    'recommended_equipment_guide': 'इस चरण के लिए अनुशंसित उपकरण',
    'farming_guides_header': 'प्रामाणिक कृषि मार्गदर्शिका',
    'ask_ai_btn': 'AI से पूछें',
    'asking_ai': 'AI कृषि विशेषज्ञ से परामर्श कर रहे हैं...',
    'ai_response_title': 'कृषि AI सलाह',
    'ask_another_question': 'एक और प्रश्न पूछें',
  },
  ta: {
    'crop_guides': 'பயிர் வழிகாட்டிகள்',
    'modern_techniques': 'நவீன நுட்பங்கள்',
    'crop_guide': 'பயிர் வழிகாட்டி',
    'technique': 'நுட்பம்',
    'search_articles': 'விவசாய வழிகாட்டிகள் & நுட்பங்களைத் தேடுங்கள்...',
    'no_articles_found': 'உங்கள் தேடலுடன் பொருந்தக்கூடிய வழிகாட்டிகள் எதுவும் கிடைக்கவில்லை',
    'close_article': 'வழிகாட்டியை மூடு',
    'ask_farming_ai': 'விவசாய AI-யிடம் கேளுங்கள்',
    'ask_question_hint': 'இந்த பயிர் பற்றிய கேள்வியைக் கேளுங்கள் (எ.கா. பூச்சிகள், நீர்ப்பாசனம்)...',
    'step_progress': 'படி',
    'of_steps': '/',
    'recommended_equipment_guide': 'இந்த நிலைக்கு பரிந்துரைக்கப்பட்ட உபகரணங்கள்',
    'farming_guides_header': 'அங்கீகரிக்கப்பட்ட விவசாய வழிகாட்டிகள்',
    'ask_ai_btn': 'AI-யிடம் கேள்',
    'asking_ai': 'AI விவசாய நிபுணரிடம் ஆலோசனை பெறுகிறது...',
    'ai_response_title': 'விவசாய AI ஆலோசனை',
    'ask_another_question': 'மற்றொரு கேள்வி கேட்கவும்',
  },
  kn: {
    'crop_guides': 'ಬೆಳೆ ಮಾರ್ಗದರ್ಶಿಗಳು',
    'modern_techniques': 'ಆಧುನಿಕ ತಂತ್ರಜ್ಞಾನಗಳು',
    'crop_guide': 'ಬೆಳೆ ಮಾರ್ಗದರ್ಶಿ',
    'technique': 'ತಂತ್ರ',
    'search_articles': 'ಕೃಷಿ ಮಾರ್ಗದರ್ಶಿಗಳು ಮತ್ತು ತಂತ್ರಗಳನ್ನು ಹುಡುಕಿ...',
    'no_articles_found': 'ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ಮಾರ್ಗದರ್ಶಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
    'close_article': 'ಮಾರ್ಗದರ್ಶಿಯನ್ನು ಮುಚ್ಚಿ',
    'ask_farming_ai': 'ಕೃಷಿ AI ಅನ್ನು ಕೇಳಿ',
    'ask_question_hint': 'ಈ ಬೆಳೆಯ ಬಗ್ಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ (ಉದಾ. ಕೀಟಗಳು, ನೀರಾವರಿ)...',
    'step_progress': 'ಹಂತ',
    'of_steps': '/',
    'recommended_equipment_guide': 'ಈ ಹಂತಕ್ಕೆ ಶಿಫಾರಸು ಮಾಡಿದ ಉಪಕರಣಗಳು',
    'farming_guides_header': 'ಅಧಿಕೃತ ಕೃಷಿ ಮಾರ್ಗದರ್ಶಿಗಳು',
    'ask_ai_btn': 'AI ಅನ್ನು ಕೇಳಿ',
    'asking_ai': 'AI ಕೃಷಿ ತಜ್ಞರೊಂದಿಗೆ ಸಮಾಲೋಚಿಸುತ್ತಿದೆ...',
    'ai_response_title': 'ಕೃಷಿ AI ಸಲಹೆ',
    'ask_another_question': 'ಮತ್ತೊಂದು ಪ್ರಶ್ನೆ ಕೇಳಿ',
  }
};

for (const lang of ['en', 'te', 'hi', 'ta', 'kn']) {
  const marker = `'${lang}': {`;
  const idx = content.indexOf(marker);
  if (idx !== -1) {
    let insertStr = `\n`;
    for (const [k, v] of Object.entries(keysToAdd[lang])) {
      if (!content.includes(`'${k}':`)) {
        insertStr += `      '${k}': '${v}',\n`;
      }
    }
    content = content.slice(0, idx + marker.length) + insertStr + content.slice(idx + marker.length);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated app_localizations.dart with guide keys!');
