const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { farmDigitalTwinService } = require('../src/services/farm/FarmDigitalTwinService');
const { farmMemoryService } = require('../src/services/farm/FarmMemoryService');
const { cropLifecycleService } = require('../src/services/farm/CropLifecycleService');
const { nextBestActionService } = require('../src/services/farm/NextBestActionService');
const { equipmentDecisionService } = require('../src/services/farm/EquipmentDecisionService');
const { farmFinancialService } = require('../src/services/farm/FarmFinancialService');
const { farmRiskEngineService } = require('../src/services/farm/FarmRiskEngineService');

async function testSubservices() {
  const farm = await prisma.farm.findFirst({
    where: { name: 'Farmer Test Land' },
    include: { crops: true, owner: true }
  });
  if (!farm) return;
  const farmId = farm.id;
  const ownerId = farm.ownerId;
  const cropId = farm.crops[0]?.id;

  async function timeIt(name, fn) {
    const s = Date.now();
    try {
      await fn();
      console.log(`[PASS] ${name}: ${Date.now() - s}ms`);
    } catch (e) {
      console.log(`[FAIL] ${name}: ${Date.now() - s}ms -> ${e.message}`);
    }
  }

  await timeIt('1. DigitalTwin', () => farmDigitalTwinService.getDigitalTwinAggregate(farmId, ownerId, false));
  await timeIt('2. MemoryContext', () => farmMemoryService.getContext(farmId, ownerId, false));
  await timeIt('3. CropLifecycle', () => cropLifecycleService.evaluateCropLifecycle(cropId, ownerId, false));
  await timeIt('4. NextBestAction', () => nextBestActionService.getNextBestActions(farmId, ownerId, cropId, 'en', false));
  await timeIt('5. EquipDecision', () => equipmentDecisionService.evaluateEquipmentDecision(farmId, ownerId, { language: 'en' }, false));
  await timeIt('6. FinancialAnalysis', () => farmFinancialService.getFinancialAnalysis(farmId, ownerId, 'en', false));
  await timeIt('7. RiskAssessment', () => farmRiskEngineService.getRiskAssessment(farmId, ownerId, 'en', false));
}

testSubservices().finally(() => prisma.$disconnect());
