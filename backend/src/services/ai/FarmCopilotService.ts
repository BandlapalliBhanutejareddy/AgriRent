import { farmContextService, CanonicalFarmContext } from './FarmContextService';
import { equipmentRecommendationService } from './EquipmentRecommendationService';
import { aiProvider } from '../aiProvider';
import { prisma } from '../../lib/prisma';

export interface CopilotRequestInput {
  farmId: string;
  cropId: string;
  question?: string;
  language?: string;
  startDate?: string;
  endDate?: string;
}

export interface CopilotConflict {
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  resolution: string;
}

export interface CopilotRisk {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  recommendation: string;
}

export interface CopilotEquipmentItem {
  equipmentId: string;
  equipmentName: string;
  category: string;
  pricePerDay: number;
  matchScore: number;
  matchTier: string;
  reason: string;
  availableForDates: boolean;
  rentalEstimate: number;
  recommendedDays: number;
  ownerName: string;
  ownerPhone?: string;
  imageUrl?: string;
}

export interface CopilotResponse {
  farmStatus: {
    summary: string;
    crop: string;
    acreage: number;
    stage: string;
    location: string;
    season: string;
  };
  translatedCropPlan: {
    crop: string;
    stage: string;
    duration: string;
  };
  actionableSteps: string[];
  translatedEquipment: {
    equipmentId: string;
    equipmentName: string;
    category: string;
    pricePerDay: number;
    matchScore: number;
    matchTier: string;
    whyNeeded: string;
    whatItDoes: string;
    whenToUse: string;
    basicUsage: string;
    imageUrl?: string;
  }[];
  conflicts: CopilotConflict[];
  risks: CopilotRisk[];
  budgetInsight: {
    budget: number;
    estimatedRentalCost: number;
    withinBudget: boolean;
    budgetStatus: string;
    message: string;
  };
  action: {
    primaryAction: string;
    equipmentId?: string;
  };
  explanation: string;
  warnings: string[];
  nextSteps: string[];
  language: string;
  currentDate: string;
  usingFallback?: boolean;
}

export class FarmCopilotService {
  /**
   * Main Copilot Decision Engine
   */
  async processCopilotRequest(farmerId: string, input: CopilotRequestInput): Promise<CopilotResponse> {
    // 1. Build canonical context
    const context = await farmContextService.buildContext(
      farmerId,
      input.farmId,
      input.cropId,
      {
        preferredLanguage: input.language
      }
    );

    const lang = context.farmProfile.preferredLanguage || 'en';
    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const endDate = input.endDate ? new Date(input.endDate) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    // 2. Query real equipment recommendations from DB with question context
    const rawMatches = await equipmentRecommendationService.recommendEquipment({
      ...context.farmProfile,
      question: input.question
    });

    // 3. Evaluate live availability & date conflicts against DB bookings
    const conflicts: CopilotConflict[] = [];
    const risks: CopilotRisk[] = [];

    // Validation warning for missing fields
    if (!context.farmProfile.acreage || context.farmProfile.acreage <= 0) {
      conflicts.push({
        type: 'MISSING_ACREAGE',
        severity: 'WARNING',
        message: 'Acreage was not provided or set to 0. Defaulting to 5 acres for equipment scaling.',
        resolution: 'Provide precise farm acreage in your farm profile.'
      });
    }

    const processedEquipment: CopilotEquipmentItem[] = [];

    for (const item of rawMatches) {
      // Check date availability overlap in DB
      const dbEquipment = await prisma.equipment.findUnique({
        where: { id: item.id },
        include: {
          owner: { select: { isSuspended: true, name: true, phone: true } },
          bookings: {
            where: {
              status: { notIn: ['REJECTED', 'CANCELLED', 'REFUNDED'] },
              startDate: { lt: endDate },
              endDate: { gt: startDate }
            }
          }
        }
      });

      // Filter out disabled equipment or suspended owners
      if (!dbEquipment || !dbEquipment.available || dbEquipment.owner?.isSuspended) {
        continue;
      }

      const isBookedForDates = dbEquipment.bookings.length > 0;

      if (isBookedForDates) {
        conflicts.push({
          type: 'EQUIPMENT_BOOKING_OVERLAP',
          severity: 'HIGH' as any,
          message: `${dbEquipment.title} is already booked for selected dates (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}).`,
          resolution: 'Select alternative available dates or choose another matched machine.'
        });
      }

      // Scale check (e.g. large farm 50+ acres vs small equipment)
      if (context.farmProfile.acreage > 20 && dbEquipment.category === 'POWER_TILLERS') {
        risks.push({
          type: 'HP_MISMATCH',
          severity: 'MEDIUM',
          message: `Power Tiller capacity may be insufficient for a large farm of ${context.farmProfile.acreage} acres.`,
          recommendation: 'Consider renting a 50+ HP heavy-duty tractor.'
        });
      }

      processedEquipment.push({
        equipmentId: dbEquipment.id,
        equipmentName: dbEquipment.title,
        category: dbEquipment.category,
        pricePerDay: dbEquipment.pricePerDay,
        matchScore: item.matchScore,
        matchTier: item.matchTier,
        reason: item.matchReason,
        availableForDates: !isBookedForDates,
        rentalEstimate: item.estimatedTotalCost,
        recommendedDays: item.recommendedDays,
        ownerName: dbEquipment.owner.name,
        ownerPhone: dbEquipment.owner.phone || undefined,
        imageUrl: dbEquipment.imageUrl
      });
    }

    // 4. Calculate total estimated rental cost
    const topMatchCost = processedEquipment.length > 0 ? processedEquipment[0].rentalEstimate : 3000;
    const farmerBudget = context.farmProfile.budget || 20000;
    const withinBudget = topMatchCost <= farmerBudget;

    if (!withinBudget) {
      conflicts.push({
        type: 'BUDGET_EXCEEDED',
        severity: 'WARNING',
        message: `Estimated rental cost of ₹${topMatchCost.toLocaleString()} exceeds your budget of ₹${farmerBudget.toLocaleString()}.`,
        resolution: 'Reduce rental duration or select an alternative implement.'
      });
    }

    // 5. Build prompt for Ollama AI Reasoning
    const prompt = this.buildOllamaPrompt(context, processedEquipment, input.question, startDate, endDate);

    let aiReasoning: any = null;
    let usingFallback = false;

    try {
      const systemPrompt = `You are AgroRent AI Farm Copilot. Respond strictly in valid JSON format matching the schema provided. Do not invent equipment or prices. Respect the requested language (${lang}). Answer the user's specific question directly.`;
      const responseText = await aiProvider.generateText(prompt, systemPrompt, 1500);
      
      aiReasoning = this.parseOllamaResponse(responseText);
    } catch (err) {
      console.warn('Ollama Copilot call failed or timed out. Engaging local deterministic fallback.');
      usingFallback = true;
    }

    // 6. If AI reasoning is missing or invalid, generate question-specific deterministic fallback
    let fallbackReasoning = this.generateDeterministicFallback(context, processedEquipment, lang, input.question);
    if (!aiReasoning) {
      aiReasoning = fallbackReasoning;
      usingFallback = true;
    }

    // 7. Assemble final verified Copilot Response
    const response: CopilotResponse = {
      farmStatus: {
        summary: aiReasoning.farmSummary || fallbackReasoning.farmSummary,
        crop: context.farmProfile.crop,
        acreage: context.farmProfile.acreage,
        stage: context.farmProfile.cropStage,
        location: context.farmProfile.location || 'Local Region',
        season: context.farmProfile.season || 'Kharif'
      },
      translatedCropPlan: aiReasoning.translatedCropPlan || fallbackReasoning.translatedCropPlan,
      actionableSteps: (aiReasoning.actionableSteps && aiReasoning.actionableSteps.length > 0) ? aiReasoning.actionableSteps : fallbackReasoning.actionableSteps,
      translatedEquipment: processedEquipment.map((eq, i) => {
        const aiEq = (aiReasoning.translatedEquipment || [])[i];
        const fbEq = (fallbackReasoning.translatedEquipment || [])[i];
        return {
          ...eq,
          whyNeeded: aiEq?.whyNeeded || fbEq?.whyNeeded || `Required for ${context.farmProfile.cropStage}`,
          whatItDoes: aiEq?.whatItDoes || fbEq?.whatItDoes || `Assists with ${eq.category.toLowerCase()}`,
          whenToUse: aiEq?.whenToUse || fbEq?.whenToUse || `During ${context.farmProfile.cropStage}`,
          basicUsage: aiEq?.basicUsage || fbEq?.basicUsage || `Operate according to standard guidelines.`
        };
      }),
      conflicts,
      risks: [
        ...risks,
        {
          type: 'WEATHER_SENSITIVITY',
          severity: 'MEDIUM',
          message: 'Rain-sensitive field operation detected. Complete land prep before precipitation.',
          recommendation: 'Ensure tractor puddling/tilling is scheduled during dry soil windows.'
        }
      ],
      budgetInsight: {
        budget: farmerBudget,
        estimatedRentalCost: topMatchCost,
        withinBudget,
        budgetStatus: withinBudget ? 'WITHIN_BUDGET' : 'OVER_BUDGET',
        message: withinBudget
          ? `Estimated rental of ₹${topMatchCost.toLocaleString()} is comfortably within your budget of ₹${farmerBudget.toLocaleString()}.`
          : `Rental estimate of ₹${topMatchCost.toLocaleString()} exceeds your budget of ₹${farmerBudget.toLocaleString()}.`
      },
      action: {
        primaryAction: processedEquipment.length > 0 ? `Book ${processedEquipment[0].equipmentName}` : 'Explore Marketplace Inventory',
        equipmentId: processedEquipment[0]?.equipmentId
      },
      explanation: aiReasoning.explanation || fallbackReasoning.explanation,
      warnings: (aiReasoning.warnings && aiReasoning.warnings.length > 0) ? aiReasoning.warnings : fallbackReasoning.warnings,
      nextSteps: (aiReasoning.nextSteps && aiReasoning.nextSteps.length > 0) ? aiReasoning.nextSteps : fallbackReasoning.nextSteps,
      language: lang,
      currentDate: context.currentDate,
      usingFallback
    };

    return response;
  }

  private buildOllamaPrompt(context: CanonicalFarmContext, equipment: CopilotEquipmentItem[], query?: string, startDate?: Date, endDate?: Date): string {
    return `
FARMER CONTEXT:
Farmer Name: ${context.farmerName}
Crop: ${context.farmProfile.crop}
Soil Type: ${context.farmProfile.soilType}
Acreage: ${context.farmProfile.acreage} acres
Location: ${context.farmProfile.location}
Season: ${context.farmProfile.season}
Farming Stage: ${context.farmProfile.cropStage}
Farming Objective: ${context.farmProfile.objective}
Budget: ₹${context.farmProfile.budget}
Language: ${context.farmProfile.preferredLanguage}
Current Date: ${context.currentDate}
Date Range: ${startDate?.toLocaleDateString()} to ${endDate?.toLocaleDateString()}
Farmer Question: ${query || 'What should I do today on my farm?'}

VERIFIED AVAILABLE DATABASE EQUIPMENT CANDIDATES:
${JSON.stringify(equipment, null, 2)}

Produce a JSON response answering the question directly, with all content translated into ${context.farmProfile.preferredLanguage}.
{
  "farmSummary": "Direct summary answer to the user query translated",
  "translatedCropPlan": {
    "crop": "Crop name translated",
    "stage": "Current Stage name translated",
    "duration": "Estimated duration translated (e.g. 10-15 days)"
  },
  "actionableSteps": [
    "Specific actionable step 1 directly answering the query",
    "Specific actionable step 2 directly answering the query",
    "Specific actionable step 3 directly answering the query"
  ],
  "translatedEquipment": [
    {
      "whyNeeded": "Why equipment is needed (translated)",
      "whatItDoes": "What equipment does (translated)",
      "whenToUse": "When to use it (translated)",
      "basicUsage": "How to use it (translated)"
    }
  ],
  "warnings": [
    "Specific warning relevant to the question and stage (translated)"
  ],
  "nextSteps": [
    "Practical next step (translated)"
  ],
  "explanation": "Detailed, practical answer addressing the exact question asked by the farmer (translated)"
}
`;
  }

  private parseOllamaResponse(text: string): any {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  private generateDeterministicFallback(context: CanonicalFarmContext, equipment: CopilotEquipmentItem[], lang: string, rawQuery?: string): any {
    const isTe = lang.startsWith('te');
    const isHi = lang.startsWith('hi');
    const isTa = lang.startsWith('ta');
    const isKn = lang.startsWith('kn');
    const q = (rawQuery || '').toLowerCase();
    const crop = context.farmProfile.crop || 'Crop';
    const stage = context.farmProfile.cropStage || 'Current Stage';
    const acreage = context.farmProfile.acreage || 5;

    // Detect Intent
    if (q.includes('land') || q.includes('prep') || q.includes('plough') || q.includes('rotavator') || q.includes('till') || q.includes('levell')) {
      return {
        farmSummary: isTe ? `${crop} నేల తయారీ కొరకు యంత్రాలు మరియు పద్ధతులు` :
                     isHi ? `${crop} भूमि तैयारी के लिए उपकरण और विधियाँ` :
                     isTa ? `${crop} நில தயாரிப்புக்கான கருவிகள் மற்றும் முறைகள்` :
                     isKn ? `${crop} ಭೂಮಿ ಸಿದ್ಧತೆಗೆ ಉಪಕರಣಗಳು ಮತ್ತು ವಿಧಾನಗಳು` :
                     `Land Preparation Equipment & Agronomy Guide for ${crop}`,
        translatedCropPlan: {
          crop,
          stage: isTe ? 'నేల తయారీ' : isHi ? 'भूमि की तैयारी' : isTa ? 'நில தயாரிப்பு' : isKn ? 'ಭೂಮಿ ಸಿದ್ಧತೆ' : 'Land Preparation',
          duration: isTe ? '5-7 రోజులు' : isHi ? '5-7 दिन' : isTa ? '5-7 நாட்கள்' : isKn ? '5-7 ದಿನಗಳು' : '5-7 days'
        },
        actionableSteps: isTe ? [
          'రోటవేటర్ లేదా నాగలితో మొదటి దుక్కి దున్నండి',
          'లేజర్ ల్యాండ్ లెవెలర్ తో నేలను సమాంతరంగా చదును చేయండి',
          'మట్టిని వదులుగా చేసి కలుపు మొక్కల వేర్లను తొలగించండి'
        ] : isHi ? [
          'रोटावेटर या कल्टीवेटर से पहली गहरी जुताई करें',
          'लेजर लैंड लेवलर से खेत को समतल करें',
          'मिट्टी को भुरभुरा बनाएं और खरपतवार निकालें'
        ] : isTa ? [
          'ரோட்டவேட்டர் அல்லது கலப்பை கொண்டு முதல் உழவு செய்யவும்',
          'லேசர் நில சமன்படுத்தி மூலம் நிலத்தை சமன் செய்யவும்',
          'மண்ணை மென்மையாக்கி களைகளை அகற்றவும்'
        ] : isKn ? [
          'ರೋಟಾವೇಟರ್ ಅಥವಾ ನೇಗಿಲಿನಿಂದ ಮೊದಲ ಉಳುಮೆ ಮಾಡಿ',
          'ಲೇಸರ್ ಲ್ಯಾಂಡ್ ಲೆವೆಲರ್ ನಿಂದ ಹೊಲವನ್ನು ಸಮತಟ್ಟು ಮಾಡಿ',
          'ಮಣ್ಣನ್ನು ಸಡಿಲಗೊಳಿಸಿ ಕಳೆಗಳನ್ನು ತೆಗೆಯಿರಿ'
        ] : [
          `Perform primary deep ploughing with Rotavator or Disc Plough`,
          `Level the field using Laser Land Leveller for uniform irrigation`,
          `Pulverize soil clods to create a fine tilth and clear residual weed roots`
        ],
        translatedEquipment: equipment.map(eq => ({
          whyNeeded: isTe ? `నేల తయారీ మరియు దుక్కి కొరకు ${eq.equipmentName} అవసరం` : isHi ? `भूमि की जुताई और तैयारी के लिए ${eq.equipmentName} आवश्यक` : isTa ? `நில தயாரிப்புக்கு ${eq.equipmentName} தேவை` : isKn ? `ಭೂಮಿ ಸಿದ್ಧತೆಗೆ ${eq.equipmentName} ಅಗತ್ಯ` : `Essential for seedbed aeration and fine tilth.`,
          whatItDoes: isTe ? 'మట్టిని సులభంగా చదును చేసి విత్తనాలకు అనుకూలంగా చేస్తుంది' : isHi ? 'मिट्टी को बारीक और समतल बनाता है' : isTa ? 'மண்ணை உழுது சமப்படுத்துகிறது' : isKn ? 'ಮಣ್ಣನ್ನು ಸಡಿಲಗೊಳಿಸಿ ಸಮತಟ್ಟು ಮಾಡುತ್ತದೆ' : `Pulverizes soil clods and mixes organic matter efficiently.`,
          whenToUse: isTe ? 'విత్తనాలు వేసే 3-5 రోజుల ముందు' : isHi ? 'बुआई से 3-5 दिन पहले' : isTa ? 'விதைப்பதற்கு 3-5 நாட்களுக்கு முன்' : isKn ? 'ಬಿತ್ತನೆಗೆ 3-5 ದಿನಗಳ ಮೊದಲು' : `3-5 days before sowing during dry soil condition.`,
          basicUsage: isTe ? 'ట్రాక్టర్ ను తగిన వేగంతో నడపండి' : isHi ? 'ट्रैक्टर को मध्यम गति पर चलाएं' : isTa ? 'டிராக்டரை மிதமான வேகத்தில் இயக்கவும்' : isKn ? 'ಟ್ರಾಕ್ಟರ್ ಅನ್ನು ಮಿತ ವೇಗದಲ್ಲಿ ಚಲಾಯಿಸಿ' : `Operate at 1800-2000 RPM PTO for uniform soil pulverization.`
        })),
        warnings: isTe ? ['నేలలో ఎక్కువ తేమ ఉన్నప్పుడు రోటవేటర్ వాడకండి'] : isHi ? ['गीली मिट्टी में रोटावेटर न चलाएं'] : isTa ? ['அதிக ஈரப்பதமுள்ள மண்ணில் உழவு செய்யாதீர்கள்'] : isKn ? ['ಅತಿಯಾದ ತೇವಾಂಶವಿದ್ದಾಗ ಉಳುಮೆ ಮಾಡಬೇಡಿ'] : ['Do not operate rotavator in waterlogged soil to avoid subsoil compaction'],
        nextSteps: isTe ? ['దుక్కి పూర్తయిన తర్వాత సేంద్రీయ ఎరువులు వేయండి'] : isHi ? ['जुताई के बाद जैविक खाद डालें'] : isTa ? ['உழவுக்குப் பின் இயற்கை உரம் இடவும்'] : isKn ? ['ಉಳುಮೆಯ ನಂತರ ಸಾವಯವ ಗೊಬ್ಬರ ಹಾಕಿ'] : ['Apply well-decomposed manure before final levelling'],
        explanation: isTe ? `${crop} పంటకు అనువైన భూమి తయారీకి రోటవేటర్ మరియు ల్యాండ్ లెవెలర్ ఉత్తమమైనవి. ఇవి విత్తనం మొలకెత్తడానికి మంచి నేల పదును అందిస్తాయి.` :
                     isHi ? `${crop} के लिए भूमि तैयारी में रोटावेटर और लैंड लेवलर सबसे प्रभावी हैं। यह बीज अंकुरण के लिए उपयुक्त मिट्टी तैयार करता है।` :
                     isTa ? `${crop} பயிருக்கு நில தயாரிப்பில் ரோட்டவேட்டர் மற்றும் லெவலர் சிறந்தவை. இது விதை முளைப்புக்கு உகந்தது.` :
                     isKn ? `${crop} ಬೆಳೆಯ ಭೂಮಿ ಸಿದ್ಧತೆಗೆ ರೋಟಾವೇಟರ್ ಮತ್ತು ಲೆವೆಲರ್ ಅತ್ಯುತ್ತಮ. ಇದು ಬೀಜ ಮೊಳಕೆಯೊಡೆಯಲು ಸಹಕಾರಿ.` :
                     `For ${crop} on ${acreage} acres, proper seedbed preparation with a Rotavator or Leveller ensures optimal root depth and weed eradication.`
      };
    }

    if (q.includes('flower') || q.includes('bloom') || q.includes('spray') || q.includes('pest')) {
      return {
        farmSummary: isTe ? `${crop} పూత దశలో తీసుకోవాల్సిన జాగ్రత్తలు & సలహాలు` :
                     isHi ? `${crop} फूल आने के चरण में आवश्यक देखभाल एवं स्प्रे` :
                     isTa ? `${crop} பூக்கும் பருவத்தில் தேவையான பராமரிப்பு & தெளிப்பான்` :
                     isKn ? `${crop} ಹೂಬಿಡುವ ಹಂತದಲ್ಲಿ ಅಗತ್ಯ ಕಾಳಜಿ ಮತ್ತು ಸಿಂಪಡಣೆ` :
                     `Flowering Stage Care & Protection Guide for ${crop}`,
        translatedCropPlan: {
          crop,
          stage: isTe ? 'పూత దశ' : isHi ? 'फूल आने की अवस्था' : isTa ? 'பூக்கும் நிலை' : isKn ? 'ಹೂಬಿಡುವ ಹಂತ' : 'Flowering Stage',
          duration: isTe ? '15-20 రోజులు' : isHi ? '15-20 दिन' : isTa ? '15-20 நாட்கள்' : isKn ? '15-20 ದಿನಗಳು' : '15-20 days'
        },
        actionableSteps: isTe ? [
          'పూత రాలకుండా తేలికపాటి నీటి తడులు అందించండి',
          'బూమ్ స్ప్రేయర్ లేదా నాప్‌సాక్ స్ప్రేయర్ తో సూక్ష్మ పోషకాలు పిచికారీ చేయండి',
          'పురుగుల ఉధృతిని ఉదయం లేదా సాయంత్రం వేళల్లో గమనించండి'
        ] : isHi ? [
          'फूल झड़ने से रोकने के लिए हल्की सिंचाई करें',
          'बूम स्प्रेयर से सूक्ष्म पोषक तत्व और सुरक्षात्मक कीटनाशक का छिड़काव करें',
          'सुबह या शाम को कीटों की निगरानी करें'
        ] : isTa ? [
          'பூ உதிர்வதை தடுக்க மிதமான நீர்ப்பாசனம் செய்யவும்',
          'பூம் ஸ்ப்ரேயர் மூலம் நுண்ணூட்டச்சத்துக்களை தெளிக்கவும்',
          'பூச்சிகளின் தாக்குதலை கண்காணிக்கவும்'
        ] : isKn ? [
          'ಹೂವು ಉದುರುವುದನ್ನು ತಡೆಯಲು ಲಘು ನೀರಾವರಿ ಒದಗಿಸಿ',
          'ಬೂಮ್ ಸ್ಪ್ರೇಯರ್ ನಿಂದ ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶಗಳನ್ನು ಸಿಂಪಡಿಸಿ',
          'ಕೀಟಗಳ ಬಾಧೆಯನ್ನು ಗಮನಿಸಿ'
        ] : [
          `Maintain consistent, light soil moisture; prevent water stress or waterlogging`,
          `Apply recommended micronutrients/boron using Tractor Boom Sprayer during early morning`,
          `Scout twice weekly for sucking pests and flower-eating caterpillars`
        ],
        translatedEquipment: equipment.map(eq => ({
          whyNeeded: isTe ? `పురుగు మందులు మరియు పోషకాలు సమానంగా పిచికారీ చేయడానికి ${eq.equipmentName} అనుకూలం` : isHi ? `पोषक तत्वों और कीटनाशक के छिड़काव के लिए ${eq.equipmentName} उपयोगी` : isTa ? `பூச்சி மருந்து தெளிக்க ${eq.equipmentName} ஏற்றது` : isKn ? `ಔಷಧ ಸಿಂಪಡಣೆಗೆ ${eq.equipmentName} ಸೂಕ್ತ` : `Enables uniform droplet coverage across flower canopy without blossom damage.`,
          whatItDoes: isTe ? 'పైరు మొత్తం మీద సమానంగా మందును పిచికారీ చేస్తుంది' : isHi ? 'फसल पर समान रूप से स्प्रे करता है' : isTa ? 'பயிர் முழுவதும் சீராக தெளிக்கிறது' : isKn ? 'ಬೆಳೆಯ ಮೇಲೆ ಸಮಾನವಾಗಿ ಸಿಂಪಡಿಸುತ್ತದೆ' : `Disperses uniform mist over the crop canopy.`,
          whenToUse: isTe ? 'ఉదయం 7-10 గంటల మధ్య లేదా సాయంత్రం' : isHi ? 'सुबह 7-10 बजे या शाम को' : isTa ? 'காலை 7-10 மணி அல்லது மாலையில்' : isKn ? 'ಬೆಳಿಗ್ಗೆ 7-10 ಗಂಟೆ ಅಥವಾ ಸಂಜೆ' : `Early morning (7-10 AM) or late afternoon during low wind.`,
          basicUsage: isTe ? 'నాజిల్స్ శుభ్రంగా ఉండేలా చూసుకోండి' : isHi ? 'नोजल साफ रखें और उचित दबाव बनाए रखें' : isTa ? 'நாசில்களை சுத்தமாக வைத்துக்கொள்ளவும்' : isKn ? 'ನಾಸಲ್ ಗಳನ್ನು ಸ್ವಚ್ಛವಾಗಿಡಿ' : `Maintain recommended pressure (30-40 PSI) with clean nozzles.`
        })),
        warnings: isTe ? ['తీవ్రమైన ఎండ సమయంలో లేదా మధ్యాహ్నం పిచికారీ చేయవద్దు (పరాగ సంపర్క కీటకాలు దెబ్బతింటాయి)'] : isHi ? ['तेज धूप में स्प्रे न करें, इससे मधुमक्खियों को नुकसान हो सकता है'] : isTa ? ['மதிய வெயிலில் மருந்து தெளிக்காதீர்கள்'] : isKn ? ['ಮಧ್ಯಾಹ್ನದ ಬಿಸಿಲಿನಲ್ಲಿ ಔಷಧ ಸಿಂಪಡಿಸಬೇಡಿ'] : ['Do not spray during midday peak heat to avoid harming pollinator bees'],
        nextSteps: isTe ? ['కాయ/గింజ అభివృద్ధి దశకు నీటి యాజమాన్యం సిద్ధం చేసుకోండి'] : isHi ? ['फल/दाने बनने की अवस्था के लिए पानी का प्रबंधन करें'] : isTa ? ['காய் பிடிக்கும் நிலைக்கு நீர்ப்பாசனத்தை திட்டமிடுங்கள்'] : isKn ? ['ಕಾಯಿ ಕಟ್ಟುವ ಹಂತಕ್ಕೆ ನೀರಾವರಿ ಯೋಜಿಸಿ'] : ['Plan for fruit/grain development fertigation in 10 days'],
        explanation: isTe ? `${crop} పూత దశ అత్యంత సున్నితమైనది. ఈ సమయంలో నీటి ఎద్దడి లేకుండా చూసుకోవడం మరియు బూమ్ స్ప్రేయర్ ద్వారా సమయానికి పోషకాలు అందించడం అధిక దిగుబడిని ఇస్తుంది.` :
                     isHi ? `${crop} में फूल आने का समय बहुत संवेदनशील होता है। उचित सिंचाई और बूम स्प्रेयर से पोषक तत्वों का छिड़काव अच्छी उपज सुनिश्चित करता है।` :
                     isTa ? `${crop} பூக்கும் பருவம் மிக முக்கியமானது. சரியான நீர்ப்பாசனம் மற்றும் ஸ்ப்ரேயர் மூலம் சத்துக்கள் தெளிப்பது மகசூலை பெருக்கும்.` :
                     isKn ? `${crop} ಹೂಬಿಡುವ ಹಂತ ಅತ್ಯಂತ ಸೂಕ್ಷ್ಮ. ಸಮರ್ಪಕ ನೀರಾವರಿ ಮತ್ತು ಸ್ಪ್ರೇಯರ್ ನಿಂದ ಪೋಷಕಾಂಶ ಸಿಂಪಡಣೆ ಅಧಿಕ ಇಳುವರಿ ನೀಡುತ್ತದೆ.` :
                     `Flowering in ${crop} requires strict moisture balance and gentle foliar spraying to prevent flower drop and ensure high fruit-setting percentage.`
      };
    }

    if (q.includes('budget') || q.includes('cheap') || q.includes('cost') || q.includes('priorit') || q.includes('money') || q.includes('limit')) {
      return {
        farmSummary: isTe ? `పరిమిత బడ్జెట్ లో ప్రాధాన్యతలు & ఖర్చు ఆదా చేసే పద్ధతులు` :
                     isHi ? `सीमित बजट में प्राथमिक कार्य एवं लागत बचत के उपाय` :
                     isTa ? `குறைந்த பட்ஜெட்டில் முன்னுரிமை பணிகள் & செலவு குறைப்பு வழிகள்` :
                     isKn ? `ಕಡಿಮೆ ಬಜೆಟ್ ನಲ್ಲಿ ಆದ್ಯತೆಯ ಕೆಲಸಗಳು ಮತ್ತು ವೆಚ್ಚ ಉಳಿತಾಯ` :
                     `Budget-Smart Farming Strategy & Cost Priority for ${crop}`,
        translatedCropPlan: {
          crop,
          stage,
          duration: isTe ? 'మొత్తం సీజన్' : isHi ? 'पूरा मौसम' : isTa ? 'முழு பருவம்' : isKn ? 'ಸಂಪೂರ್ಣ ಋತು' : 'Full Season'
        },
        actionableSteps: isTe ? [
          'అత్యంత కీలకమైన పనులకు మాత్రమే యంత్రాలు అద్దెకు తీసుకోండి (ఉదా: దుక్కి & నీటి పంప్)',
          'పొరుగు రైతులతో కలిసి యంత్రాల అద్దె సమయాన్ని పంచుకోండి',
          'తక్కువ రోజువారీ అద్దె గల ఇంప్లిమెంట్స్ ఎంచుకోండి (రూ. 400-800/రోజు)'
        ] : isHi ? [
          'केवल अति आवश्यक कार्यों के लिए उपकरण किराए पर लें (जैसे जुताई व पानी का पंप)',
          'आसपास के किसानों के साथ मिलकर उपकरण का किराया साझा करें',
          'कम दैनिक किराये वाले उपकरण चुनें (₹400-800/दिन)'
        ] : isTa ? [
          'முக்கிய வேலைகளுக்கு மட்டும் வாடகை இயந்திரங்களை பயன்படுத்தவும்',
          'அருகிலுள்ள விவசாயிகளுடன் வாடகையை பகிர்ந்து கொள்ளவும்',
          'குறைந்த வாடகை கருவிகளை தேர்வு செய்யவும் (₹400-800/நாள்)'
        ] : isKn ? [
          'ಮುಖ್ಯ ಕೆಲಸಗಳಿಗೆ ಮಾತ್ರ ಯಂತ್ರಗಳನ್ನು ಬಾಡಿಗೆಗೆ ಪಡೆಯಿರಿ',
          'ನೆರೆಹೊರೆಯ ರೈತರೊಂದಿಗೆ ಬಾಡಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ',
          'ಕಡಿಮೆ ಬಾಡಿಗೆಯ ಉಪಕರಣಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ (₹400-800/ದಿನ)'
        ] : [
          `Prioritize high-ROI operations: precise land tilling and timely water pumping`,
          `Group bookings with neighboring plots to split transportation and daily rental overheads`,
          `Select cost-effective implements (₹400 - ₹800/day) rather than owning expensive machinery`
        ],
        translatedEquipment: equipment.map(eq => ({
          whyNeeded: isTe ? `బడ్జెట్ కి అనుకూలమైన అద్దె ఖర్చు (రూ. ${eq.pricePerDay}/రోజు)` : isHi ? `किफायती दैनिक किराया (₹${eq.pricePerDay}/दिन)` : isTa ? `சிக்கனமான வாடகை (₹${eq.pricePerDay}/நாள்)` : isKn ? `ಕೈಗೆಟುಕುವ ಬಾಡಿಗೆ (₹${eq.pricePerDay}/ದಿನ)` : `Affordable rental rate (₹${eq.pricePerDay}/day) that fits within your budget.`,
          whatItDoes: isTe ? 'తక్కువ ఖర్చుతో పనిని వేగవంతం చేస్తుంది' : isHi ? 'कम खर्च में काम तेजी से पूरा करता है' : isTa ? 'குறைந்த செலவில் வேலையை முடிக்கிறது' : isKn ? 'ಕಡಿಮೆ ವೆಚ್ಚದಲ್ಲಿ ಕೆಲಸ ಪೂರ್ಣಗೊಳಿಸುತ್ತದೆ' : `Delivers mechanized productivity at minimal daily rental expense.`,
          whenToUse: isTe ? 'పని ఉన్న రోజు మాత్రమే బుక్ చేసుకోండి' : isHi ? 'केवल कार्य के दिन बुक करें' : isTa ? 'தேவையான நாளில் மட்டும் வாடகைக்கு எடுக்கவும்' : isKn ? 'ಅಗತ್ಯವಿದ್ದ ದಿನ ಮಾತ್ರ ಬುಕ್ ಮಾಡಿ' : `Rent on specific operational days only.`,
          basicUsage: isTe ? 'సమయాన్ని సద్వినియోగం చేసుకోండి' : isHi ? 'किराये की अवधि का अधिकतम उपयोग करें' : isTa ? 'நேரத்தை சரியாக பயன்படுத்தவும்' : isKn ? 'ಸಮಯವನ್ನು ಸದುಪಯೋಗಪಡಿಸಿಕೊಳ್ಳಿ' : `Prepare the field before machine arrival to maximize rented hours.`
        })),
        warnings: isTe ? ['నాణ్యమైన విత్తనాలు లేదా సకాలంలో కలుపు తీత విషయంలో రాజీ పడవద్దు (తరువాత ఖర్చు రెట్టింపు అవుతుంది)'] : isHi ? ['बीज की गुणवत्ता या खरपतवार नियंत्रण में समझौता न करें'] : isTa ? ['விதை தரம் மற்றும் களை எடுப்பதில் சமரசம் செய்யாதீர்கள்'] : isKn ? ['ಬೀಜದ ಗುಣಮಟ್ಟ ಮತ್ತು ಕಳೆ ತೆಗೆಯುವಲ್ಲಿ ರಾಜಿ ಮಾಡಿಕೊಳ್ಳಬೇಡಿ'] : ['Never compromise on certified seed quality or early weed control'],
        nextSteps: isTe ? ['హోమ్ స్క్రీన్ లో ఖర్చుల వివరాలను నిరంతరం గమనించండి'] : isHi ? ['होम स्क्रीन पर खर्च रिपोर्ट की जांच करें'] : isTa ? ['முகப்பு திரையில் செலவு அறிக்கையை பார்க்கவும்'] : isKn ? ['ಖರ್ಚುಗಳ ವರದಿಯನ್ನು ಗಮನಿಸಿ'] : ['Track live spending under Farmer Home analytics'],
        explanation: isTe ? `మీ బడ్జెట్ పరిమితంగా ఉన్నప్పుడు, వాటర్ పంప్ (రూ. 400/రోజు) మరియు రోటవేటర్ (రూ. 800/రోజు) వంటి తక్కువ ఖర్చు గల పరికరాలను ప్రాధాన్యత ప్రకారం వాడటం ద్వారా 40% వరకు ఖర్చు తగ్గించుకోవచ్చు.` :
                     isHi ? `सीमित बजट में वाटर पंप (₹400/दिन) और रोटावेटर (₹800/दिन) जैसे आवश्यक उपकरण किराए पर लेकर आप लागत में 40% तक बचत कर सकते हैं।` :
                     isTa ? `குறைந்த பட்ஜெட்டில் நீர் பம்ப் மற்றும் ரோட்டவேட்டர் போன்ற கருவிகளை வாடகைக்கு எடுத்து 40% வரை செலவை மிச்சப்படுத்தலாம்.` :
                     isKn ? `ಕಡಿಮೆ ಬಜೆಟ್ ನಲ್ಲಿ ವಾಟರ್ ಪಂಪ್ ಮತ್ತು ರೋಟಾವೇಟರ್ ನಂತಹ ಉಪಕರಣಗಳನ್ನು ಬಾಡಿಗೆಗೆ ಪಡೆದು 40% ವೆಚ್ಚ ಉಳಿಸಬಹುದು.` :
                     `With limited budget, prioritize essential rental tools like Water Pumps (₹400/day) and Rotavators (₹800/day) over high-cost capital purchases.`
      };
    }

    if (q.includes('irrigat') || q.includes('water') || q.includes('pump') || q.includes('moist') || q.includes('dry')) {
      return {
        farmSummary: isTe ? `${crop} నీటి యాజమాన్యం మరియు పంపింగ్ సలహాలు` :
                     isHi ? `${crop} सिंचाई प्रबंधन एवं पंप उपयोग दिशा-निर्देश` :
                     isTa ? `${crop} நீர்ப்பாசன மேலாண்மை & பம்ப் பயன்பாட்டு வழிகாட்டி` :
                     isKn ? `${crop} ನೀರಾವರಿ ನಿರ್ವಹಣೆ ಮತ್ತು ಪಂಪ್ ಬಳಕೆ ಸಲಹೆಗಳು` :
                     `Irrigation Management & Water Guidance for ${crop}`,
        translatedCropPlan: {
          crop,
          stage,
          duration: isTe ? '3-5 రోజులు' : isHi ? '3-5 दिन' : isTa ? '3-5 நாட்கள்' : isKn ? '3-5 ದಿನಗಳು' : '3-5 days'
        },
        actionableSteps: isTe ? [
          'వాటర్ పంప్ సహాయంతో సకాలంలో నీటి తడులు అందించండి',
          'నీరు నిలవకుండా మురుగు కాలువలు శుభ్రం చేయండి',
          'నేలలో తగినంత తేమ ఉండేలా డ్రిప్ లేదా స్ప్రింక్లర్ పద్ధతి అనుసరించండి'
        ] : isHi ? [
          'वाटर पंप की सहायता से समय पर सिंचाई करें',
          'खेत में जलभराव न होने दें, जल निकासी नाली साफ रखें',
          'उचित नमी बनाए रखने के लिए स्प्रिंकलर या ड्रिप का उपयोग करें'
        ] : isTa ? [
          'வாட்டர் பம்ப் கொண்டு சரியான நேரத்தில் பாசனம் செய்யவும்',
          'நீர் தேங்காமல் வடிகால் வசதியை உறுதி செய்யவும்',
          'சொட்டு நீர் அல்லது தெளிப்பு பாசனம் பயன்படுத்தவும்'
        ] : isKn ? [
          'ವಾಟರ್ ಪಂಪ್ ನಿಂದ ಸಕಾಲಿಕ ನೀರಾವರಿ ಮಾಡಿ',
          'ನೀರು ನಿಲ್ಲದಂತೆ ಚರಂಡಿಗಳನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಿ',
          'ಹನಿ ನೀರಾವರಿ ಅಥವಾ ತುಂತುರು ನೀರಾವರಿ ಬಳಸಿ'
        ] : [
          `Supply timely irrigation using 5HP Water Pump to maintain optimum root-zone moisture`,
          `Ensure drainage furrows are clear to avoid stagnant waterlogging`,
          `Adopt drip or sprinkler systems during critical vegetative/flowering windows`
        ],
        translatedEquipment: equipment.map(eq => ({
          whyNeeded: isTe ? `సకాలంలో నీరు అందించడానికి ${eq.equipmentName} ముఖ్యం` : isHi ? `सिंचाई के लिए ${eq.equipmentName} अत्यंत आवश्यक` : isTa ? `பாசனத்திற்கு ${eq.equipmentName} அவசியம்` : isKn ? `ನೀರಾವರಿಗೆ ${eq.equipmentName} ಅತ್ಯಗತ್ಯ` : `Provides reliable water delivery to prevent drought stress.`,
          whatItDoes: isTe ? 'బోరుబావి లేదా కాలువ నుండి నీటిని పొలానికి పంపుతుంది' : isHi ? 'बोरवेल या नहर से पानी खेत तक पहुंचाता है' : isTa ? 'கிணறு அல்லது கால்வாயில் இருந்து நீர் பாய்ச்சுகிறது' : isKn ? 'ಬೋರ್ ವೆಲ್ ಅಥವಾ ಕಾಲುವೆಯಿಂದ ನೀರನ್ನು ಹೊಲಕ್ಕೆ ಹರಿಸುತ್ತದೆ' : `Pumps water from borewell/canal with high fuel efficiency.`,
          whenToUse: isTe ? 'నేల పైపొర ఆరిపోయిన వెంటనే' : isHi ? 'मिट्टी की ऊपरी परत सूखने पर' : isTa ? 'மண் காய்ந்தவுடன்' : isKn ? 'ಮಣ್ಣು ಒಣಗಿದ ತಕ್ಷಣ' : `When top 2 inches of soil feel dry to touch.`,
          basicUsage: isTe ? 'ఇంధనం మరియు ఆయిల్ స్థాయి సరిచూసుకోండి' : isHi ? 'ईंधन और इंजन ऑयल की जांच करें' : isTa ? 'எரிபொருள் மற்றும் ஆயில் அளவை சரிபார்க்கவும்' : isKn ? 'ಇಂಧನ ಮಟ್ಟವನ್ನು ಪರೀಕ್ಷಿಸಿ' : `Check fuel/oil levels and secure suction hose before starting.`
        })),
        warnings: isTe ? ['ఎక్కువగా నీరు పెట్టడం వల్ల వేరుకుళ్లు తెగులు వస్తుంది, తగినంత మాత్రమే నీరు ఇవ్వండి'] : isHi ? ['अत्यधिक पानी से जड़ गलन रोग हो सकता है, सीमित सिंचाई करें'] : isTa ? ['அதிக நீர் வேரழுகல் நோயை உண்டாக்கும், மிதமான பாசனம் தேவை'] : isKn ? ['ಅತಿಯಾದ ನೀರು ಬೇರು ಕೊಳೆ ರೋಗ ತರಬಹುದು'] : ['Avoid water stagnation which causes root rot and anaerobic conditions'],
        nextSteps: isTe ? ['నీరు పెట్టిన 2 రోజుల తర్వాత కలుపు నివారణ చర్యలు చేపట్టండి'] : isHi ? ['सिंचाई के 2 दिन बाद निराई-गुड़ाई करें'] : isTa ? ['பாசனத்திற்கு பின் களை எடுக்கவும்'] : isKn ? ['ನೀರಾವರಿಯ ನಂತರ ಕಳೆ ತೆಗೆಯಿರಿ'] : ['Check moisture level 48 hours post-irrigation'],
        explanation: isTe ? `${crop} పంటకు ఈ దశలో నీరు అందించడం అత్యంత అవసరం. తగిన తేమ ఉంటేనే మొక్క పోషకాలను వేర్ల ద్వారా గ్రహించి ఏపుగా ఎదుగుతుంది.` :
                     isHi ? `${crop} में इस चरण पर सिंचाई बहुत जरूरी है। पर्याप्त नमी से पौधे पोषक तत्व ग्रहण करते हैं और स्वस्थ वृद्धि होती है।` :
                     isTa ? `${crop} பயிருக்கு இந்த பருவத்தில் பாசனம் மிகவும் அவசியம். இது பயிர் சீராக வளர உதவும்.` :
                     isKn ? `${crop} ಬೆಳೆಗೆ ಈ ಹಂತದಲ್ಲಿ ನೀರಾವರಿ ಬಹಳ ಮುಖ್ಯ. ಸರಿಯಾದ ತೇವಾಂಶವು ಬೆಳವಣಿಗೆಗೆ ಸಹಕಾರಿ.` :
                     `Timely irrigation for ${crop} sustains transpiration and nutrient uptake, preventing permanent wilting and yield loss.`
      };
    }

    if (q.includes('precaution') || q.includes('safe') || q.includes('care') || q.includes('risk') || q.includes('rain')) {
      return {
        farmSummary: isTe ? `${crop} రక్షణ చర్యలు మరియు జాగ్రత్తలు` :
                     isHi ? `${crop} सुरक्षा सावधानियां एवं निवारक उपाय` :
                     isTa ? `${crop} பாதுகாப்பு முன்னெச்சரிக்கைகள்` :
                     isKn ? `${crop} ಮುನ್ನೆಚ್ಚರಿಕೆ ಕ್ರಮಗಳು ಮತ್ತು ರಕ್ಷಣೆ` :
                     `Farm Safety & Preventative Precautions for ${crop}`,
        translatedCropPlan: {
          crop,
          stage,
          duration: isTe ? 'వారపు తనిఖీ' : isHi ? 'साप्ताहिक निगरानी' : isTa ? 'வாராந்திர ஆய்வு' : isKn ? 'ವಾರದ ಪರಿಶೀಲನೆ' : 'Weekly Routine'
        },
        actionableSteps: isTe ? [
          'వాతావరణ నివేదికను గమనించి వర్షం పడే ముందు మందుల పిచికారీ ఆపండి',
          'మందులు పిచికారీ చేసేటప్పుడు మాస్క్ మరియు చేతి తొడుగులు తప్పక ధరించండి',
          'ట్రాక్టర్ మరియు పరికరాల నట్లు, బోల్టులు సరిచూసుకోండి'
        ] : isHi ? [
          'मौसम का पूर्वानुमान देखकर बारिश से पहले छिड़काव से बचें',
          'स्प्रे करते समय मास्क और दस्ताने का प्रयोग अनिवार्य रूप से करें',
          'ट्रैक्टर और औजारों के नट-बोल्ट की जांच करें'
        ] : isTa ? [
          'வானிலை அறிந்து மழைக்கு முன் மருந்து தெளிப்பதை தவிர்க்கவும்',
          'மருந்து தெளிக்கும் போது முகக்கவசம் அணியவும்',
          'டிராக்டர் பாகங்களை பரிசோதிக்கவும்'
        ] : isKn ? [
          'ಹವಾಮಾನ ವರದಿ ಗಮನಿಸಿ ಮಳೆ ಬರುವ ಮುನ್ನ ಔಷಧ ಸಿಂಪಡಿಸಬೇಡಿ',
          'ಔಷಧ ಸಿಂಪಡಿಸುವಾಗ ಮಾಸ್ಕ್ ಮತ್ತು ಕೈಗವಸು ಧರಿಸಿ',
          'ಟ್ರಾಕ್ಟರ್ ಭಾಗಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ'
        ] : [
          `Check 48-hour local weather forecast before chemical application or harvesting`,
          `Wear protective PPE (mask, gloves, eyewear) when handling agrochemicals`,
          `Inspect machinery hitch points and hydraulic lines before entering field`
        ],
        translatedEquipment: equipment.map(eq => ({
          whyNeeded: isTe ? `సురక్షితంగా పని పూర్తి చేయడానికి ${eq.equipmentName} అవసరం` : isHi ? `सुरक्षित कार्य के लिए ${eq.equipmentName} उपयोगी` : isTa ? `பாதுகாப்பான வேலைக்கு ${eq.equipmentName} தேவை` : isKn ? `ಸುರಕ್ಷಿತ ಕೆಲಸಕ್ಕೆ ${eq.equipmentName} ಅಗತ್ಯ` : `Maintained machinery ensures safe and breakdown-free operations.`,
          whatItDoes: isTe ? 'పనిలో ప్రమాదాలు జరగకుండా కాపాడుతుంది' : isHi ? 'कार्य में सुरक्षा सुनिश्चित करता है' : isTa ? 'பாதுகாப்பாக வேலை செய்ய உதவுகிறது' : isKn ? 'ಸುರಕ್ಷಿತವಾಗಿ ಕೆಲಸ ನಿರ್ವಹಿಸುತ್ತದೆ' : `Ensures controlled and safe field operations.`,
          whenToUse: isTe ? 'పని ప్రారంభించే ముందు' : isHi ? 'काम शुरू करने से पहले' : isTa ? 'வேலை தொடங்கும் முன்' : isKn ? 'ಕೆಲಸ ಪ್ರಾರಂಭಿಸುವ ಮುನ್ನ' : `Prior to field entry during dry daytime.`,
          basicUsage: isTe ? 'సురక్షిత పద్ధతులు పాటించండి' : isHi ? 'सुरक्षा नियमों का पालन करें' : isTa ? 'பாதுகாப்பு விதிகளை பின்பற்றவும்' : isKn ? 'ಸುರಕ್ಷತಾ ನಿಯಮಗಳನ್ನು ಪಾಲಿಸಿ' : `Ensure all safety guards and PTO shields are locked.`
        })),
        warnings: isTe ? ['గాలి వేగం ఎక్కువగా ఉన్నప్పుడు ఎరువులు లేదా మందులు పిచికారీ చేయవద్దు'] : isHi ? ['तेज हवा में कीटनाशक का छिड़काव न करें'] : isTa ? ['அதிவேக காற்றில் மருந்து தெளிக்காதீர்கள்'] : isKn ? ['ಜೋರಾಗಿ ಗಾಳಿ ಬೀಸುವಾಗ ಔಷಧ ಸಿಂಪಡಿಸಬೇಡಿ'] : ['Do not spray chemicals during windy conditions exceeding 15 km/h'],
        nextSteps: isTe ? ['పని ముగిసిన తర్వాత పరికరాలను శుభ్రం చేయండి'] : isHi ? ['काम पूरा होने पर औजारों को धोकर रखें'] : isTa ? ['வேலை முடிந்ததும் கருவிகளை கழுவி வைக்கவும்'] : isKn ? ['ಕೆಲಸ ಮುಗಿದ ನಂತರ ಉಪಕರಣಗಳನ್ನು ತೊಳೆಯಿರಿ'] : ['Wash all equipment thoroughly after chemical application'],
        explanation: isTe ? `${crop} సాగులో భద్రతా జాగ్రత్తలు పాటించడం వల్ల పంట నష్టం మరియు ఖర్చులు తగ్గుతాయి. వాతావరణ ఆధారిత నిర్ణయాలు తీసుకోవడం శ్రేయస్కరం.` :
                     isHi ? `${crop} की खेती में सुरक्षा नियमों का पालन फसल क्षति से बचाता है। मौसम पूर्वानुमान के अनुसार ही काम करें।` :
                     isTa ? `${crop} சாகுபடியில் முன்னெச்சரிக்கை நடவடிக்கைகள் பயிர் இழப்பை தவிர்க்கும்.` :
                     isKn ? `${crop} ಕೃಷಿಯಲ್ಲಿ ಮುನ್ನೆಚ್ಚರಿಕೆ ಕ್ರಮಗಳು ಬೆಳೆ ನಷ್ಟವನ್ನು ತಪ್ಪಿಸುತ್ತವೆ.` :
                     `Following agronomic precautions for ${crop} mitigates weather damage, drift loss, and chemical poisoning risks.`
      };
    }

    // Default: "What should I do today?" / general today
    return {
      farmSummary: isTe ? `${crop} పైరు కొరకు నేటి వ్యవసాయ ప్రణాళిక (${acreage} ఎకరాలు)` :
                   isHi ? `${crop} फसल के लिए आज की कृषि कार्य योजना (${acreage} एकड़)` :
                   isTa ? `${crop} பயிருக்கான இன்றைய உழவுத் திட்டம் (${acreage} ஏக்கர்)` :
                   isKn ? `${crop} ಬೆಳೆಗೆ ಇಂದಿನ ಕೃಷಿ ಯೋಜನೆ (${acreage} ಎಕರೆ)` :
                   `Today's Field Action Plan for ${crop} (${acreage} acres, Stage: ${stage})`,
      translatedCropPlan: {
        crop,
        stage: isTe ? `${stage} దశ` : isHi ? `${stage} चरण` : isTa ? `${stage} நிலை` : isKn ? `${stage} ಹಂತ` : stage,
        duration: isTe ? 'నేటి పనులు' : isHi ? 'आज के कार्य' : isTa ? 'இன்றைய பணிகள்' : isKn ? 'ಇಂದಿನ ಕೆಲಸಗಳು' : 'Today'
      },
      actionableSteps: isTe ? [
        `పొలంలో మట్టి తేమ మరియు ${crop} మొక్కల ఎదుగుదల తనిఖీ చేయండి`,
        'కలుపు మొక్కలు లేదా పురుగుల దాడి ఉందేమో పరిశీలించండి',
        'అవసరమైన పరికరాలను ఆగ్రోరెంట్ ద్వారా సిద్ధం చేసుకోండి'
      ] : isHi ? [
        `खेत में मिट्टी की नमी और ${crop} पौधों की वृद्धि की जांच करें`,
        'खरपतवार और कीटों के प्रकोप का निरीक्षण करें',
        'आवश्यक कृषि उपकरण तैयार रखें'
      ] : isTa ? [
        `வயலில் மண் ஈரப்பதம் மற்றும் ${crop} பயிர் வளர்ச்சியை சரிபார்க்கவும்`,
        'களைகள் மற்றும் பூச்சிகள் உள்ளதா என கண்காணிக்கவும்',
        'தேவையான கருவிகளை தயார் செய்யவும்'
      ] : isKn ? [
        `ಹೊಲದಲ್ಲಿ ಮಣ್ಣಿನ ತೇವಾಂಶ ಮತ್ತು ${crop} ಬೆಳೆಯ ಬೆಳವಣಿಗೆಯನ್ನು ಪರಿಶೀಲಿಸಿ`,
        'ಕಳೆಗಳು ಮತ್ತು ಕೀಟಗಳ ಬಾಧೆಯನ್ನು ಗಮನಿಸಿ',
        'ಅಗತ್ಯ ಉಪಕರಣಗಳನ್ನು ಸಿದ್ಧವಾಗಿಟ್ಟುಕೊಳ್ಳಿ'
      ] : [
        `Inspect field soil moisture and ${crop} vegetative growth condition`,
        `Scout for early weed emergence or pest signs across field diagonals`,
        `Confirm equipment availability on AgroRent for upcoming operations`
      ],
      translatedEquipment: equipment.map(eq => ({
        whyNeeded: isTe ? `${stage} దశలో పనిని వేగవంతం చేయడానికి ${eq.equipmentName} అవసరం` : isHi ? `${stage} चरण में काम को सुगम बनाने के लिए ${eq.equipmentName} आवश्यक` : isTa ? `${stage} நிலைக்கு ${eq.equipmentName} தேவை` : isKn ? `${stage} ಹಂತಕ್ಕೆ ${eq.equipmentName} ಅಗತ್ಯ` : `Matched for ${stage} operations on your ${acreage} acre farm.`,
        whatItDoes: isTe ? 'పొలం పనులను సులభంగా మరియు తక్కువ సమయంలో పూర్తి చేస్తుంది' : isHi ? 'खेत के काम को कम समय में पूरा करता है' : isTa ? 'பண்ணை வேலைகளை எளிதாக்குகிறது' : isKn ? 'ಹೊಲದ ಕೆಲಸವನ್ನು ಸುಲಭಗೊಳಿಸುತ್ತದೆ' : `Executes designated field operations efficiently.`,
        whenToUse: isTe ? 'నేటి కార్యాచరణ షెడ్యూల్ ప్రకారం' : isHi ? 'आज की कार्ययोजना के अनुसार' : isTa ? 'இன்றைய திட்டப்படி' : isKn ? 'ಇಂದಿನ ಯೋಜನೆಯಂತೆ' : `During suitable soil moisture conditions.`,
        basicUsage: isTe ? 'సరైన పద్ధతిలో నడపండి' : isHi ? 'उचित रूप से संचालित करें' : isTa ? 'சரியாக இயக்கவும்' : isKn ? 'ಸರಿಯಾಗಿ ನಿರ್ವಹಿಸಿ' : `Operate according to standard agronomic protocols.`
      })),
      warnings: isTe ? ['వాతావరణ సూచనలు గమనించి పనులను ప్రారంభించండి'] : 
                isHi ? ['मौसम के पूर्वानुमान पर ध्यान दें और काम शुरू करें'] : 
                isTa ? ['வானிலை முன்னறிவிப்புகளை கவனித்து செயல்படவும்'] : 
                isKn ? ['ಹವಾಮಾನ ಮುನ್ಸೂಚನೆಗಳನ್ನು ಗಮನಿಸಿ ಕೆಲಸ ಪ್ರಾರಂಭಿಸಿ'] : 
                ['Monitor local weather forecast before committing field operations'],
      nextSteps: isTe ? ['నేటి పనులను ఫార్మ్ ఆపరేషన్స్ లో పూర్తి చేసినట్లు నమోదు చేయండి'] : 
                 isHi ? ['आज के पूरे किए गए कार्यों को फार्म ऑपरेशन्स में दर्ज करें'] : 
                 isTa ? ['முடிந்த பணிகளை செயல்பாடுகளில் பதிவு செய்யவும்'] : 
                 isKn ? ['ಪೂರ್ಣಗೊಂಡ ಕೆಲಸಗಳನ್ನು ದಾಖಲಿಸಿ'] : 
                 ['Log completed field tasks in Farm Operations'],
      explanation: isTe ? `${context.farmProfile.location} లో ${crop} పైరుకు నేటి ప్రాధాన్యత పనుల వివరాలు. అనువైన పరికరాలను ఎంచుకుని సమయానికి పనులు పూర్తి చేయడం ముఖ్యం.` : 
                   isHi ? `${context.farmProfile.location} में ${crop} के लिए आज के प्राथमिकता कार्य। समय पर उपकरण का उपयोग उपज में सहायक होगा।` : 
                   isTa ? `${context.farmProfile.location} இல் ${crop} பயிருக்கான இன்றைய பணிகள்.` : 
                   isKn ? `${context.farmProfile.location} ದಲ್ಲಿ ${crop} ಬೆಳೆಯ ಇಂದಿನ ಆದ್ಯತೆಯ ಕೆಲಸಗಳು.` : 
                   `Today's recommended field operations for ${crop} (${acreage} acres, ${stage}) in ${context.farmProfile.location || 'your location'}.`
    };
  }

  /**
   * Generate simple Farm Overview
   */
  async generateFarmOverview(farmerId: string, farmId: string, cropId: string, lang = 'en'): Promise<string> {
    const context = await farmContextService.buildContext(
      farmerId,
      farmId,
      cropId,
      { preferredLanguage: lang }
    );
    
    // Import fallback
    const { LOCALIZED_FARM_OVERVIEW } = require('../farm/LocalizedFarmingGuidance');


    const prompt = `You are a simple farming assistant.
Explain the farming process in the requested language (${lang}).
Use the supplied farm information:
Crop: ${context.farmProfile.crop}
Acreage: ${context.farmProfile.acreage}
Location: ${context.farmProfile.location}
Soil: ${context.farmProfile.soilType}
Season: ${context.farmProfile.season}
Current Stage: ${context.farmProfile.cropStage}
Budget: ₹${context.farmProfile.budget || 0}

Give practical, easy-to-understand guidance.
Do not invent equipment availability or rental prices.
Do not invent completed farm activities.
Do not change the crop stage.
Do not calculate authoritative financial values.
If information is missing, clearly say that it is missing.
Keep the response concise and farmer-friendly, using short sections like LAND PREPARATION, SEEDING, etc.`;

    const systemPrompt = `You are a helpful agricultural assistant focusing on farmer-friendly explanations. 
STRICT INSTRUCTION: Respond ENTIRELY in the ${lang} language. DO NOT use English unless the requested language is English. DO NOT mix languages. DO NOT include any Chinese characters under any circumstances.`;
    
    try {
      const response = await aiProvider.generateText(prompt, systemPrompt, 15000);
      
      const lowerLang = (lang || '').toLowerCase();
      const hasChinese = /[\u4e00-\u9fa5]/.test(response);
      const isTe = lowerLang === 'te' || lowerLang.includes('telugu');
      const isHi = lowerLang === 'hi' || lowerLang.includes('hindi');
      const isTa = lowerLang === 'ta' || lowerLang.includes('tamil');
      const isKn = lowerLang === 'kn' || lowerLang.includes('kannada');
      
      let validScript = true;
      if (isTe) validScript = (response.match(/[\u0C00-\u0C7F]/g) || []).length > 20;
      else if (isHi) validScript = (response.match(/[\u0900-\u097F]/g) || []).length > 20;
      else if (isTa) validScript = (response.match(/[\u0B80-\u0BFF]/g) || []).length > 20;
      else if (isKn) validScript = (response.match(/[\u0C80-\u0CFF]/g) || []).length > 20;

      if (!hasChinese && validScript && !response.includes("Sure, here are some")) {
        return response;
      }
      
      console.warn(`[FarmCopilot] Model response failed script validation for ${lang}. Falling back.`);
    } catch (error) {
      console.error("Ollama generateFarmOverview failed", error);
    }
    
    const fallbackFn = LOCALIZED_FARM_OVERVIEW[lang] || LOCALIZED_FARM_OVERVIEW.en;
    return fallbackFn(
      context.farmProfile.crop,
      context.farmProfile.soilType,
      context.farmProfile.acreage || 5,
      context.farmProfile.location,
      context.farmProfile.season,
      context.farmProfile.cropStage
    );
  }
}

export const farmCopilotService = new FarmCopilotService();
