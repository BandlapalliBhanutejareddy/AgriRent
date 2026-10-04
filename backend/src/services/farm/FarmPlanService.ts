import { prisma } from '../../lib/prisma';
import { aiProvider } from '../aiProvider';
import { equipmentDecisionService } from './EquipmentDecisionService';
import { getCropLifecycleRules } from './CropLifecycleRules';
import { farmMemoryService } from './FarmMemoryService';
import { operationSchedulerService } from './OperationSchedulerService';

export interface FarmPlanParams {
  farmId: string;
  cropId: string;
  stage: string;
  process: string;
  labourersAvailable: number;
  budget: number;
  language: string;
}

export interface FarmPlanResponse {
  processName: string;
  whatToDo: string;
  whyNeeded: string;
  steps: string[];
  labourersNeeded: number | null;
  labourersAvailable: number;
  labourGap: number | null;
  machineRequired: {
    id: string;
    name: string;
    rentalPrice: number;
    available: boolean;
  } | null;
  costs: {
    equipment: number;
    labour: number | null;
    other: number | null;
    total: number;
    budgetAvailable: number;
    budgetRemaining: number;
  };
  durationDays: number;
  safetyPrecautions: string[];
  checkBeforeStart: string[];
  monitorDuring: string[];
  successIndicators: string[];
  nextProcess: string;
  learningResource: string | null;
  rawAiExplanation: string;
}

const PROCESS_TASKS: Record<string, string[]> = {
  'LAND_PREPARATION': ['Check field condition', 'Check soil moisture', 'Prepare equipment', 'Perform land preparation', 'Inspect field'],
  'SEED_SOWING': ['Verify seed quality', 'Check weather', 'Load planter', 'Sow seeds', 'Cover seeds'],
  'TRANSPLANTING': ['Water seedlings', 'Prepare field', 'Transplant seedlings', 'Initial irrigation', 'Check spacing'],
  'IRRIGATION': ['Check water source', 'Inspect irrigation lines', 'Run irrigation', 'Check soil moisture', 'Turn off irrigation'],
  'FERTILIZATION': ['Measure fertilizer', 'Load spreader', 'Apply fertilizer', 'Clean equipment', 'Record application'],
  'WEEDING': ['Identify weed types', 'Prepare tools', 'Remove weeds', 'Dispose of weeds', 'Inspect field'],
  'PEST_CONTROL': ['Identify pests', 'Prepare pesticide', 'Apply pesticide', 'Clean equipment', 'Record application'],
  'HARVESTING': ['Check crop maturity', 'Prepare harvesting tools', 'Harvest crop', 'Transport to storage', 'Clean field']
};

export class FarmPlanService {
  
  async generatePlan(ownerId: string, params: FarmPlanParams, isAdmin = false): Promise<FarmPlanResponse> {
    const { farmId, cropId, stage, process, labourersAvailable, budget, language } = params;
    
    // Verify ownership
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { crops: { where: { id: cropId } } }
    });
    
    if (!farm || (!isAdmin && farm.ownerId !== ownerId) || farm.crops.length === 0) {
      throw new Error('FORBIDDEN_FARM_ACCESS');
    }
    
    const crop = farm.crops[0];
    const currentStage = stage || (crop as any).stage || 'SOWING';
    let currentProcess = process;
    if (!currentProcess) {
      if (currentStage.includes('SOW') || currentStage.includes('PREP')) currentProcess = 'LAND_PREPARATION';
      else if (currentStage.includes('GERM') || currentStage.includes('SEED')) currentProcess = 'SEED_SOWING';
      else if (currentStage.includes('VEGETAT') || currentStage.includes('GROW')) currentProcess = 'WEEDING';
      else if (currentStage.includes('FLOWER') || currentStage.includes('FRUIT')) currentProcess = 'PEST_CONTROL';
      else if (currentStage.includes('HARVEST')) currentProcess = 'HARVESTING';
      else currentProcess = 'LAND_PREPARATION';
    }
    const availLabour = (labourersAvailable !== undefined && labourersAvailable !== null) ? labourersAvailable : 2;
    const availableBudget = (budget && budget > 0) ? budget : ((farm as any).totalBudget || (farm as any).budget || 20000);
    const lang = language || 'en';
    
    // Ask OperationSchedulerService for the canonical next operation
    let nextProcess = 'None';
    const schedule = await prisma.farmSchedule.findFirst({
      where: { farmId, status: 'FINALIZED' },
      include: { items: { orderBy: { plannedStartDate: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
    if (schedule) {
      const pendingItems = schedule.items.filter(i => i.status === 'PLANNED' && i.operationName !== currentProcess);
      if (pendingItems.length > 0) {
        nextProcess = pendingItems[0].operationName;
      }
    } else {
      const rules = getCropLifecycleRules(crop.cropName);
      const lifecycleKeys = Object.keys((rules as any).stages || {});
      const stageIndex = lifecycleKeys.indexOf(currentStage);
      if (stageIndex >= 0 && stageIndex < lifecycleKeys.length - 1) {
        const nextStageKey = lifecycleKeys[stageIndex + 1];
        const nextStageRules = (rules as any).stages[nextStageKey];
        if (nextStageRules && nextStageRules.requiredOperations && nextStageRules.requiredOperations.length > 0) {
          nextProcess = nextStageRules.requiredOperations[0];
        }
      }
    }
    
    // Deterministic labour requirement
    let labourersNeeded: number | null = null;
    if (currentProcess === 'LAND_PREPARATION') labourersNeeded = 4;
    else if (currentProcess === 'SEED_SOWING') labourersNeeded = 2;
    else if (currentProcess === 'TRANSPLANTING') labourersNeeded = 6;
    else if (currentProcess === 'IRRIGATION') labourersNeeded = 1;
    else if (currentProcess === 'FERTILIZATION') labourersNeeded = 2;
    else if (currentProcess === 'WEEDING') labourersNeeded = 4;
    else if (currentProcess === 'PEST_CONTROL') labourersNeeded = 2;
    else if (currentProcess === 'HARVESTING') labourersNeeded = 8;
    
    const labourGap = labourersNeeded !== null ? Math.max(0, labourersNeeded - availLabour) : null;
    
    // Determine machine required
    let machineRequired = null;
    let equipmentCost = 0;
    try {
      const eq = await prisma.equipment.findFirst({
        where: { title: { contains: process.split('_')[0], mode: 'insensitive' } }
      });
      if (eq) {
        machineRequired = {
          id: eq.id,
          name: eq.title,
          rentalPrice: Number(eq.pricePerDay || 500),
          available: true
        };
        equipmentCost = machineRequired.rentalPrice;
      }
    } catch(e) {
      console.warn("Failed to get equipment decision for farm plan:", e);
    }
    
    const durationDays = 1;
    
    // Ensure no fabricated labour rate. Labour cost is null if unknown.
    const labourCost: number | null = null;
    const otherCost: number | null = null;
    const totalCost = equipmentCost + (labourCost || 0) + (otherCost || 0);
    const budgetRemaining = budget - totalCost;
    
    // AI call for contextual instructions in target language
    const prompt = `
    You are an expert agronomist advising a farmer.
    Crop: ${crop.cropName}
    Current Stage: ${stage}
    Current Process: ${process}
    Acreage: ${farm.area} ${farm.areaUnit}
    Location: ${farm.location}
    Season: ${(farm as any).season || (crop as any).season || 'Current'}
    
    Generate a practical plan for the CURRENT process.
    Format your response STRICTLY as a JSON object with these exact keys (do not add markdown formatting outside the JSON, return ONLY JSON):
    {
      "whatToDo": "Brief description of the task",
      "whyNeeded": "Why this is important right now",
      "safetyPrecautions": ["Precaution 1...", "Precaution 2..."],
      "checkBeforeStart": ["Check 1...", "Check 2..."],
      "monitorDuring": ["Monitor 1...", "Monitor 2..."],
      "successIndicators": ["Indicator 1...", "Indicator 2..."]
    }
    
    IMPORTANT: Provide the content inside the JSON values in ${language === 'en' ? 'English' : language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : language === 'ta' ? 'Tamil' : 'Kannada'}.
    The JSON keys themselves MUST remain in English as defined above.
    `;
    
    let aiResponseStr = '';
    let parsedAi = {
      whatToDo: `Execute ${process}`,
      whyNeeded: `Essential for ${stage} stage`,
      safetyPrecautions: ['Standard safety precautions'],
      checkBeforeStart: ['Weather conditions'],
      monitorDuring: ['Progress'],
      successIndicators: ['Completion without issues']
    };
    
    try {
      aiResponseStr = await aiProvider.generateText(prompt);
      const cleaned = aiResponseStr.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedAi = JSON.parse(cleaned);
    } catch(e) {
      console.warn("Failed to parse AI farm plan, using fallback.", e);
    }
    
    const planResult: FarmPlanResponse = {
      processName: currentProcess,
      whatToDo: parsedAi.whatToDo || `Execute ${currentProcess}`,
      whyNeeded: parsedAi.whyNeeded || `Essential for ${currentStage} stage`,
      steps: PROCESS_TASKS[currentProcess] || ['Prepare', 'Execute', 'Review'],
      labourersNeeded,
      labourersAvailable: availLabour,
      labourGap,
      machineRequired,
      costs: {
        equipment: equipmentCost,
        labour: labourCost,
        other: otherCost,
        total: totalCost,
        budgetAvailable: availableBudget,
        budgetRemaining
      },
      durationDays,
      safetyPrecautions: parsedAi.safetyPrecautions || [],
      checkBeforeStart: parsedAi.checkBeforeStart || [],
      monitorDuring: parsedAi.monitorDuring || [],
      successIndicators: parsedAi.successIndicators || [],
      nextProcess,
      learningResource: `https://www.youtube.com/results?search_query=farming+${currentProcess.toLowerCase()}+${crop.cropName.toLowerCase()}`,
      rawAiExplanation: aiResponseStr
    };

    // Auto-activate & persist to DB so operations and tasks exist immediately in DB
    try {
      await this.activatePlan(ownerId, farmId, cropId, planResult, isAdmin);
    } catch (e) {
      console.warn("Auto-activation on plan generation non-blocking:", e);
    }

    return planResult;
  }
  
  async addTask(ownerId: string, farmId: string, cropId: string, operationId: string, title: string, description?: string, isAdmin = false) {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { crops: { where: { id: cropId } } }
    });
    
    if (!farm || (!isAdmin && farm.ownerId !== ownerId) || farm.crops.length === 0) {
      throw new Error('FORBIDDEN_FARM_ACCESS');
    }

    const op = await prisma.farmOperation.findUnique({ where: { id: operationId } });
    if (!op || op.farmCropId !== cropId) throw new Error('OPERATION_NOT_FOUND');

    const task = await prisma.farmTask.create({
      data: {
        operationId,
        title: title || 'Custom Task',
        description: description || title || '',
        status: 'PENDING'
      }
    });

    await prisma.farmMemory.create({
      data: {
        farmId,
        eventType: 'TASK_CREATED',
        subjectId: task.id,
        subjectType: 'FARM_TASK',
        payload: JSON.stringify({ taskTitle: task.title, operationName: op.name }),
        actorId: ownerId
      }
    });

    return task;
  }
  
  async activatePlan(ownerId: string, farmId: string, cropId: string, plan: FarmPlanResponse, isAdmin = false): Promise<any> {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { crops: { where: { id: cropId } } }
    });
    
    if (!farm || (!isAdmin && farm.ownerId !== ownerId) || farm.crops.length === 0) {
      throw new Error('FORBIDDEN_FARM_ACCESS');
    }
    
    return await prisma.$transaction(async (tx) => {
      // Check for an existing active plan for this crop
      const existing = await tx.farmOperation.findFirst({
        where: {
          farmCropId: cropId,
          status: { in: ['PLANNED', 'IN_PROGRESS', 'READY_TO_START'] }
        },
        include: { tasks: true },
        orderBy: { createdAt: 'desc' }
      });
      
      // If there's an existing plan, just return it (prevent duplicates)
      if (existing && existing.name === plan.processName) {
        return existing;
      }
      
      // If there is a different process active, you can archive it or allow it
      // Let's archive any stale active operations
      if (existing) {
        await tx.farmOperation.updateMany({
          where: { 
            farmCropId: cropId,
            status: { in: ['PLANNED', 'IN_PROGRESS', 'READY_TO_START'] }
          },
          data: { status: 'ARCHIVED' }
        });
      }
      
      const operation = await tx.farmOperation.create({
        data: {
          farmCropId: cropId,
          name: plan.processName,
          description: plan.whatToDo,
          status: 'PLANNED', // Using valid DB status
          plannedStartDate: new Date(),
          plannedEndDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
          labourersNeeded: plan.labourersNeeded,
          labourersAvailable: plan.labourersAvailable,
          estimatedLabourCost: plan.costs.labour
        }
      });
      
      // Create tasks from deterministic list
      const deterministicSteps = PROCESS_TASKS[plan.processName] || plan.steps || ['Prepare', 'Execute', 'Review'];
      if (deterministicSteps && deterministicSteps.length > 0) {
        const tasks = deterministicSteps.map((step, index) => ({
          operationId: operation.id,
          title: `Step ${index + 1}`,
          description: step,
          status: 'PENDING'
        }));
        
        await tx.farmTask.createMany({ data: tasks });
      }
      
      return operation;
    });
  }
  
  async getActivePlan(ownerId: string, farmId: string, cropId: string, isAdmin = false) {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { crops: { where: { id: cropId } } }
    });
    
    if (!farm || (!isAdmin && farm.ownerId !== ownerId) || farm.crops.length === 0) {
      throw new Error('FORBIDDEN_FARM_ACCESS');
    }
    
    const activeOperation = await prisma.farmOperation.findFirst({
      where: {
        farmCropId: cropId,
        status: { in: ['PLANNED', 'READY_TO_START', 'IN_PROGRESS'] }
      },
      include: {
        tasks: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    let progress = 0;
    if (activeOperation && activeOperation.tasks.length > 0) {
      const completed = activeOperation.tasks.filter(t => t.status === 'COMPLETED').length;
      progress = Math.round((completed / activeOperation.tasks.length) * 100);
    }
    
    let nextProcess = null;
    const schedule = await prisma.farmSchedule.findFirst({
      where: { farmId, status: 'FINALIZED' },
      include: { items: { orderBy: { plannedStartDate: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
    
    if (schedule && activeOperation) {
      const pendingItems = schedule.items.filter(i => i.status === 'PLANNED' && i.operationName !== activeOperation.name);
      if (pendingItems.length > 0) {
        nextProcess = pendingItems[0].operationName;
      }
    } else if (activeOperation) {
      const crop = farm.crops[0];
      const rules = getCropLifecycleRules(crop.cropName);
      const stage = (crop as any).stage || 'SOWING';
      const lifecycleKeys = Object.keys((rules as any).stages || {});
      const stageIndex = lifecycleKeys.indexOf(stage);
      if (stageIndex >= 0 && stageIndex < lifecycleKeys.length - 1) {
        const nextStageKey = lifecycleKeys[stageIndex + 1];
        const nextStageRules = (rules as any).stages[nextStageKey];
        if (nextStageRules && nextStageRules.requiredOperations && nextStageRules.requiredOperations.length > 0) {
          nextProcess = nextStageRules.requiredOperations[0];
        }
      }
    }
    
    let machineRequired = null;
    let equipmentCost = 0;
    if (activeOperation) {
      try {
        const eq = await prisma.equipment.findFirst({
          where: { title: { contains: activeOperation.name.split('_')[0], mode: 'insensitive' } }
        });
        if (eq) {
          machineRequired = {
            id: eq.id,
            name: eq.title,
            rentalPrice: Number(eq.pricePerDay || 500),
            available: true
          };
          equipmentCost = machineRequired.rentalPrice;
        }
      } catch(e) {}
    }
    
    const completedOperations = await prisma.farmOperation.findMany({
      where: { farmCropId: cropId, status: 'COMPLETED' },
      orderBy: { completedAt: 'asc' }
    });
    
    return {
      activeOperation,
      progress,
      machineRequired,
      nextProcess,
      completedOperations,
      costs: {
        equipment: equipmentCost,
        labour: activeOperation?.estimatedLabourCost || null,
        other: null,
        total: equipmentCost + (activeOperation?.estimatedLabourCost || 0)
      }
    };
  }
  
  async completeOperation(ownerId: string, farmId: string, cropId: string, operationId: string, feedback: string, notes: string, isAdmin = false) {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { crops: { where: { id: cropId } } }
    });
    
    if (!farm || (!isAdmin && farm.ownerId !== ownerId) || farm.crops.length === 0) {
      throw new Error('FORBIDDEN_FARM_ACCESS');
    }

    return await prisma.$transaction(async (tx) => {
      const op = await tx.farmOperation.findUnique({ where: { id: operationId } });
      if (!op || op.farmCropId !== cropId) throw new Error('Operation not found');
      
      const updatedOp = await tx.farmOperation.update({
        where: { id: operationId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
      
      await tx.farmTask.updateMany({
        where: { operationId, status: { not: 'COMPLETED' } },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });
      
      // Update corresponding schedule item if it exists
      const schedule = await tx.farmSchedule.findFirst({
        where: { farmId, status: 'FINALIZED' }
      });
      if (schedule) {
        await tx.farmScheduleItem.updateMany({
          where: { scheduleId: schedule.id, operationName: op.name, status: 'PLANNED' },
          data: { status: 'COMPLETED' }
        });
      }
      
      // Log FarmMemory using raw execution to avoid nested issues
      await tx.farmMemory.create({
        data: {
          farmId,
          eventType: 'OPERATION_COMPLETED',
          subjectId: operationId,
          subjectType: 'FARM_OPERATION',
          payload: JSON.stringify({ process: op.name, feedback, notes }),
          actorId: ownerId
        }
      });
      
      return updatedOp;
    });
  }

  async completeTask(ownerId: string, farmId: string, cropId: string, operationId: string, taskId: string, isAdmin: boolean = false) {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { crops: { where: { id: cropId } } }
    });
    
    if (!farm || (!isAdmin && farm.ownerId !== ownerId) || farm.crops.length === 0) {
      throw new Error('FORBIDDEN_FARM_ACCESS');
    }

    return await prisma.$transaction(async (tx) => {
      const task = await tx.farmTask.findUnique({ where: { id: taskId } });
      if (!task || task.operationId !== operationId) throw new Error('TASK_NOT_FOUND');
      
      const op = await tx.farmOperation.findUnique({ where: { id: operationId } });
      if (!op || op.farmCropId !== cropId) throw new Error('OPERATION_NOT_FOUND');

      if (task.status === 'COMPLETED') {
        // Return existing task without erroring to be idempotent
        return { task, progress: await this._calculateProgress(tx, operationId) };
      }
      
      const updatedTask = await tx.farmTask.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
      
      await tx.farmMemory.create({
        data: {
          farmId,
          eventType: 'TASK_COMPLETED',
          subjectId: taskId,
          subjectType: 'FARM_TASK',
          payload: JSON.stringify({ taskTitle: task.title }),
          actorId: ownerId
        }
      });
      
      const progress = await this._calculateProgress(tx, operationId);
      
      return { task: updatedTask, progress };
    });
  }

  private async _calculateProgress(tx: any, operationId: string) {
    const totalTasks = await tx.farmTask.count({ where: { operationId } });
    if (totalTasks === 0) return 0;
    const completedTasks = await tx.farmTask.count({ where: { operationId, status: 'COMPLETED' } });
    return Math.round((completedTasks / totalTasks) * 100);
  }

  async editOperation(
    ownerId: string,
    farmId: string,
    cropId: string,
    operationId: string,
    updates: {
      name?: string;
      description?: string;
      status?: string;
      plannedStartDate?: string | Date;
      plannedEndDate?: string | Date;
      labourersNeeded?: number;
      labourersAvailable?: number;
      estimatedLabourCost?: number;
    },
    isAdmin = false
  ) {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { crops: { where: { id: cropId } } }
    });

    if (!farm || (!isAdmin && farm.ownerId !== ownerId) || farm.crops.length === 0) {
      throw new Error('FORBIDDEN_FARM_ACCESS');
    }

    const op = await prisma.farmOperation.findUnique({ where: { id: operationId } });
    if (!op || op.farmCropId !== cropId) throw new Error('OPERATION_NOT_FOUND');

    const data: any = {};
    if (updates.name !== undefined) data.name = updates.name.trim();
    if (updates.description !== undefined) data.description = updates.description.trim();
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.plannedStartDate !== undefined) data.plannedStartDate = new Date(updates.plannedStartDate);
    if (updates.plannedEndDate !== undefined) data.plannedEndDate = new Date(updates.plannedEndDate);
    if (updates.labourersNeeded !== undefined) data.labourersNeeded = Number(updates.labourersNeeded);
    if (updates.labourersAvailable !== undefined) data.labourersAvailable = Number(updates.labourersAvailable);
    if (updates.estimatedLabourCost !== undefined) data.estimatedLabourCost = Number(updates.estimatedLabourCost);

    const updated = await prisma.farmOperation.update({
      where: { id: operationId },
      data,
      include: { tasks: true }
    });

    return updated;
  }

  async editTask(
    ownerId: string,
    farmId: string,
    cropId: string,
    operationId: string,
    taskId: string,
    updates: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string | Date;
    },
    isAdmin = false
  ) {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { crops: { where: { id: cropId } } }
    });

    if (!farm || (!isAdmin && farm.ownerId !== ownerId) || farm.crops.length === 0) {
      throw new Error('FORBIDDEN_FARM_ACCESS');
    }

    const task = await prisma.farmTask.findUnique({ where: { id: taskId } });
    if (!task || task.operationId !== operationId) throw new Error('TASK_NOT_FOUND');

    const data: any = {};
    if (updates.title !== undefined) data.title = updates.title.trim();
    if (updates.description !== undefined) data.description = updates.description.trim();
    if (updates.status !== undefined) {
      data.status = updates.status;
      if (updates.status === 'COMPLETED' && !task.completedAt) {
        data.completedAt = new Date();
      }
    }
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.dueDate !== undefined) data.dueDate = new Date(updates.dueDate);

    const updated = await prisma.farmTask.update({
      where: { id: taskId },
      data
    });

    return updated;
  }

  async getCompletedTasks(ownerId: string, farmId: string, cropId?: string, isAdmin = false) {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        crops: {
          where: cropId ? { id: cropId } : undefined,
          include: {
            operations: {
              include: {
                tasks: {
                  where: { status: 'COMPLETED' },
                  orderBy: { completedAt: 'desc' }
                }
              }
            }
          }
        }
      }
    });

    if (!farm || (!isAdmin && farm.ownerId !== ownerId)) {
      throw new Error('FORBIDDEN_FARM_ACCESS');
    }

    const completedTasks: any[] = [];
    farm.crops.forEach(crop => {
      crop.operations.forEach(op => {
        op.tasks.forEach(t => {
          completedTasks.push({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            completedAt: t.completedAt || t.updatedAt,
            operationId: op.id,
            operationName: op.name,
            cropId: crop.id,
            cropName: crop.cropName,
            farmId: farm.id,
            farmName: farm.name
          });
        });
      });
    });

    return {
      count: completedTasks.length,
      tasks: completedTasks
    };
  }



  async getAnalytics(ownerId: string, farmId: string, isAdmin = false) {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { crops: { include: { operations: { include: { tasks: true } } } } }
    });

    if (!farm || (!isAdmin && farm.ownerId !== ownerId)) {
      throw new Error('FORBIDDEN_FARM_ACCESS');
    }

    let budget = ((farm as any).totalBudget || (farm as any).budget || 0) ? Number(((farm as any).totalBudget || (farm as any).budget || 0)) : null;
    let equipmentCost = 0;
    let labourCost: number | null = 0;
    let otherCost: number | null = null;
    let completedProcesses = 0;
    let pendingProcesses = 0;

    let totalTasks = 0;
    let completedTasks = 0;
    let hasNullLabour = false;

    farm.crops.forEach(crop => {
      crop.operations.forEach(op => {
        if (op.status === 'COMPLETED') completedProcesses++;
        else pendingProcesses++;

        if (op.estimatedLabourCost) {
            equipmentCost += Number(op.estimatedLabourCost);
        }

        if (op.estimatedLabourCost) {
            if (labourCost !== null) {
                labourCost += Number(op.estimatedLabourCost);
            }
        } else {
            hasNullLabour = true;
            labourCost = null;
        }

        op.tasks.forEach(task => {
          totalTasks++;
          if (task.status === 'COMPLETED') completedTasks++;
        });
      });
    });

    let plannedCost: number | null = null;
    let totalProcessCost: number | null = null;
    let remainingBudget: number | null = null;

    if (labourCost !== null && otherCost !== null) {
      plannedCost = equipmentCost + labourCost + otherCost;
    } else if (labourCost !== null) {
      plannedCost = null;
    } else {
      plannedCost = null;
    }

    if (budget !== null && plannedCost !== null) {
        remainingBudget = budget - plannedCost;
    }

    return {
      totalFarmBudget: budget,
      plannedCost,
      equipmentCost,
      labourCost,
      otherCost,
      totalProcessCost: plannedCost,
      remainingBudget,
      completedProcesses,
      pendingProcesses,
      currentFarmProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  }
}

export const farmPlanService = new FarmPlanService();
