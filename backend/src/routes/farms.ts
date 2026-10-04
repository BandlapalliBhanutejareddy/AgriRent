import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { farmDigitalTwinService } from '../services/farm/FarmDigitalTwinService';
import { cropLifecycleService } from '../services/farm/CropLifecycleService';
import { nextBestActionService } from '../services/farm/NextBestActionService';
import { farmRiskEngineService } from '../services/farm/FarmRiskEngineService';
import { farmFinancialService } from '../services/farm/FarmFinancialService';
import { equipmentDecisionService } from '../services/farm/EquipmentDecisionService';
import { operationSchedulerService } from '../services/farm/OperationSchedulerService';
import { farmMemoryService, FARM_MEMORY_TAXONOMY, getLocalizedEventDescription } from '../services/farm/FarmMemoryService';
import { farmMemoryPatternService } from '../services/farm/FarmMemoryPatternService';
import { FarmMemoryPreferenceService } from '../services/farm/FarmMemoryPreferenceService';
import { farmOutcomeMemoryService } from '../services/farm/FarmOutcomeMemoryService';
import { farmCopilotService } from '../services/ai/FarmCopilotService';
import { farmPlanService } from '../services/farm/FarmPlanService';
import { prisma } from '../lib/prisma';

import { WeatherService } from '../services/weather/WeatherService';
import { WeatherAlertService } from '../services/weather/WeatherAlertService';

const router = Router();

// Protect all farm routes with authentication
router.use(requireAuth);

/**
 * 1. Create a new Farm
 * POST /api/farms
 */
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = (req as any).prismaUser.id;
    const { name, location, area, areaUnit, soilType, cropName, season, stage, totalBudget } = req.body;

    const farm = await farmDigitalTwinService.createFarm(ownerId, {
      name,
      location,
      area,
      areaUnit,
      soilType,
      cropName,
      season,
      stage,
      totalBudget
    });

    res.status(201).json(farm);
  } catch (error: any) {
    console.error('Create Farm Error:', error);
    res.status(400).json({ error: error.message || 'Failed to create farm' });
  }
});

/**
 * 2. Get all Farms owned by authenticated farmer
 * GET /api/farms
 */
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = (req as any).prismaUser.id;
    const farms = await farmDigitalTwinService.getFarmerFarms(ownerId);
    res.json(farms);
  } catch (error: any) {
    console.error('Get Farmer Farms Error:', error);
    res.status(500).json({ error: 'Failed to fetch farms' });
  }
});

/**
 * 3. Get single Farm & Digital Twin Aggregate (with strict ownership check)
 * GET /api/farms/:id
 */
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.id);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const aggregate = await farmDigitalTwinService.getDigitalTwinAggregate(farmId, ownerId, isAdmin);
    res.json(aggregate);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Get Digital Twin Aggregate Error:', error);
    res.status(500).json({ error: 'Failed to fetch farm digital twin aggregate' });
  }
});

/**
 * 4. Update Farm details (with strict ownership check)
 * PUT /api/farms/:id
 */
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.id);
    const ownerId = (req as any).prismaUser.id;
    const { name, location, area, areaUnit, soilType, cropName, season, stage, totalBudget } = req.body;

    const updatedFarm = await farmDigitalTwinService.updateFarm(farmId, ownerId, {
      name,
      location,
      area,
      areaUnit,
      soilType,
      cropName,
      season,
      stage,
      totalBudget
    });

    res.json(updatedFarm);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    res.status(400).json({ error: error.message || 'Failed to update farm' });
  }
});

/**
 * 5. Delete Farm (with strict ownership check)
 * DELETE /api/farms/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.id);
    const ownerId = (req as any).prismaUser.id;

    const result = await farmDigitalTwinService.deleteFarm(farmId, ownerId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to delete farm' });
  }
});

// ============================================================
// PHASE 5.1 — CROP LIFECYCLE ROUTES
// ============================================================

/**
 * 6. Get Crop Lifecycle Evaluation
 * GET /api/farms/:farmId/crops/:cropId/lifecycle
 */
router.get('/:farmId/crops/:cropId/lifecycle', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cropId = String(req.params.cropId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const evaluation = await cropLifecycleService.evaluateCropLifecycle(cropId, ownerId, isAdmin);
    res.json(evaluation);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_CROP_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this crop.' });
      return;
    }
    if (error.message === 'CROP_NOT_FOUND') {
      res.status(404).json({ error: 'Crop not found' });
      return;
    }
    console.error('Crop Lifecycle Evaluation Error:', error);
    res.status(500).json({ error: 'Failed to evaluate crop lifecycle' });
  }
});

/**
 * 7. Advance Crop Stage
 * POST /api/farms/:farmId/crops/:cropId/lifecycle/advance
 */
router.post('/:farmId/crops/:cropId/lifecycle/advance', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cropId = String(req.params.cropId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const updatedEvaluation = await cropLifecycleService.advanceCropStage(cropId, ownerId, isAdmin);
    res.json(updatedEvaluation);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_CROP_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this crop.' });
      return;
    }
    if (error.message === 'CROP_NOT_FOUND') {
      res.status(404).json({ error: 'Crop not found' });
      return;
    }
    if (error.message?.startsWith('INVALID_STAGE_TRANSITION')) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error('Advance Crop Stage Error:', error);
    res.status(400).json({ error: error.message || 'Failed to advance crop stage' });
  }
});

/**
 * 8. Manual Stage Override
 * POST /api/farms/:farmId/crops/:cropId/lifecycle/set-stage
 */
router.post('/:farmId/crops/:cropId/lifecycle/set-stage', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cropId = String(req.params.cropId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const { requestedStage, reason } = req.body;

    const updatedEvaluation = await cropLifecycleService.overrideCropStage(
      cropId,
      ownerId,
      requestedStage,
      reason,
      isAdmin
    );
    res.json(updatedEvaluation);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_CROP_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this crop.' });
      return;
    }
    if (error.message === 'CROP_NOT_FOUND') {
      res.status(404).json({ error: 'Crop not found' });
      return;
    }
    if (error.message?.startsWith('REASON_REQUIRED')) {
      res.status(422).json({ error: error.message });
      return;
    }
    if (error.message?.startsWith('UNSUPPORTED_STAGE')) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error('Manual Override Stage Error:', error);
    res.status(400).json({ error: error.message || 'Failed to override crop stage' });
  }
});

/**
 * 8.5 Get Farm Operations for a Crop
 * GET /api/farms/:farmId/crops/:cropId/operations
 */
router.get('/:farmId/crops/:cropId/operations', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cropId = String(req.params.cropId);
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    // Verify ownership
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { crops: { where: { id: cropId } } }
    });

    if (!farm || (!isAdmin && farm.ownerId !== ownerId) || farm.crops.length === 0) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this farm or crop.' });
      return;
    }

    const operations = await prisma.farmOperation.findMany({
      where: { farmCropId: cropId },
      include: { tasks: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(operations);
  } catch (error: any) {
    console.error('Get Farm Operations Error:', error);
    res.status(500).json({ error: 'Failed to retrieve farm operations' });
  }
});

/**
 * 8.6 Mark Farm Operation Completed
 * POST /api/farms/:farmId/crops/:cropId/operations/:operationId/complete
 */
router.post('/:farmId/crops/:cropId/operations/:operationId/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const cropId = String(req.params.cropId);
    const operationId = String(req.params.operationId);
    const { feedback, notes } = req.body;
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const result = await farmPlanService.completeOperation(
      ownerId,
      farmId,
      cropId,
      operationId,
      feedback,
      notes,
      isAdmin
    );

    // IMPORTANT: Generate/update the next operations schedule
    await operationSchedulerService.recalculateSchedule(farmId, ownerId, (req.query.lang as string) || 'en', isAdmin);

    res.json(result);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'OPERATION_NOT_FOUND') {
      res.status(404).json({ error: 'Farm operation not found.' });
      return;
    }
    console.error('Mark Operation Completed Error:', error);
    res.status(500).json({ error: 'Failed to mark operation as completed' });
  }
});

/**
 * 8.6b Mark Farm Task Completed
 * POST /api/farms/:farmId/crops/:cropId/operations/:operationId/tasks/:taskId/complete
 */
router.post('/:farmId/crops/:cropId/operations/:operationId/tasks/:taskId/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const cropId = String(req.params.cropId);
    const operationId = String(req.params.operationId);
    const taskId = String(req.params.taskId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const result = await farmPlanService.completeTask(
      ownerId,
      farmId,
      cropId,
      operationId,
      taskId,
      isAdmin
    );

    res.json(result);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'OPERATION_NOT_FOUND') {
      res.status(404).json({ error: 'Farm operation not found.' });
      return;
    }
    if (error.message === 'TASK_NOT_FOUND') {
      res.status(404).json({ error: 'Farm task not found.' });
      return;
    }
    console.error('Mark Task Completed Error:', error);
    res.status(500).json({ error: 'Failed to mark task as completed' });
  }
});

/**
 * 8.6c Add Task to Farm Operation
 * POST /api/farms/:farmId/crops/:cropId/operations/:operationId/tasks
 */
router.post('/:farmId/crops/:cropId/operations/:operationId/tasks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const cropId = String(req.params.cropId);
    const operationId = String(req.params.operationId);
    const { title, description } = req.body;
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'Task title is required.' });
      return;
    }

    const task = await farmPlanService.addTask(
      ownerId,
      farmId,
      cropId,
      operationId,
      title.trim(),
      description,
      isAdmin
    );

    res.status(201).json(task);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'OPERATION_NOT_FOUND') {
      res.status(404).json({ error: 'Farm operation not found.' });
      return;
    }
    console.error('Add Task Error:', error);
    res.status(500).json({ error: 'Failed to add task to farm operation' });
  }
});

/**
 * 8.6d Edit Farm Operation
 * PUT /api/farms/:farmId/crops/:cropId/operations/:operationId
 */
router.put('/:farmId/crops/:cropId/operations/:operationId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const cropId = String(req.params.cropId);
    const operationId = String(req.params.operationId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const updated = await farmPlanService.editOperation(
      ownerId,
      farmId,
      cropId,
      operationId,
      req.body,
      isAdmin
    );

    res.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'OPERATION_NOT_FOUND') {
      res.status(404).json({ error: 'Farm operation not found.' });
      return;
    }
    console.error('Edit Operation Error:', error);
    res.status(500).json({ error: 'Failed to edit farm operation' });
  }
});

/**
 * 8.6e Edit Farm Task
 * PUT /api/farms/:farmId/crops/:cropId/operations/:operationId/tasks/:taskId
 */
router.put('/:farmId/crops/:cropId/operations/:operationId/tasks/:taskId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const cropId = String(req.params.cropId);
    const operationId = String(req.params.operationId);
    const taskId = String(req.params.taskId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const updated = await farmPlanService.editTask(
      ownerId,
      farmId,
      cropId,
      operationId,
      taskId,
      req.body,
      isAdmin
    );

    res.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'TASK_NOT_FOUND') {
      res.status(404).json({ error: 'Farm task not found.' });
      return;
    }
    console.error('Edit Task Error:', error);
    res.status(500).json({ error: 'Failed to edit farm task' });
  }
});

/**
 * 8.6f Get Completed Tasks
 * GET /api/farms/:farmId/crops/:cropId/tasks/completed
 */
router.get('/:farmId/crops/:cropId/tasks/completed', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const cropId = String(req.params.cropId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const result = await farmPlanService.getCompletedTasks(
      ownerId,
      farmId,
      cropId,
      isAdmin
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    console.error('Get Completed Tasks Error:', error);
    res.status(500).json({ error: 'Failed to fetch completed tasks' });
  }
});


/**
 * 8.7 Get Simple Farm Overview
 * GET /api/farms/:farmId/crops/:cropId/overview
 */
router.get('/:farmId/crops/:cropId/overview', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const cropId = String(req.params.cropId);
    const lang = String(req.query.lang || 'en');
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    // Verify ownership
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { crops: { where: { id: cropId } } }
    });

    if (!farm || (!isAdmin && farm.ownerId !== ownerId) || (farm as any).crops.length === 0) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this farm or crop.' });
      return;
    }

    const overview = await farmCopilotService.generateFarmOverview(ownerId, farmId, cropId, lang);
    res.json({ overview });
  } catch (error: any) {
    console.error('Get Farm Overview Error:', error);
    res.status(500).json({ error: 'Failed to generate farm overview' });
  }
});

/**
 * 9. Get Localized Stage Explanation
 * GET /api/farms/:farmId/crops/:cropId/lifecycle/explanation
 */
router.get('/:farmId/crops/:cropId/lifecycle/explanation', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cropId = String(req.params.cropId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const lang = String(req.query.lang || 'en');

    const result = await cropLifecycleService.getStageExplanation(cropId, ownerId, lang, isAdmin);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_CROP_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this crop.' });
      return;
    }
    if (error.message === 'CROP_NOT_FOUND') {
      res.status(404).json({ error: 'Crop not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to generate stage explanation' });
  }
});

/**
 * 10. Get Next Best Action for Farm
 * GET /api/farms/:farmId/next-best-action
 */
router.get('/:farmId/next-best-action', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const lang = String(req.query.lang || 'en');

    const actions = await nextBestActionService.getNextBestActions(farmId, ownerId, undefined, lang, isAdmin);
    res.json(actions);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Get Next Best Action Error:', error);
    res.status(500).json({ error: 'Failed to generate Next Best Action recommendations' });
  }
});

/**
 * 11. Get Next Best Action for specific Crop
 * GET /api/farms/:farmId/crops/:cropId/next-best-action
 */
router.get('/:farmId/crops/:cropId/next-best-action', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const cropId = String(req.params.cropId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const lang = String(req.query.lang || 'en');

    const actions = await nextBestActionService.getNextBestActions(farmId, ownerId, cropId, lang, isAdmin);
    res.json(actions);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS' || error.message === 'FORBIDDEN_CROP_ACCESS') {
      res.status(403).json({ error: 'Forbidden access to requested resource.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND' || error.message === 'CROP_NOT_FOUND') {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
    console.error('Get Crop Next Best Action Error:', error);
    res.status(500).json({ error: 'Failed to generate crop Next Best Action' });
  }
});

/**
 * 12. Acknowledge Action Recommendation
 * POST /api/farms/:farmId/actions/:actionId/acknowledge
 */
router.post('/:farmId/actions/:actionId/acknowledge', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const actionId = String(req.params.actionId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const result = await nextBestActionService.acknowledgeAction(farmId, actionId, ownerId, isAdmin);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Acknowledge Action Error:', error);
    res.status(500).json({ error: 'Failed to acknowledge action' });
  }
});

/**
 * 13. Get Farm Risk Assessment & Dependency Graph
 * GET /api/farms/:farmId/risk-assessment
 */
router.get('/:farmId/risk-assessment', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const lang = String(req.query.lang || 'en');

    const assessment = await farmRiskEngineService.getRiskAssessment(farmId, ownerId, lang, isAdmin);
    res.json(assessment);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Get Risk Assessment Error:', error);
    res.status(500).json({ error: 'Failed to generate risk assessment' });
  }
});

/**
 * 14. What-If Delay Simulation
 * POST /api/farms/:farmId/risk-simulation
 */
router.post('/:farmId/risk-simulation', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const { cropId, operationTitle, delayDays } = req.body;
    const simulation = await farmRiskEngineService.simulateDelayScenario(
      farmId,
      ownerId,
      { farmId, cropId, operationTitle: operationTitle || 'Transplanting', delayDays: Number(delayDays) || 3 },
      isAdmin
    );
    res.json(simulation);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('What-If Simulation Error:', error);
    res.status(500).json({ error: 'Failed to simulate delay scenario' });
  }
});

/**
 * 15. Resolve / Mitigate Risk Item
 * POST /api/farms/:farmId/risks/:riskId/resolve
 */
router.post('/:farmId/risks/:riskId/resolve', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const riskId = String(req.params.riskId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const result = await farmRiskEngineService.resolveRiskItem(farmId, riskId, ownerId, isAdmin);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Resolve Risk Error:', error);
    res.status(500).json({ error: 'Failed to resolve risk item' });
  }
});

/**
 * 16. Get Holistic Farm Health Score
 * GET /api/farms/:farmId/farm-health
 */
router.get('/:farmId/farm-health', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const assessment = await farmRiskEngineService.getRiskAssessment(farmId, ownerId, 'en', isAdmin);
    res.json(assessment.farmHealth);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Get Farm Health Error:', error);
    res.status(500).json({ error: 'Failed to fetch farm health score' });
  }
});

/**
 * 17. Get Farm Financial Intelligence Analysis
 * GET /api/farms/:farmId/financials
 */
router.get('/:farmId/financials', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const lang = String(req.query.lang || 'en');

    const analysis = await farmFinancialService.getFinancialAnalysis(farmId, ownerId, lang, isAdmin);
    res.json(analysis);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Get Financial Analysis Error:', error);
    res.status(500).json({ error: 'Failed to generate farm financial analysis' });
  }
});

/**
 * 18. Update Total Farm Budget
 * POST /api/farms/:farmId/financials/budget
 */
router.post('/:farmId/financials/budget', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const { totalBudget } = req.body;

    const result = await farmFinancialService.updateFarmBudget(farmId, Number(totalBudget), ownerId, isAdmin);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Update Farm Budget Error:', error);
    res.status(500).json({ error: 'Failed to update farm budget' });
  }
});

/**
 * 18B. Log Farm Expense
 * POST /api/farms/:farmId/financials/expense
 */
router.post('/:farmId/financials/expense', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const { title, amount, category } = req.body;

    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { budgets: true }
    });

    if (!farm || (!isAdmin && farm.ownerId !== ownerId)) {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }

    const expenseAmt = Number(amount) || 0;
    let budget = farm.budgets[0];
    if (!budget) {
      budget = await prisma.farmBudget.create({
        data: {
          farmId,
          totalBudget: 50000,
          spentAmount: expenseAmt,
          currency: 'INR'
        }
      });
    } else {
      budget = await prisma.farmBudget.update({
        where: { id: budget.id },
        data: {
          spentAmount: { increment: expenseAmt }
        }
      });
    }

    // Persist individual expense record into FarmActivity
    const activity = await prisma.farmActivity.create({
      data: {
        farmId,
        actorId: ownerId,
        type: 'EXPENSE',
        title: title || 'Farm Expense',
        description: category || 'General Expense',
        metadata: JSON.stringify({
          amount: expenseAmt,
          category: category || 'General Expense',
          date: new Date().toISOString()
        })
      }
    });

    res.json({
      success: true,
      message: 'Expense recorded successfully',
      data: {
        id: activity.id,
        title: activity.title,
        category: category || 'General Expense',
        amount: expenseAmt,
        date: activity.createdAt,
        farmId
      }
    });
  } catch (error: any) {
    console.error('Log Expense Error:', error);
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

/**
 * 18C. Get All Farm Expenses & Budget
 * GET /api/farms/:farmId/financials/expenses
 */
router.get('/:farmId/financials/expenses', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { budgets: true }
    });

    if (!farm || (!isAdmin && farm.ownerId !== ownerId)) {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }

    let budget = farm.budgets[0];
    if (!budget) {
      budget = await prisma.farmBudget.create({
        data: {
          farmId,
          totalBudget: 50000,
          spentAmount: 0,
          currency: 'INR'
        }
      });
    }

    // 1. Retrieve all explicitly recorded farm expenses for this farm
    const activities = await prisma.farmActivity.findMany({
      where: {
        farmId,
        type: 'EXPENSE'
      },
      orderBy: { createdAt: 'desc' }
    });

    const manualExpenses = activities.map((act) => {
      let meta: any = {};
      try {
        if (act.metadata) meta = JSON.parse(act.metadata);
      } catch (_) {}

      return {
        id: act.id,
        title: act.title,
        description: act.description || meta.category || 'General',
        category: meta.category || act.description || 'Other Expense',
        amount: meta.amount != null ? Number(meta.amount) : 0,
        date: meta.date ? meta.date : act.createdAt.toISOString(),
        createdAt: act.createdAt,
        isRental: false
      };
    });

    // 2. Retrieve qualifying real equipment rental bookings for this farmer
    const validSpendingStatuses = ['COMPLETED', 'ACTIVE', 'RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'ACCEPTED'];
    const bookings = await prisma.booking.findMany({
      where: {
        farmerId: ownerId,
        status: { in: validSpendingStatuses }
      },
      include: {
        equipment: { select: { title: true, category: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const rentalExpenses = bookings.map((b) => ({
      id: `booking_${b.id}`,
      title: b.equipment?.title || 'Equipment Rental',
      description: `Rental (${b.status})`,
      category: 'Equipment Rental',
      amount: Number(b.totalPrice || 0),
      date: b.startDate ? b.startDate.toISOString() : b.createdAt.toISOString(),
      createdAt: b.createdAt,
      isRental: true,
      bookingId: b.id
    }));

    // Combined records sorted chronologically
    const allExpenses = [...manualExpenses, ...rentalExpenses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const rentalSpending = rentalExpenses.reduce((sum, item) => sum + item.amount, 0);
    const otherExpenses = manualExpenses.reduce((sum, item) => sum + item.amount, 0);
    const calculatedTotalSpent = rentalSpending + otherExpenses;

    const totalBudget = Number(budget.totalBudget) || 50000;
    const totalSpent = calculatedTotalSpent;
    const remainingBudget = Math.max(0, totalBudget - totalSpent);

    res.json({
      success: true,
      data: {
        totalBudget,
        totalSpent,
        rentalSpending,
        otherExpenses,
        remainingBudget,
        currency: budget.currency || 'INR',
        count: allExpenses.length,
        expenses: allExpenses
      }
    });
  } catch (error: any) {
    console.error('Get Farm Expenses Error:', error);
    res.status(500).json({ error: 'Failed to retrieve farm expenses' });
  }
});

/**
 * 19. Get Cost Optimization Opportunities
 * GET /api/farms/:farmId/financials/optimization
 */
router.get('/:farmId/financials/optimization', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const analysis = await farmFinancialService.getFinancialAnalysis(farmId, ownerId, 'en', isAdmin);
    res.json(analysis.optimizationOpportunities);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Get Financial Optimization Error:', error);
    res.status(500).json({ error: 'Failed to fetch financial optimizations' });
  }
});

/**
 * 20. Get Explainable Equipment Decision 2.0
 * GET /api/farms/:farmId/equipment-decision
 */
router.get('/:farmId/equipment-decision', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const language = String(req.query.language || req.query.lang || 'en');
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

    const decision = await equipmentDecisionService.evaluateEquipmentDecision(
      farmId,
      ownerId,
      { language, startDate, endDate },
      isAdmin
    );
    res.json(decision);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Get Equipment Decision Error:', error);
    res.status(500).json({ error: 'Failed to evaluate equipment decision' });
  }
});

/**
 * 21. Get Specific Equipment Decision Breakdown
 * GET /api/farms/:farmId/equipment-decision/:equipmentId
 */
router.get('/:farmId/equipment-decision/:equipmentId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const equipmentId = String(req.params.equipmentId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const language = String(req.query.language || req.query.lang || 'en');

    const decision = await equipmentDecisionService.evaluateEquipmentDecision(farmId, ownerId, { language }, isAdmin);
    const candidate = [decision.primaryDecision, ...decision.alternatives].find((c) => c?.equipmentId === equipmentId);

    if (!candidate) {
      res.status(404).json({ error: 'Equipment decision candidate not found for specified equipmentId' });
      return;
    }

    res.json(candidate);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Get Equipment Candidate Error:', error);
    res.status(500).json({ error: 'Failed to fetch equipment decision candidate' });
  }
});

/**
 * 22. Acknowledge Equipment Decision
 * POST /api/farms/:farmId/equipment-decision/acknowledge
 */
router.post('/:farmId/equipment-decision/acknowledge', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const { equipmentId } = req.body;

    if (!equipmentId) {
      res.status(400).json({ error: 'equipmentId is required' });
      return;
    }

    const result = await equipmentDecisionService.acknowledgeEquipmentDecision(farmId, String(equipmentId), ownerId, isAdmin);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND' || error.message === 'EQUIPMENT_NOT_FOUND') {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Acknowledge Decision Error:', error);
    res.status(500).json({ error: 'Failed to acknowledge equipment decision' });
  }
});

/**
 * 23. Get AI Farm Memory context and recent immutable events
 * GET /api/farms/:farmId/memory
 */
router.get('/:farmId/memory', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const limit = Number(req.query.limit || 50);
    const category = req.query.category ? String(req.query.category) : undefined;
    const eventType = req.query.eventType ? String(req.query.eventType) : undefined;
    const subjectType = req.query.subjectType ? String(req.query.subjectType) : undefined;

    const [context, events] = await Promise.all([
      farmMemoryService.getContext(farmId, ownerId, isAdmin),
      farmMemoryService.listEvents(farmId, ownerId, { limit, category, eventType, subjectType }, isAdmin)
    ]);
    res.json({ farmId, context, events });
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    if (
      error.message === 'INVALID_MEMORY_EVENT_TYPE' ||
      error.message === 'INVALID_MEMORY_CATEGORY' ||
      error.message === 'INVALID_MEMORY_SUBJECT_TYPE'
    ) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch farm memory' });
  }
});

/**
 * 24. Record an immutable farm memory event
 * POST /api/farms/:farmId/memory/events
 */
router.post('/:farmId/memory/events', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const event = await farmMemoryService.recordEvent(farmId, ownerId, req.body, isAdmin);
    res.status(201).json(event);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    if (
      error.message === 'INVALID_MEMORY_EVENT_TYPE' ||
      error.message === 'INVALID_MEMORY_PAYLOAD' ||
      error.message === 'INVALID_MEMORY_SUBJECT_TYPE' ||
      error.message === 'INVALID_MEMORY_CATEGORY'
    ) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to record farm memory event' });
  }
});

/**
 * 24a. Get Farm Memory Patterns
 * GET /api/farms/:farmId/memory/patterns
 */
router.get('/:farmId/memory/patterns', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const category = req.query.category ? String(req.query.category) : undefined;
    const eventType = req.query.eventType ? String(req.query.eventType) : undefined;
    const patternType = req.query.patternType ? String(req.query.patternType) : undefined;
    const subjectType = req.query.subjectType ? String(req.query.subjectType) : undefined;

    const patterns = await farmMemoryPatternService.detectPatterns(
      farmId,
      ownerId,
      { limit, category, eventType, patternType, subjectType },
      isAdmin
    );

    res.json(patterns);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to detect farm memory patterns' });
  }
});

/**
 * 24b. Get Farm Memory Preferences (Phase 5.7.3)
 * GET /api/farms/:farmId/memory/preferences
 */
router.get('/:farmId/memory/preferences', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    // Verify ownership
    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    if (farm.ownerId !== ownerId && !isAdmin) {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }

    const preferences = await FarmMemoryPreferenceService.extractPreferences(farmId);
    res.json(preferences);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to extract farm memory preferences' });
  }
});

/**
 * 24b. Get Farm Memory Taxonomy definition and metadata
 * GET /api/farms/:farmId/memory/taxonomy
 */
router.get('/:farmId/memory/taxonomy', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const lang = String(req.query.lang || 'en');

    // Assert farm authorization before providing taxonomy in farm context
    await farmMemoryService.getContext(farmId, ownerId, isAdmin);

    const summary = farmMemoryService.getTaxonomySummary();
    const taxonomyDetails = Object.values(FARM_MEMORY_TAXONOMY).map((item) => ({
      eventType: item.eventType,
      category: item.category,
      defaultSubjectType: item.defaultSubjectType,
      description: getLocalizedEventDescription(item.eventType, lang),
      expectedPayloadKeys: item.expectedPayloadKeys || [],
    }));

    res.json({
      farmId,
      language: lang,
      ...summary,
      taxonomy: taxonomyDetails,
    });
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch memory taxonomy' });
  }
});

/**
 * 25. Get Master Operation Schedule
 * GET /api/farms/:farmId/schedule
 */
router.get('/:farmId/schedule', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const language = String(req.query.language || req.query.lang || 'en');

    const schedule = await operationSchedulerService.evaluateSchedule(farmId, ownerId, { language, commit: false }, isAdmin);
    res.json(schedule);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Get Operation Schedule Error:', error);
    res.status(500).json({ error: 'Failed to evaluate operation schedule' });
  }
});

/**
 * 24. Preview Master Operation Schedule (Zero DB mutations)
 * POST /api/farms/:farmId/schedule/preview
 */
router.post('/:farmId/schedule/preview', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const { language, targetCropId } = req.body || {};

    const schedule = await operationSchedulerService.evaluateSchedule(
      farmId,
      ownerId,
      { language: language || 'en', commit: false, targetCropId },
      isAdmin
    );
    res.json(schedule);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Preview Operation Schedule Error:', error);
    res.status(500).json({ error: 'Failed to preview operation schedule' });
  }
});

/**
 * 25. Commit Master Operation Schedule (Persists to DB & Audit Log)
 * POST /api/farms/:farmId/schedule/commit
 */
router.post('/:farmId/schedule/commit', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const { language, targetCropId } = req.body || {};

    const schedule = await operationSchedulerService.evaluateSchedule(
      farmId,
      ownerId,
      { language: language || 'en', commit: true, targetCropId },
      isAdmin
    );
    res.json(schedule);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Commit Operation Schedule Error:', error);
    res.status(500).json({ error: 'Failed to commit operation schedule' });
  }
});

/**
 * 26. Get Active Schedule Conflicts
 * GET /api/farms/:farmId/schedule/conflicts
 */
router.get('/:farmId/schedule/conflicts', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const language = String(req.query.language || req.query.lang || 'en');

    const schedule = await operationSchedulerService.evaluateSchedule(farmId, ownerId, { language, commit: false }, isAdmin);
    res.json({
      farmId,
      qualityScore: schedule.qualityScore,
      conflicts: schedule.conflicts,
      blockedOperations: schedule.blockedOperations
    });
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Get Schedule Conflicts Error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule conflicts' });
  }
});

/**
 * 27. Recalculate Operation Schedule
 * POST /api/farms/:farmId/schedule/recalculate
 */
router.post('/:farmId/schedule/recalculate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const { language } = req.body || {};

    const schedule = await operationSchedulerService.recalculateSchedule(farmId, ownerId, language || 'en', isAdmin);
    res.json(schedule);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    if (error.message === 'FARM_NOT_FOUND') {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    console.error('Recalculate Schedule Error:', error);
    res.status(500).json({ error: 'Failed to recalculate operation schedule' });
  }
});

/**
 * 28. Get Expected vs Actual Outcomes (Phase 5.7.4)
 */
router.get('/:farmId/memory/outcomes', async (req: AuthRequest, res: Response) => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    // Verify ownership
    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    if (farm.ownerId !== ownerId && !isAdmin) {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }

    const filters = {
      outcomeType: req.query.outcomeType ? String(req.query.outcomeType) : undefined,
      category: req.query.category ? String(req.query.category) : undefined,
      subjectType: req.query.subjectType ? String(req.query.subjectType) : undefined,
      subjectId: req.query.subjectId ? String(req.query.subjectId) : undefined,
      limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 50
    };

    const outcomes = await farmOutcomeMemoryService.getOutcomes(farmId, filters);
    res.json(outcomes);
  } catch (err: any) {
    console.error('Error fetching farm outcomes:', err.message);
    res.status(500).json({ error: 'Failed to fetch farm outcomes' });
  }
});

// ============================================================
// PHASE 5.7.5A - FARM PLANNING ROUTES
// ============================================================

/**
 * Generate Farm Plan
 * POST /api/farms/:farmId/crops/:cropId/plan/generate
 */
router.post('/:farmId/crops/:cropId/plan/generate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const cropId = String(req.params.cropId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const params = req.body;

    const plan = await farmPlanService.generatePlan(ownerId, { farmId, cropId, ...params }, isAdmin);
    res.json(plan);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    console.error('Generate Plan Error:', error);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
});

/**
 * Activate Farm Plan
 * POST /api/farms/:farmId/crops/:cropId/plan/activate
 */
router.post('/:farmId/crops/:cropId/plan/activate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const cropId = String(req.params.cropId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';
    const { plan } = req.body;

    const activeOp = await farmPlanService.activatePlan(ownerId, farmId, cropId, plan, isAdmin);
    res.json(activeOp);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    console.error('Activate Plan Error:', error);
    res.status(500).json({ error: 'Failed to activate plan' });
  }
});

/**
 * Get Active Farm Plan
 * GET /api/farms/:farmId/crops/:cropId/plan/active
 */
router.get('/:farmId/crops/:cropId/plan/active', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = String(req.params.farmId);
    const cropId = String(req.params.cropId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const activePlan = await farmPlanService.getActivePlan(ownerId, farmId, cropId, isAdmin);
    res.json(activePlan);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    console.error('Get Active Plan Error:', error);
    res.status(500).json({ error: 'Failed to get active plan' });
  }
});



/**
 * 22. Get Farm Analytics
 * GET /api/farms/:farmId/analytics
 */
router.get('/:farmId/analytics', async (req, res) => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const analytics = await farmPlanService.getAnalytics(ownerId, farmId, isAdmin);
    res.json(analytics);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS') {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }
    console.error('Get Farm Analytics Error:', error);
    res.status(500).json({ error: 'Failed to get farm analytics' });
  }
});

/**
 * 23. Get Farm Spending Report
 * GET /api/farms/:farmId/spending-report
 */
router.get('/:farmId/spending-report', async (req, res) => {
  try {
    const farmId = String(req.params.farmId);
    const ownerId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    // Verify ownership
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: { ownerId: true }
    });

    if (!farm || (!isAdmin && farm.ownerId !== ownerId)) {
      res.status(403).json({ error: 'Forbidden: You do not own this farm.' });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: { farmerId: ownerId },
      include: {
        equipment: {
          include: { owner: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(bookings);
  } catch (error: any) {
    console.error('Get Farm Spending Error:', error);
    res.status(500).json({ error: 'Failed to get farm spending report' });
  }
});



// GET /api/farms/:farmId/weather
router.get('/:farmId/weather', async (req: AuthRequest, res: Response) => {
  try {
    const farmId = req.params.farmId as string;
    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) {
      return res.status(404).json({ success: false, error: 'Farm not found.' });
    }
    if (farm.ownerId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }
    if (!farm.location) {
      return res.status(400).json({ success: false, error: 'Weather location unavailable.', code: 'WEATHER_LOCATION_UNAVAILABLE' });
    }
    const weatherData = await WeatherService.getFarmWeather(farm.id, farm.location);
    if (!weatherData.success) {
      const status = weatherData.code === 'WEATHER_LOCATION_UNAVAILABLE' ? 400 : 502;
      return res.status(status).json(weatherData);
    }
    
    // Phase 14B-2: Evaluate weather rules
    await WeatherAlertService.evaluate(req.user!.id, farm.id, farm.name, weatherData);

    return res.json(weatherData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
