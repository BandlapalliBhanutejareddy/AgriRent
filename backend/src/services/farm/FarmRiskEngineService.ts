import { prisma } from '../../lib/prisma';
import { farmDigitalTwinService } from './FarmDigitalTwinService';
import { cropLifecycleService } from './CropLifecycleService';
import { getCropLifecycleRules } from './CropLifecycleRules';
import { equipmentRecommendationService, MatchedEquipmentResult } from '../ai/EquipmentRecommendationService';
import { aiProvider } from '../aiProvider';

export interface PredictiveRiskScoreBreakdown {
  lifecycleRisk: number; // 0 - 30
  equipmentRisk: number; // 0 - 25
  scheduleRisk: number;  // 0 - 20
  budgetRisk: number;    // 0 - 15
  dependencyRisk: number;// 0 - 10
}

export interface RiskGraphNode {
  id: string;
  type: 'ROOT_CAUSE' | 'INTERMEDIATE_IMPACT' | 'FINAL_CONSEQUENCE';
  title: string;
  description: string;
}

export interface RiskDependencyGraph {
  rootCause: string;
  impactChain: string[];
  nodes: RiskGraphNode[];
}

export interface PreventionPlanItem {
  id: string;
  riskType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  cause: string;
  impact: string;
  prevention: string;
  recommendedAction: string;
  actionType: 'RENT_ALTERNATIVE' | 'RESCHEDULE' | 'ADJUST_BUDGET' | 'ACKNOWLEDGE';
  alternativeEquipment: MatchedEquipmentResult | null;
  status: 'OPEN' | 'RESOLVED';
}

export interface FarmHealthScore {
  overallHealthScore: number; // 0 - 100
  status: 'HEALTHY' | 'MODERATE_RISK' | 'CRITICAL_RISK';
  subScores: {
    cropHealth: number;      // 0 - 100
    scheduleHealth: number;  // 0 - 100
    equipmentHealth: number; // 0 - 100
    budgetHealth: number;    // 0 - 100
    riskHealth: number;      // 0 - 100
  };
}

export interface RiskAssessmentResponse {
  farmId: string;
  farmName: string;
  activeCrop: {
    id: string;
    cropName: string;
    stage: string;
    daysInStage: number;
  } | null;
  riskScore: number; // 0 - 100
  riskSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  scoreBreakdown: PredictiveRiskScoreBreakdown;
  dependencyGraph: RiskDependencyGraph;
  preventionItems: PreventionPlanItem[];
  farmHealth: FarmHealthScore;
  summaryExplanation: string;
  generatedAt: string;
  decisionSource: 'DETERMINISTIC_ENGINE' | 'DETERMINISTIC_ENGINE_WITH_OLLAMA_EXPLANATION';
}

export interface SimulationInput {
  farmId: string;
  cropId?: string;
  operationTitle: string;
  delayDays: number;
}

export interface SimulationResult {
  currentPlan: {
    operation: string;
    scheduledDate: string;
    riskScore: number;
    estimatedCost: number;
  };
  simulatedPlan: {
    operation: string;
    delayedDays: number;
    simulatedRiskScore: number;
    riskDelta: number;
    estimatedCost: number;
    costDelta: number;
    projectedHarvestDelayDays: number;
    simulatedSeverity: string;
  };
  comparison: {
    optionA: {
      title: string;
      riskSeverity: string;
      additionalCost: number;
    };
    optionB: {
      title: string;
      riskSeverity: string;
      additionalCost: number;
      recommendedEquipmentTitle?: string;
    };
    recommendedOption: 'OPTION_A' | 'OPTION_B';
    recommendationReason: string;
  };
}

export class FarmRiskEngineService {
  /**
   * Performs full deterministic Risk Assessment & Dependency Graph evaluation
   */
  async getRiskAssessment(
    farmId: string,
    ownerId: string,
    lang = 'en',
    isAdmin = false
  ): Promise<RiskAssessmentResponse> {
    const aggregate = await farmDigitalTwinService.getDigitalTwinAggregate(farmId, ownerId, isAdmin);
    const farm = aggregate.farm;
    const crop = aggregate.crops[0] || null;

    let lifecycle = null;
    let rules = null;
    if (crop) {
      lifecycle = await cropLifecycleService.evaluateCropLifecycle(crop.id, ownerId, isAdmin);
      rules = getCropLifecycleRules(crop.cropName);
    }

    // 1. Calculate Predictive Risk Score Breakdown
    const scoreBreakdown = await this.calculateRiskScoreBreakdown(
      farm,
      crop,
      lifecycle,
      rules,
      aggregate.operations,
      aggregate.tasks,
      aggregate.budgets[0] || null
    );

    const totalRiskScore = Math.min(
      100,
      scoreBreakdown.lifecycleRisk +
      scoreBreakdown.equipmentRisk +
      scoreBreakdown.scheduleRisk +
      scoreBreakdown.budgetRisk +
      scoreBreakdown.dependencyRisk
    );

    let riskSeverity: RiskAssessmentResponse['riskSeverity'] = 'LOW';
    if (totalRiskScore >= 75) riskSeverity = 'CRITICAL';
    else if (totalRiskScore >= 50) riskSeverity = 'HIGH';
    else if (totalRiskScore >= 25) riskSeverity = 'MEDIUM';

    // 2. Build Risk Dependency Graph & Root Cause Chain
    const dependencyGraph = this.buildDependencyGraph(
      crop,
      lifecycle,
      aggregate.operations,
      aggregate.tasks,
      scoreBreakdown
    );

    // 3. Build Prevention Center Items
    const preventionItems = await this.buildPreventionItems(
      farm,
      crop,
      lifecycle,
      rules,
      aggregate.operations,
      aggregate.tasks,
      aggregate.budgets[0] || null,
      scoreBreakdown
    );

    // 4. Calculate Farm Health Score
    const farmHealth = this.calculateFarmHealthScore(totalRiskScore, scoreBreakdown);

    // 5. Generate Multilingual Explanation with fast Ollama timeout
    let summaryExplanation = `Farm ${farm.name} Risk Score is ${totalRiskScore}/100 (${riskSeverity}). Root Cause: ${dependencyGraph.rootCause}.`;
    let decisionSource: RiskAssessmentResponse['decisionSource'] = 'DETERMINISTIC_ENGINE';

    try {
      const sysPrompt = `You are an expert agricultural risk engine. Provide a concise 2-sentence risk warning in ${lang} language explaining the root cause and impact chain.`;
      const userPrompt = `Farm: ${farm.name}, Risk Score: ${totalRiskScore}/100, Root Cause: ${dependencyGraph.rootCause}, Impact Chain: ${dependencyGraph.impactChain.join(' -> ')}.`;

      const aiRes = await aiProvider.generateText(userPrompt, sysPrompt, 1500);
      if (aiRes && !aiRes.includes('<?xml')) {
        summaryExplanation = aiRes.trim();
        decisionSource = 'DETERMINISTIC_ENGINE_WITH_OLLAMA_EXPLANATION';
      }
    } catch (err) {
      // Revert to deterministic explanation
    }

    // Persist active risks into FarmRisk table for historical tracking
    try {
      for (const item of preventionItems) {
        const existing = await prisma.farmRisk.findFirst({
          where: { farmId: farm.id, title: item.title, status: 'OPEN' }
        });
        if (!existing) {
          await prisma.farmRisk.create({
            data: {
              farmId: farm.id,
              farmCropId: crop?.id || null,
              type: item.riskType,
              severity: item.severity,
              title: item.title,
              description: `${item.cause} Impact: ${item.impact}`,
              status: 'OPEN'
            }
          });
        }
      }
    } catch (err) {
      console.warn('Failed to sync FarmRisk table:', err);
    }

    return {
      farmId: farm.id,
      farmName: farm.name,
      activeCrop: crop ? {
        id: crop.id,
        cropName: crop.cropName,
        stage: lifecycle?.currentStage || crop.stage,
        daysInStage: lifecycle?.daysSinceSowing || 0
      } : null,
      riskScore: totalRiskScore,
      riskSeverity,
      scoreBreakdown,
      dependencyGraph,
      preventionItems,
      farmHealth,
      summaryExplanation,
      generatedAt: new Date().toISOString(),
      decisionSource
    };
  }

  /**
   * Deterministic "What-If" Delay Simulator
   */
  async simulateDelayScenario(
    farmId: string,
    ownerId: string,
    input: SimulationInput,
    isAdmin = false
  ): Promise<SimulationResult> {
    const aggregate = await farmDigitalTwinService.getDigitalTwinAggregate(farmId, ownerId, isAdmin);
    const farm = aggregate.farm;
    const crop = aggregate.crops[0];
    const budgetObj = aggregate.budgets[0];

    const currentAssessment = await this.getRiskAssessment(farmId, ownerId, 'en', isAdmin);
    const currentScore = currentAssessment.riskScore;

    const delayDays = Math.max(1, Math.min(30, input.delayDays || 3));
    const riskDelta = Math.min(40, delayDays * 5 + 3);
    const simulatedRiskScore = Math.min(100, currentScore + riskDelta);

    const baseCost = 2500;
    const extraRentalCost = delayDays * 400;
    const totalSimulatedCost = baseCost + extraRentalCost;

    let simSeverity = 'MEDIUM';
    if (simulatedRiskScore >= 75) simSeverity = 'CRITICAL';
    else if (simulatedRiskScore >= 50) simSeverity = 'HIGH';

    // Option A: Delay operation by N days
    const optionA = {
      title: `Delay '${input.operationTitle}' by ${delayDays} days`,
      riskSeverity: simSeverity,
      additionalCost: extraRentalCost
    };

    // Option B: Rent alternative equipment / reschedule immediately
    let recEquipmentTitle = 'High-Capacity Rotavator A1';
    try {
      const altEquip = await equipmentRecommendationService.matchEquipment(
        { crop: crop?.cropName || 'Rice', acreage: farm.area, location: farm.location },
        ['TRACTORS', 'IMPLEMENTS'],
        1
      );
      if (altEquip && altEquip[0]) {
        recEquipmentTitle = altEquip[0].title;
      }
    } catch (e) {}

    const optionB = {
      title: `Rent alternative equipment (${recEquipmentTitle}) and proceed on schedule`,
      riskSeverity: 'LOW',
      additionalCost: 700,
      recommendedEquipmentTitle: recEquipmentTitle
    };

    return {
      currentPlan: {
        operation: input.operationTitle,
        scheduledDate: new Date().toISOString().split('T')[0],
        riskScore: currentScore,
        estimatedCost: baseCost
      },
      simulatedPlan: {
        operation: input.operationTitle,
        delayedDays: delayDays,
        simulatedRiskScore,
        riskDelta,
        estimatedCost: totalSimulatedCost,
        costDelta: extraRentalCost,
        projectedHarvestDelayDays: Math.ceil(delayDays * 1.2),
        simulatedSeverity: simSeverity
      },
      comparison: {
        optionA,
        optionB,
        recommendedOption: 'OPTION_B',
        recommendationReason: `Proceeding with Option B avoids a ${riskDelta}-point risk score surge and saves ₹${Math.max(0, extraRentalCost - 700)} in potential lifecycle delay losses.`
      }
    };
  }

  /**
   * Risk Resolution Handler
   */
  async resolveRiskItem(
    farmId: string,
    riskId: string,
    ownerId: string,
    isAdmin = false
  ): Promise<{ success: boolean; message: string }> {
    const aggregate = await farmDigitalTwinService.getDigitalTwinAggregate(farmId, ownerId, isAdmin);

    try {
      await prisma.farmRisk.updateMany({
        where: { id: riskId, farmId: aggregate.farm.id },
        data: { status: 'RESOLVED', resolvedAt: new Date() }
      });
    } catch (err) {
      // Risk record might be virtual; log resolution in activity
    }

    await prisma.farmActivity.create({
      data: {
        farmId: aggregate.farm.id,
        actorId: ownerId,
        type: 'RISK_RESOLVED',
        title: `Risk Resolved: ${riskId}`,
        description: `Farmer executed prevention plan for risk item ${riskId}`,
        metadata: JSON.stringify({ riskId, timestamp: new Date().toISOString() })
      }
    });

    return {
      success: true,
      message: `Risk '${riskId}' successfully resolved and risk mitigation plan recorded.`
    };
  }

  // ------------------------------------------------------------------
  // PRIVATE HELPER CALCULATORS
  // ------------------------------------------------------------------

  private async calculateRiskScoreBreakdown(
    farm: any,
    crop: any,
    lifecycle: any,
    rules: any,
    operations: any[],
    tasks: any[],
    budget: any
  ): Promise<PredictiveRiskScoreBreakdown> {
    const now = new Date();

    // 1. Crop Lifecycle Risk (0 - 30)
    let lifecycleRisk = 5;
    if (lifecycle) {
      if (lifecycle.daysInStage > 25) lifecycleRisk = 28;
      else if (lifecycle.daysInStage > 15) lifecycleRisk = 18;
      else if (lifecycle.daysInStage > 10) lifecycleRisk = 12;
    }

    // 2. Equipment Risk (0 - 25)
    let equipmentRisk = 5;
    try {
      const reqCategory = rules?.recommendedEquipmentCategory?.[lifecycle?.currentStage || 'VEGETATIVE'] || 'Tractor';
      const available = await prisma.equipment.findMany({
        where: { available: true, category: { contains: reqCategory, mode: 'insensitive' } }
      });
      if (!available || available.length === 0) {
        equipmentRisk = 22;
      }
    } catch (err) {
      equipmentRisk = 15;
    }

    // 3. Schedule Delay Risk (0 - 20)
    let scheduleRisk = 4;
    const overdueTasks = tasks.filter((t: any) => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < now);
    if (overdueTasks.length > 2) scheduleRisk = 18;
    else if (overdueTasks.length > 0) scheduleRisk = 12;

    // 4. Budget Overrun Risk (0 - 15)
    let budgetRisk = 3;
    if (budget) {
      const totalB = Number(budget.totalBudget);
      const spentB = Number(budget.spentAmount);
      if (totalB > 0) {
        const ratio = spentB / totalB;
        if (ratio > 1.0) budgetRisk = 15;
        else if (ratio > 0.85) budgetRisk = 10;
        else if (ratio > 0.6) budgetRisk = 6;
      }
    }

    // 5. Dependency Risk (0 - 10)
    let dependencyRisk = 2;
    const pendingOps = operations.filter((o: any) => o.status === 'PLANNED' || o.status === 'IN_PROGRESS');
    if (pendingOps.length > 3) dependencyRisk = 8;

    return {
      lifecycleRisk,
      equipmentRisk,
      scheduleRisk,
      budgetRisk,
      dependencyRisk
    };
  }

  private buildDependencyGraph(
    crop: any,
    lifecycle: any,
    operations: any[],
    tasks: any[],
    breakdown: PredictiveRiskScoreBreakdown
  ): RiskDependencyGraph {
    let rootCause = 'Routine seasonal operational scheduling';
    const impactChain: string[] = [];
    const nodes: RiskGraphNode[] = [];

    if (breakdown.equipmentRisk >= 15) {
      rootCause = 'Required tractor/implement currently unavailable';
      impactChain.push('Equipment Unavailable');
      impactChain.push('Land Preparation Delayed');
      impactChain.push('Transplanting Window Missed');
      impactChain.push('Crop Lifecycle Deviation');
      impactChain.push('Potential Additional Rental Cost');
    } else if (breakdown.scheduleRisk >= 12) {
      rootCause = 'Task schedule overdue past recommended agronomic window';
      impactChain.push('Overdue Operations');
      impactChain.push('Weed & Pest Exposure');
      impactChain.push('Yield Potential Loss');
    } else if (breakdown.budgetRisk >= 10) {
      rootCause = 'Spent farm budget approaching allocated total budget';
      impactChain.push('Budget Allocation Near Limit');
      impactChain.push('Restricted Machinery Options');
      impactChain.push('Delayed Operational Dispatch');
    } else {
      impactChain.push('Optimal Field Conditions');
      impactChain.push('On-Schedule Operations');
      impactChain.push('Expected Harvest Target');
    }

    nodes.push({
      id: 'node-root',
      type: 'ROOT_CAUSE',
      title: 'Root Cause',
      description: rootCause
    });

    impactChain.slice(1).forEach((step, idx) => {
      nodes.push({
        id: `node-impact-${idx}`,
        type: idx === impactChain.length - 2 ? 'FINAL_CONSEQUENCE' : 'INTERMEDIATE_IMPACT',
        title: step,
        description: `Downstream impact step #${idx + 1}`
      });
    });

    return {
      rootCause,
      impactChain,
      nodes
    };
  }

  private async buildPreventionItems(
    farm: any,
    crop: any,
    lifecycle: any,
    rules: any,
    operations: any[],
    tasks: any[],
    budget: any,
    breakdown: PredictiveRiskScoreBreakdown
  ): Promise<PreventionPlanItem[]> {
    const items: PreventionPlanItem[] = [];

    if (breakdown.equipmentRisk >= 15) {
      let altEquip: MatchedEquipmentResult | null = null;
      try {
        const matched = await equipmentRecommendationService.matchEquipment(
          { crop: crop?.cropName || 'Rice', acreage: farm.area, location: farm.location },
          ['TRACTORS', 'IMPLEMENTS'],
          1
        );
        if (matched && matched.length > 0) altEquip = matched[0];
      } catch (e) {}

      items.push({
        id: `risk-equip-${Date.now()}`,
        riskType: 'EQUIPMENT_CONFLICT',
        severity: 'HIGH',
        title: 'Equipment Availability Conflict',
        cause: `Primary machine category for ${lifecycle?.currentStage || 'VEGETATIVE'} is currently booked or unavailable.`,
        impact: 'Field operations may be delayed past recommended stage timeline.',
        prevention: 'Select verified alternative available equipment from nearby owners.',
        recommendedAction: altEquip ? `Rent ${altEquip.title} (Est ₹${altEquip.pricePerDay}/day)` : 'Reserve compatible power tiller',
        actionType: 'RENT_ALTERNATIVE',
        alternativeEquipment: altEquip,
        status: 'OPEN'
      });
    }

    if (breakdown.scheduleRisk >= 12) {
      items.push({
        id: `risk-sched-${Date.now()}`,
        riskType: 'SCHEDULE_DELAY',
        severity: 'MEDIUM',
        title: 'Field Operation Schedule Delay',
        cause: 'One or more farm tasks are past their target due date.',
        impact: 'Risk of crop growth stage misalignment and weed competition.',
        prevention: 'Reschedule pending operations to within the next 48 hours.',
        recommendedAction: 'Dispatch operator immediately or adjust task due date',
        actionType: 'RESCHEDULE',
        alternativeEquipment: null,
        status: 'OPEN'
      });
    }

    if (breakdown.budgetRisk >= 10) {
      items.push({
        id: `risk-budget-${Date.now()}`,
        riskType: 'BUDGET_OVERRUN',
        severity: 'MEDIUM',
        title: 'Farm Budget Allocation Limit',
        cause: 'Cumulative spent amount has exceeded 85% of total budget.',
        impact: 'Insufficient funds reserved for upcoming harvest operations.',
        prevention: 'Opt for cost-optimized equipment bundles or adjust allocated budget.',
        recommendedAction: 'Choose budget-tier machinery or reallocate reserved funds',
        actionType: 'ADJUST_BUDGET',
        alternativeEquipment: null,
        status: 'OPEN'
      });
    }

    return items;
  }

  private calculateFarmHealthScore(totalRiskScore: number, breakdown: PredictiveRiskScoreBreakdown): FarmHealthScore {
    const overallHealthScore = Math.max(0, 100 - totalRiskScore);

    let status: FarmHealthScore['status'] = 'HEALTHY';
    if (overallHealthScore < 50) status = 'CRITICAL_RISK';
    else if (overallHealthScore < 80) status = 'MODERATE_RISK';

    return {
      overallHealthScore,
      status,
      subScores: {
        cropHealth: Math.max(0, 100 - breakdown.lifecycleRisk * 3),
        scheduleHealth: Math.max(0, 100 - breakdown.scheduleRisk * 4),
        equipmentHealth: Math.max(0, 100 - breakdown.equipmentRisk * 3.5),
        budgetHealth: Math.max(0, 100 - breakdown.budgetRisk * 5),
        riskHealth: Math.max(0, 100 - breakdown.dependencyRisk * 8)
      }
    };
  }
}

export const farmRiskEngineService = new FarmRiskEngineService();
