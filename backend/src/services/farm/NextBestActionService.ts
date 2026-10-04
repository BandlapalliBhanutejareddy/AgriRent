import { prisma } from '../../lib/prisma';
import { farmDigitalTwinService } from './FarmDigitalTwinService';
import { cropLifecycleService } from './CropLifecycleService';
import { getCropLifecycleRules } from './CropLifecycleRules';
import { equipmentRecommendationService, MatchedEquipmentResult } from '../ai/EquipmentRecommendationService';
import { aiProvider } from '../aiProvider';

export interface ActionScoreBreakdown {
  lifecycle: number;
  urgency: number;
  dependency: number;
  risk: number;
  equipment: number;
  budget: number;
}

export interface NextBestActionItem {
  id: string;
  farmId: string;
  cropId: string | null;
  title: string;
  description: string;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OPTIONAL';
  score: number;
  scoreBreakdown: ActionScoreBreakdown;
  stage: string;
  dueDate: string | null;
  urgency: 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'UPCOMING' | 'NO_DEADLINE';
  estimatedCost: number | null;
  budgetStatus: 'WITHIN_BUDGET' | 'NEAR_BUDGET_LIMIT' | 'OVER_BUDGET';
  requiredEquipmentCategory: string;
  recommendedEquipment: MatchedEquipmentResult | null;
  equipmentAvailability: 'AVAILABLE' | 'BOOKED' | 'PARTIALLY_AVAILABLE' | 'NOT_SUITABLE' | 'NO_EQUIPMENT';
  conflictStatus: 'NONE' | 'BLOCKED_BY_EQUIPMENT' | 'BLOCKED_BY_DEPENDENCY' | 'BLOCKED_BY_BUDGET' | 'DATE_CONFLICT';
  riskIfDelayed: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  source: 'TASK' | 'OPERATION' | 'LIFECYCLE_RULE' | 'AGRONOMIC_RULE';
  isBlocked: boolean;
  blockedReason?: string;
}

export interface NextBestActionResponse {
  farm: {
    id: string;
    name: string;
    location: string;
    area: number;
    soilType: string;
  };
  crop: {
    id: string | null;
    cropName: string;
    stage: string;
    season: string;
  } | null;
  currentStage: string;
  bestAction: NextBestActionItem | null;
  nextActions: NextBestActionItem[];
  blockedActions: NextBestActionItem[];
  completedRecentActions: any[];
  farmStatus: {
    summary: string;
    overallUrgency: string;
    budgetStatus: string;
    activeCropCount: number;
  };
  generatedAt: string;
  decisionSource: 'DETERMINISTIC_ENGINE' | 'DETERMINISTIC_ENGINE_WITH_OLLAMA_EXPLANATION';
}

const LOCALIZED_ACTION_REASONS: Record<string, Record<string, (action: string, stage: string, urgency: string) => string>> = {
  en: {
    template: (action, stage, urgency) =>
      `Action '${action}' is required for ${stage} stage (Urgency: ${urgency.replace('_', ' ')}). Required equipment is checked against local inventory.`
  },
  te: {
    template: (action, stage, urgency) =>
      `చర్య '${action}' అనేది ${stage} దశకు చాలా అవసరం (అత్యవసరత: ${urgency}). స్థానిక పరికరాల నిల్వ పరిశీలించబడింది.`
  },
  hi: {
    template: (action, stage, urgency) =>
      `कार्य '${action}' ${stage} चरण के लिए आवश्यक है (अत्यावश्यकता: ${urgency})। आवश्यक उपकरण स्थानीय इन्वेंट्री से जांचे गए हैं।`
  },
  ta: {
    template: (action, stage, urgency) =>
      `நடவடிக்கை '${action}' ${stage} நிலைக்கு தேவைப்படுகிறது (அவசரம்: ${urgency}). தேவையான உபகரணங்கள் சரிபார்க்கப்பட்டன.`
  },
  kn: {
    template: (action, stage, urgency) =>
      `ಕ್ರಿಯೆ '${action}' ${stage} ಹಂತಕ್ಕೆ ಅಗತ್ಯವಿದೆ (ತುರ್ತು: ${urgency}). ಅಗತ್ಯ ಉಪಕರಣಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.`
  }
};

const STAGE_DEPENDENCY_ORDER: Record<string, number> = {
  'SOWING': 1,
  'GERMINATION': 2,
  'SEEDLING': 3,
  'VEGETATIVE': 4,
  'FLOWERING': 5,
  'FRUITING': 6,
  'MATURITY': 7,
  'HARVEST': 8,
  'POST_HARVEST': 9
};

export class NextBestActionService {
  /**
   * Main entry point to evaluate and return ranked Next Best Actions for a farm
   */
  async getNextBestActions(
    farmId: string,
    ownerId: string,
    targetCropId?: string,
    lang = 'en',
    isAdmin = false
  ): Promise<NextBestActionResponse> {
    const aggregate = await farmDigitalTwinService.getDigitalTwinAggregate(farmId, ownerId, isAdmin);
    const farm = aggregate.farm;

    let targetCrop = aggregate.crops[0] || null;
    if (targetCropId) {
      targetCrop = aggregate.crops.find((c: any) => c.id === targetCropId) || targetCrop;
    }

    if (!targetCrop) {
      return this.buildNoActionResponse(farm, lang);
    }

    // Step 1 & 2 & 3: Lifecycle Evaluation
    const lifecycle = await cropLifecycleService.evaluateCropLifecycle(targetCrop.id, ownerId, isAdmin);
    const rules = getCropLifecycleRules(targetCrop.cropName);

    // Step 4 & 5: Collect candidates from Tasks, Operations, and Lifecycle Rules
    const candidateItems: NextBestActionItem[] = await this.collectCandidateActions(
      farm,
      targetCrop,
      lifecycle,
      rules,
      aggregate.operations,
      aggregate.tasks,
      aggregate.budgets[0] || null,
      lang
    );

    if (candidateItems.length === 0) {
      return this.buildNoActionResponse(farm, lang, targetCrop, lifecycle);
    }

    // Sort candidates by score descending
    candidateItems.sort((a, b) => b.score - a.score);

    // Separate active vs blocked candidates
    const availableActions = candidateItems.filter(item => !item.isBlocked);
    const blockedActions = candidateItems.filter(item => item.isBlocked);

    const bestAction = availableActions.length > 0 ? availableActions[0] : null;
    const nextActions = availableActions.slice(1, 4);

    // Optional Ollama explanation refinement with fast 1.5s fallback
    let decisionSource: NextBestActionResponse['decisionSource'] = 'DETERMINISTIC_ENGINE';
    if (bestAction && lang !== 'en') {
      try {
        const sysPrompt = `You are an expert agronomic advisor. Explain why this action is recommended in 2 short sentences in ${lang} language.`;
        const userPrompt = `Action: ${bestAction.title}, Crop: ${targetCrop.cropName}, Stage: ${bestAction.stage}, Urgency: ${bestAction.urgency}.`;
        
        // Use a strict 1500ms timeout for the API call to prevent blocking
        const explanation = await aiProvider.generateText(userPrompt, sysPrompt, 1500);
        
        if (explanation && !explanation.includes('<?xml')) {
          bestAction.reason = explanation.trim();
          decisionSource = 'DETERMINISTIC_ENGINE_WITH_OLLAMA_EXPLANATION';
        }
      } catch (err) {
        // Fallback to deterministic localized explanation
      }
    }

    // Completed recent actions
    const completedRecentActions = aggregate.operations
      .filter((o: any) => o.status === 'COMPLETED' || o.completedAt)
      .slice(0, 5);

    // Record decision in FarmDecision DB for audit tracking
    if (bestAction) {
      try {
        await prisma.farmDecision.create({
          data: {
            farmId: farm.id,
            farmCropId: targetCrop.id,
            type: 'NEXT_BEST_ACTION',
            title: bestAction.title,
            decision: `Recommended: ${bestAction.title} (Priority: ${bestAction.priority}, Score: ${bestAction.score}/100)`,
            reasoning: bestAction.reason,
            language: lang,
            source: decisionSource
          }
        });
      } catch (err) {
        console.warn('Failed to persist FarmDecision record:', err);
      }
    }

    const budgetObj = aggregate.budgets[0];
    const totalBudget = budgetObj ? Number(budgetObj.totalBudget) : 0;
    const spentAmount = budgetObj ? Number(budgetObj.spentAmount) : 0;
    const budgetStatus: NextBestActionItem['budgetStatus'] =
      totalBudget <= 0 ? 'WITHIN_BUDGET' : spentAmount > totalBudget ? 'OVER_BUDGET' : spentAmount > totalBudget * 0.85 ? 'NEAR_BUDGET_LIMIT' : 'WITHIN_BUDGET';

    return {
      farm: {
        id: farm.id,
        name: farm.name,
        location: farm.location,
        area: farm.area,
        soilType: farm.soilType
      },
      crop: {
        id: targetCrop.id,
        cropName: targetCrop.cropName,
        stage: lifecycle.currentStage,
        season: targetCrop.season
      },
      currentStage: lifecycle.currentStage,
      bestAction,
      nextActions,
      blockedActions,
      completedRecentActions,
      farmStatus: {
        summary: `Farm ${farm.name} has active ${targetCrop.cropName} in ${lifecycle.currentStage} stage. Total ${candidateItems.length} candidate actions identified.`,
        overallUrgency: bestAction ? bestAction.priority : 'LOW',
        budgetStatus,
        activeCropCount: aggregate.crops.length
      },
      generatedAt: new Date().toISOString(),
      decisionSource
    };
  }

  /**
   * Candidate Action Collector & Prioritization Engine
   */
  private async collectCandidateActions(
    farm: any,
    crop: any,
    lifecycle: any,
    rules: any,
    operations: any[],
    tasks: any[],
    budget: any,
    lang: string
  ): Promise<NextBestActionItem[]> {
    const items: NextBestActionItem[] = [];
    const now = new Date();

    // 1. Collect from Pending FarmTasks
    for (const task of tasks) {
      if (task.status === 'COMPLETED' || task.completedAt) continue;

      const op = operations.find((o: any) => o.id === task.operationId);
      const reqEquipCat = rules.recommendedEquipmentCategory[lifecycle.currentStage] || 'Tractor';

      const candidate = await this.evaluateAndScoreAction(
        `task-${task.id}`,
        farm,
        crop,
        lifecycle,
        rules,
        task.title,
        task.description || `Pending task for ${crop.cropName}`,
        'FARM_TASK',
        task.dueDate ? new Date(task.dueDate) : null,
        task.priority || 'MEDIUM',
        reqEquipCat,
        budget,
        'TASK',
        lang
      );
      items.push(candidate);
    }

    // 2. Collect from Planned/In-Progress Operations
    for (const op of operations) {
      if (op.status === 'COMPLETED' || op.completedAt) continue;

      const reqEquipCat = rules.recommendedEquipmentCategory[lifecycle.currentStage] || 'Tractor';
      const candidate = await this.evaluateAndScoreAction(
        `op-${op.id}`,
        farm,
        crop,
        lifecycle,
        rules,
        op.name,
        op.description || `Operation ${op.name} for ${crop.cropName}`,
        'FARM_OPERATION',
        op.plannedEndDate ? new Date(op.plannedEndDate) : op.plannedStartDate ? new Date(op.plannedStartDate) : null,
        'HIGH',
        reqEquipCat,
        budget,
        'OPERATION',
        lang
      );
      // Avoid duplicate title if already present
      if (!items.some(i => i.title.toLowerCase() === op.name.toLowerCase())) {
        items.push(candidate);
      }
    }

    // 3. Collect Lifecycle Stage Required Operations
    const currentStageOps = rules.requiredOperations[lifecycle.currentStage] || [];
    for (let idx = 0; idx < currentStageOps.length; idx++) {
      const opName = currentStageOps[idx];
      if (!items.some(i => i.title.toLowerCase().includes(opName.toLowerCase()))) {
        const reqEquipCat = rules.recommendedEquipmentCategory[lifecycle.currentStage] || 'Tractor';
        const candidate = await this.evaluateAndScoreAction(
          `lifecycle-${lifecycle.currentStage}-${idx}`,
          farm,
          crop,
          lifecycle,
          rules,
          `${opName} (${lifecycle.currentStage})`,
          `Essential agronomic requirement for ${crop.cropName} during ${lifecycle.currentStage} stage.`,
          'CROP_LIFECYCLE',
          new Date(now.getTime() + (idx + 1) * 2 * 24 * 60 * 60 * 1000), // Due in (idx+1)*2 days
          'HIGH',
          reqEquipCat,
          budget,
          'LIFECYCLE_RULE',
          lang
        );
        items.push(candidate);
      }
    }

    return items;
  }

  /**
   * Explainable 8-Dimension Scoring Engine (0-100)
   */
  private async evaluateAndScoreAction(
    id: string,
    farm: any,
    crop: any,
    lifecycle: any,
    rules: any,
    title: string,
    description: string,
    category: string,
    dueDate: Date | null,
    dbPriority: string,
    reqEquipCat: string,
    budget: any,
    source: NextBestActionItem['source'],
    lang: string
  ): Promise<NextBestActionItem> {
    const now = new Date();

    // 1. Lifecycle Relevance (0 - 25 pts)
    const currentStageOrder = STAGE_DEPENDENCY_ORDER[lifecycle.currentStage] || 1;
    let lifecycleScore = 20; // Default matches current stage
    if (title.toUpperCase().includes(lifecycle.currentStage)) {
      lifecycleScore = 25;
    } else if (lifecycle.nextStage && title.toUpperCase().includes(lifecycle.nextStage)) {
      lifecycleScore = 15;
    }

    // 2. Urgency Calculation (0 - 25 pts)
    let urgency: NextBestActionItem['urgency'] = 'NO_DEADLINE';
    let urgencyScore = 5;

    if (dueDate) {
      const diffMs = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        urgency = 'OVERDUE';
        urgencyScore = 25;
      } else if (diffDays === 0) {
        urgency = 'DUE_TODAY';
        urgencyScore = 22;
      } else if (diffDays <= 3) {
        urgency = 'DUE_SOON';
        urgencyScore = 18;
      } else {
        urgency = 'UPCOMING';
        urgencyScore = 10;
      }
    }

    // 3. Operation Dependency Check (0 - 15 pts)
    let dependencyScore = 15;
    let conflictStatus: NextBestActionItem['conflictStatus'] = 'NONE';
    let isBlocked = false;
    let blockedReason: string | undefined = undefined;

    // Check if prerequisite stage operations are incomplete
    if (currentStageOrder > 1) {
      const prevStages = rules.supportedStages.slice(0, rules.supportedStages.indexOf(lifecycle.currentStage));
      for (const pStage of prevStages) {
        // If title represents a later stage while current stage is behind
        if (title.toUpperCase().includes(rules.completionStage) && lifecycle.currentStage !== rules.harvestStage) {
          dependencyScore = 0;
          conflictStatus = 'BLOCKED_BY_DEPENDENCY';
          isBlocked = true;
          blockedReason = `Cannot perform ${title} because prior stage operations are still incomplete.`;
        }
      }
    }

    // 4. Risk of Delay (0 - 15 pts)
    let riskIfDelayed: NextBestActionItem['riskIfDelayed'] = 'MEDIUM';
    let riskScore = 10;
    if (urgency === 'OVERDUE') {
      riskIfDelayed = 'CRITICAL';
      riskScore = 15;
    } else if (urgency === 'DUE_TODAY' || urgency === 'DUE_SOON') {
      riskIfDelayed = 'HIGH';
      riskScore = 12;
    } else if (urgency === 'NO_DEADLINE') {
      riskIfDelayed = 'LOW';
      riskScore = 5;
    }

    // 5. Equipment Matching & Availability (0 - 10 pts)
    let equipmentScore = 10;
    let equipmentAvailability: NextBestActionItem['equipmentAvailability'] = 'AVAILABLE';
    let recommendedEquipment: MatchedEquipmentResult | null = null;
    let estimatedCost: number | null = null;

    try {
      const matched = await equipmentRecommendationService.matchEquipment(
        {
          crop: crop.cropName,
          soilType: farm.soilType,
          acreage: farm.area,
          location: farm.location,
          farmingStage: lifecycle.currentStage,
          budget: budget ? Number(budget.totalBudget) - Number(budget.spentAmount) : 20000
        },
        [reqEquipCat.toUpperCase(), 'TRACTORS', 'IMPLEMENTS', 'POWER_TILLERS'],
        2
      );

      if (matched && matched.length > 0) {
        recommendedEquipment = matched[0];
        estimatedCost = recommendedEquipment.estimatedTotalCost || recommendedEquipment.pricePerDay * 2;

        if (!recommendedEquipment.available) {
          equipmentAvailability = 'BOOKED';
          equipmentScore = 2;
          if (!isBlocked) {
            isBlocked = true;
            conflictStatus = 'BLOCKED_BY_EQUIPMENT';
            blockedReason = `Required equipment category ${reqEquipCat} is currently booked or unavailable.`;
          }
        }
      } else {
        equipmentAvailability = 'NO_EQUIPMENT';
        equipmentScore = 5;
      }
    } catch (err) {
      equipmentAvailability = 'NO_EQUIPMENT';
      equipmentScore = 5;
    }

    // 6. Budget Feasibility (0 - 10 pts)
    let budgetScore = 10;
    let budgetStatus: NextBestActionItem['budgetStatus'] = 'WITHIN_BUDGET';

    if (budget) {
      const totalB = Number(budget.totalBudget);
      const spentB = Number(budget.spentAmount);
      const remB = totalB - spentB;

      if (estimatedCost && estimatedCost > remB) {
        budgetStatus = 'OVER_BUDGET';
        budgetScore = 2;
        if (!isBlocked) {
          isBlocked = true;
          conflictStatus = 'BLOCKED_BY_BUDGET';
          blockedReason = `Estimated rental cost (₹${estimatedCost}) exceeds remaining farm budget (₹${remB}).`;
        }
      } else if (remB > 0 && spentB / totalB > 0.85) {
        budgetStatus = 'NEAR_BUDGET_LIMIT';
        budgetScore = 6;
      }
    }

    // Total Score Calculation (0 - 100)
    const totalScore = Math.min(100, Math.max(0, lifecycleScore + urgencyScore + dependencyScore + riskScore + equipmentScore + budgetScore));

    // Priority Banding
    let priority: NextBestActionItem['priority'] = 'MEDIUM';
    if (totalScore >= 90) priority = 'CRITICAL';
    else if (totalScore >= 75) priority = 'HIGH';
    else if (totalScore >= 50) priority = 'MEDIUM';
    else if (totalScore >= 25) priority = 'LOW';
    else priority = 'OPTIONAL';

    // Reason generation
    const locGroup = LOCALIZED_ACTION_REASONS[lang] || LOCALIZED_ACTION_REASONS.en;
    const reason = locGroup.template(title, lifecycle.currentStage, urgency);

    return {
      id,
      farmId: farm.id,
      cropId: crop.id,
      title,
      description,
      category,
      priority,
      score: totalScore,
      scoreBreakdown: {
        lifecycle: lifecycleScore,
        urgency: urgencyScore,
        dependency: dependencyScore,
        risk: riskScore,
        equipment: equipmentScore,
        budget: budgetScore
      },
      stage: lifecycle.currentStage,
      dueDate: dueDate ? dueDate.toISOString() : null,
      urgency,
      estimatedCost,
      budgetStatus,
      requiredEquipmentCategory: reqEquipCat,
      recommendedEquipment,
      equipmentAvailability,
      conflictStatus,
      riskIfDelayed,
      reason,
      source,
      isBlocked,
      blockedReason
    };
  }

  /**
   * Action Acknowledgement handler
   */
  async acknowledgeAction(
    farmId: string,
    actionId: string,
    ownerId: string,
    isAdmin = false
  ): Promise<{ success: boolean; message: string }> {
    const aggregate = await farmDigitalTwinService.getDigitalTwinAggregate(farmId, ownerId, isAdmin);

    await prisma.farmActivity.create({
      data: {
        farmId: aggregate.farm.id,
        actorId: ownerId,
        type: 'ACTION_ACKNOWLEDGED',
        title: `Action Acknowledged: ${actionId}`,
        description: `Farmer acknowledged Next Best Action recommendation ${actionId}`,
        metadata: JSON.stringify({ actionId, timestamp: new Date().toISOString() })
      }
    });

    return {
      success: true,
      message: `Action '${actionId}' acknowledged successfully. Database state preserved.`
    };
  }

  private buildNoActionResponse(farm: any, lang: string, crop?: any, lifecycle?: any): NextBestActionResponse {
    return {
      farm: {
        id: farm.id,
        name: farm.name,
        location: farm.location,
        area: farm.area,
        soilType: farm.soilType
      },
      crop: crop ? {
        id: crop.id,
        cropName: crop.cropName,
        stage: lifecycle?.currentStage || crop.stage,
        season: crop.season
      } : null,
      currentStage: lifecycle?.currentStage || 'NONE',
      bestAction: null,
      nextActions: [],
      blockedActions: [],
      completedRecentActions: [],
      farmStatus: {
        summary: 'NO_URGENT_ACTION: Farm operations are currently up to date. No pending urgent actions required.',
        overallUrgency: 'LOW',
        budgetStatus: 'WITHIN_BUDGET',
        activeCropCount: crop ? 1 : 0
      },
      generatedAt: new Date().toISOString(),
      decisionSource: 'DETERMINISTIC_ENGINE'
    };
  }
}

export const nextBestActionService = new NextBestActionService();
