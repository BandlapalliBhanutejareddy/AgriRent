import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

export interface CreateFarmInput {
  name: string;
  location: string;
  area: number;
  areaUnit?: string;
  soilType: string;
  cropName?: string;
  season?: string;
  stage?: string;
  totalBudget?: number;
}

export interface UpdateFarmInput {
  name?: string;
  location?: string;
  area?: number;
  areaUnit?: string;
  soilType?: string;
  cropName?: string;
  season?: string;
  stage?: string;
  totalBudget?: number;
}

export interface DigitalTwinAggregate {
  farm: any;
  crops: any[];
  operations: any[];
  tasks: any[];
  risks: any[];
  budgets: any[];
  decisions: any[];
  activities: any[];
}

export class FarmDigitalTwinService {
  /**
   * Create a new Farm for an authenticated farmer
   */
  async createFarm(ownerId: string, input: CreateFarmInput) {
    if (!input.name || !input.location || !input.area || input.area <= 0 || !input.soilType) {
      throw new Error('Missing required farm details: name, location, area (>0), and soilType are required.');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Create Farm record
      const farm = await tx.farm.create({
        data: {
          ownerId,
          name: input.name,
          location: input.location,
          area: Number(input.area),
          areaUnit: input.areaUnit || 'acres',
          soilType: input.soilType
        }
      });

      // 2. Create initial FarmCrop if crop details provided
      let initialCrop = null;
      if (input.cropName) {
        initialCrop = await tx.farmCrop.create({
          data: {
            farmId: farm.id,
            cropName: input.cropName,
            season: input.season || 'Kharif',
            stage: input.stage || 'LAND_PREPARATION',
            status: 'ACTIVE'
          }
        });

        // Create default initial FarmOperation for the crop
        await tx.farmOperation.create({
          data: {
            farmCropId: initialCrop.id,
            name: `${input.stage || 'LAND_PREPARATION'} Field Preparation`,
            description: `Primary agricultural operation for ${input.cropName}`,
            status: 'PLANNED'
          }
        });
      }

      // 3. Create initial FarmBudget if budget provided
      if (input.totalBudget && input.totalBudget > 0) {
        await tx.farmBudget.create({
          data: {
            farmId: farm.id,
            farmCropId: initialCrop?.id || null,
            totalBudget: new Prisma.Decimal(input.totalBudget),
            spentAmount: new Prisma.Decimal(0),
            reservedAmount: new Prisma.Decimal(0),
            currency: 'INR'
          }
        });
      }

      // 4. Log FarmActivity
      await tx.farmActivity.create({
        data: {
          farmId: farm.id,
          actorId: ownerId,
          type: 'FARM_CREATED',
          title: 'Farm Digital Twin Initialized',
          description: `Created ${farm.name} (${farm.area} ${farm.areaUnit}) in ${farm.location}`,
          metadata: JSON.stringify({ soilType: farm.soilType, crop: input.cropName })
        }
      });

      return farm;
    });
  }

  /**
   * List all farms belonging to an authenticated farmer
   */
  async getFarmerFarms(ownerId: string) {
    return await prisma.farm.findMany({
      where: { ownerId },
      include: {
        crops: { where: { status: 'ACTIVE' } },
        budgets: true,
        _count: {
          select: {
            crops: true,
            risks: { where: { status: 'OPEN' } },
            activities: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Retrieve a single farm with strict ownership verification
   */
  async getFarmById(farmId: string, ownerId: string, isAdmin = false) {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    if (!farm) {
      return null;
    }

    if (!isAdmin && farm.ownerId !== ownerId) {
      throw new Error('FORBIDDEN_FARM_ACCESS');
    }

    return farm;
  }

  /**
   * Retrieve full canonical Digital Twin Aggregate for a farm
   */
  async getDigitalTwinAggregate(farmId: string, ownerId: string, isAdmin = false): Promise<DigitalTwinAggregate> {
    const farm = await this.getFarmById(farmId, ownerId, isAdmin);
    if (!farm) {
      throw new Error('FARM_NOT_FOUND');
    }

    const [crops, risks, budgets, decisions, activities] = await Promise.all([
      prisma.farmCrop.findMany({
        where: { farmId },
        include: {
          operations: {
            include: { tasks: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.farmRisk.findMany({
        where: { farmId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.farmBudget.findMany({
        where: { farmId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.farmDecision.findMany({
        where: { farmId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.farmActivity.findMany({
        where: { farmId },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    const operations = crops.flatMap(c => c.operations);
    const tasks = operations.flatMap(o => o.tasks);

    return {
      farm,
      crops,
      operations,
      tasks,
      risks,
      budgets,
      decisions,
      activities
    };
  }

  /**
   * Update farm details with ownership check
   */
  async updateFarm(farmId: string, ownerId: string, input: UpdateFarmInput) {
    const farm = await this.getFarmById(farmId, ownerId);
    if (!farm) {
      throw new Error('FARM_NOT_FOUND');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.farm.update({
        where: { id: farmId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.location && { location: input.location }),
          ...(input.area && { area: Number(input.area) }),
          ...(input.areaUnit && { areaUnit: input.areaUnit }),
          ...(input.soilType && { soilType: input.soilType })
        }
      });

      // Update or create primary crop if cropName/stage/season provided
      if (input.cropName || input.stage || input.season) {
        const existingCrop = await tx.farmCrop.findFirst({
          where: { farmId, status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' }
        });

        if (existingCrop) {
          await tx.farmCrop.update({
            where: { id: existingCrop.id },
            data: {
              ...(input.cropName && { cropName: input.cropName }),
              ...(input.season && { season: input.season }),
              ...(input.stage && { stage: input.stage.toUpperCase() })
            }
          });

          if (input.stage) {
            // Ensure planned operation for new stage
            await tx.farmOperation.create({
              data: {
                farmCropId: existingCrop.id,
                name: `${input.stage.toUpperCase()} Field Operation`,
                description: `Agronomic operation for ${input.stage.toUpperCase()} stage`,
                status: 'PLANNED'
              }
            });
          }
        } else if (input.cropName) {
          const newCrop = await tx.farmCrop.create({
            data: {
              farmId,
              cropName: input.cropName,
              season: input.season || 'Kharif',
              stage: (input.stage || 'SOWING').toUpperCase(),
              status: 'ACTIVE'
            }
          });

          await tx.farmOperation.create({
            data: {
              farmCropId: newCrop.id,
              name: `${(input.stage || 'SOWING').toUpperCase()} Field Preparation`,
              description: `Primary agricultural operation for ${input.cropName}`,
              status: 'PLANNED'
            }
          });
        }
      }

      // Update or create budget if totalBudget provided
      if (input.totalBudget && input.totalBudget > 0) {
        const existingBudget = await tx.farmBudget.findFirst({
          where: { farmId },
          orderBy: { createdAt: 'desc' }
        });

        if (existingBudget) {
          await tx.farmBudget.update({
            where: { id: existingBudget.id },
            data: {
              totalBudget: new Prisma.Decimal(input.totalBudget)
            }
          });
        } else {
          await tx.farmBudget.create({
            data: {
              farmId,
              totalBudget: new Prisma.Decimal(input.totalBudget),
              spentAmount: new Prisma.Decimal(0),
              reservedAmount: new Prisma.Decimal(0),
              currency: 'INR'
            }
          });
        }
      }

      await tx.farmActivity.create({
        data: {
          farmId,
          actorId: ownerId,
          type: 'FARM_UPDATED',
          title: 'Farm Profile Updated',
          description: `Updated profile attributes for ${result.name}`,
          metadata: JSON.stringify(input)
        }
      });

      return result;
    });

    return updated;
  }

  /**
   * Delete farm with ownership check
   */
  async deleteFarm(farmId: string, ownerId: string) {
    const farm = await this.getFarmById(farmId, ownerId);
    if (!farm) {
      throw new Error('FARM_NOT_FOUND');
    }

    await prisma.farm.delete({
      where: { id: farmId }
    });

    return { success: true, id: farmId };
  }
}

export const farmDigitalTwinService = new FarmDigitalTwinService();
