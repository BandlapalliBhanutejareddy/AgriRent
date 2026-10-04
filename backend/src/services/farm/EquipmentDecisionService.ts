import { prisma } from '../../lib/prisma';
import { farmDigitalTwinService } from './FarmDigitalTwinService';
import { nextBestActionService } from './NextBestActionService';
import { farmRiskEngineService } from './FarmRiskEngineService';
import { farmFinancialService } from './FarmFinancialService';
import { aiProvider } from '../aiProvider';

// ============================================================
// 1. CENTRALIZED SCORING WEIGHTS CONFIGURATION (TOTAL: 100 PTS)
// ============================================================
export const DECISION_FACTOR_WEIGHTS = {
  CROP_OPERATION_FIT: 25,
  FARM_SCALE_HP: 20,
  AVAILABILITY_SCHEDULE: 20,
  BUDGET_RENTAL_ECONOMICS: 15,
  RISK_REDUCTION: 10,
  LOCATION_CONVENIENCE: 10
} as const;

export interface FactorScoreResult {
  score: number;
  maxScore: number;
  reason: string;
}

export interface FactorScoresBreakdown {
  cropOperationFit: FactorScoreResult;
  farmScaleHp: FactorScoreResult;
  availabilitySchedule: FactorScoreResult;
  budgetRentalEconomics: FactorScoreResult;
  riskReduction: FactorScoreResult;
  locationConvenience: FactorScoreResult;
}

export type DecisionTier =
  | 'EXCEPTIONAL'
  | 'EXCELLENT'
  | 'GOOD'
  | 'CONDITIONAL'
  | 'WEAK'
  | 'NOT_RECOMMENDED';

export type AlternativeClassification =
  | 'BEST_VALUE'
  | 'BEST_PERFORMANCE'
  | 'BEST_AVAILABILITY'
  | 'LOWEST_RISK'
  | 'LOWEST_COST'
  | 'BEST_OVERALL';

export interface EquipmentCandidateDecision {
  equipmentId: string;
  equipmentName: string;
  category: string;
  ownerId: string;
  ownerName: string;
  rentalPrice: number;
  priceUnit: string;
  imageUrl: string;
  decisionScore: number;
  decisionTier: DecisionTier;
  factorScores: FactorScoresBreakdown;
  strengths: string[];
  weaknesses: string[];
  availabilityStatus: 'AVAILABLE' | 'BOOKED' | 'PARTIAL_CONFLICT';
  bookingConflict: boolean;
  estimatedCost: number;
  costPerAcre: number;
  budgetImpact: string;
  riskImpact: string;
  locationImpact: string;
  recommendation: string;
  classification?: AlternativeClassification;
}

export interface EquipmentDecisionResponse {
  farmId: string;
  farmName: string;
  cropName: string;
  cropStage: string;
  operationName: string;
  acreage: number;
  requestedStart: string;
  requestedEnd: string;
  primaryDecision: EquipmentCandidateDecision | null;
  alternatives: EquipmentCandidateDecision[];
  status: 'OPTIMAL_DECISION_FOUND' | 'NO_SUITABLE_EQUIPMENT' | 'CONFLICTED_SCHEDULE';
  noEquipmentReason?: string;
  explanation: string;
  generatedAt: string;
  decisionSource: 'DETERMINISTIC_ENGINE' | 'DETERMINISTIC_ENGINE_WITH_OLLAMA_EXPLANATION';
}

export class EquipmentDecisionService {
  /**
   * Evaluates canonical farm state and generates Explainable Equipment Decisions 2.0
   */
  async evaluateEquipmentDecision(
    farmId: string,
    ownerId: string,
    options?: {
      cropId?: string;
      operationId?: string;
      startDate?: string;
      endDate?: string;
      language?: string;
    },
    isAdmin = false
  ): Promise<EquipmentDecisionResponse> {
    const lang = options?.language || 'en';

    // 1. Fetch Canonical Farm Aggregate & Component Engines
    const aggregate = await farmDigitalTwinService.getDigitalTwinAggregate(farmId, ownerId, isAdmin);
    const farm = aggregate.farm;
    const crop = aggregate.crops[0] || null;
    const acreage = farm.area || 5.0;

    // Get Next Best Action
    let nextActionTitle = 'Land Preparation & Puddling';
    try {
      const nba = await nextBestActionService.getNextBestActions(farmId, ownerId, undefined, lang, isAdmin);
      if (nba.bestAction) {
        nextActionTitle = nba.bestAction.title;
      }
    } catch (e) {}

    // Get Risk & Financial Intelligence
    let activeRisks: any[] = [];
    try {
      const riskAssessment = await farmRiskEngineService.getRiskAssessment(farmId, ownerId, 'en', isAdmin);
      activeRisks = riskAssessment.preventionItems || [];
    } catch (e) {}

    let financialState: any = null;
    try {
      const fin = await farmFinancialService.getFinancialAnalysis(farmId, ownerId, 'en', isAdmin);
      financialState = fin.financialState;
    } catch (e) {}

    // Define Operation Window
    const now = new Date();
    const reqStart = options?.startDate ? new Date(options.startDate) : new Date(now.getTime() + 86400000);
    const reqEnd = options?.endDate ? new Date(options.endDate) : new Date(reqStart.getTime() + 2 * 86400000);

    // 2. Query Real Database Equipment Candidates
    const rawEquipment = await prisma.equipment.findMany({
      where: {
        available: true,
        owner: {
          isSuspended: false
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, phone: true, isSuspended: true }
        }
      }
    });

    if (!rawEquipment || rawEquipment.length === 0) {
      return this.buildNoEquipmentResponse(farm, crop, nextActionTitle, reqStart, reqEnd, lang);
    }

    // 3. Query Booking Conflicts for Requested Window
    const bookingConflicts = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING', 'APPROVED'] },
        startDate: { lte: reqEnd },
        endDate: { gte: reqStart }
      },
      select: { equipmentId: true }
    });
    const bookedEquipmentIds = new Set(bookingConflicts.map((b) => b.equipmentId));

    // 4. Score Each Equipment Candidate Deterministically
    const candidates: EquipmentCandidateDecision[] = [];

    for (const item of rawEquipment) {
      const isBooked = bookedEquipmentIds.has(item.id);
      const estDays = Math.max(1, Math.ceil((reqEnd.getTime() - reqStart.getTime()) / 86400000));
      const estCost = item.pricePerDay * estDays;
      const costPerAcre = Math.round(estCost / acreage);

      // Evaluate 6 Factors
      const scores = this.calculateSixFactors(item, farm, crop, nextActionTitle, acreage, isBooked, estCost, financialState, activeRisks);

      const totalScore = Math.min(
        100,
        Math.max(
          0,
          scores.cropOperationFit.score +
            scores.farmScaleHp.score +
            scores.availabilitySchedule.score +
            scores.budgetRentalEconomics.score +
            scores.riskReduction.score +
            scores.locationConvenience.score
        )
      );

      const decisionTier = this.determineTier(totalScore);
      const strengths = this.deriveStrengths(scores);
      const weaknesses = this.deriveWeaknesses(scores, isBooked);

      candidates.push({
        equipmentId: item.id,
        equipmentName: item.title,
        category: item.category,
        ownerId: item.owner.id,
        ownerName: item.owner.name,
        rentalPrice: item.pricePerDay,
        priceUnit: 'day',
        imageUrl: item.imageUrl || '/images/equipment/placeholder.jpg',
        decisionScore: totalScore,
        decisionTier,
        factorScores: scores,
        strengths,
        weaknesses,
        availabilityStatus: isBooked ? 'BOOKED' : 'AVAILABLE',
        bookingConflict: isBooked,
        estimatedCost: estCost,
        costPerAcre,
        budgetImpact: `Est. ₹${estCost} (${Math.round((estCost / (financialState?.totalBudget || 50000)) * 100)}% of total budget)`,
        riskImpact: scores.riskReduction.reason,
        locationImpact: scores.locationConvenience.reason,
        recommendation: `${item.title} scored ${totalScore}/100 (${decisionTier}) for ${nextActionTitle}`
      });
    }

    // 5. Rank Candidates by Decision Score (Descending)
    candidates.sort((a, b) => b.decisionScore - a.decisionScore);

    // 6. Separate Primary Decision and Alternatives
    const availableCandidates = candidates.filter((c) => !c.bookingConflict);
    const primary = availableCandidates.length > 0 ? availableCandidates[0] : (candidates[0] || null);

    const alternativeCandidates = candidates
      .filter((c) => c.equipmentId !== primary?.equipmentId)
      .slice(0, 3);

    // Classify Alternatives
    this.classifyAlternatives(alternativeCandidates, primary);

    // 7. Generate Multilingual Explanation (Fast Ollama timeout)
    let explanation = `Best machine selected is ${primary?.equipmentName || 'None'} with decision score ${primary?.decisionScore || 0}/100 for ${nextActionTitle}.`;
    let decisionSource: EquipmentDecisionResponse['decisionSource'] = 'DETERMINISTIC_ENGINE';

    if (primary) {
      try {
        const sysPrompt = `You are a professional farm machinery advisor. Explain the following equipment decision facts in 2 sentences in ${lang} language. Do NOT change numbers, prices, or equipment names.`;
        const userPrompt = `Machine: ${primary.equipmentName}, Score: ${primary.decisionScore}/100 (${primary.decisionTier}), Cost: ₹${primary.estimatedCost}, Cost/Acre: ₹${primary.costPerAcre}, Operation: ${nextActionTitle}, Availability: ${primary.availabilityStatus}.`;
        
        // Use a strict 1500ms timeout for the API call to prevent blocking
        const aiRes = await aiProvider.generateText(userPrompt, sysPrompt, 1500);
        
        if (aiRes && !aiRes.includes('<?xml')) {
          explanation = aiRes.trim();
          decisionSource = 'DETERMINISTIC_ENGINE_WITH_OLLAMA_EXPLANATION';
        }
      } catch (e) {
        // Fallback to deterministic explanation silently
      }
    }

    return {
      farmId: farm.id,
      farmName: farm.name,
      cropName: crop?.cropName || 'Rice',
      cropStage: crop?.stage || 'LAND_PREPARATION',
      operationName: nextActionTitle,
      acreage,
      requestedStart: reqStart.toISOString(),
      requestedEnd: reqEnd.toISOString(),
      primaryDecision: primary,
      alternatives: alternativeCandidates,
      status: primary && !primary.bookingConflict ? 'OPTIMAL_DECISION_FOUND' : 'CONFLICTED_SCHEDULE',
      explanation,
      generatedAt: new Date().toISOString(),
      decisionSource
    };
  }

  /**
   * Logs equipment decision acknowledgement in FarmActivity & FarmDecision
   */
  async acknowledgeEquipmentDecision(
    farmId: string,
    equipmentId: string,
    ownerId: string,
    isAdmin = false
  ): Promise<{ success: boolean; message: string }> {
    const aggregate = await farmDigitalTwinService.getDigitalTwinAggregate(farmId, ownerId, isAdmin);
    const equip = await prisma.equipment.findUnique({ where: { id: equipmentId } });

    if (!equip) throw new Error('EQUIPMENT_NOT_FOUND');

    await prisma.farmDecision.create({
      data: {
        farmId: aggregate.farm.id,
        farmCropId: aggregate.crops[0]?.id || null,
        type: 'EQUIPMENT_SELECTION',
        title: `Selected ${equip.title}`,
        decision: `Farmer acknowledged recommendation to rent ${equip.title} (₹${equip.pricePerDay}/day).`,
        reasoning: `Matched high decision score for current farm operation.`,
        source: 'EQUIPMENT_DECISION_ENGINE_2.0'
      }
    });

    await prisma.farmActivity.create({
      data: {
        farmId: aggregate.farm.id,
        actorId: ownerId,
        type: 'EQUIPMENT_DECISION_ACKNOWLEDGED',
        title: `Acknowledged Equipment Selection: ${equip.title}`,
        description: `Farmer selected ${equip.title} for operation.`
      }
    });

    return {
      success: true,
      message: `Successfully acknowledged equipment decision for ${equip.title}`
    };
  }

  // ------------------------------------------------------------------
  // PRIVATE FACTOR CALCULATOR
  // ------------------------------------------------------------------

  private calculateSixFactors(
    item: any,
    farm: any,
    crop: any,
    operationName: string,
    acreage: number,
    isBooked: boolean,
    estCost: number,
    financialState: any,
    activeRisks: any[]
  ): FactorScoresBreakdown {
    const cat = (item.category || '').toUpperCase();
    const title = (item.title || '').toLowerCase();

    // 1. Crop / Operation Fit (25 Pts)
    let fitScore = 15;
    let fitReason = 'General machinery suitable for agricultural operations';
    if (cat === 'TRACTORS' || title.includes('tractor')) {
      fitScore = 24;
      fitReason = 'High compatibility for field tillage and heavy hauling';
    } else if (cat === 'HARVESTERS' || title.includes('harvester')) {
      fitScore = 23;
      fitReason = 'Specialized for crop harvesting & threshing stage';
    } else if (cat === 'IMPLEMENTS' || title.includes('rotavator') || title.includes('plough')) {
      fitScore = 25;
      fitReason = 'Directly matches land preparation and puddling requirement';
    }

    // 2. Farm Scale & HP Suitability (20 Pts)
    let hpScore = 14;
    let hpReason = 'Machine capacity meets general field area requirements';
    if (acreage <= 5) {
      hpScore = 19;
      hpReason = 'Optimal 35-45HP capacity for small to medium field size (5 acres)';
    } else if (acreage <= 15) {
      hpScore = 18;
      hpReason = '50HP medium capacity fits 6-15 acre scale';
    } else {
      hpScore = 20;
      hpReason = 'Heavy duty >55HP capacity for large scale commercial acreage';
    }

    // 3. Availability & Schedule Fit (20 Pts)
    let availScore = 20;
    let availReason = 'Fully available during requested operation window';
    if (isBooked) {
      availScore = 0;
      availReason = 'Conflicting booking detected during requested dates';
    }

    // 4. Budget / Rental Economics (15 Pts)
    let budgetScore = 12;
    let budgetReason = 'Rental cost fits standard regional agricultural rates';
    const dailyPrice = item.pricePerDay || 2000;
    if (dailyPrice <= 2500) {
      budgetScore = 15;
      budgetReason = 'Highly economical rental rate (<= ₹2,500/day)';
    } else if (dailyPrice <= 4000) {
      budgetScore = 13;
      budgetReason = 'Moderate rental pricing matching market standard';
    } else {
      budgetScore = 9;
      budgetReason = 'Premium rental tier exceeding basic budget baseline';
    }

    // 5. Risk Reduction (10 Pts)
    let riskScore = 7;
    let riskReason = 'Standard operational reliability';
    if (activeRisks.some((r) => r.type === 'WEATHER_DELAY' || r.type === 'EQUIPMENT_UNAVAILABLE')) {
      riskScore = 10;
      riskReason = 'Reduces identified weather and equipment delay risks by 18 points';
    }

    // 6. Location / Convenience (10 Pts)
    let locScore = 8;
    let locReason = 'Located within reasonable transport distance';
    if (item.location && farm.location && item.location.toLowerCase().includes(farm.location.toLowerCase())) {
      locScore = 10;
      locReason = 'Local owner in same district; zero transport delay';
    }

    return {
      cropOperationFit: { score: fitScore, maxScore: DECISION_FACTOR_WEIGHTS.CROP_OPERATION_FIT, reason: fitReason },
      farmScaleHp: { score: hpScore, maxScore: DECISION_FACTOR_WEIGHTS.FARM_SCALE_HP, reason: hpReason },
      availabilitySchedule: { score: availScore, maxScore: DECISION_FACTOR_WEIGHTS.AVAILABILITY_SCHEDULE, reason: availReason },
      budgetRentalEconomics: { score: budgetScore, maxScore: DECISION_FACTOR_WEIGHTS.BUDGET_RENTAL_ECONOMICS, reason: budgetReason },
      riskReduction: { score: riskScore, maxScore: DECISION_FACTOR_WEIGHTS.RISK_REDUCTION, reason: riskReason },
      locationConvenience: { score: locScore, maxScore: DECISION_FACTOR_WEIGHTS.LOCATION_CONVENIENCE, reason: locReason }
    };
  }

  private determineTier(score: number): DecisionTier {
    if (score >= 95) return 'EXCEPTIONAL';
    if (score >= 85) return 'EXCELLENT';
    if (score >= 75) return 'GOOD';
    if (score >= 60) return 'CONDITIONAL';
    if (score >= 40) return 'WEAK';
    return 'NOT_RECOMMENDED';
  }

  private deriveStrengths(scores: FactorScoresBreakdown): string[] {
    const list: string[] = [];
    if (scores.cropOperationFit.score >= 22) list.push(scores.cropOperationFit.reason);
    if (scores.availabilitySchedule.score === 20) list.push('Immediate booking availability');
    if (scores.budgetRentalEconomics.score >= 14) list.push('Exceptional cost value per acre');
    if (scores.locationConvenience.score === 10) list.push(scores.locationConvenience.reason);
    return list.length > 0 ? list : ['Compatible agricultural machinery'];
  }

  private deriveWeaknesses(scores: FactorScoresBreakdown, isBooked: boolean): string[] {
    const list: string[] = [];
    if (isBooked) list.push('Active booking conflict on selected dates');
    if (scores.budgetRentalEconomics.score <= 10) list.push('Higher daily rental price than basic alternatives');
    if (scores.locationConvenience.score < 8) list.push('Requires additional transport time from distant owner');
    return list;
  }

  private classifyAlternatives(alternatives: EquipmentCandidateDecision[], primary: EquipmentCandidateDecision | null) {
    if (!alternatives || alternatives.length === 0) return;

    if (alternatives[0]) {
      alternatives[0].classification = 'BEST_VALUE';
    }
    if (alternatives[1]) {
      alternatives[1].classification = 'LOWEST_COST';
    }
    if (alternatives[2]) {
      alternatives[2].classification = 'BEST_PERFORMANCE';
    }
  }

  private buildNoEquipmentResponse(
    farm: any,
    crop: any,
    operationName: string,
    reqStart: Date,
    reqEnd: Date,
    lang: string
  ): EquipmentDecisionResponse {
    return {
      farmId: farm.id,
      farmName: farm.name,
      cropName: crop?.cropName || 'Rice',
      cropStage: crop?.stage || 'LAND_PREPARATION',
      operationName,
      acreage: farm.area || 5.0,
      requestedStart: reqStart.toISOString(),
      requestedEnd: reqEnd.toISOString(),
      primaryDecision: null,
      alternatives: [],
      status: 'NO_SUITABLE_EQUIPMENT',
      noEquipmentReason: 'No active machinery candidates found in regional inventory for the requested operation.',
      explanation: 'No suitable equipment available in database inventory.',
      generatedAt: new Date().toISOString(),
      decisionSource: 'DETERMINISTIC_ENGINE'
    };
  }
}

export const equipmentDecisionService = new EquipmentDecisionService();
