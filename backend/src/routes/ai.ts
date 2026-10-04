import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { aiProvider } from '../services/aiProvider';
import { smartFarmingService } from '../services/ai/SmartFarmingService';
import { farmCopilotService } from '../services/ai/FarmCopilotService';

const router = Router();

/**
 * Legacy AI Advisor Endpoint
 */
router.post('/advisor', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { prompt, question, crop, language = 'English' } = req.body;
    const promptText = prompt || question || (crop ? `Agronomic advice for ${crop}` : null);

    if (!promptText || typeof promptText !== 'string') {
      res.status(400).json({ error: 'Please provide at least a crop or a question.' });
      return;
    }

    const equipmentList = await prisma.equipment.findMany({
      where: { available: true },
      select: { title: true, category: true, pricePerDay: true, location: true }
    });

    const responseText = await aiProvider.getAdvisorAdvice(req.body, language, equipmentList);

    await prisma.auditLog.create({
      data: {
        actorId: req.prismaUser.id,
        actorRole: req.prismaUser.role,
        action: 'AI_PROMPT_EXECUTED',
        resource: 'AI',
        metadata: JSON.stringify({ prompt, language }),
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({ reply: responseText });
  } catch (error: any) {
    console.error('AI Advisor Error:', error);
    res.status(503).json({ error: 'AI Advisor is currently unavailable.', details: error.message || error.toString() });
  }
});

/**
 * PHASE 3: Smart Farming Plan Endpoint
 * POST /api/ai/smart-plan
 */
router.post('/smart-plan', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { crop } = req.body;
    if (!crop || typeof crop !== 'string' || crop.trim().length === 0) {
      res.status(400).json({ error: 'Crop parameter is required.' });
      return;
    }

    const plan = await smartFarmingService.generateSmartPlan(req.body);

    await prisma.auditLog.create({
      data: {
        actorId: req.prismaUser.id,
        actorRole: req.prismaUser.role,
        action: 'SMART_FARMING_PLAN_GENERATED',
        resource: 'AI_SMART_PLAN',
        metadata: JSON.stringify({
          crop: req.body.crop,
          stage: req.body.farmingStage,
          acreage: req.body.acreage,
          matchedEquipmentCount: plan.matchedEquipment.length
        }),
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    res.json(plan);
  } catch (error: any) {
    console.error('Smart Farming Plan Error:', error);
    res.status(500).json({ error: 'Failed to generate Smart Farming Plan.', details: error.message });
  }
});

/**
 * PHASE 4: AI Farm Copilot Endpoint
 * POST /api/ai/farm-copilot
 */
router.post('/farm-copilot', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmerId = req.prismaUser.id;
    const { farmId, cropId } = req.body;

    if (!farmId || !cropId) {
      res.status(400).json({ error: 'farmId and cropId are required for Farm Copilot.' });
      return;
    }

    // Execute Copilot Decision Engine
    const copilotResult = await farmCopilotService.processCopilotRequest(farmerId, req.body);

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: farmerId,
        actorRole: req.prismaUser.role,
        action: 'AI_FARM_COPILOT_EXECUTED',
        resource: 'AI_COPILOT',
        metadata: JSON.stringify({
          crop: copilotResult.farmStatus.crop,
          stage: copilotResult.farmStatus.stage,
          acreage: copilotResult.farmStatus.acreage,
          conflictsCount: copilotResult.conflicts.length,
          recommendedEquipmentCount: copilotResult.translatedEquipment.length,
          usingFallback: copilotResult.usingFallback
        }),
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    res.json(copilotResult);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_FARM_ACCESS' || error.message === 'FARM_NOT_FOUND' || error.message === 'CROP_NOT_FOUND_OR_NOT_OWNED') {
      res.status(403).json({ error: 'Forbidden: You do not have access to this farm or crop.' });
      return;
    }
    console.error('AI Farm Copilot Error:', error);
    res.status(500).json({ error: 'AI Farm Copilot is currently unavailable.', details: error.message || error.toString() });
  }
});

/**
 * PHASE 5.7.5: Add Copilot Plan to Farm Operations
 * POST /api/ai/farm-copilot/add-to-plan
 */
router.post('/farm-copilot/add-to-plan', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmerId = req.prismaUser.id;
    const { farmId, cropId, actionableSteps, stage } = req.body;

    if (!farmId || !cropId || !actionableSteps || !Array.isArray(actionableSteps)) {
      res.status(400).json({ error: 'farmId, cropId, and an array of actionableSteps are required.' });
      return;
    }

    // Verify Ownership
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { crops: { where: { id: cropId } } }
    });

    if (!farm || farm.ownerId !== farmerId || farm.crops.length === 0) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this farm or crop.' });
      return;
    }

    const crop = farm.crops[0];
    const operationName = `${stage || crop.stage} - AI Plan`;

    // Prevent duplicate active AI plans
    const existingPlan = await prisma.farmOperation.findFirst({
      where: {
        farmCropId: cropId,
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
        name: operationName
      },
      include: { tasks: true }
    });

    if (existingPlan) {
      res.json({
        success: true,
        message: 'Existing active AI plan found. Returning the existing plan to prevent duplicates.',
        operation: existingPlan
      });
      return;
    }

    // Validate and sanitize actionable steps
    const validSteps = actionableSteps
      .filter((step: any) => typeof step === 'string')
      .map((step: string) => step.trim())
      .filter((step: string) => step.length > 0);

    if (validSteps.length === 0) {
      res.status(400).json({ error: 'No valid actionable steps provided.' });
      return;
    }

    if (validSteps.length > 15) {
      res.status(400).json({ error: 'Too many tasks. Maximum allowed is 15.' });
      return;
    }

    // Create FarmOperation
    const operation = await prisma.farmOperation.create({
      data: {
        farmCropId: cropId,
        name: operationName,
        description: `AI Farm Copilot recommended plan for ${crop.cropName}`,
        status: 'PLANNED',
        tasks: {
          create: validSteps.map((step, idx) => ({
            title: step,
            status: 'PENDING',
            priority: idx === 0 ? 'HIGH' : 'MEDIUM'
          }))
        }
      },
      include: {
        tasks: true
      }
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: farmerId,
        actorRole: req.prismaUser.role,
        action: 'AI_FARM_PLAN_ADDED',
        resource: 'FARM_OPERATION',
        metadata: JSON.stringify({
          cropId,
          operationId: operation.id,
          taskCount: actionableSteps.length
        }),
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'Plan added successfully to your farm operations.',
      operation
    });
  } catch (error: any) {
    console.error('Add to Farm Plan Error:', error);
    res.status(500).json({ error: 'Failed to add plan to farm operations.', details: error.message || error.toString() });
  }
});

export default router;
