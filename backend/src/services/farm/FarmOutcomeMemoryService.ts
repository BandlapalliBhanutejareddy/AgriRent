import { prisma } from '../../lib/prisma';
import { FarmMemory } from '@prisma/client';

export type FarmOutcomeType =
  | 'EXPECTED_MATCHED'
  | 'EXPECTED_NOT_MATCHED'
  | 'OPERATION_ON_TIME'
  | 'OPERATION_DELAYED'
  | 'OPERATION_COMPLETED_EARLY'
  | 'EQUIPMENT_EXPECTATION_MATCHED'
  | 'EQUIPMENT_EXPECTATION_FAILED'
  | 'COST_WITHIN_EXPECTATION'
  | 'COST_ABOVE_EXPECTATION'
  | 'COST_BELOW_EXPECTATION'
  | 'BOOKING_EXPECTATION_MATCHED'
  | 'BOOKING_EXPECTATION_FAILED'
  | 'SCHEDULE_EXPECTATION_MATCHED'
  | 'SCHEDULE_DELAYED'
  | 'RISK_EXPECTATION_MATCHED'
  | 'RISK_ESCALATED'
  | 'RISK_REDUCED'
  | 'RECOMMENDATION_ACCEPTED'
  | 'RECOMMENDATION_REJECTED';

export interface FarmOutcomeEvidence {
  sourceEventId?: string;
  relatedEventIds: string[];
  expected: any;
  actual: any;
  variance?: {
    numerical?: number;
    percentage?: number;
    description?: string;
  };
}

export interface FarmOutcomeRecord {
  outcomeType: FarmOutcomeType;
  category: string;
  subjectType: string;
  subjectId: string;
  evidence: FarmOutcomeEvidence;
  occurredAt: Date;
  explanation: string;
}

export class FarmOutcomeMemoryService {
  /**
   * Records a detected outcome deterministically in the FarmMemory ledger.
   */
  async recordOutcome(
    farmId: string,
    actorId: string | null,
    outcome: FarmOutcomeRecord
  ): Promise<FarmMemory> {
    const payload = JSON.stringify({
      outcomeType: outcome.outcomeType,
      category: outcome.category,
      evidence: outcome.evidence,
      explanation: outcome.explanation
    });

    return prisma.farmMemory.create({
      data: {
        farmId,
        actorId,
        eventType: 'OUTCOME_DETECTED',
        subjectType: outcome.subjectType,
        subjectId: outcome.subjectId,
        payload,
        occurredAt: outcome.occurredAt
      }
    });
  }

  /**
   * Compare expected vs actual numerical values (e.g., cost) and determine the outcome.
   */
  public evaluateCostOutcome(
    farmId: string,
    subjectType: string,
    subjectId: string,
    expectedCost: number | null | undefined,
    actualCost: number | null | undefined,
    relatedEventIds: string[] = []
  ): FarmOutcomeRecord | null {
    if (expectedCost == null || actualCost == null) return null; // Insufficient data

    const variance = actualCost - expectedCost;
    let percentage = 0;
    if (expectedCost > 0) {
      percentage = (variance / expectedCost) * 100;
    }

    let outcomeType: FarmOutcomeType = 'COST_WITHIN_EXPECTATION';
    let explanation = `Cost matched expectation exactly (₹${expectedCost}).`;

    if (variance > 0) {
      outcomeType = 'COST_ABOVE_EXPECTATION';
      explanation = `Cost was ₹${variance} higher than expected (₹${expectedCost} -> ₹${actualCost}).`;
    } else if (variance < 0) {
      outcomeType = 'COST_BELOW_EXPECTATION';
      explanation = `Cost was ₹${Math.abs(variance)} lower than expected (₹${expectedCost} -> ₹${actualCost}).`;
    }

    return {
      outcomeType,
      category: 'FINANCIAL',
      subjectType,
      subjectId,
      evidence: {
        relatedEventIds,
        expected: { cost: expectedCost },
        actual: { cost: actualCost },
        variance: {
          numerical: variance,
          percentage: Number(percentage.toFixed(2)),
          description: explanation
        }
      },
      occurredAt: new Date(),
      explanation
    };
  }

  /**
   * Compare expected vs actual duration (in hours or days) and determine outcome.
   */
  public evaluateOperationDuration(
    farmId: string,
    subjectType: string,
    subjectId: string,
    expectedDuration: number | null | undefined,
    actualDuration: number | null | undefined,
    relatedEventIds: string[] = []
  ): FarmOutcomeRecord | null {
    if (expectedDuration == null || actualDuration == null) return null;

    const variance = actualDuration - expectedDuration;
    let outcomeType: FarmOutcomeType = 'OPERATION_ON_TIME';
    let explanation = `Operation completed exactly on expected duration (${expectedDuration}).`;

    if (variance > 0) {
      outcomeType = 'OPERATION_DELAYED';
      explanation = `Operation was delayed by ${variance} units (${expectedDuration} -> ${actualDuration}).`;
    } else if (variance < 0) {
      outcomeType = 'OPERATION_COMPLETED_EARLY';
      explanation = `Operation was completed ${Math.abs(variance)} units early (${expectedDuration} -> ${actualDuration}).`;
    }

    let percentage = 0;
    if (expectedDuration > 0) {
      percentage = (variance / expectedDuration) * 100;
    }

    return {
      outcomeType,
      category: 'OPERATIONAL',
      subjectType,
      subjectId,
      evidence: {
        relatedEventIds,
        expected: { duration: expectedDuration },
        actual: { duration: actualDuration },
        variance: {
          numerical: variance,
          percentage: Number(percentage.toFixed(2)),
          description: explanation
        }
      },
      occurredAt: new Date(),
      explanation
    };
  }

  /**
   * Compare discrete states (e.g., Booking expected ACCEPTED, actual REJECTED).
   */
  public evaluateStateOutcome(
    farmId: string,
    subjectType: string,
    subjectId: string,
    expectedState: string | null | undefined,
    actualState: string | null | undefined,
    relatedEventIds: string[] = []
  ): FarmOutcomeRecord | null {
    if (!expectedState || !actualState) return null;

    const isMatch = expectedState === actualState;
    let outcomeType: FarmOutcomeType = 'EXPECTED_MATCHED';
    let explanation = `State matched expectation: ${expectedState}.`;

    if (!isMatch) {
      outcomeType = 'EXPECTED_NOT_MATCHED';
      explanation = `State expectation failed. Expected ${expectedState} but got ${actualState}.`;
    }

    // Specific domain mappings
    if (subjectType === 'BOOKING') {
      outcomeType = isMatch ? 'BOOKING_EXPECTATION_MATCHED' : 'BOOKING_EXPECTATION_FAILED';
    } else if (subjectType === 'EQUIPMENT') {
      outcomeType = isMatch ? 'EQUIPMENT_EXPECTATION_MATCHED' : 'EQUIPMENT_EXPECTATION_FAILED';
    } else if (subjectType === 'RISK') {
      // Very basic discrete check
      outcomeType = isMatch ? 'RISK_EXPECTATION_MATCHED' : 'RISK_ESCALATED'; // or reduced depending on scale
    } else if (subjectType === 'RECOMMENDATION') {
      if (actualState === 'ACCEPTED') outcomeType = 'RECOMMENDATION_ACCEPTED';
      else if (actualState === 'REJECTED') outcomeType = 'RECOMMENDATION_REJECTED';
    } else if (subjectType === 'SCHEDULE') {
      outcomeType = isMatch ? 'SCHEDULE_EXPECTATION_MATCHED' : 'SCHEDULE_DELAYED';
    }

    return {
      outcomeType,
      category: 'STATE',
      subjectType,
      subjectId,
      evidence: {
        relatedEventIds,
        expected: { state: expectedState },
        actual: { state: actualState }
      },
      occurredAt: new Date(),
      explanation
    };
  }

  /**
   * Queries existing outcomes for a farm, with optional filters.
   */
  async getOutcomes(farmId: string, filters?: {
    outcomeType?: string;
    category?: string;
    subjectType?: string;
    subjectId?: string;
    limit?: number;
  }) {
    const where: any = {
      farmId,
      eventType: 'OUTCOME_DETECTED'
    };
    
    if (filters?.subjectType) where.subjectType = filters.subjectType;
    if (filters?.subjectId) where.subjectId = filters.subjectId;

    const limit = filters?.limit ? parseInt(filters.limit as any) : 50;

    const records = await prisma.farmMemory.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      take: limit
    });

    return records.map(r => {
      const parsed = JSON.parse(r.payload);
      // Client-side filtering for JSON payload properties if requested
      if (filters?.outcomeType && parsed.outcomeType !== filters.outcomeType) return null;
      if (filters?.category && parsed.category !== filters.category) return null;
      return {
        id: r.id,
        farmId: r.farmId,
        actorId: r.actorId,
        occurredAt: r.occurredAt,
        subjectType: r.subjectType,
        subjectId: r.subjectId,
        ...parsed
      };
    }).filter(Boolean);
  }
}

export const farmOutcomeMemoryService = new FarmOutcomeMemoryService();
