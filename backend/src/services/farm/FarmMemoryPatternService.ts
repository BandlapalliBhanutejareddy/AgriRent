import { prisma } from '../../lib/prisma';
import { FarmMemoryService, FarmMemoryCategory, FarmMemoryEventType, FarmMemorySubjectType } from './FarmMemoryService';

export const MIN_PATTERN_OCCURRENCES = 3;
export const STRONG_PATTERN_OCCURRENCES = 5;
export const VERY_STRONG_PATTERN_OCCURRENCES = 8;

export type PatternStrength = 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';

export type PatternType = 
  | 'REPEATED_EVENT'
  | 'REPEATED_ACCEPTANCE'
  | 'REPEATED_REJECTION'
  | 'REPEATED_DELAY'
  | 'REPEATED_RISK'
  | 'REPEATED_EQUIPMENT_USE'
  | 'REPEATED_EQUIPMENT_REJECTION'
  | 'REPEATED_BOOKING_BEHAVIOR'
  | 'REPEATED_BUDGET_ALERT'
  | 'REPEATED_AI_ACCEPTANCE'
  | 'REPEATED_AI_REJECTION'
  | 'REPEATED_FARMER_DECISION'
  | 'REPEATED_SCHEDULE_CHANGE'
  | 'REPEATED_WEATHER_IMPACT';

export interface PatternEvidence {
  eventIds: string[];
}

export interface MemoryPattern {
  patternType: PatternType;
  category: FarmMemoryCategory;
  eventType: FarmMemoryEventType;
  subjectType?: string;
  subjectId?: string;
  occurrenceCount: number;
  firstObservedAt: string;
  lastObservedAt: string;
  confidence: number;
  strength: PatternStrength;
  evidence: PatternEvidence;
  explanation: string;
}

export interface PatternFilters {
  category?: FarmMemoryCategory | string;
  patternType?: PatternType | string;
  eventType?: FarmMemoryEventType | string;
  subjectType?: FarmMemorySubjectType | string;
  limit?: number;
}

function determineConfidence(count: number): number {
  if (count >= VERY_STRONG_PATTERN_OCCURRENCES) return 0.95;
  if (count >= STRONG_PATTERN_OCCURRENCES) return 0.80;
  if (count >= MIN_PATTERN_OCCURRENCES) return 0.60;
  return 0.0;
}

function determineStrength(count: number): PatternStrength {
  if (count >= VERY_STRONG_PATTERN_OCCURRENCES) return 'VERY_STRONG';
  if (count >= STRONG_PATTERN_OCCURRENCES) return 'STRONG';
  if (count >= MIN_PATTERN_OCCURRENCES) return 'MODERATE';
  return 'WEAK';
}

function getPatternTypeForEvent(eventType: FarmMemoryEventType): PatternType {
  switch (eventType) {
    case 'BOOKING_ACCEPTED':
    case 'FARMER_DECISION_ACCEPTED':
      return 'REPEATED_ACCEPTANCE';
    case 'BOOKING_REJECTED':
    case 'FARMER_DECISION_REJECTED':
      return 'REPEATED_REJECTION';
    case 'OPERATION_DELAYED':
    case 'SCHEDULE_DELAYED':
      return 'REPEATED_DELAY';
    case 'RISK_DETECTED':
    case 'RISK_ENCOUNTERED':
    case 'RISK_ESCALATED':
      return 'REPEATED_RISK';
    case 'EQUIPMENT_RENTED':
      return 'REPEATED_EQUIPMENT_USE';
    case 'BUDGET_ALERT':
      return 'REPEATED_BUDGET_ALERT';
    case 'AI_RECOMMENDATION_ACCEPTED':
      return 'REPEATED_AI_ACCEPTANCE';
    case 'AI_RECOMMENDATION_REJECTED':
      return 'REPEATED_AI_REJECTION';
    case 'DECISION_MADE':
    case 'FARMER_DECISION_MADE':
      return 'REPEATED_FARMER_DECISION';
    case 'SCHEDULE_CHANGED':
      return 'REPEATED_SCHEDULE_CHANGE';
    case 'WEATHER_IMPACT':
    case 'WEATHER_ALERT':
      return 'REPEATED_WEATHER_IMPACT';
    case 'BOOKING_CREATED':
    case 'BOOKING_CANCELLED':
    case 'BOOKING_COMPLETED':
      return 'REPEATED_BOOKING_BEHAVIOR';
    case 'EQUIPMENT_UNAVAILABLE':
      return 'REPEATED_EQUIPMENT_REJECTION';
    default:
      return 'REPEATED_EVENT';
  }
}

export class FarmMemoryPatternService {
  private async assertAccess(farmId: string, ownerId: string, isAdmin: boolean): Promise<void> {
    const farm = await prisma.farm.findUnique({ where: { id: farmId }, select: { ownerId: true } });
    if (!farm) throw new Error('FARM_NOT_FOUND');
    if (!isAdmin && farm.ownerId !== ownerId) throw new Error('FORBIDDEN_FARM_ACCESS');
  }

  async detectPatterns(farmId: string, ownerId: string, filters: PatternFilters = {}, isAdmin = false): Promise<MemoryPattern[]> {
    await this.assertAccess(farmId, ownerId, isAdmin);

    const events = await prisma.farmMemory.findMany({
      where: { farmId },
      orderBy: { occurredAt: 'asc' }
    });

    const groups = new Map<string, typeof events>();

    // Grouping strategy based on eventType and optionally subjectId
    for (const event of events) {
      const taxonomyInfo = event.eventType;
      
      // We parse payload to extract deeper subject identifiers if subjectId is missing
      let keySubjectId = event.subjectId || '';
      try {
        const payload = JSON.parse(event.payload);
        if (!keySubjectId) {
          if (payload.equipmentId) keySubjectId = String(payload.equipmentId);
          else if (payload.riskType) keySubjectId = String(payload.riskType);
          else if (payload.operationName) keySubjectId = String(payload.operationName);
          else if (payload.cropId) keySubjectId = String(payload.cropId);
        }
      } catch (e) {
        // ignore
      }

      const groupKey = `${event.eventType}::${event.subjectType}::${keySubjectId}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(event);
    }

    const patterns: MemoryPattern[] = [];

    for (const [groupKey, groupEvents] of groups.entries()) {
      if (groupEvents.length >= MIN_PATTERN_OCCURRENCES) {
        const firstEvent = groupEvents[0];
        const lastEvent = groupEvents[groupEvents.length - 1];
        const count = groupEvents.length;

        // Apply filters directly to category/eventType
        let taxonomyCategory: string = 'SYSTEM';
        if (firstEvent.eventType.includes('EQUIPMENT')) taxonomyCategory = 'EQUIPMENT';
        else if (firstEvent.eventType.includes('BOOKING')) taxonomyCategory = 'BOOKING';
        else if (firstEvent.eventType.includes('BUDGET') || firstEvent.eventType.includes('RENTAL')) taxonomyCategory = 'FINANCIAL';
        else if (firstEvent.eventType.includes('RISK')) taxonomyCategory = 'RISK';
        else if (firstEvent.eventType.includes('SCHEDULE')) taxonomyCategory = 'SCHEDULE';
        else if (firstEvent.eventType.includes('AI_')) taxonomyCategory = 'AI';
        else if (firstEvent.eventType.includes('WEATHER')) taxonomyCategory = 'WEATHER';
        else if (firstEvent.eventType.includes('DECISION')) taxonomyCategory = 'DECISION';
        else if (firstEvent.eventType.includes('OPERATION')) taxonomyCategory = 'OPERATION';
        else if (firstEvent.eventType.includes('CROP')) taxonomyCategory = 'CROP';
        else if (firstEvent.eventType.includes('FARM')) taxonomyCategory = 'FARM';
        else taxonomyCategory = 'SYSTEM';

        // Actually we can map back to FarmMemoryCategory, but this heuristic is safe or we can extract from taxonomy.
        // Let's rely on eventType mapping
        const pType = getPatternTypeForEvent(firstEvent.eventType as FarmMemoryEventType);
        
        if (filters.category && filters.category !== taxonomyCategory) continue;
        if (filters.eventType && filters.eventType !== firstEvent.eventType) continue;
        if (filters.patternType && filters.patternType !== pType) continue;
        if (filters.subjectType && filters.subjectType !== firstEvent.subjectType) continue;

        let subjectDisplay = firstEvent.subjectId || 'similar items';
        if (subjectDisplay === 'similar items' && groupKey.split('::')[2]) {
           subjectDisplay = groupKey.split('::')[2];
        }

        patterns.push({
          patternType: pType,
          category: taxonomyCategory as FarmMemoryCategory,
          eventType: firstEvent.eventType as FarmMemoryEventType,
          subjectType: firstEvent.subjectType || undefined,
          subjectId: subjectDisplay !== 'similar items' ? subjectDisplay : undefined,
          occurrenceCount: count,
          firstObservedAt: firstEvent.occurredAt.toISOString(),
          lastObservedAt: lastEvent.occurredAt.toISOString(),
          confidence: determineConfidence(count),
          strength: determineStrength(count),
          evidence: {
            eventIds: groupEvents.map(e => e.id)
          },
          explanation: `Detected ${pType} with ${count} occurrences for ${firstEvent.eventType} on ${firstEvent.subjectType} (${subjectDisplay}).`
        });
      }
    }

    // Sort by descending occurrence count, then by lastObservedAt
    patterns.sort((a, b) => b.occurrenceCount - a.occurrenceCount || new Date(b.lastObservedAt).getTime() - new Date(a.lastObservedAt).getTime());

    if (filters.limit && filters.limit > 0) {
      return patterns.slice(0, filters.limit);
    }
    
    return patterns;
  }
}

export const farmMemoryPatternService = new FarmMemoryPatternService();
