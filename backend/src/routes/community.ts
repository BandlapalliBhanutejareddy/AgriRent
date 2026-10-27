import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { getIo } from '../lib/socket';
import { marketPriceService } from '../services/market/MarketPriceService';

const router = Router();

// Middleware to strictly enforce FARMER participation in the Community
const requireFarmerRole = (req: AuthRequest, res: Response, next: () => void): void => {
  if (!req.prismaUser) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const role = req.prismaUser.role;
  const isFarmer = role === 'FARMER' || 
                   role === 'BOTH' || 
                   (typeof role === 'string' && role.split(',').map((r: string) => r.trim()).includes('FARMER'));

  if (!isFarmer) {
    res.status(403).json({ error: 'Only registered Farmers can participate in the AgroRent Farmer Community' });
    return;
  }

  next();
};

/**
 * GET /api/community
 * Basic community overview and metadata
 */
router.get('/', requireAuth, requireFarmerRole, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalFarmers = await prisma.user.count({
      where: {
        role: {
          contains: 'FARMER'
        }
      }
    });

    const totalMessages = await prisma.communityMessage.count();

    res.json({
      id: 'agrorent-farmer-community',
      name: 'AgroRent Farmer Community',
      description: 'Official shared knowledge and equipment discussion community for registered farmers',
      isMember: true, // Auto-access enabled for all authenticated Farmers
      memberCount: totalFarmers,
      messageCount: totalMessages,
      createdAt: '2026-01-01T00:00:00.000Z'
    });
  } catch (error) {
    console.error('Failed to fetch community metadata:', error);
    res.status(500).json({ error: 'Failed to fetch community metadata' });
  }
});

/**
 * GET /api/community/messages
 * Fetch persistent community messages (latest 100)
 */
router.get('/messages', requireAuth, requireFarmerRole, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);

    const messages = await prisma.communityMessage.findMany({
      take: limit,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderId: true,
        text: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Failed to fetch community messages:', error);
    res.status(500).json({ error: 'Failed to fetch community messages' });
  }
});

/**
 * POST /api/community/messages
 * Send a persistent message to the shared Farmer Community
 */
router.post('/messages', requireAuth, requireFarmerRole, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body || {};

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'Message text cannot be empty' });
      return;
    }

    const trimmed = text.trim();
    if (trimmed.length > 1000) {
      res.status(400).json({ error: 'Message cannot exceed 1000 characters' });
      return;
    }

    // Sender identity is strictly derived from authenticated token to prevent spoofing
    const senderId = req.prismaUser.id;

    const newMessage = await prisma.communityMessage.create({
      data: {
        senderId,
        text: trimmed
      },
      select: {
        id: true,
        senderId: true,
        text: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      }
    });

    // Real-time broadcast if socket is active
    try {
      const io = getIo();
      if (io) {
        io.emit('community_message', newMessage);
      }
    } catch (sockErr) {
      // Socket broadcast failure shouldn't fail HTTP persistence
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Failed to post community message:', error);
    res.status(500).json({ error: 'Failed to post community message' });
  }
});

import { aiProvider } from '../services/aiProvider';

/**
 * GET /api/community/members
 * Fetch list of registered farmers participating in community with public crop summaries.
 * Strictly excludes private contact details like phone, email, and exact coordinates.
 */
router.get('/members', requireAuth, requireFarmerRole, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmers = await prisma.user.findMany({
      where: {
        role: {
          contains: 'FARMER'
        },
        isSuspended: false
      },
      select: {
        id: true,
        name: true,
        profileImage: true,
        createdAt: true,
        farms: {
          select: {
            id: true,
            name: true,
            location: true,
            area: true,
            crops: {
              select: {
                id: true,
                cropName: true,
                variety: true,
                season: true,
                stage: true,
                status: true,
                sowingDate: true,
                expectedHarvestDate: true
              }
            }
          },
          take: 2
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const sanitizedMembers = farmers.map(farmer => {
      const allCrops = farmer.farms.flatMap(f => f.crops || []);
      const activeCrop = allCrops.find(c => c.status === 'ACTIVE') || allCrops[0] || null;
      const plannedCrop = allCrops.find(c => c.status === 'PLANNED') || null;
      const primaryFarm = farmer.farms[0];

      return {
        id: farmer.id,
        name: farmer.name,
        profileImage: farmer.profileImage,
        joinedAt: farmer.createdAt,
        location: primaryFarm?.location || 'Local Region',
        currentCrop: activeCrop ? {
          cropName: activeCrop.cropName,
          stage: activeCrop.stage,
          season: activeCrop.season,
          variety: activeCrop.variety
        } : null,
        nextCrop: plannedCrop ? {
          cropName: plannedCrop.cropName,
          season: plannedCrop.season
        } : null
      };
    });

    res.json(sanitizedMembers);
  } catch (error) {
    console.error('Failed to fetch community members:', error);
    res.status(500).json({ error: 'Failed to fetch community members' });
  }
});

/**
 * GET /api/community/members/:id
 * Dedicated Farmer Public Profile.
 * Strictly returns public information only. Rejects private email, phone, coordinates, or finances.
 */
router.get('/members/:id', requireAuth, requireFarmerRole, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = String(req.params.id);
    const farmer = await prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        profileImage: true,
        createdAt: true,
        farms: {
          select: {
            id: true,
            name: true,
            location: true,
            area: true,
            areaUnit: true,
            soilType: true,
            crops: {
              select: {
                id: true,
                cropName: true,
                variety: true,
                season: true,
                stage: true,
                status: true,
                sowingDate: true,
                expectedHarvestDate: true
              }
            }
          }
        }
      }
    });

    if (!farmer) {
      res.status(404).json({ error: 'Farmer profile not found' });
      return;
    }

    const allCrops = farmer.farms.flatMap(f => f.crops || []);
    const activeCrop = allCrops.find(c => c.status === 'ACTIVE') || allCrops[0] || null;
    const plannedCrop = allCrops.find(c => c.status === 'PLANNED') || null;
    const primaryFarm = farmer.farms[0];

    res.json({
      id: farmer.id,
      name: farmer.name,
      profileImage: farmer.profileImage,
      joinedAt: farmer.createdAt,
      location: primaryFarm?.location || 'Local Region',
      currentCrop: activeCrop ? {
        id: activeCrop.id,
        cropName: activeCrop.cropName,
        variety: activeCrop.variety,
        season: activeCrop.season,
        stage: activeCrop.stage,
        sowingDate: activeCrop.sowingDate,
        expectedHarvestDate: activeCrop.expectedHarvestDate
      } : null,
      nextCrop: plannedCrop ? {
        id: plannedCrop.id,
        cropName: plannedCrop.cropName,
        variety: plannedCrop.variety,
        season: plannedCrop.season,
        sowingDate: plannedCrop.sowingDate
      } : null,
      farmSummary: primaryFarm ? {
        name: primaryFarm.name,
        area: primaryFarm.area,
        areaUnit: primaryFarm.areaUnit,
        soilType: primaryFarm.soilType
      } : null
    });
  } catch (error) {
    console.error('Failed to fetch farmer profile:', error);
    res.status(500).json({ error: 'Failed to fetch farmer profile' });
  }
});

/**
 * GET /api/community/my-crops
 * Get current authenticated farmer's current and next planned crop.
 */
router.get('/my-crops', requireAuth, requireFarmerRole, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmerId = req.prismaUser.id;
    const farms = await prisma.farm.findMany({
      where: { ownerId: farmerId },
      include: { crops: true },
      orderBy: { createdAt: 'desc' }
    });

    const primaryFarm = farms[0] || null;
    const allCrops = farms.flatMap(f => f.crops || []);
    const currentCrop = allCrops.find(c => c.status === 'ACTIVE') || allCrops[0] || null;
    const nextCrop = allCrops.find(c => c.status === 'PLANNED') || null;

    res.json({
      farm: primaryFarm ? {
        id: primaryFarm.id,
        name: primaryFarm.name,
        location: primaryFarm.location,
        area: primaryFarm.area,
        soilType: primaryFarm.soilType
      } : null,
      currentCrop,
      nextCrop
    });
  } catch (error) {
    console.error('Failed to fetch my crops:', error);
    res.status(500).json({ error: 'Failed to fetch my crops' });
  }
});

/**
 * POST /api/community/my-crops
 * Register or update the authenticated Farmer's Current Crop and Next Planned Crop.
 */
router.post('/my-crops', requireAuth, requireFarmerRole, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmerId = req.prismaUser.id;
    const { currentCrop, nextCrop } = req.body || {};

    if (!currentCrop?.cropName && !nextCrop?.cropName) {
      res.status(400).json({ error: 'At least a current crop or next planned crop must be specified.' });
      return;
    }

    // Ensure farmer has a Farm
    let farm = await prisma.farm.findFirst({
      where: { ownerId: farmerId },
      orderBy: { createdAt: 'desc' }
    });

    if (!farm) {
      farm = await prisma.farm.create({
        data: {
          ownerId: farmerId,
          name: `${req.prismaUser.name}'s Farm`,
          location: currentCrop?.farmLocation || 'Guntur, Andhra Pradesh',
          area: parseFloat(currentCrop?.area) || 5.0,
          soilType: currentCrop?.soilType || 'Black Soil'
        }
      });
    } else if (currentCrop?.farmLocation) {
      farm = await prisma.farm.update({
        where: { id: farm.id },
        data: { location: currentCrop.farmLocation }
      });
    }

    let savedActiveCrop = null;
    let savedPlannedCrop = null;

    // 1. Process Current Crop (ACTIVE)
    if (currentCrop?.cropName) {
      const activeCrop = await prisma.farmCrop.findFirst({
        where: { farmId: farm.id, status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' }
      });

      if (activeCrop) {
        savedActiveCrop = await prisma.farmCrop.update({
          where: { id: activeCrop.id },
          data: {
            cropName: currentCrop.cropName.trim(),
            variety: currentCrop.variety || activeCrop.variety,
            season: currentCrop.season || activeCrop.season,
            stage: currentCrop.stage || activeCrop.stage,
            sowingDate: currentCrop.sowingDate ? new Date(currentCrop.sowingDate) : activeCrop.sowingDate,
            expectedHarvestDate: currentCrop.expectedHarvestDate ? new Date(currentCrop.expectedHarvestDate) : activeCrop.expectedHarvestDate
          }
        });
      } else {
        savedActiveCrop = await prisma.farmCrop.create({
          data: {
            farmId: farm.id,
            cropName: currentCrop.cropName.trim(),
            variety: currentCrop.variety || null,
            season: currentCrop.season || 'Kharif',
            stage: currentCrop.stage || 'SOWING',
            sowingDate: currentCrop.sowingDate ? new Date(currentCrop.sowingDate) : new Date(),
            expectedHarvestDate: currentCrop.expectedHarvestDate ? new Date(currentCrop.expectedHarvestDate) : null,
            status: 'ACTIVE'
          }
        });
      }
    }

    // 2. Process Next Planned Crop (PLANNED)
    if (nextCrop?.cropName) {
      const plannedCrop = await prisma.farmCrop.findFirst({
        where: { farmId: farm.id, status: 'PLANNED' },
        orderBy: { updatedAt: 'desc' }
      });

      if (plannedCrop) {
        savedPlannedCrop = await prisma.farmCrop.update({
          where: { id: plannedCrop.id },
          data: {
            cropName: nextCrop.cropName.trim(),
            variety: nextCrop.variety || plannedCrop.variety,
            season: nextCrop.season || plannedCrop.season,
            stage: 'PLANNED',
            sowingDate: nextCrop.plannedSowingDate ? new Date(nextCrop.plannedSowingDate) : plannedCrop.sowingDate
          }
        });
      } else {
        savedPlannedCrop = await prisma.farmCrop.create({
          data: {
            farmId: farm.id,
            cropName: nextCrop.cropName.trim(),
            variety: nextCrop.variety || null,
            season: nextCrop.season || 'Rabi',
            stage: 'PLANNED',
            sowingDate: nextCrop.plannedSowingDate ? new Date(nextCrop.plannedSowingDate) : null,
            status: 'PLANNED'
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Crop details saved successfully',
      farm: {
        id: farm.id,
        name: farm.name,
        location: farm.location,
        area: farm.area
      },
      currentCrop: savedActiveCrop,
      nextCrop: savedPlannedCrop
    });
  } catch (error: any) {
    console.error('Failed to save crop registration:', error);
    res.status(500).json({ error: error.message || 'Failed to save crop registration' });
  }
});

/**
 * GET /api/community/crop-trends
 * Authoritative crop statistics across registered farmers + Grounded Ollama explanation.
 * Strictly adheres to rule: No fabricated market prices when data feed is unconnected.
 */
router.get('/crop-trends', requireAuth, requireFarmerRole, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activeCrops = await prisma.farmCrop.findMany({
      where: { status: 'ACTIVE' },
      include: {
        farm: {
          select: {
            ownerId: true,
            location: true,
            area: true
          }
        }
      }
    });

    const plannedCrops = await prisma.farmCrop.findMany({
      where: { status: 'PLANNED' },
      include: {
        farm: {
          select: {
            ownerId: true,
            location: true,
            area: true
          }
        }
      }
    });

    const statsByCrop: Record<string, {
      cropName: string;
      activeFarmers: Set<string>;
      plannedFarmers: Set<string>;
      activeFields: number;
      regions: Record<string, number>;
    }> = {};

    for (const c of activeCrops) {
      const name = c.cropName.trim();
      if (!name) continue;
      if (!statsByCrop[name]) {
        statsByCrop[name] = {
          cropName: name,
          activeFarmers: new Set<string>(),
          plannedFarmers: new Set<string>(),
          activeFields: 0,
          regions: {}
        };
      }
      statsByCrop[name].activeFarmers.add(c.farm.ownerId);
      statsByCrop[name].activeFields += 1;
      const reg = c.farm.location || 'Local Region';
      statsByCrop[name].regions[reg] = (statsByCrop[name].regions[reg] || 0) + 1;
    }

    for (const c of plannedCrops) {
      const name = c.cropName.trim();
      if (!name) continue;
      if (!statsByCrop[name]) {
        statsByCrop[name] = {
          cropName: name,
          activeFarmers: new Set<string>(),
          plannedFarmers: new Set<string>(),
          activeFields: 0,
          regions: {}
        };
      }
      statsByCrop[name].plannedFarmers.add(c.farm.ownerId);
    }

    const cropStats = Object.values(statsByCrop).map(s => ({
      cropName: s.cropName,
      activeFarmerCount: s.activeFarmers.size,
      plannedFarmerCount: s.plannedFarmers.size,
      activeFieldCount: s.activeFields,
      topRegions: Object.entries(s.regions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([region, count]) => ({ region, count })),
      marketPriceStatus: 'UNAVAILABLE',
      marketPriceMessage: 'A reliable selling-price estimate is unavailable because current market-price data is not connected.'
    })).sort((a, b) => b.activeFarmerCount - a.activeFarmerCount);

    const cropSummaries = cropStats.slice(0, 5).map(c => 
      `${c.cropName}: ${c.activeFarmerCount} active cultivating farmers, ${c.plannedFarmerCount} planned next crop`
    ).join('; ');

    let ollamaExplanation = `Platform crop data shows ${cropStats.length} registered crops. Popular crops include ${cropStats.slice(0, 3).map(c => c.cropName).join(', ')}.`;
    try {
      const prompt = `Based strictly on this registered farmer crop participation data: [${cropSummaries}]. Provide a concise 2-sentence market context explaining what this platform cultivation trend indicates about crop supply and planning. Do not fabricate market prices, MSP, or yield numbers. Note that reliable price estimation is unavailable without connected market-price feeds.`;
      const system = `You are an agronomic intelligence assistant. Ground explanations strictly in provided platform counts. Never invent currency prices.`;
      const aiResponse = await aiProvider.generateText(prompt, system, 3000);
      if (aiResponse && aiResponse.trim().length > 10) {
        ollamaExplanation = aiResponse.trim();
      }
    } catch (aiErr) {
      ollamaExplanation = `Based on platform records, ${cropStats.length > 0 ? cropStats[0].cropName : 'cultivated crops'} has the highest registered participation among local farmers. Platform participation trends provide insights into community equipment demand and crop planning. Note that reliable selling-price estimates are unavailable because current market-price data is not connected.`;
    }

    const marketData = await marketPriceService.getMarketPrices();

    res.json({
      totalCropsTracked: cropStats.length,
      totalActiveCultivations: activeCrops.length,
      cropTrends: cropStats,
      marketPriceStatus: marketData.status,
      marketPriceSource: marketData.dataSource,
      marketPriceDisclaimer: marketData.disclaimer,
      marketPriceData: marketData,
      aiExplanation: ollamaExplanation,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to calculate crop trends:', error);
    res.status(500).json({ error: 'Failed to calculate crop trends' });
  }
});

/**
 * GET /api/community/market/prices
 * Real Agmarknet Indian mandi prices endpoint
 */
router.get('/market/prices', async (req: any, res: Response): Promise<void> => {
  try {
    const commodity = req.query.commodity ? String(req.query.commodity) : undefined;
    const state = req.query.state ? String(req.query.state) : undefined;
    const prices = await marketPriceService.getMarketPrices(commodity, state);
    res.json(prices);
  } catch (error) {
    console.error('Failed to fetch market prices:', error);
    res.status(500).json({ error: 'Failed to fetch market prices' });
  }
});

export default router;
