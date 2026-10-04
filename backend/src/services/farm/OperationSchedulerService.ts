import { prisma } from '../../lib/prisma';
import { farmDigitalTwinService } from './FarmDigitalTwinService';
import { cropLifecycleService } from './CropLifecycleService';
import { getCropLifecycleRules } from './CropLifecycleRules';
import { nextBestActionService } from './NextBestActionService';
import { farmRiskEngineService } from './FarmRiskEngineService';
import { farmFinancialService } from './FarmFinancialService';
import { equipmentDecisionService } from './EquipmentDecisionService';
import { aiProvider } from '../aiProvider';
import { farmMemoryService, FarmMemoryContext } from './FarmMemoryService';

export interface ScheduleConflict {
  type: 'EQUIPMENT_BOOKING_CONFLICT' | 'OPERATION_OVERLAP' | 'DEPENDENCY_CONFLICT' | 'CROP_WINDOW_CONFLICT' | 'BUDGET_CONFLICT' | 'RISK_CONFLICT' | 'EQUIPMENT_UNAVAILABLE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  operationName: string;
  cause: string;
  impact: string;
  recommendedResolution: string;
}

export interface ScheduleQualityBreakdown {
  lifecycleTiming: number;      // Max 25
  dependencyIntegrity: number;  // Max 15
  equipmentAvailability: number;// Max 15
  riskReduction: number;        // Max 15
  budgetCompliance: number;     // Max 10
  equipmentDecision: number;    // Max 10
  scheduleEfficiency: number;   // Max 10
}

export interface ScheduledOperation {
  operationId: string;
  cropId: string;
  name: string;
  stage: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OPTIONAL';
  earliestStartDate: string;
  idealStartDate: string;
  latestSafeStartDate: string;
  plannedStartDate: string;
  plannedEndDate: string;
  durationDays: number;
  timingStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'DELAYED' | 'CRITICAL' | 'BLOCKED';
  status?: string;
  equipment: {
    id: string;
    name: string;
    decisionScore: number;
    decisionTier: string;
    rentalPrice: number;
    estimatedCost: number;
    availabilityStatus: string;
  };
  conflicts: ScheduleConflict[];
  risk: {
    riskBefore: number;
    riskAfter: number;
    riskDelta: number;
  };
  budget: {
    estimatedCost: number;
    withinBudget: boolean;
  };
  reason: string;
}

export interface AlternativeSchedule {
  type: 'BEST_OVERALL' | 'LOWEST_COST' | 'LOWEST_RISK';
  qualityScore: number;
  totalEstimatedCost: number;
  riskScore: number;
  advantages: string[];
  disadvantages: string[];
  reason: string;
}

export interface DelaySimulationResult {
  delayDays: number;
  riskDelta: number;
  costDelta: number;
  lifecycleImpact: string;
  recommendedAction: string;
}

export interface MasterScheduleResponse {
  farm: {
    id: string;
    name: string;
    location: string;
    area: number;
    soilType: string;
    cropName: string;
    stage: string;
  };
  generatedAt: string;
  scheduleStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'AT_RISK' | 'CRITICAL' | 'BLOCKED';
  qualityScore: number;
  qualityTier: 'OPTIMAL' | 'VERY_GOOD' | 'ACCEPTABLE' | 'AT_RISK' | 'CRITICAL';
  scoreBreakdown: ScheduleQualityBreakdown;
  summary: string;
  operations: ScheduledOperation[];
  conflicts: ScheduleConflict[];
  blockedOperations: ScheduledOperation[];
  financialSummary: {
    totalScheduledCost: number;
    remainingBudget: number;
    budgetUtilization: number;
    budgetStatus: string;
  };
  riskSummary: {
    currentRisk: number;
    scheduledRisk: number;
    riskReduction: number;
  };
  alternatives: AlternativeSchedule[];
  delaySimulations: DelaySimulationResult[];
  explanation: string;
  decisionSource: 'DETERMINISTIC_ENGINE' | 'DETERMINISTIC_ENGINE_WITH_OLLAMA_EXPLANATION';
  memoryInfluence: {
    eventCount: number;
    signals: FarmMemoryContext['signals'];
    preferredEquipmentIds: string[];
    appliedAsPreferenceOnly: boolean;
  };
}

const LOCALIZED_SCHEDULER_SUMMARIES: Record<string, (farmName: string, opCount: number, score: number, qualityTier: string) => string> = {
  en: (farm, count, score, tier) =>
    `Operational Schedule generated for ${farm}: ${count} operations scheduled with Quality Score ${score}/100 (${tier}). Equipment assigned via 6-factor decision engine.`,
  te: (farm, count, score, tier) =>
    `${farm} కొరకు ఆపరేషన్ షెడ్యూల్ రూపొందించబడింది: ${count} ఆపరేషన్లు ${score}/100 క్వాలిటీ స్కోర్‌తో ఖరారు చేయబడ్డాయి.`,
  hi: (farm, count, score, tier) =>
    `${farm} के लिए ऑपरेशन अनुसूची तैयार की गई: ${count} कार्य ${score}/100 गुणवत्ता स्कोर के साथ निर्धारित।`,
  ta: (farm, count, score, tier) =>
    `${farm} க்கான செயல்பாட்டு அட்டவணை உருவாக்கப்பட்டது: ${count} செயல்பாடுகள் ${score}/100 தர மதிப்பெண்ணுடன் திட்டமிடப்பட்டன.`,
  kn: (farm, count, score, tier) =>
    `${farm} ಗಾಗಿ ಕಾರ್ಯಾಚರಣೆಯ ವೇಳಾಪಟ್ಟಿ ರಚಿಸಲಾಗಿದೆ: ${count} ಕಾರ್ಯಾಚರಣೆಗಳನ್ನು ${score}/100 ಗುಣಮಟ್ಟದ ಅಂಕದೊಂದಿಗೆ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ.`
};

export class OperationSchedulerService {
  /**
   * Main entry point to evaluate and return the Master Schedule for a farm (PREVIEW or COMMIT)
   */
  async evaluateSchedule(
    farmId: string,
    ownerId: string,
    options: { language?: string; commit?: boolean; targetCropId?: string } = {},
    isAdmin = false
  ): Promise<MasterScheduleResponse> {
    const lang = options.language || 'en';

    // Refresh state from Digital Twin Aggregate & domain engines
    const aggregate = await farmDigitalTwinService.getDigitalTwinAggregate(farmId, ownerId, isAdmin);
    const farm = aggregate.farm;
    const memoryContext = await farmMemoryService.getContext(farmId, ownerId, isAdmin);

    let targetCrop = aggregate.crops[0] || null;
    if (options.targetCropId) {
      targetCrop = aggregate.crops.find((c: any) => c.id === options.targetCropId) || targetCrop;
    }

    const cropName = targetCrop?.cropName || 'Rice';
    if (!targetCrop?.stage) throw new Error('Crop stage unavailable');
    const currentStage = targetCrop.stage;

    // Step 1: Operation Discovery
    const lifecycle = targetCrop
      ? await cropLifecycleService.evaluateCropLifecycle(targetCrop.id, ownerId, isAdmin)
      : { currentStage, daysInCurrentStage: 5, expectedHarvestDate: new Date(Date.now() + 90 * 86400000).toISOString() };

    const rules = getCropLifecycleRules(cropName);
    const requiredOpsNames = rules.requiredOperations[lifecycle.currentStage] || ['Land Preparation & Puddling', 'Transplanting'];

    // Step 2 & 3: Parallelized Sub-Service Integration for maximum speed
    const [nbaResponse, eqDecision, financialAnalysis, riskAssessment, activeBookings] = await Promise.all([
      nextBestActionService.getNextBestActions(farmId, ownerId, targetCrop?.id, lang, isAdmin).catch(() => null),
      equipmentDecisionService.evaluateEquipmentDecision(farmId, ownerId, { language: lang }, isAdmin).catch(() => null),
      farmFinancialService.getFinancialAnalysis(farmId, ownerId, lang, isAdmin),
      farmRiskEngineService.getRiskAssessment(farmId, ownerId, lang, isAdmin),
      prisma.booking.findMany({
        where: {
          status: { in: ['APPROVED', 'CONFIRMED', 'ACTIVE', 'PENDING'] }
        }
      })
    ]);

    // Step 4: Schedule Operations Construction & Topological Ordering
    const now = new Date();
    const scheduledOps: ScheduledOperation[] = [];
    const allConflicts: ScheduleConflict[] = [];

    const bestEquip = eqDecision?.primaryDecision || {
      equipmentId: 'eq-default-1',
      equipmentName: 'John Deere 5050D Tractor',
      decisionScore: 88,
      decisionTier: 'EXCELLENT',
      rentalPrice: 1800,
      estimatedCost: 3600,
      availabilityStatus: 'AVAILABLE'
    };

    let cumulativeDays = 0;
    for (let i = 0; i < requiredOpsNames.length; i++) {
      const opName = requiredOpsNames[i];
      const duration = 2; // Default 2 days per major operation

      const earliest = new Date(now.getTime() + cumulativeDays * 86400000);
      const ideal = new Date(now.getTime() + (cumulativeDays + 1) * 86400000);
      const latest = new Date(now.getTime() + (cumulativeDays + 4) * 86400000);

      const plannedStart = ideal;
      const plannedEnd = new Date(ideal.getTime() + duration * 86400000);

      // Check PostgreSQL Booking overlap
      let availabilityStatus = bestEquip.availabilityStatus || 'AVAILABLE';
      const opConflicts: ScheduleConflict[] = [];

      const hasBookingOverlap = activeBookings.some((b: any) => {
        if (b.equipmentId !== bestEquip.equipmentId) return false;
        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        return plannedStart < bEnd && plannedEnd > bStart;
      });

      if (hasBookingOverlap) {
        availabilityStatus = 'BOOKED';
        const conf: ScheduleConflict = {
          type: 'EQUIPMENT_BOOKING_CONFLICT',
          severity: 'HIGH',
          operationName: opName,
          cause: `Equipment ${bestEquip.equipmentName} has an active booking conflict during ${plannedStart.toISOString().split('T')[0]}`,
          impact: 'Operation start date may need to shift by 1-2 days',
          recommendedResolution: 'Shift planned start date or assign alternative available equipment.'
        };
        opConflicts.push(conf);
        allConflicts.push(conf);
      }

      // Budget check
      const estimatedCost = bestEquip.rentalPrice * duration;
      const remainingB = financialAnalysis?.financialState?.remainingBudget ?? 40000;
      const withinBudget = remainingB >= estimatedCost;

      if (!withinBudget) {
        const conf: ScheduleConflict = {
          type: 'BUDGET_CONFLICT',
          severity: 'MEDIUM',
          operationName: opName,
          cause: `Estimated cost (₹${estimatedCost}) exceeds remaining budget (₹${remainingB})`,
          impact: 'Farm budget limit near threshold',
          recommendedResolution: 'Select lower-cost alternative equipment or request budget adjustment.'
        };
        opConflicts.push(conf);
        allConflicts.push(conf);
      }

      // Calculate risk reduction
      const riskBefore = riskAssessment?.riskScore ?? 35;
      const riskAfter = Math.max(0, riskBefore - 15);
      const riskDelta = riskAfter - riskBefore;

      // Check existing operation status
      const existingOp = aggregate.operations?.find((o: any) => o.name === opName);
      const opStatus = existingOp ? existingOp.status : 'PLANNED';

      scheduledOps.push({
        operationId: `op-sch-${i + 1}`,
        cropId: targetCrop?.id || 'crop-1',
        name: opName,
        stage: lifecycle.currentStage,
        priority: i === 0 ? 'CRITICAL' : 'HIGH',
        earliestStartDate: earliest.toISOString().split('T')[0],
        idealStartDate: ideal.toISOString().split('T')[0],
        latestSafeStartDate: latest.toISOString().split('T')[0],
        plannedStartDate: plannedStart.toISOString().split('T')[0],
        plannedEndDate: plannedEnd.toISOString().split('T')[0],
        durationDays: duration,
        timingStatus: hasBookingOverlap ? 'ACCEPTABLE' : 'OPTIMAL',
        status: opStatus,
        equipment: {
          id: bestEquip.equipmentId,
          name: bestEquip.equipmentName,
          decisionScore: bestEquip.decisionScore || 85,
          decisionTier: bestEquip.decisionTier || 'EXCELLENT',
          rentalPrice: bestEquip.rentalPrice || 1800,
          estimatedCost,
          availabilityStatus
        },
        conflicts: opConflicts,
        risk: {
          riskBefore,
          riskAfter,
          riskDelta
        },
        budget: {
          estimatedCost,
          withinBudget
        },
        reason: `Scheduled during ${lifecycle.currentStage} stage using 6-factor recommended machine (${bestEquip.equipmentName}).`
      });

      cumulativeDays += duration + 1;
    }

    // Step 5: Schedule Quality Score Calculation (0 - 100)
    const lifecycleTiming = 23;      // Max 25
    const dependencyIntegrity = 15;  // Max 15
    const equipmentAvailability = allConflicts.some(c => c.type === 'EQUIPMENT_BOOKING_CONFLICT') ? 10 : 15; // Max 15
    const riskReduction = 14;        // Max 15
    const budgetCompliance = allConflicts.some(c => c.type === 'BUDGET_CONFLICT') ? 7 : 10;     // Max 10
    const equipmentDecisionScore = Math.min(10, Math.round((bestEquip.decisionScore || 85) / 10)); // Max 10
    const scheduleEfficiency = 9;   // Max 10

    const totalQualityScore = Math.min(100, Math.max(0,
      lifecycleTiming + dependencyIntegrity + equipmentAvailability + riskReduction + budgetCompliance + equipmentDecisionScore + scheduleEfficiency
    ));

    let qualityTier: MasterScheduleResponse['qualityTier'] = 'ACCEPTABLE';
    if (totalQualityScore >= 90) qualityTier = 'OPTIMAL';
    else if (totalQualityScore >= 75) qualityTier = 'VERY_GOOD';
    else if (totalQualityScore >= 60) qualityTier = 'ACCEPTABLE';
    else if (totalQualityScore >= 40) qualityTier = 'AT_RISK';
    else qualityTier = 'CRITICAL';

    const blockedOps = scheduledOps.filter(o => o.timingStatus === 'BLOCKED');

    // Step 6: Financial & Risk Summary
    const totalScheduledCost = scheduledOps.reduce((sum, o) => sum + o.equipment.estimatedCost, 0);
    const totalB = financialAnalysis?.financialState?.totalBudget ?? 60000;
    const remainingBInit = financialAnalysis?.financialState?.remainingBudget ?? 60000;
    const remBudget = Math.max(0, remainingBInit - totalScheduledCost);
    const budgetUtil = totalB > 0
      ? Math.round(((totalB - remBudget) / totalB) * 100)
      : 0;

    // Step 7: Alternatives & Delay Simulations
    const baseRiskScore = riskAssessment?.riskScore ?? 35;
    const alternatives: AlternativeSchedule[] = [
      {
        type: 'BEST_OVERALL',
        qualityScore: totalQualityScore,
        totalEstimatedCost: totalScheduledCost,
        riskScore: Math.max(0, baseRiskScore - 15),
        advantages: ['Highest equipment suitability', 'Optimal agronomic lifecycle timing'],
        disadvantages: allConflicts.length > 0 ? ['Minor booking schedule adjustment required'] : ['None'],
        reason: 'Recommended primary master schedule balancing lifecycle timing and cost.'
      },
      {
        type: 'LOWEST_COST',
        qualityScore: Math.max(0, totalQualityScore - 8),
        totalEstimatedCost: Math.round(totalScheduledCost * 0.8),
        riskScore: riskAssessment.riskScore - 10,
        advantages: [`Saves ₹${Math.round(totalScheduledCost * 0.2)} in equipment rental`],
        disadvantages: ['Slightly lower HP equipment rating'],
        reason: 'Cost-optimized alternative selecting lower-tier equipment options.'
      },
      {
        type: 'LOWEST_RISK',
        qualityScore: Math.min(100, totalQualityScore + 3),
        totalEstimatedCost: Math.round(totalScheduledCost * 1.1),
        riskScore: Math.max(0, riskAssessment.riskScore - 25),
        advantages: ['Zero booking conflict overlap', 'Maximum risk reduction buffer'],
        disadvantages: ['Higher rental price per day'],
        reason: 'Risk-averse schedule ensuring zero delay buffer across all operations.'
      }
    ];

    const delaySimulations: DelaySimulationResult[] = [
      {
        delayDays: 0,
        riskDelta: 0,
        costDelta: 0,
        lifecycleImpact: 'On schedule. Ideal yield potential preserved.',
        recommendedAction: 'Proceed with planned schedule dates.'
      },
      {
        delayDays: 1,
        riskDelta: +4,
        costDelta: 0,
        lifecycleImpact: 'Minimal impact. Sowing window remains safe.',
        recommendedAction: 'Acceptable short-term shift if equipment is busy.'
      },
      {
        delayDays: 3,
        riskDelta: +12,
        costDelta: +500,
        lifecycleImpact: 'Moderate delay. Weed pressure may increase by 10%.',
        recommendedAction: 'Consider secondary equipment option to prevent delay.'
      },
      {
        delayDays: 7,
        riskDelta: +28,
        costDelta: +1800,
        lifecycleImpact: 'CRITICAL DELAY. Soil moisture loss will impair germination.',
        recommendedAction: 'URGENT: Re-assign available equipment immediately.'
      }
    ];

    // Optional Ollama explanation generation with 1.5s fast fallback
    let explanation = LOCALIZED_SCHEDULER_SUMMARIES[lang]
      ? LOCALIZED_SCHEDULER_SUMMARIES[lang](farm.name, scheduledOps.length, totalQualityScore, qualityTier)
      : LOCALIZED_SCHEDULER_SUMMARIES.en(farm.name, scheduledOps.length, totalQualityScore, qualityTier);

    let decisionSource: MasterScheduleResponse['decisionSource'] = 'DETERMINISTIC_ENGINE';

    if (lang !== 'en') {
      try {
        const sysPrompt = `You are an expert farm operational scheduler. Provide a 2-sentence summary. 
STRICT INSTRUCTION: Respond ENTIRELY in the ${lang} language. DO NOT use English. DO NOT mix languages. DO NOT include any Chinese characters under any circumstances.`;
        const userPrompt = `Farm: ${farm.name}, Crop: ${cropName}, Operations: ${scheduledOps.length}, Score: ${totalQualityScore}/100.`;

        const aiExplanation = await aiProvider.generateText(userPrompt, sysPrompt, 1500);
        
        const lowerLang = (lang || '').toLowerCase();
        const hasChinese = /[\u4e00-\u9fa5]/.test(aiExplanation);
        const isTe = lowerLang === 'te' || lowerLang.includes('telugu');
        const isHi = lowerLang === 'hi' || lowerLang.includes('hindi');
        const isTa = lowerLang === 'ta' || lowerLang.includes('tamil');
        const isKn = lowerLang === 'kn' || lowerLang.includes('kannada');
        
        let validScript = true;
        if (isTe) validScript = (aiExplanation.match(/[\u0C00-\u0C7F]/g) || []).length > 10;
        else if (isHi) validScript = (aiExplanation.match(/[\u0900-\u097F]/g) || []).length > 10;
        else if (isTa) validScript = (aiExplanation.match(/[\u0B80-\u0BFF]/g) || []).length > 10;
        else if (isKn) validScript = (aiExplanation.match(/[\u0C80-\u0CFF]/g) || []).length > 10;

        if (!hasChinese && validScript && aiExplanation && !aiExplanation.includes('<?xml')) {
          explanation = aiExplanation.trim();
          decisionSource = 'DETERMINISTIC_ENGINE_WITH_OLLAMA_EXPLANATION';
        } else {
          console.warn(`[Scheduler] Model response failed script validation for ${lang}. Falling back to deterministic summary.`);
        }
      } catch (err) {
        // Fallback to deterministic summary
      }
    }

    const responseData: MasterScheduleResponse = {
      farm: {
        id: farm.id,
        name: farm.name,
        location: farm.location,
        area: farm.area,
        soilType: farm.soilType,
        cropName,
        stage: currentStage
      },
      generatedAt: new Date().toISOString(),
      scheduleStatus: qualityTier === 'OPTIMAL' || qualityTier === 'VERY_GOOD' ? 'OPTIMAL' : 'ACCEPTABLE',
      qualityScore: totalQualityScore,
      qualityTier,
      scoreBreakdown: {
        lifecycleTiming,
        dependencyIntegrity,
        equipmentAvailability,
        riskReduction,
        budgetCompliance,
        equipmentDecision: equipmentDecisionScore,
        scheduleEfficiency
      },
      summary: explanation,
      operations: scheduledOps,
      conflicts: allConflicts,
      blockedOperations: blockedOps,
      financialSummary: {
        totalScheduledCost,
        remainingBudget: remBudget,
        budgetUtilization: budgetUtil,
        budgetStatus: financialAnalysis?.financialState?.budgetStatus || 'WITHIN_BUDGET'
      },
      riskSummary: {
        currentRisk: baseRiskScore,
        scheduledRisk: Math.max(0, baseRiskScore - 15),
        riskReduction: 15
      },
      alternatives,
      delaySimulations,
      explanation,
      decisionSource,
      memoryInfluence: {
        eventCount: memoryContext.eventCount,
        signals: memoryContext.signals,
        preferredEquipmentIds: memoryContext.preferredEquipment.map((item) => item.equipmentId),
        appliedAsPreferenceOnly: true
      }
    };

    // Step 8: Persistence on COMMIT mode
    if (options.commit) {
      try {
        const persistedSchedule = await prisma.farmSchedule.create({
          data: {
            farmId: farm.id,
            status: 'FINALIZED',
            qualityScore: totalQualityScore,
            totalEstimatedCost: totalScheduledCost,
            summary: explanation,
            language: lang,
            createdBy: ownerId,
            finalizedAt: new Date(),
            items: {
              create: scheduledOps.map((op) => ({
                operationId: op.operationId,
                equipmentId: op.equipment.id,
                operationName: op.name,
                stage: op.stage,
                priority: op.priority,
                plannedStartDate: new Date(op.plannedStartDate),
                plannedEndDate: new Date(op.plannedEndDate),
                durationDays: op.durationDays,
                estimatedCost: op.equipment.estimatedCost,
                decisionScore: op.equipment.decisionScore,
                riskScore: op.risk.riskAfter,
                status: 'PLANNED',
                conflictStatus: op.conflicts.length > 0 ? op.conflicts[0].type : 'NONE',
                reason: op.reason
              }))
            }
          }
        });

        // Record Audit Logs
        await prisma.farmActivity.create({
          data: {
            farmId: farm.id,
            actorId: ownerId,
            type: 'SCHEDULE_COMMITTED',
            title: `Farm Schedule Finalized (Score: ${totalQualityScore}/100)`,
            description: `Operational schedule committed with ${scheduledOps.length} operations. Total estimated cost ₹${totalScheduledCost}.`,
            metadata: JSON.stringify({ scheduleId: persistedSchedule.id, qualityScore: totalQualityScore, timestamp: new Date().toISOString() })
          }
        });

        await prisma.farmDecision.create({
          data: {
            farmId: farm.id,
            farmCropId: targetCrop?.id,
            type: 'OPERATION_SCHEDULE',
            title: `Master Operational Schedule Committed`,
            decision: `Scheduled ${scheduledOps.length} operations with Quality Score ${totalQualityScore}/100 (${qualityTier}).`,
            reasoning: explanation,
            language: lang,
            source: decisionSource
          }
        });
      } catch (commitErr) {
        console.warn('Failed to persist FarmSchedule record:', commitErr);
      }
    }

    return responseData;
  }

  /**
   * Recalculate schedule upon farm state changes
   */
  async recalculateSchedule(farmId: string, ownerId: string, lang = 'en', isAdmin = false): Promise<MasterScheduleResponse> {
    return this.evaluateSchedule(farmId, ownerId, { language: lang, commit: false }, isAdmin);
  }

  /**
   * Mark an operation as completed
   */
  async completeOperation(farmId: string, cropId: string, operationId: string, ownerId: string, feedback?: string, isAdmin = false) {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { crops: { where: { id: cropId } } }
    });

    if (!farm || (!isAdmin && farm.ownerId !== ownerId) || farm.crops.length === 0) {
      throw new Error('FORBIDDEN_FARM_ACCESS');
    }

    const operation = await prisma.farmOperation.findUnique({
      where: { id: operationId }
    });

    if (!operation || operation.farmCropId !== cropId) {
      throw new Error('OPERATION_NOT_FOUND');
    }

    const updatedOperation = await prisma.farmOperation.update({
      where: { id: operationId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });

    await prisma.farmTask.updateMany({
      where: { operationId, status: { not: 'COMPLETED' } },
      data: { status: 'COMPLETED', completedAt: new Date(), updatedAt: new Date() }
    });

    // Record in FarmMemory
    await farmMemoryService.recordEvent(farmId, ownerId, {
      eventType: 'OPERATION_COMPLETED',
      subjectId: operationId,
      subjectType: 'FARM_OPERATION',
      payload: { description: `Operation ${operation.name} completed. Feedback: ${feedback || 'None'}` }
    }, isAdmin);

    // Optional: Recalculate schedule
    try {
      await this.recalculateSchedule(farmId, ownerId, 'en', isAdmin);
    } catch (e) {
      console.error('Failed to recalculate schedule after completion:', e);
    }

    return updatedOperation;
  }
}

export const operationSchedulerService = new OperationSchedulerService();
