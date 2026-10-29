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
 * Real Agmarknet Indian mandi prices endpoint (backward-compatible alias)
 */
router.get('/market/prices', async (req: any, res: Response): Promise<void> => {
  try {
    const commodity = req.query.commodity ? String(req.query.commodity) : undefined;
    const state = req.query.state ? String(req.query.state) : undefined;
    const district = req.query.district ? String(req.query.district) : undefined;
    const market = req.query.market ? String(req.query.market) : undefined;
    const variety = req.query.variety ? String(req.query.variety) : undefined;
    const date = req.query.date ? String(req.query.date) : undefined;
    const prices = await marketPriceService.getMarketPrices({
      commodity,
      state,
      district,
      market,
      variety,
      date
    });
    res.json(prices);
  } catch (error) {
    console.error('Failed to fetch market prices:', error);
    res.status(500).json({ error: 'Failed to fetch market prices' });
  }
});

/**
 * ============================================================
 * PHASE 4: PERSISTENT FARMER COMMUNITY POSTS, QUESTIONS & REPLIES
 * ============================================================
 */

// 1. GET /api/community/posts - List paginated farming posts with search and category filters
router.get('/posts', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '15'), 10), 1), 50);
    const skip = (page - 1) * limit;

    const category = req.query.category ? String(req.query.category).toUpperCase() : undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;
    const myPosts = req.query.myPosts === 'true';

    const where: any = { status: 'ACTIVE' };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (myPosts && req.prismaUser) {
      where.authorId = req.prismaUser.id;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, posts] = await Promise.all([
      prisma.communityPost.count({ where }),
      prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              role: true
            }
          },
          _count: {
            select: {
              comments: true
            }
          }
        }
      })
    ]);

    res.json({
      posts: posts.map((p) => ({
        id: p.id,
        authorId: p.authorId,
        author: p.author,
        title: p.title,
        content: p.content,
        category: p.category,
        tags: p.tags ? p.tags.split(',').map((t) => t.trim()) : [],
        imageUrl: p.imageUrl,
        likesCount: p.likesCount,
        viewsCount: p.viewsCount,
        commentsCount: p._count.comments,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error('Failed to list community posts:', error);
    res.status(500).json({ error: 'Failed to retrieve community posts' });
  }
});

// 2. POST /api/community/posts - Create a farming post / question
router.post('/posts', requireAuth, requireFarmerRole, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, category = 'GENERAL', tags, imageUrl } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      res.status(400).json({ error: 'Post title must be at least 3 characters long.' });
      return;
    }
    if (title.trim().length > 150) {
      res.status(400).json({ error: 'Post title cannot exceed 150 characters.' });
      return;
    }

    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      res.status(400).json({ error: 'Post content must be at least 10 characters long to provide sufficient context.' });
      return;
    }
    if (content.trim().length > 5000) {
      res.status(400).json({ error: 'Post content cannot exceed 5000 characters.' });
      return;
    }

    const validCategories = ['CROPS', 'EQUIPMENT', 'PESTS_DISEASES', 'IRRIGATION', 'WEATHER', 'MARKETS', 'GENERAL'];
    const normalizedCategory = validCategories.includes(String(category).toUpperCase())
      ? String(category).toUpperCase()
      : 'GENERAL';

    const authorId = req.prismaUser.id;

    const newPost = await prisma.communityPost.create({
      data: {
        authorId,
        title: title.trim(),
        content: content.trim(),
        category: normalizedCategory,
        tags: tags ? (Array.isArray(tags) ? tags.join(', ') : String(tags)) : null,
        imageUrl: imageUrl ? String(imageUrl).trim() : null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            role: true
          }
        }
      }
    });

    // Sync to legacy CommunityMessage for backwards compatibility with mobile stream
    try {
      await prisma.communityMessage.create({
        data: {
          senderId: authorId,
          text: `[${normalizedCategory}] ${newPost.title}: ${newPost.content.slice(0, 250)}`
        }
      });
    } catch (_) {}

    // Real-time broadcast
    try {
      const io = getIo();
      if (io) io.emit('new_community_post', newPost);
    } catch (_) {}

    res.status(201).json(newPost);
  } catch (error: any) {
    console.error('Failed to create community post:', error);
    res.status(500).json({ error: 'Failed to create community post' });
  }
});

// 3. GET /api/community/posts/:id - Get single post with chronological comments
router.get('/posts/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = String(req.params.id);

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            role: true
          }
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!post || post.status !== 'ACTIVE') {
      res.status(404).json({ error: 'Post not found or has been removed.' });
      return;
    }

    // Increment views asynchronously
    prisma.communityPost.update({
      where: { id: postId },
      data: { viewsCount: { increment: 1 } }
    }).catch(() => {});

    res.json(post);
  } catch (error: any) {
    console.error('Failed to get community post:', error);
    res.status(500).json({ error: 'Failed to retrieve post details' });
  }
});

// 4. PUT /api/community/posts/:id - Edit own post with strict authorization
router.put('/posts/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = String(req.params.id);
    const { title, content, category } = req.body || {};

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    // Strictly enforce ownership or ADMIN role
    if (post.authorId !== req.prismaUser.id && req.prismaUser.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: You can only edit your own community posts.' });
      return;
    }

    if (title && (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 150)) {
      res.status(400).json({ error: 'Title must be between 3 and 150 characters.' });
      return;
    }

    if (content && (typeof content !== 'string' || content.trim().length < 10 || content.trim().length > 5000)) {
      res.status(400).json({ error: 'Content must be between 10 and 5000 characters.' });
      return;
    }

    const updated = await prisma.communityPost.update({
      where: { id: postId },
      data: {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        ...(category && { category: String(category).toUpperCase() })
      },
      include: {
        author: {
          select: { id: true, name: true, profileImage: true, role: true }
        }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update community post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// 5. DELETE /api/community/posts/:id - Delete own post with strict authorization
router.delete('/posts/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = String(req.params.id);

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    // Strict ownership enforcement
    if (post.authorId !== req.prismaUser.id && req.prismaUser.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: You can only delete your own community posts.' });
      return;
    }

    await prisma.communityPost.delete({ where: { id: postId } });
    res.json({ success: true, message: 'Community post removed successfully.' });
  } catch (error: any) {
    console.error('Failed to delete community post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// 6. POST /api/community/posts/:id/comments - Add reply and notify post author
router.post('/posts/:id/comments', requireAuth, requireFarmerRole, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = String(req.params.id);
    const { content, parentCommentId } = req.body || {};

    if (!content || typeof content !== 'string' || content.trim().length < 2) {
      res.status(400).json({ error: 'Comment must be at least 2 characters long.' });
      return;
    }
    if (content.trim().length > 2000) {
      res.status(400).json({ error: 'Comment cannot exceed 2000 characters.' });
      return;
    }

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post || post.status !== 'ACTIVE') {
      res.status(404).json({ error: 'Post not found or is no longer active.' });
      return;
    }

    const authorId = req.prismaUser.id;
    const authorName = req.prismaUser.name || 'A fellow farmer';

    const comment = await prisma.communityComment.create({
      data: {
        postId,
        authorId,
        content: content.trim(),
        parentCommentId: parentCommentId ? String(parentCommentId) : null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            role: true
          }
        }
      }
    });

    // Notify post author if commenter is someone else
    if (post.authorId !== authorId) {
      const preview = content.trim().length > 60 ? `${content.trim().slice(0, 60)}...` : content.trim();
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          title: `New Reply on "${post.title.slice(0, 35)}"`,
          message: `${authorName}: "${preview}"`,
          relatedId: post.id,
          type: 'COMMUNITY_REPLY'
        }
      }).catch(() => {});
    }

    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Failed to post community comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// 7. PUT /api/community/comments/:id - Edit own comment
router.put('/comments/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commentId = String(req.params.id);
    const { content } = req.body || {};

    const comment = await prisma.communityComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }

    if (comment.authorId !== req.prismaUser.id && req.prismaUser.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: You can only edit your own comments.' });
      return;
    }

    if (!content || typeof content !== 'string' || content.trim().length < 2) {
      res.status(400).json({ error: 'Comment text cannot be empty.' });
      return;
    }

    const updated = await prisma.communityComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        author: { select: { id: true, name: true, profileImage: true, role: true } }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Failed to edit comment:', error);
    res.status(500).json({ error: 'Failed to edit comment' });
  }
});

// 8. DELETE /api/community/comments/:id - Delete own comment
router.delete('/comments/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commentId = String(req.params.id);

    const comment = await prisma.communityComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }

    if (comment.authorId !== req.prismaUser.id && req.prismaUser.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: You can only delete your own comments.' });
      return;
    }

    await prisma.communityComment.delete({ where: { id: commentId } });
    res.json({ success: true, message: 'Comment deleted successfully.' });
  } catch (error: any) {
    console.error('Failed to delete comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// 9. POST /api/community/reports - Report inappropriate post or comment
router.post('/reports', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId, commentId, reason } = req.body || {};

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      res.status(400).json({ error: 'Please provide a clear reason for the report (minimum 5 characters).' });
      return;
    }

    if (!postId && !commentId) {
      res.status(400).json({ error: 'Target postId or commentId is required.' });
      return;
    }

    const reporterId = req.prismaUser.id;

    const report = await prisma.communityReport.create({
      data: {
        reporterId,
        postId: postId ? String(postId) : null,
        commentId: commentId ? String(commentId) : null,
        reason: reason.trim()
      }
    });

    if (postId) {
      await prisma.communityPost.update({
        where: { id: String(postId) },
        data: { isReported: true }
      }).catch(() => {});
    }

    res.json({ success: true, message: 'Report submitted for moderation review.', reportId: report.id });
  } catch (error: any) {
    console.error('Failed to report content:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// 10. POST /api/community/posts/:id/like - Like a community post
router.post('/posts/:id/like', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = String(req.params.id);
    const post = await prisma.communityPost.update({
      where: { id: postId },
      data: { likesCount: { increment: 1 } },
      select: { id: true, likesCount: true }
    });
    res.json({ success: true, likesCount: post.likesCount });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update like count' });
  }
});

export default router;
