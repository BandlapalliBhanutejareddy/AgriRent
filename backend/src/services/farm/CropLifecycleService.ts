import { prisma } from '../../lib/prisma';
import { getCropLifecycleRules, CropLifecycleDefinition } from './CropLifecycleRules';
import { aiProvider } from '../aiProvider';

export interface CropLifecycleEvaluation {
  cropId: string;
  cropName: string;
  farmId: string;
  currentStage: string;
  calculatedStage: string;
  nextStage: string | null;
  previousStage: string | null;
  progressPercent: number;
  lifecycleStatus: 'ON_TRACK' | 'EARLY' | 'LATE' | 'HARVEST_READY' | 'COMPLETED';
  daysSinceSowing: number;
  daysToExpectedHarvest: number;
  transitionAllowed: boolean;
  explanation: string;
  requiredOperations: string[];
  recommendedEquipmentCategory: string;
  sowingDate: Date;
  expectedHarvestDate: Date;
  status: string;
}

const LOCALIZED_EXPLANATIONS: Record<string, Record<string, (crop: string, stage: string, days: number, status: string) => string>> = {
  en: {
    template: (crop, stage, days, status) =>
      `Your ${crop} crop is currently at the ${stage} stage (${days} days since sowing). Status: ${status.replace('_', ' ')}.`
  },
  te: {
    template: (crop, stage, days, status) =>
      `మీ ${crop} పంట ప్రస్తుతం ${stage} దశలో ఉంది (విత్తినప్పటి నుండి ${days} రోజులు). స్థితి: ${status}.`
  },
  hi: {
    template: (crop, stage, days, status) =>
      `आपकी ${crop} फसल वर्तमान में ${stage} चरण में है (बुआई के ${days} दिन बाद)। स्थिति: ${status}।`
  },
  ta: {
    template: (crop, stage, days, status) =>
      `உங்கள் ${crop} பயிர் தற்போது ${stage} நிலையில் உள்ளது (விதைத்து ${days} நாட்கள்). நிலை: ${status}.`
  },
  kn: {
    template: (crop, stage, days, status) =>
      `ನಿಮ್ಮ ${crop} ಬೆಳೆಯು ಪ್ರಸ್ತುತ ${stage} ಹಂತದಲ್ಲಿದೆ (ಬಿತ್ತನೆಯಿಂದ ${days} ದಿನಗಳು). ಸ್ಥಿತಿ: ${status}.`
  }
};

export class CropLifecycleService {
  /**
   * Evaluate crop lifecycle state deterministically without mutating the database
   */
  async evaluateCropLifecycle(cropId: string, ownerId: string, isAdmin = false): Promise<CropLifecycleEvaluation> {
    const crop = await prisma.farmCrop.findUnique({
      where: { id: cropId },
      include: {
        farm: true
      }
    });

    if (!crop) {
      throw new Error('CROP_NOT_FOUND');
    }

    if (!isAdmin && crop.farm.ownerId !== ownerId) {
      throw new Error('FORBIDDEN_CROP_ACCESS');
    }

    const rules = getCropLifecycleRules(crop.cropName);
    const sowingDate = crop.sowingDate || crop.createdAt;
    const now = new Date();
    
    // Calculate days elapsed
    const diffTime = Math.max(0, now.getTime() - sowingDate.getTime());
    const daysSinceSowing = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Calculate expected harvest date if missing
    let expectedHarvestDate = crop.expectedHarvestDate;
    if (!expectedHarvestDate) {
      expectedHarvestDate = new Date(sowingDate.getTime() + rules.totalDurationDays.avgDays * 24 * 60 * 60 * 1000);
    }

    const diffHarvest = expectedHarvestDate.getTime() - now.getTime();
    const daysToExpectedHarvest = Math.ceil(diffHarvest / (1000 * 60 * 60 * 24));

    // Determine calculated stage based on days elapsed
    const calculatedStage = this.calculateStageFromDays(rules, daysSinceSowing);

    // Current stage from DB
    const currentStage = (crop.stage || rules.supportedStages[0]).toUpperCase();
    const currentOrder = rules.stageOrder[currentStage] || 1;

    // Previous and Next stages
    const prevStageIndex = rules.supportedStages.indexOf(currentStage) - 1;
    const nextStageIndex = rules.supportedStages.indexOf(currentStage) + 1;

    const previousStage = prevStageIndex >= 0 ? rules.supportedStages[prevStageIndex] : null;
    const nextStage = nextStageIndex < rules.supportedStages.length ? rules.supportedStages[nextStageIndex] : null;

    // Progress percentage
    const totalAvg = rules.totalDurationDays.avgDays;
    
    let stageCumulativeDays = 0;
    for (const st of rules.supportedStages) {
      if (st === currentStage) break;
      stageCumulativeDays += rules.stageDurations[st]?.avgDays || 0;
    }
    const effectiveDays = Math.max(daysSinceSowing, stageCumulativeDays);
    const progressPercent = Math.min(100, Math.max(0, Math.round((effectiveDays / totalAvg) * 100)));

    // Determine lifecycle status
    let lifecycleStatus: CropLifecycleEvaluation['lifecycleStatus'] = 'ON_TRACK';
    const calcOrder = rules.stageOrder[calculatedStage] || 1;

    if (currentStage === rules.harvestStage) {
      lifecycleStatus = 'HARVEST_READY';
    } else if (currentStage === rules.completionStage || crop.status === 'COMPLETED') {
      lifecycleStatus = 'COMPLETED';
    } else if (currentOrder > calcOrder + 1) {
      lifecycleStatus = 'EARLY';
    } else if (currentOrder < calcOrder - 1 || daysSinceSowing > totalAvg + 15) {
      lifecycleStatus = 'LATE';
    }

    const transitionAllowed = nextStage !== null && currentStage !== rules.completionStage;

    const explanation = `Crop ${crop.cropName} is in ${currentStage} stage (${daysSinceSowing} days active). Expected harvest in ${daysToExpectedHarvest} days.`;
    const requiredOperations = rules.requiredOperations[currentStage] || ['Field Monitoring'];
    const recommendedEquipmentCategory = rules.recommendedEquipmentCategory[currentStage] || 'Tractor';

    return {
      cropId: crop.id,
      cropName: crop.cropName,
      farmId: crop.farmId,
      currentStage,
      calculatedStage,
      nextStage,
      previousStage,
      progressPercent,
      lifecycleStatus,
      daysSinceSowing,
      daysToExpectedHarvest,
      transitionAllowed,
      explanation,
      requiredOperations,
      recommendedEquipmentCategory,
      sowingDate,
      expectedHarvestDate,
      status: crop.status
    };
  }

  /**
   * Advance crop stage to the next valid sequential stage
   */
  async advanceCropStage(cropId: string, ownerId: string, isAdmin = false): Promise<CropLifecycleEvaluation> {
    const evalState = await this.evaluateCropLifecycle(cropId, ownerId, isAdmin);

    if (!evalState.transitionAllowed || !evalState.nextStage) {
      throw new Error('INVALID_STAGE_TRANSITION: Crop is at final stage or cannot advance.');
    }

    const previousStage = evalState.currentStage;
    const newStage = evalState.nextStage;
    const rules = getCropLifecycleRules(evalState.cropName);

    const isCompleted = newStage === rules.completionStage;

    const updateCrop = prisma.farmCrop.update({
      where: { id: cropId },
      data: {
        stage: newStage,
        ...(isCompleted && { status: 'COMPLETED' })
      }
    });

    const createActivity = prisma.farmActivity.create({
      data: {
        farmId: evalState.farmId,
        actorId: ownerId,
        type: 'CROP_STAGE_ADVANCED',
        title: `Crop Stage Advanced to ${newStage}`,
        description: `Advanced ${evalState.cropName} from ${previousStage} to ${newStage}`,
        metadata: JSON.stringify({
          cropId,
          previousStage,
          newStage,
          source: 'AUTOMATIC_ADVANCE'
        })
      }
    });

    await prisma.$transaction([updateCrop, createActivity]);

    return await this.evaluateCropLifecycle(cropId, ownerId, isAdmin);
  }

  /**
   * Manually override crop stage with a required reason
   */
  async overrideCropStage(
    cropId: string,
    ownerId: string,
    requestedStage: string,
    reason: string,
    isAdmin = false
  ): Promise<CropLifecycleEvaluation> {
    const effectiveReason = (reason && reason.trim().length >= 3) ? reason.trim() : 'Farmer updated crop stage';
    const evalState = await this.evaluateCropLifecycle(cropId, ownerId, isAdmin);
    const rules = getCropLifecycleRules(evalState.cropName);

    const targetStage = (requestedStage || '').trim().toUpperCase();
    if (!rules.supportedStages.includes(targetStage)) {
      throw new Error(`UNSUPPORTED_STAGE: '${targetStage}' is not a valid stage for ${evalState.cropName}.`);
    }

    const previousStage = evalState.currentStage;
    const isCompleted = targetStage === rules.completionStage;

    const updateCrop = prisma.farmCrop.update({
      where: { id: cropId },
      data: {
        stage: targetStage,
        ...(isCompleted && { status: 'COMPLETED' })
      }
    });

    const createActivity = prisma.farmActivity.create({
      data: {
        farmId: evalState.farmId,
        actorId: ownerId,
        type: 'CROP_STAGE_OVERRIDE',
        title: `Crop Stage Overridden to ${targetStage}`,
        description: `Manual override of ${evalState.cropName} from ${previousStage} to ${targetStage}. Reason: ${effectiveReason}`,
        metadata: JSON.stringify({
          cropId,
          previousStage,
          newStage: targetStage,
          reason: effectiveReason,
          source: 'MANUAL_OVERRIDE'
        })
      }
    });

    await prisma.$transaction([updateCrop, createActivity]);

    return await this.evaluateCropLifecycle(cropId, ownerId, isAdmin);
  }

  /**
   * Get localized agricultural explanation for a crop's current stage
   */
  async getStageExplanation(
    cropId: string,
    ownerId: string,
    language = 'en',
    isAdmin = false
  ): Promise<{ explanation: string; language: string }> {
    const evalState = await this.evaluateCropLifecycle(cropId, ownerId, isAdmin);
    const lang = (language || 'en').toLowerCase();

    // Deterministic localized fallback
    const locGroup = LOCALIZED_EXPLANATIONS[lang] || LOCALIZED_EXPLANATIONS.en;
    const defaultTemplate = locGroup.template(
      evalState.cropName,
      evalState.currentStage,
      evalState.daysSinceSowing,
      evalState.lifecycleStatus
    );

    // Optional Local Ollama Explanation with fast fallback
    try {
      const systemPrompt = `You are an agronomic expert advisor. Explain the current crop stage for a farmer. Answer ONLY in 2-3 concise sentences in ${lang} language.`;
      const userPrompt = `Crop: ${evalState.cropName}, Stage: ${evalState.currentStage}, Days since sowing: ${evalState.daysSinceSowing}, Status: ${evalState.lifecycleStatus}. Give practical advice for this stage.`;

      const aiText = await aiProvider.generateText(userPrompt, systemPrompt, 1000);

      if (aiText && aiText.trim().length > 0 && !aiText.includes('<?xml')) {
        return { explanation: aiText.trim(), language: lang };
      }
    } catch (err) {
      // Clean fallback if Ollama offline/timed out
    }

    return { explanation: defaultTemplate, language: lang };
  }

  private calculateStageFromDays(rules: CropLifecycleDefinition, days: number): string {
    let accumulatedDays = 0;
    for (const stage of rules.supportedStages) {
      const duration = rules.stageDurations[stage]?.avgDays || 10;
      accumulatedDays += duration;
      if (days <= accumulatedDays) {
        return stage;
      }
    }
    return rules.harvestStage;
  }
}

export const cropLifecycleService = new CropLifecycleService();
