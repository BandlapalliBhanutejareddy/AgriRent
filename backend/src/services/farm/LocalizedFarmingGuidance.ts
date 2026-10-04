export const LOCALIZED_FARM_OVERVIEW: Record<string, (crop: string, soilType: string, acreage: number, location: string, season: string, cropStage: string) => string> = {
  en: (crop, soilType, acreage, location, season, cropStage) => `Overview for ${crop} farming in ${location} (${acreage} acres):
- Season: ${season}
- Soil: ${soilType}
- Current Stage: ${cropStage}

General Farming Guidelines:
1. LAND PREPARATION: Clear the field and plow to achieve good soil tilth.
2. SOWING / PLANTING: Select healthy seeds or seedlings and plant at recommended spacing.
3. WATER MANAGEMENT: Maintain proper moisture levels.
4. FERTILIZATION: Apply required nutrients in divided doses based on the crop's needs.
5. PEST & DISEASE CONTROL: Monitor regularly and apply appropriate treatments if pests are found.
6. HARVEST: Harvest at the correct maturity stage and store safely.`,

  te: (crop, soilType, acreage, location, season, cropStage) => `${location} లో ${crop} వ్యవసాయం కోసం స్థూలదృష్టి (${acreage} ఎకరాలు):
- కాలం: ${season}
- నేల: ${soilType}
- ప్రస్తుత దశ: ${cropStage}

సాధారణ వ్యవసాయ మార్గదర్శకాలు:
1. భూమి తయారీ: పొలాన్ని శుభ్రపరిచి, నేల బాగా చదును అయ్యేలా దున్నండి.
2. విత్తడం / నాటడం: ఆరోగ్యవంతమైన విత్తనాలు లేదా నారు ఎంచుకుని సిఫార్సు చేసిన దూరంలో నాటండి.
3. నీటి నిర్వహణ: సరైన తేమ శాతాన్ని నిర్వహించండి.
4. ఎరువులు: పంట అవసరాల ఆధారంగా విడతల వారీగా అవసరమైన పోషకాలను వేయండి.
5. తెగుళ్లు మరియు వ్యాధుల నివారణ: ఎప్పటికప్పుడు గమనిస్తూ, తెగుళ్లు కనిపిస్తే తగిన మందులు పిచికారీ చేయండి.
6. కోత: సరైన పక్వ దశలో కోత కోసి, సురక్షితంగా నిల్వ చేయండి.`,

  hi: (crop, soilType, acreage, location, season, cropStage) => `${location} में ${crop} की खेती के लिए अवलोकन (${acreage} एकड़):
- मौसम: ${season}
- मिट्टी: ${soilType}
- वर्तमान चरण: ${cropStage}

सामान्य कृषि दिशा-निर्देश:
1. भूमि की तैयारी: खेत को साफ करें और अच्छी जुताई करें।
2. बुवाई / रोपण: स्वस्थ बीज या पौधे चुनें और अनुशंसित दूरी पर बोएं।
3. जल प्रबंधन: उचित नमी बनाए रखें।
4. उर्वरक: फसल की आवश्यकता के अनुसार विभाजित खुराकों में आवश्यक पोषक तत्व डालें।
5. कीट और रोग नियंत्रण: नियमित रूप से निगरानी करें और कीटों के पाए जाने पर उचित उपचार लागू करें।
6. कटाई: सही परिपक्वता चरण में कटाई करें और सुरक्षित रूप से स्टोर करें।`,

  ta: (crop, soilType, acreage, location, season, cropStage) => `${location} இல் ${crop} விவசாயத்திற்கான மேலோட்டம் (${acreage} ஏக்கர்):
- பருவம்: ${season}
- மண்: ${soilType}
- தற்போதைய நிலை: ${cropStage}

பொதுவான விவசாய வழிகாட்டுதல்கள்:
1. நிலம் தயாரித்தல்: வயலை சுத்தம் செய்து நன்கு உழவும்.
2. விதைப்பு / நடவு: ஆரோக்கியமான விதைகள் அல்லது நாற்றுகளைத் தேர்ந்தெடுத்து பரிந்துரைக்கப்பட்ட இடைவெளியில் நடவும்.
3. நீர் மேலாண்மை: சரியான ஈரப்பதத்தை பராமரிக்கவும்.
4. உரம்: பயிரின் தேவைக்கேற்ப ஊட்டச்சத்துக்களை பிரித்து உரமாக அளிக்கவும்.
5. பூச்சி மற்றும் நோய் கட்டுப்பாடு: தவறாமல் கண்காணித்து பூச்சிகள் காணப்பட்டால் தகுந்த மருந்துகளை தெளிக்கவும்.
6. அறுவடை: சரியான முதிர்ச்சி நிலையில் அறுவடை செய்து பாதுகாப்பாக சேமிக்கவும்.`,

  kn: (crop, soilType, acreage, location, season, cropStage) => `${location} ದಲ್ಲಿ ${crop} ಕೃಷಿಗಾಗಿ ಅವಲೋಕನ (${acreage} ಎಕರೆ):
- ಋತು: ${season}
- ಮಣ್ಣು: ${soilType}
- ಪ್ರಸ್ತುತ ಹಂತ: ${cropStage}

ಸಾಮಾನ್ಯ ಕೃಷಿ ಮಾರ್ಗಸೂಚಿಗಳು:
1. ಭೂಮಿ ತಯಾರಿ: ಜಮೀನನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಿ ಮತ್ತು ಚೆನ್ನಾಗಿ ಉಳುಮೆ ಮಾಡಿ.
2. ಬಿತ್ತನೆ / ನಾಟಿ: ಆರೋಗ್ಯಕರ ಬೀಜಗಳು ಅಥವಾ ಸಸಿಗಳನ್ನು ಆರಿಸಿ ಮತ್ತು ಶಿಫಾರಸು ಮಾಡಿದ ಅಂತರದಲ್ಲಿ ನಾಟಿ ಮಾಡಿ.
3. ನೀರು ನಿರ್ವಹಣೆ: ಸರಿಯಾದ ತೇವಾಂಶವನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಿ.
4. ರಸಗೊಬ್ಬರ: ಬೆಳೆಯ ಅಗತ್ಯಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ಪೋಷಕಾಂಶಗಳನ್ನು ಹಂಚಿ ಹಾಕಿ.
5. ಕೀಟ ಮತ್ತು ರೋಗ ನಿಯಂತ್ರಣ: ನಿಯಮಿತವಾಗಿ ಗಮನಿಸಿ ಮತ್ತು ಕೀಟಗಳು ಕಂಡುಬಂದರೆ ಸೂಕ್ತ ಔಷಧಿ ಸಿಂಪಡಿಸಿ.
6. ಕಟಾವು: ಸರಿಯಾದ ಪಕ್ವತೆಯ ಹಂತದಲ್ಲಿ ಕಟಾವು ಮಾಡಿ ಮತ್ತು ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಿ.`
};
