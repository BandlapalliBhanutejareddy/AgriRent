/**
 * AGRORENT AI — PHASE 5.7.1 MEMORY EVENT TAXONOMY
 * 
 * Centralized, strongly typed, deterministic domain taxonomy for FarmMemory events.
 * Supports all 12 core domains:
 * A. FARM
 * B. CROP
 * C. OPERATION
 * D. EQUIPMENT
 * E. BOOKING
 * F. FINANCIAL
 * G. RISK
 * H. WEATHER
 * I. SCHEDULE
 * J. FARMER DECISION
 * K. AI ADVISORY
 * L. SYSTEM
 * 
 * In accordance with Phase 5.7.1 strict rules:
 * - Deterministic validation without AI/LLM dependencies
 * - Stable English constant identifiers
 * - Multi-lingual localized descriptions (en, te, hi, ta, kn)
 * - 100% backward compatible with existing Phase 5.7 foundation events
 */

export type FarmMemoryCategory =
  | 'FARM'
  | 'CROP'
  | 'OPERATION'
  | 'EQUIPMENT'
  | 'BOOKING'
  | 'FINANCIAL'
  | 'RISK'
  | 'WEATHER'
  | 'SCHEDULE'
  | 'DECISION'
  | 'AI'
  | 'SYSTEM';

export type FarmMemorySubjectType =
  | 'FARM'
  | 'CROP'
  | 'OPERATION'
  | 'EQUIPMENT'
  | 'BOOKING'
  | 'BUDGET'
  | 'RISK'
  | 'WEATHER'
  | 'SCHEDULE'
  | 'DECISION'
  | 'AI'
  | 'SYSTEM';

export type FarmMemoryEventType =
  // FARM
  | 'FARM_CREATED'
  | 'FARM_UPDATED'
  // CROP
  | 'CROP_PLANTED'
  | 'CROP_STAGE_CHANGED'
  | 'CROP_HARVESTED'
  | 'CROP_FAILED'
  // OPERATION
  | 'OPERATION_CREATED'
  | 'OPERATION_STARTED'
  | 'OPERATION_COMPLETED'
  | 'OPERATION_DELAYED'
  | 'OPERATION_CANCELLED'
  // EQUIPMENT
  | 'EQUIPMENT_RENTED'
  | 'EQUIPMENT_RETURNED'
  | 'EQUIPMENT_MAINTENANCE'
  | 'EQUIPMENT_UNAVAILABLE'
  // BOOKING
  | 'BOOKING_CREATED'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_COMPLETED'
  // FINANCIAL
  | 'BUDGET_CREATED'
  | 'BUDGET_UPDATED'
  | 'RENTAL_COST_RECORDED'
  | 'BUDGET_ALERT'
  | 'BUDGET_DECISION'
  // RISK
  | 'RISK_DETECTED'
  | 'RISK_ENCOUNTERED'
  | 'RISK_RESOLVED'
  | 'RISK_ESCALATED'
  // WEATHER
  | 'WEATHER_ALERT'
  | 'WEATHER_IMPACT'
  // SCHEDULE
  | 'SCHEDULE_CREATED'
  | 'SCHEDULE_CHANGED'
  | 'SCHEDULE_DELAYED'
  | 'SCHEDULE_COMPLETED'
  // FARMER DECISION
  | 'DECISION_MADE'
  | 'DECISION_OUTCOME'
  | 'PREFERENCE_OBSERVED'
  | 'FARMER_DECISION_MADE'
  | 'FARMER_DECISION_ACCEPTED'
  | 'FARMER_DECISION_REJECTED'
  // AI ADVISORY
  | 'AI_RECOMMENDATION_GENERATED'
  | 'AI_RECOMMENDATION_ACCEPTED'
  | 'AI_RECOMMENDATION_REJECTED'
  // SYSTEM
  | 'SYSTEM_EVENT'
  | 'OUTCOME_DETECTED';

export type SupportedLanguage = 'en' | 'te' | 'hi' | 'ta' | 'kn';

export interface EventTaxonomyDefinition {
  eventType: FarmMemoryEventType;
  category: FarmMemoryCategory;
  defaultSubjectType: FarmMemorySubjectType;
  description: Record<SupportedLanguage, string>;
  expectedPayloadKeys?: string[];
}

export const FARM_MEMORY_CATEGORIES: ReadonlyArray<FarmMemoryCategory> = [
  'FARM',
  'CROP',
  'OPERATION',
  'EQUIPMENT',
  'BOOKING',
  'FINANCIAL',
  'RISK',
  'WEATHER',
  'SCHEDULE',
  'DECISION',
  'AI',
  'SYSTEM',
] as const;

export const FARM_MEMORY_SUBJECT_TYPES: ReadonlyArray<FarmMemorySubjectType> = [
  'FARM',
  'CROP',
  'OPERATION',
  'EQUIPMENT',
  'BOOKING',
  'BUDGET',
  'RISK',
  'WEATHER',
  'SCHEDULE',
  'DECISION',
  'AI',
  'SYSTEM',
] as const;

export const FARM_MEMORY_TAXONOMY: Record<FarmMemoryEventType, EventTaxonomyDefinition> = {
  // --- FARM ---
  FARM_CREATED: {
    eventType: 'FARM_CREATED',
    category: 'FARM',
    defaultSubjectType: 'FARM',
    description: {
      en: 'Farm profile registered and initialized.',
      te: 'వ్యవసాయ క్షేత్రం ప్రొఫైల్ నమోదు చేయబడింది మరియు ప్రారంభించబడింది.',
      hi: 'खेत प्रोफ़ाइल पंजीकृत और प्रारंभ की गई।',
      ta: 'பண்ணை சுயவிவரம் பதிவு செய்யப்பட்டு தொடங்கப்பட்டது.',
      kn: 'ಕೃಷಿ ಭೂಮಿ ವಿವರ ನೋಂದಾಯಿಸಲಾಗಿದೆ ಮತ್ತು ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['name', 'totalAcres'],
  },
  FARM_UPDATED: {
    eventType: 'FARM_UPDATED',
    category: 'FARM',
    defaultSubjectType: 'FARM',
    description: {
      en: 'Farm profile or boundaries modified.',
      te: 'వ్యవసాయ క్షేత్ర వివరాలు లేదా సరిహద్దులు నవీకరించబడ్డాయి.',
      hi: 'खेत प्रोफ़ाइल या सीमाओं में संशोधन किया गया।',
      ta: 'பண்ணை விவரங்கள் அல்லது எல்லைகள் மாற்றப்பட்டன.',
      kn: 'ಕೃಷಿ ಭೂಮಿ ವಿವರಗಳು ಅಥವಾ ಗಡಿಗಳನ್ನು ಮಾರ್ಪಡಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['updatedFields'],
  },

  // --- CROP ---
  CROP_PLANTED: {
    eventType: 'CROP_PLANTED',
    category: 'CROP',
    defaultSubjectType: 'CROP',
    description: {
      en: 'New crop cycle planted on the farm.',
      te: 'పొలంలో కొత్త పంట విత్తబడింది.',
      hi: 'खेत में नई फसल बोई गई।',
      ta: 'பண்ணையில் புதிய பயிர் நடவு செய்யப்பட்டது.',
      kn: 'ಹೊಲದಲ್ಲಿ ಹೊಸ ಬೆಳೆ ಬಿತ್ತನೆ ಮಾಡಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['cropName', 'acreage', 'plantingDate'],
  },
  CROP_STAGE_CHANGED: {
    eventType: 'CROP_STAGE_CHANGED',
    category: 'CROP',
    defaultSubjectType: 'CROP',
    description: {
      en: 'Crop growth stage progressed to a new phase.',
      te: 'పంట పెరుగుదల దశ తదుపరి దశకు చేరింది.',
      hi: 'फसल विकास का चरण नए चरण में पहुंचा।',
      ta: 'பயிர் வளர்ச்சி நிலை புதிய கட்டத்திற்கு முன்னேறியது.',
      kn: 'ಬೆಳೆಯ ಬೆಳವಣಿಗೆಯ ಹಂತ ಹೊಸ ಹಂತಕ್ಕೆ ತಲುಪಿದೆ.',
    },
    expectedPayloadKeys: ['cropId', 'fromStage', 'toStage'],
  },
  CROP_HARVESTED: {
    eventType: 'CROP_HARVESTED',
    category: 'CROP',
    defaultSubjectType: 'CROP',
    description: {
      en: 'Crop harvesting completed with yield outcome recorded.',
      te: 'పంట కోత పూర్తయింది మరియు దిగుబడి నమోదు చేయబడింది.',
      hi: 'फसल की कटाई पूरी हुई और उपज दर्ज की गई।',
      ta: 'பயிர் அறுவடை முடிந்து விளைச்சல் பதிவு செய்யப்பட்டது.',
      kn: 'ಬೆಳೆ ಕಟಾವು ಪೂರ್ಣಗೊಂಡಿದೆ ಮತ್ತು ಇಳುವರಿ ದಾಖಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['cropId', 'yieldQuintals', 'quality'],
  },
  CROP_FAILED: {
    eventType: 'CROP_FAILED',
    category: 'CROP',
    defaultSubjectType: 'CROP',
    description: {
      en: 'Crop loss or damage event recorded.',
      te: 'పంట నష్టం లేదా వైఫల్యం నమోదు చేయబడింది.',
      hi: 'फसल क्षति या विफलता दर्ज की गई।',
      ta: 'பயிர் இழப்பு அல்லது சேதம் பதிவு செய்யப்பட்டது.',
      kn: 'ಬೆಳೆ ನಷ್ಟ ಅಥವಾ ವಿಫಲತೆ ದಾಖಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['cropId', 'cause', 'affectedAcres'],
  },

  // --- OPERATION ---
  OPERATION_CREATED: {
    eventType: 'OPERATION_CREATED',
    category: 'OPERATION',
    defaultSubjectType: 'OPERATION',
    description: {
      en: 'Farm operation planned and queued.',
      te: 'వ్యవసాయ పని ప్రణాళిక రూపొందించబడింది.',
      hi: 'खेत संचालन की योजना बनाई गई।',
      ta: 'பண்ணை செயல்பாடு திட்டமிடப்பட்டது.',
      kn: 'ಕೃಷಿ ಕಾರ್ಯಾಚರಣೆ ಯೋಜಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['operationName', 'scheduledDate'],
  },
  OPERATION_STARTED: {
    eventType: 'OPERATION_STARTED',
    category: 'OPERATION',
    defaultSubjectType: 'OPERATION',
    description: {
      en: 'Field execution of farm operation began.',
      te: 'పొలంలో వ్యవసాయ పని ప్రారంభమైంది.',
      hi: 'खेत में कार्य शुरू हुआ।',
      ta: 'களப்பணி தொடங்கியது.',
      kn: 'ಕ್ಷೇತ್ರ ಕಾರ್ಯಾಚರಣೆ ಪ್ರಾರಂಭವಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['operationId', 'operationName'],
  },
  OPERATION_COMPLETED: {
    eventType: 'OPERATION_COMPLETED',
    category: 'OPERATION',
    defaultSubjectType: 'OPERATION',
    description: {
      en: 'Farm operation successfully executed and finished.',
      te: 'వ్యవసాయ పని విజయవంతంగా పూర్తయింది.',
      hi: 'खेत कार्य सफलतापूर्वक पूरा हुआ।',
      ta: 'பண்ணை செயல்பாடு வெற்றிகரமாக முடிந்தது.',
      kn: 'ಕೃಷಿ ಕಾರ್ಯಾಚರಣೆ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ.',
    },
    expectedPayloadKeys: ['operationName'],
  },
  OPERATION_DELAYED: {
    eventType: 'OPERATION_DELAYED',
    category: 'OPERATION',
    defaultSubjectType: 'OPERATION',
    description: {
      en: 'Farm operation delayed due to field or weather constraints.',
      te: 'వాతావరణం లేదా క్షేత్ర పరిస్థితుల వలన పని వాయిదా పడింది.',
      hi: 'मौसम या अन्य कारणों से खेत कार्य में देरी हुई।',
      ta: 'வானிலை அல்லது பிற காரணங்களால் வேலை தாமதமானது.',
      kn: 'ಹವಾಮಾನ ಅಥವಾ ಇತರ ಕಾರಣಗಳಿಂದ ಕಾರ್ಯಾಚರಣೆ ವಿಳಂಬವಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['operationId', 'delayDays', 'reason'],
  },
  OPERATION_CANCELLED: {
    eventType: 'OPERATION_CANCELLED',
    category: 'OPERATION',
    defaultSubjectType: 'OPERATION',
    description: {
      en: 'Farm operation cancelled.',
      te: 'వ్యవసాయ పని రద్దు చేయబడింది.',
      hi: 'खेत कार्य रद्द कर दिया गया।',
      ta: 'பண்ணை செயல்பாடு ரத்து செய்யப்பட்டது.',
      kn: 'ಕೃಷಿ ಕಾರ್ಯಾಚರಣೆ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['operationId', 'reason'],
  },

  // --- EQUIPMENT ---
  EQUIPMENT_RENTED: {
    eventType: 'EQUIPMENT_RENTED',
    category: 'EQUIPMENT',
    defaultSubjectType: 'EQUIPMENT',
    description: {
      en: 'Equipment rented and mobilized for farm operations.',
      te: 'వ్యవసాయ పనుల కోసం యంత్ర పరికరం అద్దెకు తీసుకోబడింది.',
      hi: 'खेत कार्यों के लिए उपकरण किराए पर लिया गया।',
      ta: 'பண்ணை பணிகளுக்காக உபகரணம் வாடகைக்கு எடுக்கப்பட்டது.',
      kn: 'ಕೃಷಿ ಕೆಲಸಗಳಿಗಾಗಿ ಉಪಕರಣವನ್ನು ಬಾಡಿಗೆಗೆ ಪಡೆಯಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['equipmentId'],
  },
  EQUIPMENT_RETURNED: {
    eventType: 'EQUIPMENT_RETURNED',
    category: 'EQUIPMENT',
    defaultSubjectType: 'EQUIPMENT',
    description: {
      en: 'Rented equipment returned to owner in verified condition.',
      te: 'అద్దె యంత్రం యజమానికి తిరిగి అప్పగించబడింది.',
      hi: 'किराए का उपकरण मालिक को वापस लौटा दिया गया।',
      ta: 'வாடகை உபகரணம் உரிமையாளரிடம் திருப்பி ஒப்படைக்கப்பட்டது.',
      kn: 'ಬಾಡಿಗೆ ಉಪಕರಣವನ್ನು ಮಾಲೀಕರಿಗೆ ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['equipmentId', 'hoursUsed'],
  },
  EQUIPMENT_MAINTENANCE: {
    eventType: 'EQUIPMENT_MAINTENANCE',
    category: 'EQUIPMENT',
    defaultSubjectType: 'EQUIPMENT',
    description: {
      en: 'Equipment underwent maintenance or servicing.',
      te: 'యంత్రానికి మరమ్మతులు లేదా సర్వీసింగ్ చేయబడింది.',
      hi: 'उपकरण की मरम्मत या सर्विसिंग की गई।',
      ta: 'உபகரணம் பராமரிப்பு அல்லது சேவைக்கு உட்படுத்தப்பட்டது.',
      kn: 'ಉಪಕರಣದ ದುರಸ್ತಿ ಅಥವಾ ಸೇವೆ ನಡೆಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['equipmentId', 'serviceType'],
  },
  EQUIPMENT_UNAVAILABLE: {
    eventType: 'EQUIPMENT_UNAVAILABLE',
    category: 'EQUIPMENT',
    defaultSubjectType: 'EQUIPMENT',
    description: {
      en: 'Requested equipment was unavailable in proximity or schedule.',
      te: 'కోరిన యంత్రం సమీపంలో లేదా ఆ సమయంలో అందుబాటులో లేదు.',
      hi: 'अनुरोधित उपकरण समय पर या पास में उपलब्ध नहीं था।',
      ta: 'கோரப்பட்ட உபகரணம் குறிப்பிட்ட நேரத்தில் கிடைக்கவில்லை.',
      kn: 'ವಿನಂತಿಸಿದ ಉಪಕರಣ ಲಭ್ಯವಿರಲಿಲ್ಲ.',
    },
    expectedPayloadKeys: ['equipmentId', 'requestedDate'],
  },

  // --- BOOKING ---
  BOOKING_CREATED: {
    eventType: 'BOOKING_CREATED',
    category: 'BOOKING',
    defaultSubjectType: 'BOOKING',
    description: {
      en: 'Rental booking initiated for equipment.',
      te: 'యంత్ర పరికర అద్దె బుకింగ్ ప్రారంభించబడింది.',
      hi: 'उपकरण के लिए बुकिंग बनाई गई।',
      ta: 'உபகரணத்திற்கான வாடகை முன்பதிவு உருவாக்கப்பட்டது.',
      kn: 'ಉಪಕರಣ ಬಾಡಿಗೆ ಬುಕಿಂಗ್ ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['bookingId', 'equipmentId', 'totalDays'],
  },
  BOOKING_ACCEPTED: {
    eventType: 'BOOKING_ACCEPTED',
    category: 'BOOKING',
    defaultSubjectType: 'BOOKING',
    description: {
      en: 'Rental booking accepted by equipment owner.',
      te: 'యంత్ర యజమాని అద్దె బుకింగ్‌ను అంగీకరించారు.',
      hi: 'उपकरण मालिक द्वारा बुकिंग स्वीकार की गई।',
      ta: 'உபகரண உரிமையாளரால் முன்பதிவு ஏற்கப்பட்டது.',
      kn: 'ಮಾಲೀಕರು ಬಾಡಿಗೆ ಬುಕಿಂಗ್ ಅಂಗೀಕರಿಸಿದ್ದಾರೆ.',
    },
    expectedPayloadKeys: ['bookingId', 'ownerId'],
  },
  BOOKING_REJECTED: {
    eventType: 'BOOKING_REJECTED',
    category: 'BOOKING',
    defaultSubjectType: 'BOOKING',
    description: {
      en: 'Rental booking declined by equipment owner.',
      te: 'యంత్ర యజమాని అద్దె బుకింగ్‌ను తిరస్కరించారు.',
      hi: 'उपकरण मालिक द्वारा बुकिंग अस्वीकार की गई।',
      ta: 'உபகரண உரிமையாளரால் முன்பதிவு நிராகரிக்கப்பட்டது.',
      kn: 'ಮಾಲೀಕರು ಬಾಡಿಗೆ ಬುಕಿಂಗ್ ತಿರಸ್ಕರಿಸಿದ್ದಾರೆ.',
    },
    expectedPayloadKeys: ['bookingId', 'reason'],
  },
  BOOKING_CANCELLED: {
    eventType: 'BOOKING_CANCELLED',
    category: 'BOOKING',
    defaultSubjectType: 'BOOKING',
    description: {
      en: 'Rental booking cancelled.',
      te: 'అద్దె బుకింగ్ రద్దు చేయబడింది.',
      hi: 'बुकिंग रद्द कर दी गई।',
      ta: 'முன்பதிவு ரத்து செய்யப்பட்டது.',
      kn: 'ಬುಕಿಂಗ್ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['bookingId', 'reason'],
  },
  BOOKING_COMPLETED: {
    eventType: 'BOOKING_COMPLETED',
    category: 'BOOKING',
    defaultSubjectType: 'BOOKING',
    description: {
      en: 'Rental booking completed with final settlement.',
      te: 'అద్దె బుకింగ్ విజయవంతంగా ముగిసింది మరియు సెటిల్‌మెంట్ పూర్తయింది.',
      hi: 'बुकिंग पूर्ण हुई और अंतिम भुगतान संपन्न हुआ।',
      ta: 'முன்பதிவு நிறைவடைந்து தீர்வு காணப்பட்டது.',
      kn: 'ಬುಕಿಂಗ್ ಪೂರ್ಣಗೊಂಡಿದೆ ಮತ್ತು ಅಂತಿಮ ಇತ್ಯರ್ಥವಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['bookingId', 'finalCost'],
  },

  // --- FINANCIAL ---
  BUDGET_CREATED: {
    eventType: 'BUDGET_CREATED',
    category: 'FINANCIAL',
    defaultSubjectType: 'BUDGET',
    description: {
      en: 'Seasonal farm budget established.',
      te: 'వ్యవసాయ కాలానికి బడ్జెట్ నిర్ణయించబడింది.',
      hi: 'फसल चक्र के लिए बजट निर्धारित किया गया।',
      ta: 'பருவகால பண்ணை பட்ஜெட் உருவாக்கப்பட்டது.',
      kn: 'ಕೃಷಿ ಋತುವಿನ ಬಜೆಟ್ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['totalBudget', 'season'],
  },
  BUDGET_UPDATED: {
    eventType: 'BUDGET_UPDATED',
    category: 'FINANCIAL',
    defaultSubjectType: 'BUDGET',
    description: {
      en: 'Farm budget allocations adjusted.',
      te: 'వ్యవసాయ బడ్జెట్ కేటాయింపులు సవరించబడ్డాయి.',
      hi: 'खेत बजट आवंटन समायोजित किया गया।',
      ta: 'பண்ணை பட்ஜெட் ஒதுக்கீடுகள் மாற்றியமைக்கப்பட்டன.',
      kn: 'ಬಜೆಟ್ ಹಂಚಿಕೆಗಳನ್ನು ಸರಿಹೊಂದಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['previousBudget', 'newBudget'],
  },
  RENTAL_COST_RECORDED: {
    eventType: 'RENTAL_COST_RECORDED',
    category: 'FINANCIAL',
    defaultSubjectType: 'BUDGET',
    description: {
      en: 'Direct machinery rental expense debited to farm budget.',
      te: 'యంత్రాల అద్దె ఖర్చు బడ్జెట్‌లో నమోదు చేయబడింది.',
      hi: 'मशीनरी किराया व्यय खेत बजट में दर्ज किया गया।',
      ta: 'இயந்திர வாடகை செலவு பட்ஜெட்டில் பதிவு செய்யப்பட்டது.',
      kn: 'ಯಂತ್ರೋಪಕರಣ ಬಾಡಿಗೆ ವೆಚ್ಚವನ್ನು ಬಜೆಟ್‌ನಲ್ಲಿ ದಾಖಲಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['amount', 'equipmentCategory'],
  },
  BUDGET_ALERT: {
    eventType: 'BUDGET_ALERT',
    category: 'FINANCIAL',
    defaultSubjectType: 'BUDGET',
    description: {
      en: 'Financial threshold exceeded or budget overrun warning triggered.',
      te: 'బడ్జెట్ పరిమితి దాటినప్పుడు హెచ్చరిక జారీ చేయబడింది.',
      hi: 'बजट सीमा पार होने पर चेतावनी जारी की गई।',
      ta: 'பட்ஜெட் வரம்பு மீறல் எச்சரிக்கை விடுக்கப்பட்டது.',
      kn: 'ಬಜೆಟ್ ಮಿತಿ ಮೀರಿದಾಗ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['burnRate', 'variancePercentage'],
  },
  BUDGET_DECISION: {
    eventType: 'BUDGET_DECISION',
    category: 'FINANCIAL',
    defaultSubjectType: 'BUDGET',
    description: {
      en: 'Farmer made a financial trade-off or budget allocation decision.',
      te: 'రైతు బడ్జెట్ కేటాయింపు లేదా ఖర్చుపై నిర్ణయం తీసుకున్నారు.',
      hi: 'किसान ने बजट या वित्तीय आवंटन पर निर्णय लिया।',
      ta: 'விவசாயி நிதி ஒதுக்கீடு குறித்து முடிவு செய்தார்.',
      kn: 'ರೈತರು ಹಣಕಾಸಿನ ಹೊಂದಾಣಿಕೆ ಅಥವಾ ಬಜೆಟ್ ನಿರ್ಧಾರ ಕೈಗೊಂಡಿದ್ದಾರೆ.',
    },
    expectedPayloadKeys: ['decision', 'pressure'],
  },

  // --- RISK ---
  RISK_DETECTED: {
    eventType: 'RISK_DETECTED',
    category: 'RISK',
    defaultSubjectType: 'RISK',
    description: {
      en: 'Agronomic, operational, or weather risk detected.',
      te: 'వ్యవసాయ లేదా వాతావరణ ప్రమాదం గుర్తించబడింది.',
      hi: 'कृषि, परिचालन या मौसम संबंधी जोखिम का पता चला।',
      ta: 'வேளாண் அல்லது வானிலை ஆபத்து கண்டறியப்பட்டது.',
      kn: 'ಕೃಷಿ ಅಥವಾ ಹವಾಮಾನ ಅಪಾಯವನ್ನು ಪತ್ತೆಹಚ್ಚಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['riskType', 'severityScore'],
  },
  RISK_ENCOUNTERED: {
    eventType: 'RISK_ENCOUNTERED',
    category: 'RISK',
    defaultSubjectType: 'RISK',
    description: {
      en: 'Active risk impacted field operations.',
      te: 'ప్రమాదం వలన పొలం పనులపై ప్రభావం పడింది.',
      hi: 'सक्रिय जोखिम ने खेत कार्यों को प्रभावित किया।',
      ta: 'செயலில் உள்ள ஆபத்து களப்பணிகளை பாதித்தது.',
      kn: 'ಸಕ್ರಿಯ ಅಪಾಯವು ಕೃಷಿ ಕೆಲಸಗಳ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರಿದೆ.',
    },
    expectedPayloadKeys: ['riskId', 'description'],
  },
  RISK_RESOLVED: {
    eventType: 'RISK_RESOLVED',
    category: 'RISK',
    defaultSubjectType: 'RISK',
    description: {
      en: 'Mitigation action successfully resolved identified risk.',
      te: 'నివారణ చర్య ద్వారా గుర్తించిన ప్రమాదం తొలగించబడింది.',
      hi: 'निवारक कार्रवाई द्वारा जोखिम का सफलतापूर्वक समाधान किया गया।',
      ta: 'தணிப்பு நடவடிக்கை மூலம் ஆபத்து தீர்க்கப்பட்டது.',
      kn: 'ಪರಿಹಾರ ಕ್ರಮದಿಂದ ಅಪಾಯ ನಿವಾರಣೆಯಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['riskId', 'mitigationAction'],
  },
  RISK_ESCALATED: {
    eventType: 'RISK_ESCALATED',
    category: 'RISK',
    defaultSubjectType: 'RISK',
    description: {
      en: 'Risk severity escalated to critical threshold.',
      te: 'ప్రమాద స్థాయి మరింత తీవ్రతరమైంది.',
      hi: 'जोखिम की गंभीरता गंभीर सीमा तक बढ़ गई।',
      ta: 'ஆபத்தின் தீவிரம் அதிகரித்தது.',
      kn: 'ಅಪಾಯದ ತೀವ್ರತೆಯು ಹೆಚ್ಚಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['riskId', 'newSeverityScore'],
  },

  // --- WEATHER ---
  WEATHER_ALERT: {
    eventType: 'WEATHER_ALERT',
    category: 'WEATHER',
    defaultSubjectType: 'WEATHER',
    description: {
      en: 'Meteorological advisory issued for farm coordinates.',
      te: 'పొలం ప్రాంతానికి వాతావరణ హెచ్చరిక జారీ చేయబడింది.',
      hi: 'खेत क्षेत्र के लिए मौसम चेतावनी जारी की गई।',
      ta: 'பண்ணை பகுதிக்கு வானிலை எச்சரிக்கை விடுக்கப்பட்டது.',
      kn: 'ಕೃಷಿ ಪ್ರದೇಶಕ್ಕೆ ಹವಾಮಾನ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['alertType', 'rainfallExpectedMm'],
  },
  WEATHER_IMPACT: {
    eventType: 'WEATHER_IMPACT',
    category: 'WEATHER',
    defaultSubjectType: 'WEATHER',
    description: {
      en: 'Adverse weather event caused direct field impact.',
      te: 'ప్రతికూల వాతావరణం పొలంపై ప్రత్యక్ష ప్రభావం చూపింది.',
      hi: 'प्रतिकूल मौसम ने खेत पर सीधा प्रभाव डाला।',
      ta: 'மோசமான வானிலை பண்ணையில் நேரடி பாதிப்பை ஏற்படுத்தியது.',
      kn: 'ಪ್ರತಿಕೂಲ ಹವಾಮಾನವು ಹೊಲದ ಮೇಲೆ ನೇರ ಪರಿಣಾಮ ಬೀರಿದೆ.',
    },
    expectedPayloadKeys: ['condition', 'impactSeverity'],
  },

  // --- SCHEDULE ---
  SCHEDULE_CREATED: {
    eventType: 'SCHEDULE_CREATED',
    category: 'SCHEDULE',
    defaultSubjectType: 'SCHEDULE',
    description: {
      en: 'Master crop operation schedule generated.',
      te: 'ప్రధాన పంట నిర్వహణ కాలపట్టిక రూపొందించబడింది.',
      hi: 'मुख्य फसल संचालन अनुसूची बनाई गई।',
      ta: 'முக்கிய பயிர் செயல்பாட்டு அட்டவணை உருவாக்கப்பட்டது.',
      kn: 'ಮುಖ್ಯ ಬೆಳೆ ಕಾರ್ಯಾಚರಣೆ ವೇಳಾಪಟ್ಟಿ ರಚಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['scheduleId', 'operationCount', 'qualityScore'],
  },
  SCHEDULE_CHANGED: {
    eventType: 'SCHEDULE_CHANGED',
    category: 'SCHEDULE',
    defaultSubjectType: 'SCHEDULE',
    description: {
      en: 'Operation schedule dates or sequence modified.',
      te: 'పనుల కాలపట్టిక లేదా తేదీలు మార్చబడ్డాయి.',
      hi: 'अनुसूची की तिथियां या क्रम संशोधित किया गया।',
      ta: 'அட்டவணை தேதிகள் அல்லது வரிசை மாற்றியமைக்கப்பட்டது.',
      kn: 'ವೇಳಾಪಟ್ಟಿಯ ದಿನಾಂಕಗಳು ಅಥವಾ ಅನುಕ್ರಮವನ್ನು ಬದಲಾಯಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['scheduleId', 'delayDays'],
  },
  SCHEDULE_DELAYED: {
    eventType: 'SCHEDULE_DELAYED',
    category: 'SCHEDULE',
    defaultSubjectType: 'SCHEDULE',
    description: {
      en: 'Schedule milestone delayed due to dependency.',
      te: 'ముందస్తు కారణాల వల్ల కాలపట్టిక ఆలస్యమైంది.',
      hi: 'निर्भरता के कारण अनुसूची में देरी हुई।',
      ta: 'காரணங்களால் அட்டவணை தாமதமானது.',
      kn: 'ಕಾರಣಾಂತರಗಳಿಂದ ವೇಳಾಪಟ್ಟಿ ವಿಳಂಬವಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['scheduleId', 'delayedDays', 'bottleneck'],
  },
  SCHEDULE_COMPLETED: {
    eventType: 'SCHEDULE_COMPLETED',
    category: 'SCHEDULE',
    defaultSubjectType: 'SCHEDULE',
    description: {
      en: 'All planned schedule operations completed.',
      te: 'కాలపట్టికలోని అన్ని పనులు విజయవంతంగా ముగిశాయి.',
      hi: 'अनुसूची के सभी कार्य संपन्न हुए।',
      ta: 'அட்டவணையின் அனைத்து பணிகளும் முடிவடைந்தன.',
      kn: 'ವೇಳಾಪಟ್ಟಿಯ ಎಲ್ಲಾ ಕೆಲಸಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ.',
    },
    expectedPayloadKeys: ['scheduleId', 'completedOperationsCount'],
  },

  // --- FARMER DECISION ---
  DECISION_MADE: {
    eventType: 'DECISION_MADE',
    category: 'DECISION',
    defaultSubjectType: 'DECISION',
    description: {
      en: 'Farmer recorded an operational or management decision.',
      te: 'రైతు ఒక ముఖ్యమైన కార్యాచరణ నిర్ణయం తీసుకున్నారు.',
      hi: 'किसान ने एक परिचालन या प्रबंधन निर्णय दर्ज किया।',
      ta: 'விவசாயி ஒரு செயல்பாட்டு முடிவை பதிவு செய்தார்.',
      kn: 'ರೈತರು ಕಾರ್ಯಾಚರಣೆಯ ನಿರ್ಧಾರವನ್ನು ದಾಖಲಿಸಿದ್ದಾರೆ.',
    },
    expectedPayloadKeys: ['decisionType', 'choice'],
  },
  DECISION_OUTCOME: {
    eventType: 'DECISION_OUTCOME',
    category: 'DECISION',
    defaultSubjectType: 'DECISION',
    description: {
      en: 'Observed outcome of a previously recorded decision.',
      te: 'గతంలో తీసుకున్న నిర్ణయం యొక్క ఫలితం నమోదు చేయబడింది.',
      hi: 'पूर्व निर्णय का देखा गया परिणाम दर्ज किया गया।',
      ta: 'முந்தைய முடிவின் காணப்பட்ட முடிவு பதிவு செய்யப்பட்டது.',
      kn: 'ಹಿಂದಿನ ನಿರ್ಧಾರದ ಫಲಿತಾಂಶವನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['decisionId', 'outcomeQuality'],
  },
  PREFERENCE_OBSERVED: {
    eventType: 'PREFERENCE_OBSERVED',
    category: 'DECISION',
    defaultSubjectType: 'DECISION',
    description: {
      en: 'Farmer preference pattern noted for machinery or practices.',
      te: 'యంత్రాలు లేదా పద్ధతులపై రైతు ప్రాధాన్యత గుర్తించబడింది.',
      hi: 'मशीनरी या प्रथाओं के लिए किसान की प्राथमिकता दर्ज की गई।',
      ta: 'இயந்திரங்கள் குறித்த விவசாயியின் விருப்பம் கவனிக்கப்பட்டது.',
      kn: 'ಯಂತ್ರೋಪಕರಣಗಳ ಬಗ್ಗೆ ರೈತರ ಆದ್ಯತೆಯನ್ನು ಗಮನಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['category', 'preferredEntityId'],
  },
  FARMER_DECISION_MADE: {
    eventType: 'FARMER_DECISION_MADE',
    category: 'DECISION',
    defaultSubjectType: 'DECISION',
    description: {
      en: 'Farmer explicitly chose an action from alternatives.',
      te: 'రైతు ప్రత్యామ్నాయాల నుండి ఒక నిర్దిష్ట చర్యను ఎంచుకున్నారు.',
      hi: 'किसान ने विकल्पों में से एक कार्रवाई का चयन किया।',
      ta: 'விவசாயி மாற்று வழிகளில் இருந்து ஒரு செயலைத் தேர்ந்தெடுத்தார்.',
      kn: 'ರೈತರು ಪರ್ಯಾಯಗಳಿಂದ ಒಂದು ಕ್ರಮವನ್ನು ಆರಿಸಿಕೊಂಡಿದ್ದಾರೆ.',
    },
    expectedPayloadKeys: ['actionSelected', 'reason'],
  },
  FARMER_DECISION_ACCEPTED: {
    eventType: 'FARMER_DECISION_ACCEPTED',
    category: 'DECISION',
    defaultSubjectType: 'DECISION',
    description: {
      en: 'Farmer accepted a suggested action or workflow.',
      te: 'రైతు సూచించిన చర్యను ఆమోదించారు.',
      hi: 'किसान ने सुझाई गई कार्रवाई को स्वीकार किया।',
      ta: 'விவசாயி பரிந்துரைக்கப்பட்ட செயலை ஏற்றுக்கொண்டார்.',
      kn: 'ರೈತರು ಸೂಚಿಸಿದ ಕ್ರಮವನ್ನು ಒಪ್ಪಿಕೊಂಡಿದ್ದಾರೆ.',
    },
    expectedPayloadKeys: ['proposalId'],
  },
  FARMER_DECISION_REJECTED: {
    eventType: 'FARMER_DECISION_REJECTED',
    category: 'DECISION',
    defaultSubjectType: 'DECISION',
    description: {
      en: 'Farmer declined a suggested action or workflow.',
      te: 'రైతు సూచించిన చర్యను తిరస్కరించారు.',
      hi: 'किसान ने सुझाई गई कार्रवाई को अस्वीकार किया।',
      ta: 'விவசாயி பரிந்துரைக்கப்பட்ட செயலை நிராகரித்தார்.',
      kn: 'ರೈತರು ಸೂಚಿಸಿದ ಕ್ರಮವನ್ನು ತಿರಸ್ಕರಿಸಿದ್ದಾರೆ.',
    },
    expectedPayloadKeys: ['proposalId', 'reason'],
  },

  // --- AI ADVISORY ---
  AI_RECOMMENDATION_GENERATED: {
    eventType: 'AI_RECOMMENDATION_GENERATED',
    category: 'AI',
    defaultSubjectType: 'AI',
    description: {
      en: 'Advisory recommendation generated by local AI copilot.',
      te: 'స్థానిక AI కోపైలట్ ద్వారా సలహా సిఫార్సు రూపొందించబడింది.',
      hi: 'स्थानीय AI कोपायलट द्वारा सलाह सिफारिश उत्पन्न की गई।',
      ta: 'உள்ளூர் AI துணை வழிகாட்டி மூலம் பரிந்துரை உருவாக்கப்பட்டது.',
      kn: 'ಸ್ಥಳೀಯ AI ಕೊಪೈಲಟ್ ಮೂಲಕ ಸಲಹಾ ಶಿಫಾರಸು ರಚಿಸಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['topic', 'recommendationSummary'],
  },
  AI_RECOMMENDATION_ACCEPTED: {
    eventType: 'AI_RECOMMENDATION_ACCEPTED',
    category: 'AI',
    defaultSubjectType: 'AI',
    description: {
      en: 'Farmer adopted the advice provided by AI copilot.',
      te: 'రైతు AI అందించిన సలహాను అనుసరించారు.',
      hi: 'किसान ने AI द्वारा दी गई सलाह को अपनाया।',
      ta: 'விவசாயி AI வழங்கிய ஆலோசனையை ஏற்றுக்கொண்டார்.',
      kn: 'ರೈತರು AI ನೀಡಿದ ಸಲಹೆಯನ್ನು ಅಳವಡಿಸಿಕೊಂಡಿದ್ದಾರೆ.',
    },
    expectedPayloadKeys: ['recommendationId'],
  },
  AI_RECOMMENDATION_REJECTED: {
    eventType: 'AI_RECOMMENDATION_REJECTED',
    category: 'AI',
    defaultSubjectType: 'AI',
    description: {
      en: 'Farmer dismissed the advice provided by AI copilot.',
      te: 'రైతు AI అందించిన సలహాను తోసిపుచ్చారు.',
      hi: 'किसान ने AI द्वारा दी गई सलाह को खारिज किया।',
      ta: 'விவசாயி AI வழங்கிய ஆலோசனையை நிராகரித்தார்.',
      kn: 'ರೈತರು AI ನೀಡಿದ ಸಲಹೆಯನ್ನು ತಿರಸ್ಕರಿಸಿದ್ದಾರೆ.',
    },
    expectedPayloadKeys: ['recommendationId', 'reason'],
  },

  // --- SYSTEM ---
  SYSTEM_EVENT: {
    eventType: 'SYSTEM_EVENT',
    category: 'SYSTEM',
    defaultSubjectType: 'SYSTEM',
    description: {
      en: 'Platform lifecycle or audit memory event recorded.',
      te: 'ప్లాట్‌ఫామ్ ఆడిట్ లేదా సిస్టమ్ రికార్డు నమోదు చేయబడింది.',
      hi: 'प्लेटफ़ॉर्म ऑडिट या सिस्टम इवेंट दर्ज किया गया।',
      ta: 'தள தணிக்கை அல்லது கணினி நிகழ்வு பதிவு செய்யப்பட்டது.',
      kn: 'ವೇದಿಕೆಯ ಲೆಕ್ಕಪರಿಶೋಧನೆ ಅಥವಾ ಸಿಸ್ಟಮ್ ಘಟನೆ ದಾಖಲಾಗಿದೆ.',
    },
    expectedPayloadKeys: ['eventType', 'detail'],
  },
  'OUTCOME_DETECTED': {
    eventType: 'OUTCOME_DETECTED',
    category: 'SYSTEM',
    defaultSubjectType: 'SYSTEM',
    description: {
      en: 'Expected vs Actual outcome detected and verified',
      te: 'ఆశించిన మరియు వాస్తవ ఫలితం కనుగొనబడింది మరియు ధృవీకరించబడింది',
      hi: 'अपेक्षित और वास्तविक परिणाम का पता चला और सत्यापित किया गया',
      ta: 'எதிர்பார்க்கப்பட்ட மற்றும் உண்மையான முடிவு கண்டறியப்பட்டு சரிபார்க்கப்பட்டது',
      kn: 'ನಿರೀಕ್ಷಿತ ಮತ್ತು ನೈಜ ಫಲಿತಾಂಶವನ್ನು ಪತ್ತೆಹಚ್ಚಲಾಗಿದೆ ಮತ್ತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ'
    },
    expectedPayloadKeys: ['outcomeType', 'category', 'evidence'],
  },
};

const VALID_EVENT_TYPES_SET = new Set<string>(Object.keys(FARM_MEMORY_TAXONOMY));
const VALID_CATEGORIES_SET = new Set<string>(FARM_MEMORY_CATEGORIES);
const VALID_SUBJECT_TYPES_SET = new Set<string>(FARM_MEMORY_SUBJECT_TYPES);

/**
 * Deterministic validation functions
 */
export function isValidEventType(type: unknown): type is FarmMemoryEventType {
  return typeof type === 'string' && VALID_EVENT_TYPES_SET.has(type);
}

export function isValidCategory(category: unknown): category is FarmMemoryCategory {
  return typeof category === 'string' && VALID_CATEGORIES_SET.has(category);
}

export function isValidSubjectType(subjectType: unknown): subjectType is FarmMemorySubjectType {
  return typeof subjectType === 'string' && VALID_SUBJECT_TYPES_SET.has(subjectType);
}

export function getEventTaxonomy(type: FarmMemoryEventType): EventTaxonomyDefinition {
  const def = FARM_MEMORY_TAXONOMY[type];
  if (!def) {
    throw new Error(`UNKNOWN_EVENT_TAXONOMY: ${type}`);
  }
  return def;
}

export function getEventsByCategory(category: FarmMemoryCategory): FarmMemoryEventType[] {
  return Object.values(FARM_MEMORY_TAXONOMY)
    .filter((def) => def.category === category)
    .map((def) => def.eventType);
}

export function getLocalizedEventDescription(type: FarmMemoryEventType, lang: string = 'en'): string {
  const def = FARM_MEMORY_TAXONOMY[type];
  if (!def) return type;
  const targetLang = (lang in def.description ? lang : 'en') as SupportedLanguage;
  return def.description[targetLang] || def.description.en;
}
