const fs = require('fs');
const path = require('path');

const en = {
  farmPlan: {
    title: "🌾 MY FARM PLAN",
    howToFarm: "📖 HOW TO FARM THIS CROP",
    overviewNotAvailable: "Farm overview is not available yet.",
    completeJourney: "📊 COMPLETE FARM STATUS",
    youAreHere: "🟢 YOU ARE HERE",
    upcoming: "⏳ UPCOMING",
    completed: "Completed"
  },
  todayWork: {
    title: "📍 TODAY'S WORK",
    why: "Why:",
    status: "Status:",
    doToday: "DO TODAY",
    markCompleted: "MARK COMPLETED",
    notScheduled: "No work scheduled for today.",
    defaultReason: "This is the scheduled work for the {{stage}} stage."
  },
  equipment: {
    title: "🚜 MACHINE YOU NEED",
    available: "🟢 Available",
    notAvailable: "🔴 Not Available",
    perDay: "/day",
    bookMachine: "BOOK MACHINE",
    whyThisMachine: "WHY THIS MACHINE?"
  },
  nextWork: {
    title: "➡️ NEXT FARM WORK",
    noUpcoming: "No upcoming work scheduled.",
    defaultReason: "Scheduled for the upcoming farm phase."
  },
  journey: {
    title: "📅 MY FARM JOURNEY",
    current: "Current",
    next: "Next",
    completedPrefix: "✓"
  },
  budget: {
    title: "💰 MY BUDGET PLAN",
    budget: "Budget:",
    planned: "Planned:",
    remaining: "Remaining:",
    viewPlan: "VIEW BUDGET PLAN",
    overrunWarning: "You may need more budget for the current planned work.",
    notAvailable: "Budget information not available."
  },
  learning: {
    title: "🎥 LEARN",
    watchVideos: "Watch {{title}} Videos"
  },
  copilot: {
    title: "🤖 ASK FARM AI",
    placeholder: "What should I do today?",
    askBtn: "Ask Farm AI",
    loading: "..."
  },
  completion: {
    confirmTitle: "Confirm Completion",
    didYouComplete: "Did you complete this operation?",
    howDidWorkGo: "How did the work go?",
    wentWell: "😊 Went well",
    normal: "😐 Normal",
    problem: "⚠️ Problem occurred",
    whatHappened: "What happened? (Optional)",
    notYet: "Not Yet",
    yesCompleted: "Yes, Completed",
    saving: "Saving...",
    success: "Operation marked as completed!",
    failed: "Failed to complete operation"
  },
  stages: {
    SOWING: "Sowing",
    GERMINATION: "Germination",
    SEEDLING: "Seedling",
    VEGETATIVE: "Vegetative",
    FLOWERING: "Flowering",
    FRUITING: "Fruiting",
    MATURITY: "Maturity",
    HARVEST: "Harvest"
  },
  operations: {
    LAND_PREPARATION: "Land Preparation",
    IRRIGATION: "Irrigation",
    FERTILIZATION: "Fertilization",
    WEEDING: "Weeding",
    PEST_CONTROL: "Pest Control",
    HARVESTING: "Harvesting",
    SEED_SOWING: "Seed Sowing",
    CROP_MONITORING: "Crop Monitoring",
    SPRAYING: "Spraying",
    TRANSPLANTING: "Transplanting",
    THRESHER_OPERATION: "Thresher Operation",
    TRANSPORT: "Transport",
    "Land Preparation & Puddling": "Land Preparation & Puddling",
    "Transplanting": "Transplanting"
  },
  statuses: {
    WITHIN_BUDGET: "🟢 WITHIN BUDGET",
    BUDGET_TIGHT: "🟡 BUDGET TIGHT",
    OVER_BUDGET: "🔴 OVER BUDGET",
    NEAR_LIMIT: "🟡 BUDGET TIGHT",
    BUDGET_OVERRUN: "🔴 OVER BUDGET"
  },
  common: {
    loadingFarm: "Loading Farm Plan...",
    noFarmProfile: "No Farm Profile Found",
    setupFarm: "Setup Farm",
    couldNotLoadAI: "Could not load AI response.",
    acres: "Acres",
    whyInfo: "Selected because it perfectly matches your farm size and current crop stage."
  }
};

const te = {
  farmPlan: {
    title: "🌾 నా వ్యవసాయ ప్రణాళిక",
    howToFarm: "📖 ఈ పంటను ఎలా పండించాలి",
    overviewNotAvailable: "వ్యవసాయ స్థూలదృష్టి ఇంకా అందుబాటులో లేదు.",
    completeJourney: "📊 పూర్తి వ్యవసాయ స్థితి",
    youAreHere: "🟢 మీరు ఇక్కడ ఉన్నారు",
    upcoming: "⏳ రాబోయేవి",
    completed: "పూర్తయింది"
  },
  todayWork: {
    title: "📍 నేటి పని",
    why: "ఎందుకు:",
    status: "స్థితి:",
    doToday: "ఈరోజు చేయాలి",
    markCompleted: "పూర్తయినట్లు గుర్తించండి",
    notScheduled: "ఈరోజు ఏ పనీ షెడ్యూల్ చేయబడలేదు.",
    defaultReason: "ఇది {{stage}} దశకు షెడ్యూల్ చేయబడిన పని."
  },
  equipment: {
    title: "🚜 మీకు అవసరమైన యంత్రం",
    available: "🟢 అందుబాటులో ఉంది",
    notAvailable: "🔴 అందుబాటులో లేదు",
    perDay: "/రోజుకు",
    bookMachine: "యంత్రాన్ని బుక్ చేయండి",
    whyThisMachine: "ఈ యంత్రం ఎందుకు?"
  },
  nextWork: {
    title: "➡️ తదుపరి వ్యవసాయ పని",
    noUpcoming: "ఎలాంటి పనులు షెడ్యూల్ చేయబడలేదు.",
    defaultReason: "రాబోయే వ్యవసాయ దశ కోసం షెడ్యూల్ చేయబడింది."
  },
  journey: {
    title: "📅 నా వ్యవసాయ ప్రయాణం",
    current: "ప్రస్తుతం",
    next: "తదుపరి",
    completedPrefix: "✓"
  },
  budget: {
    title: "💰 నా బడ్జెట్ ప్రణాళిక",
    budget: "బడ్జెట్:",
    planned: "ప్రణాళిక:",
    remaining: "మిగిలినది:",
    viewPlan: "బడ్జెట్ ప్లాన్ చూడండి",
    overrunWarning: "ప్రస్తుత పని కోసం మీకు మరింత బడ్జెట్ అవసరం కావచ్చు.",
    notAvailable: "బడ్జెట్ సమాచారం అందుబాటులో లేదు."
  },
  learning: {
    title: "🎥 నేర్చుకోండి",
    watchVideos: "{{title}} వీడియోలను చూడండి"
  },
  copilot: {
    title: "🤖 ఫార్మ్ ఏఐని అడగండి",
    placeholder: "నేను ఈ రోజు ఏమి చేయాలి?",
    askBtn: "ఫార్మ్ ఏఐని అడగండి",
    loading: "..."
  },
  completion: {
    confirmTitle: "పూర్తయినట్లు నిర్ధారించండి",
    didYouComplete: "మీరు ఈ ఆపరేషన్ పూర్తి చేసారా?",
    howDidWorkGo: "పని ఎలా జరిగింది?",
    wentWell: "😊 బాగా జరిగింది",
    normal: "😐 సాధారణం",
    problem: "⚠️ సమస్య ఏర్పడింది",
    whatHappened: "ఏమి జరిగింది? (ఐచ్ఛికం)",
    notYet: "ఇంకా లేదు",
    yesCompleted: "అవును, పూర్తయింది",
    saving: "సేవ్ చేస్తోంది...",
    success: "ఆపరేషన్ పూర్తయినట్లు గుర్తించబడింది!",
    failed: "ఆపరేషన్ పూర్తి చేయడం విఫలమైంది"
  },
  stages: {
    SOWING: "విత్తడం",
    GERMINATION: "మొలకెత్తడం",
    SEEDLING: "నారు",
    VEGETATIVE: "పెరుగుదల",
    FLOWERING: "పూత",
    FRUITING: "కాయతొడగడం",
    MATURITY: "పక్వానికి రావడం",
    HARVEST: "కోత"
  },
  operations: {
    LAND_PREPARATION: "భూమి సిద్ధం",
    IRRIGATION: "నీటిపారుదల",
    FERTILIZATION: "ఎరువులు వేయడం",
    WEEDING: "కలుపు తీయడం",
    PEST_CONTROL: "తెగుళ్ల నివారణ",
    HARVESTING: "పంట కోత",
    SEED_SOWING: "విత్తనాలు వేయడం",
    CROP_MONITORING: "పంట పర్యవేక్షణ",
    SPRAYING: "మందులు చల్లడం",
    TRANSPLANTING: "నాట్లు వేయడం",
    THRESHER_OPERATION: "నూర్పిడి",
    TRANSPORT: "రవాణా",
    "Land Preparation & Puddling": "భూమి సిద్ధం & దమ్ము చేయడం",
    "Transplanting": "నాట్లు వేయడం"
  },
  statuses: {
    WITHIN_BUDGET: "🟢 బడ్జెట్ లోపల",
    BUDGET_TIGHT: "🟡 బడ్జెట్ తక్కువగా ఉంది",
    OVER_BUDGET: "🔴 బడ్జెట్ దాటింది",
    NEAR_LIMIT: "🟡 బడ్జెట్ తక్కువగా ఉంది",
    BUDGET_OVERRUN: "🔴 బడ్జెట్ దాటింది"
  },
  common: {
    loadingFarm: "వ్యవసాయ ప్రణాళిక లోడ్ అవుతోంది...",
    noFarmProfile: "వ్యవసాయ ప్రొఫైల్ కనుగొనబడలేదు",
    setupFarm: "ఫార్మ్ సెటప్ చేయండి",
    couldNotLoadAI: "ఏఐ స్పందన లోడ్ కాలేదు.",
    acres: "ఎకరాలు",
    whyInfo: "ఇది మీ వ్యవసాయ పరిమాణానికి మరియు ప్రస్తుత పంట దశకు సరిగ్గా సరిపోలుతుంది కాబట్టి ఎంచుకోబడింది."
  }
};

const hi = {
  farmPlan: {
    title: "🌾 मेरी कृषि योजना",
    howToFarm: "📖 इस फसल की खेती कैसे करें",
    overviewNotAvailable: "कृषि अवलोकन अभी उपलब्ध नहीं है।",
    completeJourney: "📊 पूर्ण कृषि स्थिति",
    youAreHere: "🟢 आप यहाँ हैं",
    upcoming: "⏳ आगामी",
    completed: "पूरा हुआ"
  },
  todayWork: {
    title: "📍 आज का काम",
    why: "क्यों:",
    status: "स्थिति:",
    doToday: "आज करें",
    markCompleted: "पूरा हुआ चिह्नित करें",
    notScheduled: "आज के लिए कोई काम निर्धारित नहीं है।",
    defaultReason: "यह {{stage}} चरण के लिए निर्धारित कार्य है।"
  },
  equipment: {
    title: "🚜 मशीन जो आपको चाहिए",
    available: "🟢 उपलब्ध है",
    notAvailable: "🔴 उपलब्ध नहीं है",
    perDay: "/दिन",
    bookMachine: "मशीन बुक करें",
    whyThisMachine: "यह मशीन क्यों?"
  },
  nextWork: {
    title: "➡️ अगला कृषि कार्य",
    noUpcoming: "कोई आगामी कार्य निर्धारित नहीं है।",
    defaultReason: "आगामी कृषि चरण के लिए निर्धारित।"
  },
  journey: {
    title: "📅 मेरी कृषि यात्रा",
    current: "वर्तमान",
    next: "अगला",
    completedPrefix: "✓"
  },
  budget: {
    title: "💰 मेरी बजट योजना",
    budget: "बजट:",
    planned: "योजनाबद्ध:",
    remaining: "शेष:",
    viewPlan: "बजट योजना देखें",
    overrunWarning: "आपको वर्तमान योजनाबद्ध कार्य के लिए अधिक बजट की आवश्यकता हो सकती है।",
    notAvailable: "बजट जानकारी उपलब्ध नहीं है।"
  },
  learning: {
    title: "🎥 सीखें",
    watchVideos: "{{title}} वीडियो देखें"
  },
  copilot: {
    title: "🤖 कृषि एआई से पूछें",
    placeholder: "मुझे आज क्या करना चाहिए?",
    askBtn: "कृषि एआई से पूछें",
    loading: "..."
  },
  completion: {
    confirmTitle: "पूर्णता की पुष्टि करें",
    didYouComplete: "क्या आपने यह कार्य पूरा कर लिया?",
    howDidWorkGo: "काम कैसा रहा?",
    wentWell: "😊 बहुत अच्छा",
    normal: "😐 सामान्य",
    problem: "⚠️ समस्या हुई",
    whatHappened: "क्या हुआ? (वैकल्पिक)",
    notYet: "अभी नहीं",
    yesCompleted: "हाँ, पूरा हुआ",
    saving: "सहेज रहा है...",
    success: "ऑपरेशन पूरा हो गया!",
    failed: "ऑपरेशन पूरा करने में विफल"
  },
  stages: {
    SOWING: "बुआई",
    GERMINATION: "अंकुरण",
    SEEDLING: "पौध",
    VEGETATIVE: "वनस्पति वृद्धि",
    FLOWERING: "फूल आना",
    FRUITING: "फल आना",
    MATURITY: "परिपक्वता",
    HARVEST: "कटाई"
  },
  operations: {
    LAND_PREPARATION: "भूमि की तैयारी",
    IRRIGATION: "सिंचाई",
    FERTILIZATION: "उर्वरक",
    WEEDING: "निराई",
    PEST_CONTROL: "कीट नियंत्रण",
    HARVESTING: "कटाई",
    SEED_SOWING: "बीज बुआई",
    CROP_MONITORING: "फसल निगरानी",
    SPRAYING: "छिड़काव",
    TRANSPLANTING: "प्रत्यारोपण",
    THRESHER_OPERATION: "थ्रेशर ऑपरेशन",
    TRANSPORT: "परिवहन",
    "Land Preparation & Puddling": "भूमि की तैयारी और पडलिंग",
    "Transplanting": "प्रत्यारोपण"
  },
  statuses: {
    WITHIN_BUDGET: "🟢 बजट के भीतर",
    BUDGET_TIGHT: "🟡 बजट तंग है",
    OVER_BUDGET: "🔴 बजट से अधिक",
    NEAR_LIMIT: "🟡 बजट तंग है",
    BUDGET_OVERRUN: "🔴 बजट से अधिक"
  },
  common: {
    loadingFarm: "कृषि योजना लोड हो रही है...",
    noFarmProfile: "कोई कृषि प्रोफ़ाइल नहीं मिली",
    setupFarm: "फ़ार्म सेटअप करें",
    couldNotLoadAI: "एआई प्रतिक्रिया लोड नहीं कर सका।",
    acres: "एकड़",
    whyInfo: "इसे इसलिए चुना गया है क्योंकि यह आपके खेत के आकार और वर्तमान फसल चरण से पूरी तरह मेल खाता है।"
  }
};

const ta = {
  farmPlan: {
    title: "🌾 என் பண்ணை திட்டம்",
    howToFarm: "📖 இந்த பயிரை எவ்வாறு வளர்ப்பது",
    overviewNotAvailable: "பண்ணை கண்ணோட்டம் இன்னும் கிடைக்கவில்லை.",
    completeJourney: "📊 முழு பண்ணை நிலை",
    youAreHere: "🟢 நீங்கள் இங்கே உள்ளீர்கள்",
    upcoming: "⏳ வரவிருக்கும்",
    completed: "முடிந்தது"
  },
  todayWork: {
    title: "📍 இன்றைய வேலை",
    why: "ஏன்:",
    status: "நிலை:",
    doToday: "இன்று செய்ய வேண்டும்",
    markCompleted: "முடிந்தது என குறிக்கவும்",
    notScheduled: "இன்று எந்த வேலையும் திட்டமிடப்படவில்லை.",
    defaultReason: "இது {{stage}} கட்டத்திற்காக திட்டமிடப்பட்ட வேலையாகும்."
  },
  equipment: {
    title: "🚜 உங்களுக்கு தேவையான இயந்திரம்",
    available: "🟢 கிடைக்கிறது",
    notAvailable: "🔴 கிடைக்கவில்லை",
    perDay: "/நாள்",
    bookMachine: "இயந்திரத்தை முன்பதிவு செய்",
    whyThisMachine: "ஏன் இந்த இயந்திரம்?"
  },
  nextWork: {
    title: "➡️ அடுத்த பண்ணை வேலை",
    noUpcoming: "வரவிருக்கும் வேலைகள் எதுவும் திட்டமிடப்படவில்லை.",
    defaultReason: "வரவிருக்கும் பண்ணை கட்டத்திற்காக திட்டமிடப்பட்டுள்ளது."
  },
  journey: {
    title: "📅 என் பண்ணை பயணம்",
    current: "தற்போதைய",
    next: "அடுத்த",
    completedPrefix: "✓"
  },
  budget: {
    title: "💰 என் பட்ஜெட் திட்டம்",
    budget: "பட்ஜெட்:",
    planned: "திட்டமிட்டது:",
    remaining: "மீதமுள்ளவை:",
    viewPlan: "பட்ஜெட் திட்டத்தைப் காண்க",
    overrunWarning: "தற்போதைய வேலைக்கு உங்களுக்கு அதிக பட்ஜெட் தேவைப்படலாம்.",
    notAvailable: "பட்ஜெட் தகவல் கிடைக்கவில்லை."
  },
  learning: {
    title: "🎥 கற்க",
    watchVideos: "{{title}} வீடியோக்களைப் பார்க்கவும்"
  },
  copilot: {
    title: "🤖 பண்ணை AI-யிடம் கேளுங்கள்",
    placeholder: "இன்று நான் என்ன செய்ய வேண்டும்?",
    askBtn: "கேளுங்கள்",
    loading: "..."
  },
  completion: {
    confirmTitle: "முடிந்ததை உறுதிப்படுத்து",
    didYouComplete: "இந்த வேலையை முடித்துவிட்டீர்களா?",
    howDidWorkGo: "வேலை எப்படி இருந்தது?",
    wentWell: "😊 நன்றாக இருந்தது",
    normal: "😐 சாதாரணமானது",
    problem: "⚠️ சிக்கல் ஏற்பட்டது",
    whatHappened: "என்ன நடந்தது? (விருப்பத்திற்குரியது)",
    notYet: "இன்னும் இல்லை",
    yesCompleted: "ஆம், முடிந்தது",
    saving: "சேமிக்கிறது...",
    success: "செயல்பாடு முடிந்தது என குறிக்கப்பட்டது!",
    failed: "செயல்பாட்டை முடிக்க முடியவில்லை"
  },
  stages: {
    SOWING: "விதைத்தல்",
    GERMINATION: "முளைத்தல்",
    SEEDLING: "நாற்று",
    VEGETATIVE: "வளர்ச்சி",
    FLOWERING: "பூத்தல்",
    FRUITING: "காய்த்தல்",
    MATURITY: "முதிர்ச்சி",
    HARVEST: "அறுவடை"
  },
  operations: {
    LAND_PREPARATION: "நிலம் தயாரித்தல்",
    IRRIGATION: "நீர்ப்பாசனம்",
    FERTILIZATION: "உரமிடுதல்",
    WEEDING: "களையெடுத்தல்",
    PEST_CONTROL: "பூச்சி கட்டுப்பாடு",
    HARVESTING: "அறுவடை",
    SEED_SOWING: "விதை விதைத்தல்",
    CROP_MONITORING: "பயிர் கண்காணிப்பு",
    SPRAYING: "தெளித்தல்",
    TRANSPLANTING: "நாற்று நடுதல்",
    THRESHER_OPERATION: "கதிரடித்தல்",
    TRANSPORT: "போக்குவரத்து",
    "Land Preparation & Puddling": "நிலம் தயாரித்தல் & சேறு உழுதல்",
    "Transplanting": "நாற்று நடுதல்"
  },
  statuses: {
    WITHIN_BUDGET: "🟢 பட்ஜெட்டுக்குள்",
    BUDGET_TIGHT: "🟡 பட்ஜெட் இறுக்கமாக உள்ளது",
    OVER_BUDGET: "🔴 பட்ஜெட்டை விட அதிகம்",
    NEAR_LIMIT: "🟡 பட்ஜெட் இறுக்கமாக உள்ளது",
    BUDGET_OVERRUN: "🔴 பட்ஜெட்டை விட அதிகம்"
  },
  common: {
    loadingFarm: "பண்ணை திட்டம் ஏற்றப்படுகிறது...",
    noFarmProfile: "பண்ணை விவரம் எதுவும் கிடைக்கவில்லை",
    setupFarm: "பண்ணையை அமைக்கவும்",
    couldNotLoadAI: "AI பதிலை ஏற்ற முடியவில்லை.",
    acres: "ஏக்கர்",
    whyInfo: "உங்கள் பண்ணையின் அளவு மற்றும் தற்போதைய பயிர் கட்டத்திற்கு சரியாக பொருந்துவதால் இது தேர்ந்தெடுக்கப்பட்டது."
  }
};

const kn = {
  farmPlan: {
    title: "🌾 ನನ್ನ ಕೃಷಿ ಯೋಜನೆ",
    howToFarm: "📖 ಈ ಬೆಳೆಯನ್ನು ಹೇಗೆ ಬೆಳೆಯುವುದು",
    overviewNotAvailable: "ಕೃಷಿ ಅವಲೋಕನ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.",
    completeJourney: "📊 ಸಂಪೂರ್ಣ ಕೃಷಿ ಸ್ಥಿತಿ",
    youAreHere: "🟢 ನೀವು ಇಲ್ಲಿದ್ದೀರಿ",
    upcoming: "⏳ ಮುಂಬರುವ",
    completed: "ಪೂರ್ಣಗೊಂಡಿದೆ"
  },
  todayWork: {
    title: "📍 ಇಂದಿನ ಕೆಲಸ",
    why: "ಏಕೆ:",
    status: "ಸ್ಥಿತಿ:",
    doToday: "ಇಂದು ಮಾಡಬೇಕು",
    markCompleted: "ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರ್ತಿಸಿ",
    notScheduled: "ಇಂದು ಯಾವುದೇ ಕೆಲಸ ನಿಗದಿಯಾಗಿಲ್ಲ.",
    defaultReason: "ಇದು {{stage}} ಹಂತಕ್ಕಾಗಿ ನಿಗದಿತ ಕೆಲಸವಾಗಿದೆ."
  },
  equipment: {
    title: "🚜 ನಿಮಗೆ ಬೇಕಾದ ಯಂತ್ರ",
    available: "🟢 ಲಭ್ಯವಿದೆ",
    notAvailable: "🔴 ಲಭ್ಯವಿಲ್ಲ",
    perDay: "/ದಿನಕ್ಕೆ",
    bookMachine: "ಯಂತ್ರವನ್ನು ಕಾಯ್ದಿರಿಸಿ",
    whyThisMachine: "ಈ ಯಂತ್ರ ಏಕೆ?"
  },
  nextWork: {
    title: "➡️ ಮುಂದಿನ ಕೃಷಿ ಕೆಲಸ",
    noUpcoming: "ಮುಂಬರುವ ಯಾವುದೇ ಕೆಲಸ ನಿಗದಿಯಾಗಿಲ್ಲ.",
    defaultReason: "ಮುಂಬರುವ ಕೃಷಿ ಹಂತಕ್ಕಾಗಿ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ."
  },
  journey: {
    title: "📅 ನನ್ನ ಕೃಷಿ ಪ್ರಯಾಣ",
    current: "ಪ್ರಸ್ತುತ",
    next: "ಮುಂದಿನ",
    completedPrefix: "✓"
  },
  budget: {
    title: "💰 ನನ್ನ ಬಜೆಟ್ ಯೋಜನೆ",
    budget: "ಬಜೆಟ್:",
    planned: "ಯೋಜಿತ:",
    remaining: "ಉಳಿದಿರುವ:",
    viewPlan: "ಬಜೆಟ್ ಯೋಜನೆ ವೀಕ್ಷಿಸಿ",
    overrunWarning: "ಪ್ರಸ್ತುತ ಕೆಲಸಕ್ಕಾಗಿ ನಿಮಗೆ ಹೆಚ್ಚಿನ ಬಜೆಟ್ ಬೇಕಾಗಬಹುದು.",
    notAvailable: "ಬಜೆಟ್ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ."
  },
  learning: {
    title: "🎥 ಕಲಿಯಿರಿ",
    watchVideos: "{{title}} ವೀಡಿಯೊಗಳನ್ನು ವೀಕ್ಷಿಸಿ"
  },
  copilot: {
    title: "🤖 ಕೃಷಿ AI ಅನ್ನು ಕೇಳಿ",
    placeholder: "ನಾನು ಇಂದು ಏನು ಮಾಡಬೇಕು?",
    askBtn: "ಕೇಳಿ",
    loading: "..."
  },
  completion: {
    confirmTitle: "ಪೂರ್ಣಗೊಂಡಿರುವುದನ್ನು ಖಚಿತಪಡಿಸಿ",
    didYouComplete: "ನೀವು ಈ ಕಾರ್ಯಾಚರಣೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಾ?",
    howDidWorkGo: "ಕೆಲಸ ಹೇಗೆ ನಡೆಯಿತು?",
    wentWell: "😊 ಚೆನ್ನಾಗಿ ನಡೆಯಿತು",
    normal: "😐 ಸಾಮಾನ್ಯ",
    problem: "⚠️ ಸಮಸ್ಯೆ ಎದುರಾಯಿತು",
    whatHappened: "ಏನಾಯಿತು? (ಐಚ್ಛಿಕ)",
    notYet: "ಇನ್ನೂ ಇಲ್ಲ",
    yesCompleted: "ಹೌದು, ಪೂರ್ಣಗೊಂಡಿದೆ",
    saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    success: "ಕಾರ್ಯಾಚರಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರ್ತಿಸಲಾಗಿದೆ!",
    failed: "ಕಾರ್ಯಾಚರಣೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ"
  },
  stages: {
    SOWING: "ಬಿತ್ತನೆ",
    GERMINATION: "ಮೊಳೆಕೆ",
    SEEDLING: "ಸಸಿ",
    VEGETATIVE: "ಬೆಳವಣಿಗೆ",
    FLOWERING: "ಹೂಬಿಡುವ",
    FRUITING: "ಹಣ್ಣು ಬಿಡುವ",
    MATURITY: "ಬೆಳವಣಿಗೆ ಪೂರ್ಣ",
    HARVEST: "ಕೊಯ್ಲು"
  },
  operations: {
    LAND_PREPARATION: "ಭೂಮಿ ಸಿದ್ಧತೆ",
    IRRIGATION: "ನೀರಾವರಿ",
    FERTILIZATION: "ಗೊಬ್ಬರ",
    WEEDING: "ಕಳೆ ಕೀಳುವುದು",
    PEST_CONTROL: "ಕೀಟ ನಿಯಂತ್ರಣ",
    HARVESTING: "ಕೊಯ್ಲು",
    SEED_SOWING: "ಬೀಜ ಬಿತ್ತನೆ",
    CROP_MONITORING: "ಬೆಳೆ ಮೇಲ್ವಿಚಾರಣೆ",
    SPRAYING: "ಸಿಂಪಡಣೆ",
    TRANSPLANTING: "ನಾಟಿ",
    THRESHER_OPERATION: "ಒಕ್ಕಣೆ",
    TRANSPORT: "ಸಾರಿಗೆ",
    "Land Preparation & Puddling": "ಭೂಮಿ ಸಿದ್ಧತೆ ಮತ್ತು ಕೆಸರು ಮಾಡುವುದು",
    "Transplanting": "ನಾಟಿ ಮಾಡುವುದು"
  },
  statuses: {
    WITHIN_BUDGET: "🟢 ಬಜೆಟ್ ಒಳಗೆ",
    BUDGET_TIGHT: "🟡 ಬಜೆಟ್ ಬಿಗಿಯಾಗಿದೆ",
    OVER_BUDGET: "🔴 ಬಜೆಟ್ ಮೀರಿದೆ",
    NEAR_LIMIT: "🟡 ಬಜೆಟ್ ಬಿಗಿಯಾಗಿದೆ",
    BUDGET_OVERRUN: "🔴 ಬಜೆಟ್ ಮೀರಿದೆ"
  },
  common: {
    loadingFarm: "ಕೃಷಿ ಯೋಜನೆ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    noFarmProfile: "ಯಾವುದೇ ಕೃಷಿ ಪ್ರೊಫೈಲ್ ಕಂಡುಬಂದಿಲ್ಲ",
    setupFarm: "ಫಾರ್ಮ್ ಸೆಟಪ್ ಮಾಡಿ",
    couldNotLoadAI: "AI ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    acres: "ಎಕರೆಗಳು",
    whyInfo: "ನಿಮ್ಮ ಜಮೀನಿನ ಗಾತ್ರ ಮತ್ತು ಪ್ರಸ್ತುತ ಬೆಳೆ ಹಂತಕ್ಕೆ ಇದು ಸಂಪೂರ್ಣವಾಗಿ ಹೊಂದುವುದರಿಂದ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ."
  }
};

const dir = path.join(__dirname, '../../web/src/locales');
fs.writeFileSync(path.join(dir, 'en.json'), JSON.stringify(en, null, 2));
fs.writeFileSync(path.join(dir, 'te.json'), JSON.stringify(te, null, 2));
fs.writeFileSync(path.join(dir, 'hi.json'), JSON.stringify(hi, null, 2));
fs.writeFileSync(path.join(dir, 'ta.json'), JSON.stringify(ta, null, 2));
fs.writeFileSync(path.join(dir, 'kn.json'), JSON.stringify(kn, null, 2));

console.log('Translations generated.');
