import { prisma } from '../../lib/prisma';
import {
  FarmMemoryCategory,
  FarmMemorySubjectType,
  FarmMemoryEventType,
  EventTaxonomyDefinition,
  SupportedLanguage,
  FARM_MEMORY_CATEGORIES,
  FARM_MEMORY_SUBJECT_TYPES,
  FARM_MEMORY_TAXONOMY,
  isValidEventType,
  isValidCategory,
  isValidSubjectType,
  getEventTaxonomy,
  getEventsByCategory,
  getLocalizedEventDescription,
} from './FarmMemoryTaxonomy';

export {
  FarmMemoryCategory,
  FarmMemorySubjectType,
  FarmMemoryEventType,
  EventTaxonomyDefinition,
  SupportedLanguage,
  FARM_MEMORY_CATEGORIES,
  FARM_MEMORY_SUBJECT_TYPES,
  FARM_MEMORY_TAXONOMY,
  isValidEventType,
  isValidCategory,
  isValidSubjectType,
  getEventTaxonomy,
  getEventsByCategory,
  getLocalizedEventDescription,
};

export interface FarmMemoryEventInput {
  eventType: FarmMemoryEventType;
  subjectType?: FarmMemorySubjectType | string;
  subjectId?: string;
  payload: Record<string, unknown>;
  occurredAt?: string;
}

export interface FarmMemoryListOptions {
  limit?: number;
  category?: FarmMemoryCategory | string;
  eventType?: FarmMemoryEventType | string;
  subjectType?: FarmMemorySubjectType | string;
}

export interface FarmMemoryContext {
  eventCount: number;
  preferredEquipment: Array<{ equipmentId: string; count: number; lastUsedAt: string }>;
  signals: Array<{ type: string; count: number; explanation: string }>;
}

function parsePayload(payload: string): Record<string, unknown> {
  try {
    const value = JSON.parse(payload);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export class FarmMemoryService {
  private async assertAccess(farmId: string, ownerId: string, isAdmin: boolean): Promise<void> {
    const farm = await prisma.farm.findUnique({ where: { id: farmId }, select: { ownerId: true } });
    if (!farm) throw new Error('FARM_NOT_FOUND');
    if (!isAdmin && farm.ownerId !== ownerId) throw new Error('FORBIDDEN_FARM_ACCESS');
  }

  async recordEvent(
    farmId: string,
    ownerId: string,
    input: FarmMemoryEventInput,
    isAdmin = false
  ) {
    await this.assertAccess(farmId, ownerId, isAdmin);
    
    // Deterministic validation against centralized taxonomy
    if (!isValidEventType(input.eventType)) {
      throw new Error('INVALID_MEMORY_EVENT_TYPE');
    }
    if (!input.payload || typeof input.payload !== 'object' || Array.isArray(input.payload)) {
      throw new Error('INVALID_MEMORY_PAYLOAD');
    }

    const taxonomy = getEventTaxonomy(input.eventType);
    let resolvedSubjectType = input.subjectType;

    if (resolvedSubjectType) {
      if (!isValidSubjectType(resolvedSubjectType)) {
        throw new Error('INVALID_MEMORY_SUBJECT_TYPE');
      }
    } else {
      resolvedSubjectType = taxonomy.defaultSubjectType;
    }

    return prisma.farmMemory.create({
      data: {
        farmId,
        actorId: ownerId,
        eventType: input.eventType,
        subjectType: resolvedSubjectType,
        subjectId: input.subjectId || null,
        payload: JSON.stringify(input.payload),
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date()
      }
    });
  }

  async getContext(farmId: string, ownerId: string, isAdmin = false): Promise<FarmMemoryContext> {
    await this.assertAccess(farmId, ownerId, isAdmin);
    const events = await prisma.farmMemory.findMany({
      where: { farmId },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }]
    });

    const equipmentCounts = new Map<string, { count: number; lastUsedAt: string }>();
    let delayCount = 0;
    let budgetPressureCount = 0;
    let riskCount = 0;

    for (const event of events) {
      const payload = parsePayload(event.payload);
      const equipmentId = String(payload.equipmentId || (event.eventType === 'EQUIPMENT_RENTED' ? event.subjectId || '' : ''));
      if (event.eventType === 'EQUIPMENT_RENTED' && equipmentId) {
        const current = equipmentCounts.get(equipmentId);
        equipmentCounts.set(equipmentId, {
          count: (current?.count || 0) + 1,
          lastUsedAt: current?.lastUsedAt || event.occurredAt.toISOString()
        });
      }
      if ((event.eventType === 'SCHEDULE_CHANGED' || event.eventType === 'SCHEDULE_DELAYED' || event.eventType === 'OPERATION_DELAYED') && 
          (Number(payload.delayDays || payload.delayedDays || 0) > 0 || event.eventType === 'SCHEDULE_DELAYED' || event.eventType === 'OPERATION_DELAYED')) {
        delayCount++;
      }
      if ((event.eventType === 'BUDGET_DECISION' && payload.pressure === true) || event.eventType === 'BUDGET_ALERT') {
        budgetPressureCount++;
      }
      if (event.eventType === 'RISK_ENCOUNTERED' || event.eventType === 'RISK_DETECTED' || event.eventType === 'RISK_ESCALATED') {
        riskCount++;
      }
    }

    const preferredEquipment = Array.from(equipmentCounts.entries())
      .map(([equipmentId, value]) => ({ equipmentId, ...value }))
      .sort((a, b) => b.count - a.count || a.equipmentId.localeCompare(b.equipmentId));
    const signals: FarmMemoryContext['signals'] = [];
    if (delayCount) signals.push({ type: 'REPEATED_DELAYS', count: delayCount, explanation: `${delayCount} historical schedule delays were recorded.` });
    if (budgetPressureCount) signals.push({ type: 'RECURRING_BUDGET_PRESSURE', count: budgetPressureCount, explanation: `${budgetPressureCount} budget decisions recorded pressure.` });
    if (riskCount) signals.push({ type: 'RECURRING_RISK_EVENTS', count: riskCount, explanation: `${riskCount} historical risk events were recorded.` });

    return { eventCount: events.length, preferredEquipment, signals };
  }

  async listEvents(
    farmId: string,
    ownerId: string,
    limitOrOptions: number | FarmMemoryListOptions = 50,
    isAdmin = false
  ) {
    await this.assertAccess(farmId, ownerId, isAdmin);

    let limit = 50;
    let categoryFilter: FarmMemoryCategory | undefined;
    let eventTypeFilter: FarmMemoryEventType | undefined;
    let subjectTypeFilter: FarmMemorySubjectType | undefined;

    if (typeof limitOrOptions === 'number') {
      limit = limitOrOptions;
    } else if (limitOrOptions && typeof limitOrOptions === 'object') {
      limit = limitOrOptions.limit ?? 50;
      if (limitOrOptions.category) {
        if (!isValidCategory(limitOrOptions.category)) {
          throw new Error('INVALID_MEMORY_CATEGORY');
        }
        categoryFilter = limitOrOptions.category;
      }
      if (limitOrOptions.eventType) {
        if (!isValidEventType(limitOrOptions.eventType)) {
          throw new Error('INVALID_MEMORY_EVENT_TYPE');
        }
        eventTypeFilter = limitOrOptions.eventType;
      }
      if (limitOrOptions.subjectType) {
        if (!isValidSubjectType(limitOrOptions.subjectType)) {
          throw new Error('INVALID_MEMORY_SUBJECT_TYPE');
        }
        subjectTypeFilter = limitOrOptions.subjectType;
      }
    }

    const where: any = { farmId };
    if (eventTypeFilter) {
      where.eventType = eventTypeFilter;
    } else if (categoryFilter) {
      const categoryEvents = getEventsByCategory(categoryFilter);
      where.eventType = { in: categoryEvents };
    }

    if (subjectTypeFilter) {
      where.subjectType = subjectTypeFilter;
    }

    return prisma.farmMemory.findMany({
      where,
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      take: Math.min(Math.max(limit, 1), 100)
    });
  }

  getTaxonomySummary() {
    return {
      categories: FARM_MEMORY_CATEGORIES,
      subjectTypes: FARM_MEMORY_SUBJECT_TYPES,
      eventTypes: Object.keys(FARM_MEMORY_TAXONOMY),
      totalEventsDefined: Object.keys(FARM_MEMORY_TAXONOMY).length,
    };
  }
}

export const farmMemoryService = new FarmMemoryService();