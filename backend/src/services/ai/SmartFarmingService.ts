import { aiProvider } from '../aiProvider';
import { equipmentRecommendationService, FarmerProfileInput, MatchedEquipmentResult } from './EquipmentRecommendationService';

export interface SmartFarmingPlanResponse {
  summary: string;
  crop: string;
  farmSize: number;
  farmingStage: string;
  operations: string[];
  equipmentRecommendations: {
    category: string;
    name: string;
    minHp?: number;
    maxHp?: number;
    purpose: string;
    estimatedHours: number;
  }[];
  rentalStrategy: {
    recommendedDays: number;
    priority: string;
    estimatedBudgetMin: number;
    estimatedBudgetMax: number;
    costSavingAlternative: string;
  };
  estimatedCost: {
    totalEstimatedCost: number;
    farmerBudget: number;
    withinBudget: boolean;
    budgetStatus: 'WITHIN_BUDGET' | 'OVER_BUDGET' | 'BUDGET_NOT_SPECIFIED';
    analysis: string;
  };
  risks: string[];
  actionPlan: {
    day: string;
    task: string;
  }[];
  costSavingTips: string[];
  warnings: string[];
  language: string;
  matchedEquipment: MatchedEquipmentResult[];
}

export class SmartFarmingService {
  public async generateSmartPlan(farmer: FarmerProfileInput): Promise<SmartFarmingPlanResponse> {
    const crop = (farmer.crop || 'Crop').trim();
    const soilType = (farmer.soilType || 'Standard Soil').trim();
    const acreageNum = typeof farmer.acreage === 'number' ? farmer.acreage : parseFloat(String(farmer.acreage)) || 5;
    const location = (farmer.location || 'Your Region').trim();
    const season = (farmer.season || 'Kharif').trim();
    const stage = (farmer.farmingStage || 'LAND_PREPARATION').trim().toUpperCase();
    const objective = (farmer.objective || 'Reduce Cost & Maximize Yield').trim();
    const budgetNum = farmer.budget ? (typeof farmer.budget === 'number' ? farmer.budget : parseFloat(String(farmer.budget))) : 0;
    const question = (farmer.question || `What machinery should I rent for ${crop} during ${stage}?`).trim();
    const lang = (farmer.language || 'en').trim().toLowerCase();

    // 1. Fetch relevant local DB knowledge guides
    const knowledge = await equipmentRecommendationService.getRelevantKnowledgeBase(crop, stage);

    // 2. Build Ollama Prompt
    const systemPrompt = `You are an expert Agronomist and Equipment Advisor for AgroRent AI.
Generate a structured JSON Smart Farming Plan. Response MUST be strict valid JSON matching the specified schema.
Respond strictly in the ${lang.toUpperCase()} language for all text fields.`;

    const userPrompt = `FARMING SITUATION PROFILE:
- Crop: ${crop}
- Soil Type: ${soilType}
- Acreage: ${acreageNum} acres
- Location: ${location}
- Season: ${season}
- Current Farming Stage: ${stage}
- Farmer Objective: ${objective}
- Farmer Budget: ${budgetNum ? '₹' + budgetNum : 'Not specified'}
- Question / Request: "${question}"
- Target Language Code: ${lang}

RELEVANT DATABASE GUIDES: ${JSON.stringify(knowledge.guides.slice(0, 2))}

REQUIREMENTS:
1. Tailor the advice specifically to ${crop} on ${acreageNum} acres in ${soilType} soil during ${season} season at stage ${stage}.
2. Recommend appropriate equipment categories (e.g. TRACTORS, ROTAVATORS, HARVESTERS).
3. If objective is "Reduce Cost", recommend cost-saving strategies (e.g., renting high-HP combined machinery).
4. If acreage is large (>10 acres), recommend heavy duty equipment. If small (<=10 acres), recommend medium equipment.
5. Provide strict valid JSON ONLY with NO markdown wrappers matching this exact JSON structure:

{
  "summary": "Full overview of farming plan in ${lang}",
  "crop": "${crop}",
  "farmSize": ${acreageNum},
  "farmingStage": "${stage}",
  "operations": ["Operation 1", "Operation 2", "Operation 3"],
  "equipmentRecommendations": [
    {
      "category": "TRACTORS",
      "name": "45-50 HP Tractor",
      "minHp": 45,
      "maxHp": 50,
      "purpose": "Primary land preparation and deep tilling",
      "estimatedHours": 8
    }
  ],
  "rentalStrategy": {
    "recommendedDays": 2,
    "priority": "HIGH",
    "estimatedBudgetMin": 3000,
    "estimatedBudgetMax": 5000,
    "costSavingAlternative": "Rent a single multi-purpose tractor with attached rotavator"
  },
  "estimatedCost": {
    "totalEstimatedCost": 4000,
    "farmerBudget": ${budgetNum},
    "withinBudget": ${budgetNum === 0 || 4000 <= budgetNum ? true : false},
    "budgetStatus": "${budgetNum === 0 ? 'BUDGET_NOT_SPECIFIED' : (4000 <= budgetNum ? 'WITHIN_BUDGET' : 'OVER_BUDGET')}",
    "analysis": "Budget analysis statement"
  },
  "risks": ["Risk 1", "Risk 2"],
  "actionPlan": [
    { "day": "Day 1", "task": "Task for Day 1" },
    { "day": "Day 2", "task": "Task for Day 2" }
  ],
  "costSavingTips": ["Tip 1", "Tip 2"],
  "warnings": ["Warning 1"],
  "language": "${lang}"
}`;

    let parsedPlan: any = null;

    try {
      // Call Ollama local model
      const rawResult = await (aiProvider as any).generate(userPrompt, true, systemPrompt);
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : rawResult;
      parsedPlan = JSON.parse(cleanJson.trim());

      // Validate required keys exist
      if (!parsedPlan.summary || !parsedPlan.operations || !parsedPlan.equipmentRecommendations) {
        throw new Error('Incomplete JSON schema returned by model');
      }
    } catch (err: any) {
      console.warn('[SmartFarmingService] Ollama model response parsing failed or offline, engaging local agronomy engine:', err.message);
      parsedPlan = this.getDeterministicFallbackPlan(crop, soilType, acreageNum, location, season, stage, objective, budgetNum, lang);
    }

    // Ensure budget calculation is strictly evaluated
    const recDays = parsedPlan.rentalStrategy?.recommendedDays || 2;
    const recCategories = (parsedPlan.equipmentRecommendations || []).map((e: any) => e.category || e.name || 'TRACTORS');

    // 3. Query Real Database Equipment via EquipmentRecommendationService
    const matchedEquipment = await equipmentRecommendationService.matchEquipment(farmer, recCategories, recDays);

    // Calculate real budget analysis
    const estTotalCost = matchedEquipment.length > 0 
      ? matchedEquipment[0].estimatedTotalCost 
      : (parsedPlan.estimatedCost?.totalEstimatedCost || 4000);

    let budgetStatus: 'WITHIN_BUDGET' | 'OVER_BUDGET' | 'BUDGET_NOT_SPECIFIED' = 'BUDGET_NOT_SPECIFIED';
    let withinBudget = true;
    let analysis = `Estimated equipment rental cost is ₹${estTotalCost}.`;

    if (budgetNum > 0) {
      if (estTotalCost <= budgetNum) {
        budgetStatus = 'WITHIN_BUDGET';
        withinBudget = true;
        analysis = `Your estimated rental cost of ₹${estTotalCost.toLocaleString()} is within your ₹${budgetNum.toLocaleString()} budget.`;
      } else {
        budgetStatus = 'OVER_BUDGET';
        withinBudget = false;
        analysis = `Estimated cost of ₹${estTotalCost.toLocaleString()} exceeds your ₹${budgetNum.toLocaleString()} budget. Consider renting lower HP machinery or sharing rental days.`;
      }
    }

    return {
      summary: parsedPlan.summary || `Smart Farming Plan for ${crop} on ${acreageNum} acres`,
      crop,
      farmSize: acreageNum,
      farmingStage: stage,
      operations: parsedPlan.operations || ['Land Tillage', 'Soil Levelling'],
      equipmentRecommendations: parsedPlan.equipmentRecommendations || [
        { category: 'TRACTORS', name: '45-50 HP Tractor', purpose: 'Primary tilling', estimatedHours: 8 }
      ],
      rentalStrategy: {
        recommendedDays: recDays,
        priority: parsedPlan.rentalStrategy?.priority || 'HIGH',
        estimatedBudgetMin: parsedPlan.rentalStrategy?.estimatedBudgetMin || Math.round(estTotalCost * 0.8),
        estimatedBudgetMax: parsedPlan.rentalStrategy?.estimatedBudgetMax || Math.round(estTotalCost * 1.2),
        costSavingAlternative: parsedPlan.rentalStrategy?.costSavingAlternative || 'Opt for multi-purpose attachments to reduce total tractor rental days.'
      },
      estimatedCost: {
        totalEstimatedCost: estTotalCost,
        farmerBudget: budgetNum,
        withinBudget,
        budgetStatus,
        analysis
      },
      risks: parsedPlan.risks || ['Weather dependency', 'Soil moisture level'],
      actionPlan: parsedPlan.actionPlan || [
        { day: 'Day 1', task: 'Primary land preparation' },
        { day: 'Day 2', task: 'Secondary rotavator till and seedbed setup' }
      ],
      costSavingTips: parsedPlan.costSavingTips || ['Book machinery during non-peak weekdays for discounted rates'],
      warnings: parsedPlan.warnings || ['Verify equipment operational condition before field dispatch'],
      language: lang,
      matchedEquipment
    };
  }

  /**
   * Deterministic Context-Sensitive Local Agronomic Fallback Engine
   */
  private getDeterministicFallbackPlan(
    crop: string,
    soil: string,
    acreage: number,
    loc: string,
    season: string,
    stage: string,
    objective: string,
    budget: number,
    lang: string
  ): any {
    const isTelugu = lang === 'te' || lang.includes('telugu');
    const isHindi = lang === 'hi' || lang.includes('hindi');
    const isTamil = lang === 'ta' || lang.includes('tamil');
    const isKannada = lang === 'kn' || lang.includes('kannada');

    const isLargeFarm = acreage > 10;
    const isHarvesting = stage.includes('HARVEST');
    const isCostSaving = objective.toLowerCase().includes('cost');

    // Context-sensitive recommendations
    let operations: string[] = [];
    let eqRecs: any[] = [];
    let recDays = isLargeFarm ? 4 : 2;

    if (isHarvesting) {
      operations = isTelugu 
        ? ['పంట కోత', 'నూర్పిడి', 'ప్యాకింగ్ & రవాణా']
        : (isHindi ? ['फसल कटाई', 'थ्रेशिंग', 'परिवहन'] : ['Crop Harvesting', 'Threshing & Cleaning', 'Bagging & Transport']);
      
      eqRecs = [
        {
          category: 'HARVESTERS',
          name: isLargeFarm ? 'Multi-Crop Combine Harvester (110 HP)' : 'Mini Combine Harvester',
          minHp: isLargeFarm ? 100 : 50,
          maxHp: isLargeFarm ? 120 : 75,
          purpose: 'Automated harvesting and grain separation',
          estimatedHours: isLargeFarm ? 16 : 8
        }
      ];
    } else {
      operations = isTelugu
        ? ['భూమి దుక్కి', 'రోటవేటర్ నేల సమతలం', 'విత్తనాలు నాటడం']
        : (isHindi ? ['जुताई एवं भूमि तैयारी', 'रोटावेटर द्वारा समतलीकरण', 'बीज बुवाई'] : ['Primary Deep Ploughing', 'Rotavator Soil Pulverization', 'Precision Sowing']);
      
      eqRecs = [
        {
          category: 'TRACTORS',
          name: isLargeFarm ? '55 HP Heavy Duty Tractor' : '45 HP Utility Tractor',
          minHp: isLargeFarm ? 50 : 40,
          maxHp: isLargeFarm ? 60 : 50,
          purpose: 'Deep ploughing & seedbed preparation',
          estimatedHours: isLargeFarm ? 12 : 6
        },
        {
          category: 'IMPLEMENTS',
          name: 'Rotavator & Seed Drill Attachment',
          purpose: 'Soil conditioning and seeding',
          estimatedHours: isLargeFarm ? 8 : 4
        }
      ];
    }

    const estCost = (eqRecs[0].minHp > 50 ? 2500 : 1500) * recDays;

    let summaryText = `Custom Smart Farming Plan for ${crop} (${acreage} acres in ${loc}, ${season} season).`;
    if (isTelugu) {
      summaryText = `${loc} ప్రాంతంలో ${season} సీజన్‌లో ${acreage} ఎకరాల ${crop} సాగు కోసం ప్రత్యేకమైన వ్యవసాయ ప్రణాళిక.`;
    } else if (isHindi) {
      summaryText = `${loc} क्षेत्र में ${season} मौसम के दौरान ${acreage} एकड़ ${crop} की खेती के लिए स्मार्ट कृषि योजना।`;
    }

    return {
      summary: summaryText,
      crop,
      farmSize: acreage,
      farmingStage: stage,
      operations,
      equipmentRecommendations: eqRecs,
      rentalStrategy: {
        recommendedDays: recDays,
        priority: 'HIGH',
        estimatedBudgetMin: Math.round(estCost * 0.85),
        estimatedBudgetMax: Math.round(estCost * 1.15),
        costSavingAlternative: isCostSaving 
          ? 'Rent combined machinery with multi-utility attachments to complete operations in fewer days.'
          : 'Schedule heavy machinery for continuous non-stop operation to maximize daily output.'
      },
      estimatedCost: {
        totalEstimatedCost: estCost,
        farmerBudget: budget,
        withinBudget: budget === 0 || estCost <= budget,
        budgetStatus: budget === 0 ? 'BUDGET_NOT_SPECIFIED' : (estCost <= budget ? 'WITHIN_BUDGET' : 'OVER_BUDGET'),
        analysis: `Estimated total rental cost is ₹${estCost}.`
      },
      risks: isTelugu 
        ? ['సకాలంలో వర్షపాతం', 'నేల తేమ పరిమితి', 'యంత్రాల లభ్యత']
        : ['Rainfall and weather dependency', 'Soil moisture level', 'Equipment timing during peak season'],
      actionPlan: [
        { day: 'Day 1', task: isHarvesting ? 'Primary crop field harvesting' : 'Primary deep tillage and field preparation' },
        { day: 'Day 2', task: isHarvesting ? 'Threshing, cleaning and bagging' : 'Rotavator soil levelling and sowing preparation' }
      ],
      costSavingTips: [
        'Rent machinery from local owners on AgroRent AI to reduce transport costs',
        'Book off-peak weekdays for lower daily rental rates'
      ],
      warnings: ['Inspect equipment hydraulic and engine condition prior to operation'],
      language: lang
    };
  }
}

export const smartFarmingService = new SmartFarmingService();
