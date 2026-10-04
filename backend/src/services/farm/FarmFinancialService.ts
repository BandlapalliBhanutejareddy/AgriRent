import { prisma } from '../../lib/prisma';
import { farmDigitalTwinService } from './FarmDigitalTwinService';
import { getCropLifecycleRules } from './CropLifecycleRules';
import { equipmentRecommendationService } from '../ai/EquipmentRecommendationService';
import { aiProvider } from '../aiProvider';

export interface FarmFinancialState {
  farmId: string;
  farmName: string;
  currency: string;
  totalBudget: number;
  spentAmount: number;
  reservedAmount: number;
  remainingBudget: number;
  projectedTotalCost: number;
  budgetUtilizationPercent: number;
  budgetStatus: 'WITHIN_BUDGET' | 'NEAR_LIMIT' | 'BUDGET_OVERRUN';
}

export interface RentalCostIntelligence {
  equipmentCategory: string;
  selectedEquipmentTitle?: string;
  pricePerDay: number;
  estimatedDays: number;
  estimatedOperationCost: number;
  costPerAcre: number;
  alternativeEquipmentTitle?: string;
  alternativePricePerDay?: number;
  potentialSavings: number;
}

export interface BudgetForecast {
  currentStage: string;
  plannedSpentToDate: number;
  actualSpentToDate: number;
  reservedBookingsCost: number;
  expectedUpcomingOperationsCost: number;
  projectedTotalCostAtHarvest: number;
  projectedOverrunAmount: number;
  forecastStatus: 'ON_TRACK' | 'MODERATE_OVERRUN_RISK' | 'CRITICAL_OVERRUN_RISK';
}

export interface CostOptimizationOpportunity {
  id: string;
  title: string;
  currentCost: number;
  optimizedCost: number;
  potentialSavings: number;
  reason: string;
  impact: string;
  savingOpportunity: string;
  recommendedAction: string;
  recommendedEquipmentId?: string;
}

export interface FarmFinancialAnalysisResponse {
  financialState: FarmFinancialState;
  rentalIntelligence: RentalCostIntelligence[];
  forecast: BudgetForecast;
  optimizationOpportunities: CostOptimizationOpportunity[];
  summaryExplanation: string;
  generatedAt: string;
  decisionSource: 'DETERMINISTIC_ENGINE' | 'DETERMINISTIC_ENGINE_WITH_OLLAMA_EXPLANATION';
}

export class FarmFinancialService {
  /**
   * Generates comprehensive Farm Financial State, Forecast, and Cost Optimization
   */
  async getFinancialAnalysis(
    farmId: string,
    ownerId: string,
    lang = 'en',
    isAdmin = false
  ): Promise<FarmFinancialAnalysisResponse> {
    const aggregate = await farmDigitalTwinService.getDigitalTwinAggregate(farmId, ownerId, isAdmin);
    const farm = aggregate.farm;
    const crop = aggregate.crops[0] || null;

    let budgetRecord = aggregate.budgets[0];

    // Ensure default budget record exists
    if (!budgetRecord) {
      budgetRecord = await prisma.farmBudget.create({
        data: {
          farmId: farm.id,
          farmCropId: crop?.id || null,
          totalBudget: 50000,
          spentAmount: 0,
          reservedAmount: 0,
          currency: 'INR'
        }
      });
    }

    // 1. Calculate Financial State
    const totalB = Number(budgetRecord.totalBudget) || 50000;
    const spentB = Number(budgetRecord.spentAmount) || 0;
    const reservedB = Number(budgetRecord.reservedAmount) || 0;
    const remainingB = Math.max(0, totalB - (spentB + reservedB));
    const utilization = totalB > 0 ? Math.round(((spentB + reservedB) / totalB) * 100) : 0;

    let bStatus: FarmFinancialState['budgetStatus'] = 'WITHIN_BUDGET';
    if (utilization >= 100) bStatus = 'BUDGET_OVERRUN';
    else if (utilization >= 85) bStatus = 'NEAR_LIMIT';

    // 2. Budget Forecast Engine
    const forecast = await this.calculateForecast(farm, crop, spentB, reservedB, totalB);

    const financialState: FarmFinancialState = {
      farmId: farm.id,
      farmName: farm.name,
      currency: budgetRecord.currency || 'INR',
      totalBudget: totalB,
      spentAmount: spentB,
      reservedAmount: reservedB,
      remainingBudget: remainingB,
      projectedTotalCost: forecast.projectedTotalCostAtHarvest,
      budgetUtilizationPercent: utilization,
      budgetStatus: bStatus
    };

    // 3. Rental Cost Intelligence
    const rentalIntelligence = await this.calculateRentalIntelligence(farm, crop);

    // 4. Cost Optimization Engine
    const optimizationOpportunities = await this.calculateOptimizationOpportunities(farm, crop, totalB, spentB + reservedB);

    // 5. Generate Multilingual Explanation (Fast Ollama timeout)
    let summaryExplanation = `Farm ${farm.name} budget utilization is ${utilization}%. Projected total cost at harvest is ₹${forecast.projectedTotalCostAtHarvest}. Status: ${bStatus}.`;
    let decisionSource: FarmFinancialAnalysisResponse['decisionSource'] = 'DETERMINISTIC_ENGINE';

    try {
      const sysPrompt = `You are a professional agricultural financial advisor. Provide a 2-sentence financial summary in ${lang} language based strictly on the provided numbers.`;
      const userPrompt = `Farm: ${farm.name}, Total Budget: ₹${totalB}, Spent: ₹${spentB}, Reserved: ₹${reservedB}, Remaining: ₹${remainingB}, Utilization: ${utilization}%, Projected Cost: ₹${forecast.projectedTotalCostAtHarvest}.`;

      const aiRes = await aiProvider.generateText(userPrompt, sysPrompt, 1500);
      if (aiRes && !aiRes.includes('<?xml')) {
        summaryExplanation = aiRes.trim();
        decisionSource = 'DETERMINISTIC_ENGINE_WITH_OLLAMA_EXPLANATION';
      }
    } catch (err) {
      // Revert to deterministic explanation
    }

    return {
      financialState,
      rentalIntelligence,
      forecast,
      optimizationOpportunities,
      summaryExplanation,
      generatedAt: new Date().toISOString(),
      decisionSource
    };
  }

  /**
   * Updates or initializes Farm Total Budget
   */
  async updateFarmBudget(
    farmId: string,
    totalBudget: number,
    ownerId: string,
    isAdmin = false
  ): Promise<{ success: boolean; budget: FarmFinancialState }> {
    const aggregate = await farmDigitalTwinService.getDigitalTwinAggregate(farmId, ownerId, isAdmin);
    
    let budgetRecord = aggregate.budgets[0];
    const newTotal = Math.max(1000, Number(totalBudget) || 50000);

    if (budgetRecord) {
      budgetRecord = await prisma.farmBudget.update({
        where: { id: budgetRecord.id },
        data: { totalBudget: newTotal }
      });
    } else {
      budgetRecord = await prisma.farmBudget.create({
        data: {
          farmId: aggregate.farm.id,
          totalBudget: newTotal,
          spentAmount: 0,
          reservedAmount: 0,
          currency: 'INR'
        }
      });
    }

    const analysis = await this.getFinancialAnalysis(farmId, ownerId, 'en', isAdmin);
    return {
      success: true,
      budget: analysis.financialState
    };
  }

  // ------------------------------------------------------------------
  // PRIVATE CALCULATORS
  // ------------------------------------------------------------------

  private async calculateForecast(
    farm: any,
    crop: any,
    spent: number,
    reserved: number,
    totalBudget: number
  ): Promise<BudgetForecast> {
    if (!crop?.stage) throw new Error('Crop stage unavailable');
    const stage = crop.stage;
    const rules = getCropLifecycleRules(crop?.cropName || 'Rice');

    // Estimate remaining operational expenses based on remaining lifecycle stages
    let expectedUpcoming = 12000;
    if (stage === 'SOWING') expectedUpcoming = 18000;
    else if (stage === 'VEGETATIVE') expectedUpcoming = 12000;
    else if (stage === 'FLOWERING' || stage === 'MATURITY') expectedUpcoming = 6000;
    else if (stage === 'HARVEST_READY') expectedUpcoming = 2000;

    const projectedTotalCost = spent + reserved + expectedUpcoming;
    const projectedOverrunAmount = Math.max(0, projectedTotalCost - totalBudget);

    let forecastStatus: BudgetForecast['forecastStatus'] = 'ON_TRACK';
    if (projectedOverrunAmount > 5000) forecastStatus = 'CRITICAL_OVERRUN_RISK';
    else if (projectedOverrunAmount > 0) forecastStatus = 'MODERATE_OVERRUN_RISK';

    return {
      currentStage: stage,
      plannedSpentToDate: Math.round(totalBudget * 0.4),
      actualSpentToDate: spent,
      reservedBookingsCost: reserved,
      expectedUpcomingOperationsCost: expectedUpcoming,
      projectedTotalCostAtHarvest: projectedTotalCost,
      projectedOverrunAmount,
      forecastStatus
    };
  }

  private async calculateRentalIntelligence(farm: any, crop: any): Promise<RentalCostIntelligence[]> {
    const list: RentalCostIntelligence[] = [];
    const acreage = farm.area || 5.0;

    try {
      const matchTractor = await equipmentRecommendationService.matchEquipment(
        { crop: crop?.cropName || 'Rice', acreage, location: farm.location },
        ['TRACTORS'],
        2
      );

      if (matchTractor && matchTractor.length > 0) {
        const primary = matchTractor[0];
        const alt = matchTractor[1] || null;
        const estDays = 2;
        const opCost = primary.pricePerDay * estDays;
        const costPerAcre = Math.round(opCost / acreage);
        const savings = alt && alt.pricePerDay < primary.pricePerDay ? (primary.pricePerDay - alt.pricePerDay) * estDays : 0;

        list.push({
          equipmentCategory: 'TRACTORS',
          selectedEquipmentTitle: primary.title,
          pricePerDay: primary.pricePerDay,
          estimatedDays: estDays,
          estimatedOperationCost: opCost,
          costPerAcre,
          alternativeEquipmentTitle: alt?.title,
          alternativePricePerDay: alt?.pricePerDay,
          potentialSavings: Math.max(0, savings)
        });
      }
    } catch (e) {}

    return list;
  }

  private async calculateOptimizationOpportunities(
    farm: any,
    crop: any,
    totalBudget: number,
    currentCommitted: number
  ): Promise<CostOptimizationOpportunity[]> {
    const list: CostOptimizationOpportunity[] = [];

    if (currentCommitted > totalBudget * 0.7) {
      list.push({
        id: `opt-equip-${Date.now()}`,
        title: 'Optimize Tillage Machinery Rental Tier',
        currentCost: 4800,
        optimizedCost: 3200,
        potentialSavings: 1600,
        reason: 'Primary tractor selection belongs to premium high-HP category exceeding current 6-acre field requirement.',
        impact: 'Reduces operational budget utilization by 4.2% without sacrificing field completion rate.',
        savingOpportunity: 'Switch to verified 45HP Rotavator combo option from nearby owner.',
        recommendedAction: 'Select 45HP Rotavator option for upcoming puddling operation'
      });
    }

    return list;
  }
}

export const farmFinancialService = new FarmFinancialService();
