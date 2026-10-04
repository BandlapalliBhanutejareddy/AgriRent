import { prisma } from '../../lib/prisma';
import { FarmMemory, Prisma } from '@prisma/client';

export type PreferenceStrength = 'MODERATE' | 'STRONG' | 'VERY_STRONG';
export type PreferenceType = 
  | 'PREFERS_EQUIPMENT' 
  | 'AVOIDS_EQUIPMENT'
  | 'PREFERS_OPERATION'
  | 'AVOIDS_OPERATION'
  | 'AI_RECOMMENDATION_ACCEPTANCE_PATTERN'
  | 'AI_RECOMMENDATION_REJECTION_PATTERN';

export interface FarmPreference {
  preferenceType: PreferenceType;
  subjectType: string;
  subjectId: string;
  occurrenceCount: number;
  firstObservedAt: Date;
  lastObservedAt: Date;
  confidence: number;
  strength: PreferenceStrength;
  evidence: {
    eventIds: string[];
  };
  explanation: string;
}

export class FarmMemoryPreferenceService {
  private static readonly MIN_PATTERN_OCCURRENCES = 3;
  private static readonly STRONG_PATTERN_OCCURRENCES = 5;
  private static readonly VERY_STRONG_PATTERN_OCCURRENCES = 8;

  private static determineStrength(count: number): { confidence: number, strength: PreferenceStrength } {
    if (count >= this.VERY_STRONG_PATTERN_OCCURRENCES) return { confidence: 0.95, strength: 'VERY_STRONG' };
    if (count >= this.STRONG_PATTERN_OCCURRENCES) return { confidence: 0.80, strength: 'STRONG' };
    return { confidence: 0.60, strength: 'MODERATE' };
  }

  static async extractPreferences(farmId: string): Promise<FarmPreference[]> {
    const memoryEvents = await prisma.farmMemory.findMany({
      where: { farmId },
      orderBy: { occurredAt: 'asc' }
    });

    const preferences: FarmPreference[] = [];

    // Group logic to find equipment preferences
    const equipmentUses: Record<string, FarmMemory[]> = {};
    const equipmentRejections: Record<string, FarmMemory[]> = {};
    const aiAcceptances: Record<string, FarmMemory[]> = {};
    const aiRejections: Record<string, FarmMemory[]> = {};
    const operationUses: Record<string, FarmMemory[]> = {};

    for (const event of memoryEvents) {
      const type = event.eventType;
      const sub = event.subjectId;
      if (!sub) continue;

      if (type === 'EQUIPMENT_USED') {
        if (!equipmentUses[sub]) equipmentUses[sub] = [];
        equipmentUses[sub].push(event);
      }
      if (type === 'EQUIPMENT_REJECTED') {
        if (!equipmentRejections[sub]) equipmentRejections[sub] = [];
        equipmentRejections[sub].push(event);
      }
      if (type === 'AI_RECOMMENDATION_ACCEPTED') {
        if (!aiAcceptances[sub]) aiAcceptances[sub] = [];
        aiAcceptances[sub].push(event);
      }
      if (type === 'AI_RECOMMENDATION_REJECTED') {
        if (!aiRejections[sub]) aiRejections[sub] = [];
        aiRejections[sub].push(event);
      }
      if (type === 'OPERATION_COMPLETED') {
        if (!operationUses[sub]) operationUses[sub] = [];
        operationUses[sub].push(event);
      }
    }

    const processGroup = (group: Record<string, FarmMemory[]>, prefType: PreferenceType, subjectType: string, actionDesc: string) => {
      for (const [subjectId, events] of Object.entries(group)) {
        if (events.length >= this.MIN_PATTERN_OCCURRENCES) {
          
          // Conflict handling for Equipment Uses vs Rejections
          if (prefType === 'PREFERS_EQUIPMENT' && equipmentRejections[subjectId]?.length >= this.MIN_PATTERN_OCCURRENCES) {
             continue; // NO_CLEAR_PREFERENCE
          }
          if (prefType === 'AVOIDS_EQUIPMENT' && equipmentUses[subjectId]?.length >= this.MIN_PATTERN_OCCURRENCES) {
             continue; // NO_CLEAR_PREFERENCE
          }
          if (prefType === 'AI_RECOMMENDATION_ACCEPTANCE_PATTERN' && aiRejections[subjectId]?.length >= this.MIN_PATTERN_OCCURRENCES) {
             continue;
          }
          if (prefType === 'AI_RECOMMENDATION_REJECTION_PATTERN' && aiAcceptances[subjectId]?.length >= this.MIN_PATTERN_OCCURRENCES) {
             continue;
          }

          const { confidence, strength } = this.determineStrength(events.length);
          const firstObservedAt = events[0].occurredAt;
          const lastObservedAt = events[events.length - 1].occurredAt;

          preferences.push({
            preferenceType: prefType,
            subjectType,
            subjectId,
            occurrenceCount: events.length,
            firstObservedAt,
            lastObservedAt,
            confidence,
            strength,
            evidence: { eventIds: events.map((e) => e.id) },
            explanation: `Farmer deterministically ${actionDesc} for ${subjectType} (${subjectId}) with ${events.length} occurrences.`
          });
        }
      }
    };

    processGroup(equipmentUses, 'PREFERS_EQUIPMENT', 'EQUIPMENT', 'prefers equipment');
    processGroup(equipmentRejections, 'AVOIDS_EQUIPMENT', 'EQUIPMENT', 'avoids equipment');
    processGroup(aiAcceptances, 'AI_RECOMMENDATION_ACCEPTANCE_PATTERN', 'AI_RECOMMENDATION', 'accepts AI recommendations');
    processGroup(aiRejections, 'AI_RECOMMENDATION_REJECTION_PATTERN', 'AI_RECOMMENDATION', 'rejects AI recommendations');
    processGroup(operationUses, 'PREFERS_OPERATION', 'OPERATION', 'prefers operation');

    return preferences;
  }
}
