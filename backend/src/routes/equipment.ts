import { Router, Request, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createEquipmentSchema, updateEquipmentSchema } from '../schemas';
import { deleteFileByUrl } from '../lib/storage';
import { prisma } from '../lib/prisma';

import { aiProvider } from '../services/aiProvider';

const router = Router();

// Get Equipment List (With Filters)
router.get('/', async (req: Request, res: Response, next: any): Promise<void> => {
  try {
    const { category, search, minPrice, maxPrice, sort, available, page, limit } = req.query;

    const pageNum = parseInt(String(page)) || 1;
    const limitNum = parseInt(String(limit)) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      owner: {
        isSuspended: false,
        isVerified: true
      }
    };

    if (available === 'true') {
      where.available = true;
    } else if (available === 'false') {
      where.available = false;
    } else {
      where.available = true; // Default to available only
    }

    if (category && category !== 'ALL' && category !== 'All Categories') {
      where.category = String(category).toUpperCase();
    }

    if (search) {
      const searchStr = String(search).toLowerCase();
      // Hybrid search: local mapped keyword first
      const dictionary: Record<string, string> = {
        'Ã Â°Å¸Ã Â±ÂÃ Â°Â°Ã Â°Â¾Ã Â°â€¢Ã Â±ÂÃ Â°Å¸Ã Â°Â°Ã Â±Â': 'tractor', 'tractor': 'tractor', 'Ã Â¤Å¸Ã Â¥ÂÃ Â¤Â°Ã Â¥Ë†Ã Â¤â€¢Ã Â¥ÂÃ Â¤Å¸Ã Â¤Â°': 'tractor', 'Ã Â®Å¸Ã Â®Â¿Ã Â®Â°Ã Â®Â¾Ã Â®â€¢Ã Â¯ÂÃ Â®Å¸Ã Â®Â°Ã Â¯Â': 'tractor', 'Ã Â²Å¸Ã Â³ÂÃ Â²Â°Ã Â²Â¾Ã Â²â€¢Ã Â³ÂÃ Â²Å¸Ã Â²Â°Ã Â³Â': 'tractor',
        'harvester': 'harvester', 'Ã Â°Â¹Ã Â°Â¾Ã Â°Â°Ã Â±ÂÃ Â°ÂµÃ Â±â€ Ã Â°Â¸Ã Â±ÂÃ Â°Å¸Ã Â°Â°Ã Â±Â': 'harvester', 'Ã Â¤Â¹Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤ÂµÃ Â¥â€¡Ã Â¤Â¸Ã Â¥ÂÃ Â¤Å¸Ã Â¤Â°': 'harvester', 'Ã Â®â€¦Ã Â®Â±Ã Â¯ÂÃ Â®ÂµÃ Â®Å¸Ã Â¯Ë† Ã Â®â€¡Ã Â®Â¯Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â°Ã Â®Â®Ã Â¯Â': 'harvester', 'Ã Â²Â¹Ã Â²Â¾Ã Â²Â°Ã Â³ÂÃ Â²ÂµÃ Â³â€ Ã Â²Â¸Ã Â³ÂÃ Â²Å¸Ã Â²Â°Ã Â³Â': 'harvester',
        'cultivator': 'cultivator', 'Ã Â°â€¢Ã Â°Â²Ã Â±ÂÃ Â°Å¸Ã Â°Â¿Ã Â°ÂµÃ Â±â€¡Ã Â°Å¸Ã Â°Â°Ã Â±Â': 'cultivator', 'Ã Â¤â€¢Ã Â¤Â²Ã Â¥ÂÃ Â¤Å¸Ã Â¥â‚¬Ã Â¤ÂµÃ Â¥â€¡Ã Â¤Å¸Ã Â¤Â°': 'cultivator', 'Ã Â®Å¡Ã Â®Â¾Ã Â®â€¢Ã Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â®Â¿Ã Â®Â¯Ã Â®Â¾Ã Â®Â³Ã Â®Â°Ã Â¯Â': 'cultivator', 'Ã Â²â€¢Ã Â²Â²Ã Â³ÂÃ Â²Å¸Ã Â²Â¿Ã Â²ÂµÃ Â³â€¡Ã Â²Å¸Ã Â²Â°Ã Â³Â': 'cultivator',
        'rotavator': 'rotavator', 'Ã Â°Â°Ã Â±â€¹Ã Â°Å¸Ã Â°ÂµÃ Â±â€¡Ã Â°Å¸Ã Â°Â°Ã Â±Â': 'rotavator', 'Ã Â¤Â°Ã Â¥â€¹Ã Â¤Å¸Ã Â¤Â¾Ã Â¤ÂµÃ Â¥â€¡Ã Â¤Å¸Ã Â¤Â°': 'rotavator', 'Ã Â®Â°Ã Â¯â€¹Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®Â¾Ã Â®ÂµÃ Â¯â€¡Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®Â°Ã Â¯Â': 'rotavator', 'Ã Â²Â°Ã Â³Å Ã Â²Å¸Ã Â²Â¾Ã Â²ÂµÃ Â³â€¡Ã Â²Å¸Ã Â²Â°Ã Â³Â': 'rotavator',
        'sprayer': 'sprayer', 'Ã Â°Â¸Ã Â±ÂÃ Â°ÂªÃ Â±ÂÃ Â°Â°Ã Â±â€¡Ã Â°Â¯Ã Â°Â°Ã Â±Â': 'sprayer', 'Ã Â¤Â¸Ã Â¥ÂÃ Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¥â€¡Ã Â¤Â¯Ã Â¤Â°': 'sprayer', 'Ã Â®Â¤Ã Â¯â€ Ã Â®Â³Ã Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¾Ã Â®Â©Ã Â¯Â': 'sprayer', 'Ã Â²Â¸Ã Â²Â¿Ã Â²â€šÃ Â²ÂªÃ Â²Â¡Ã Â²Â¿Ã Â²Â¸Ã Â³ÂÃ Â²ÂµÃ Â²ÂµÃ Â²Â¨Ã Â³Â': 'sprayer',
        'thresher': 'thresher', 'Ã Â°Â¥Ã Â±ÂÃ Â°Â°Ã Â±â€ Ã Â°Â·Ã Â°Â°Ã Â±Â': 'thresher', 'Ã Â¤Â¥Ã Â¥ÂÃ Â¤Â°Ã Â¥â€¡Ã Â¤Â¶Ã Â¤Â°': 'thresher', 'Ã Â®â€¢Ã Â®Â¤Ã Â®Â¿Ã Â®Â°Ã Â¯Â Ã Â®â€¦Ã Â®Å¸Ã Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¾Ã Â®Â©Ã Â¯Â': 'thresher', 'Ã Â²Â¥Ã Â³ÂÃ Â²Â°Ã Â³â€ Ã Â²Â·Ã Â²Â°Ã Â³Â': 'thresher',
        'seed drill': 'seed drill', 'Ã Â°Â¸Ã Â±â‚¬Ã Â°Â¡Ã Â±Â Ã Â°Â¡Ã Â±ÂÃ Â°Â°Ã Â°Â¿Ã Â°Â²Ã Â±Â': 'seed drill', 'Ã Â¤Â¸Ã Â¥â‚¬Ã Â¤Â¡ Ã Â¤Â¡Ã Â¥ÂÃ Â¤Â°Ã Â¤Â¿Ã Â¤Â²': 'seed drill', 'Ã Â®ÂµÃ Â®Â¿Ã Â®Â¤Ã Â¯Ë† Ã Â®Â¤Ã Â¯ÂÃ Â®Â°Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â£Ã Â®Â®Ã Â¯Â': 'seed drill', 'Ã Â²Â¬Ã Â³â‚¬Ã Â²Å“ Ã Â²Â¡Ã Â³ÂÃ Â²Â°Ã Â²Â¿Ã Â²Â²Ã Â³Â': 'seed drill',
        'power tiller': 'power tiller', 'Ã Â°ÂªÃ Â°ÂµÃ Â°Â°Ã Â±Â Ã Â°Å¸Ã Â°Â¿Ã Â°Â²Ã Â±ÂÃ Â°Â²Ã Â°Â°Ã Â±Â': 'power tiller', 'Ã Â¤ÂªÃ Â¤Â¾Ã Â¤ÂµÃ Â¤Â° Ã Â¤Å¸Ã Â¤Â¿Ã Â¤Â²Ã Â¤Â°': 'power tiller', 'Ã Â®ÂªÃ Â®ÂµÃ Â®Â°Ã Â¯Â Ã Â®Å¸Ã Â®Â¿Ã Â®Â²Ã Â¯ÂÃ Â®Â²Ã Â®Â°Ã Â¯Â': 'power tiller', 'Ã Â²ÂªÃ Â²ÂµÃ Â²Â°Ã Â³Â Ã Â²Å¸Ã Â²Â¿Ã Â²Â²Ã Â³ÂÃ Â²Â²Ã Â²Â°Ã Â³Â': 'power tiller',
        'rice transplanter': 'rice transplanter', 'Ã Â°Â°Ã Â±Ë†Ã Â°Â¸Ã Â±Â Ã Â°Å¸Ã Â±ÂÃ Â°Â°Ã Â°Â¾Ã Â°Â¨Ã Â±ÂÃ Â°Â¸Ã Â±ÂÃ¢â‚¬Å’Ã Â°ÂªÃ Â±ÂÃ Â°Â²Ã Â°Â¾Ã Â°â€šÃ Â°Å¸Ã Â°Â°Ã Â±Â': 'rice transplanter', 'Ã Â¤Â°Ã Â¤Â¾Ã Â¤â€¡Ã Â¤Â¸ Ã Â¤Å¸Ã Â¥ÂÃ Â¤Â°Ã Â¤Â¾Ã Â¤â€šÃ Â¤Â¸Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â²Ã Â¤Â¾Ã Â¤â€šÃ Â¤Å¸Ã Â¤Â°': 'rice transplanter', 'Ã Â®Â¨Ã Â¯â€ Ã Â®Â²Ã Â¯Â Ã Â®Â¨Ã Â®Â¾Ã Â®Â±Ã Â¯ÂÃ Â®Â±Ã Â¯Â Ã Â®Â¨Ã Â®Å¸Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®â€¡Ã Â®Â¯Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â°Ã Â®Â®Ã Â¯Â': 'rice transplanter', 'Ã Â²Â­Ã Â²Â¤Ã Â³ÂÃ Â²Â¤Ã Â²Â¦ Ã Â²Â¨Ã Â²Â¾Ã Â²Å¸Ã Â²Â¿ Ã Â²Â¯Ã Â²â€šÃ Â²Â¤Ã Â³ÂÃ Â²Â°': 'rice transplanter'
      };

      let keyword = dictionary[searchStr];
      if (!keyword) {
        // Fallback to AI intent
        try {
          keyword = await aiProvider.getSearchIntent(searchStr);
        } catch (e) {
          keyword = searchStr;
        }
      }

      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { category: { contains: keyword, mode: 'insensitive' } },
        { titleEn: { contains: keyword, mode: 'insensitive' } },
        { titleTe: { contains: searchStr, mode: 'insensitive' } },
        { titleHi: { contains: searchStr, mode: 'insensitive' } },
        { titleTa: { contains: searchStr, mode: 'insensitive' } },
        { titleKn: { contains: searchStr, mode: 'insensitive' } }
      ];
    }

    if (minPrice || maxPrice) {
      where.pricePerDay = {};
      if (minPrice) where.pricePerDay.gte = parseFloat(String(minPrice));
      if (maxPrice) where.pricePerDay.lte = parseFloat(String(maxPrice));
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'lowest_price') orderBy = { pricePerDay: 'asc' };
    if (sort === 'highest_price') orderBy = { pricePerDay: 'desc' };
    if (sort === 'newest') orderBy = { createdAt: 'desc' };
    // "recommended", "nearest", "highest_rated" can be future extensions, default to createdAt

    const [total, equipment] = await prisma.$transaction([
      prisma.equipment.count({ where }),
      prisma.equipment.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          owner: {
            select: { id: true, name: true }
          }
        }
      })
    ]);

    const equipmentIds = equipment.map(e => e.id);
    const feedbacks = await prisma.feedback.findMany({
      where: {
        category: 'Equipment',
        subject: { in: equipmentIds }
      },
      include: {
        user: { select: { name: true } }
      }
    });

    const enrichedEquipment = equipment.map(eq => {
      const eqFeedbacks = feedbacks.filter(f => f.subject === eq.id);
      const ratingSum = eqFeedbacks.reduce((sum, f) => sum + f.rating, 0);
      return {
        ...eq,
        rating: eqFeedbacks.length > 0 ? (ratingSum / eqFeedbacks.length).toFixed(1) : 0,
        reviewCount: eqFeedbacks.length,
        reviews: eqFeedbacks.map(f => ({
          rating: f.rating,
          text: f.message,
          author: f.user.name,
          createdAt: f.createdAt
        }))
      };
    });

    res.json({
      data: enrichedEquipment,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Equipment Fetch Error:', error);
    next(error);
  }
});

// Haversine distance function
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Get Nearby Equipment
router.get('/nearby', async (req: Request, res: Response, next: any): Promise<void> => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const equipment = await prisma.equipment.findMany({
      where: { available: true, latitude: { not: null }, longitude: { not: null } },
      include: { owner: { select: { id: true, name: true } } }
    });

    const targetLat = parseFloat(String(lat));
    const targetLng = parseFloat(String(lng));
    const maxRadius = parseFloat(String(radius));

    const nearbyEquipment = equipment.filter(eq => {
      if (eq.latitude === null || eq.longitude === null) return false;
      const distance = getDistanceFromLatLonInKm(targetLat, targetLng, eq.latitude, eq.longitude);
      // Attach distance to the returned object for frontend convenience
      (eq as any).distance = distance;
      return distance <= maxRadius;
    });

    // Sort by distance
    nearbyEquipment.sort((a: any, b: any) => a.distance - b.distance);

    res.json(nearbyEquipment);
  } catch (error) {
    console.error('Nearby Equipment Error:', error);
    next(error);
  }
});

// Get My Equipment (Owner Only)
router.get('/my', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipment = await prisma.equipment.findMany({
      where: { ownerId: String(req.prismaUser.id) },
      orderBy: { createdAt: 'desc' }
    });

    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your equipment' });
  }
});

// Get Single Equipment (Public)
router.get('/:id', async (req: Request, res: Response, next: any): Promise<void> => {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: String(req.params.id) },
      include: {
        owner: {
          select: { id: true, name: true, phone: true }
        }
      }
    });

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    const feedbacks = await prisma.feedback.findMany({
      where: {
        category: 'Equipment',
        subject: equipment.id
      },
      include: {
        user: { select: { name: true } }
      }
    });

    const ratingSum = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const enrichedEquipment = {
      ...equipment,
      rating: feedbacks.length > 0 ? (ratingSum / feedbacks.length).toFixed(1) : 0,
      reviewCount: feedbacks.length,
      distance: 0, // Fallback for single item view without location
      securityDeposit: (equipment as any).securityDeposit || (equipment.pricePerDay * 0.2), // Default 20% if not set
      reviews: feedbacks.map(f => ({
        rating: f.rating,
        text: f.message,
        author: f.user.name,
        createdAt: f.createdAt
      }))
    };

    res.json(enrichedEquipment);
  } catch (error) {
    console.error('Single Equipment Fetch Error:', error);
    next(error);
  }
});

// Create Equipment (Owner Only)
router.post('/', requireAuth, requireRole('OWNER'), validate(createEquipmentSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  console.log("CREATE PAYLOAD", req.body);
  try {
    const { title, category, pricePerDay, description, imageUrl, location } = req.body;

    let finalImageUrl = imageUrl ? String(imageUrl) : '';

    let transData: any = {};
    try {
      transData = await aiProvider.translateListing(String(title), description ? String(description) : '');
    } catch (e) {
      console.warn('AI translation failed, storing without translations', e);
    }

    const equipment = await prisma.equipment.create({
      data: {
        title: String(title),
        category: String(category).toUpperCase(),
        pricePerDay: parseFloat(String(pricePerDay)),
        description: description ? String(description) : '',
        imageUrl: finalImageUrl,
        location: location ? String(location) : null,
        latitude: req.body.latitude ? parseFloat(String(req.body.latitude)) : null,
        longitude: req.body.longitude ? parseFloat(String(req.body.longitude)) : null,
        ownerId: String(req.prismaUser.id),
        available: true,
        titleEn: transData.titleEn || null,
        titleTe: transData.titleTe || null,
        titleHi: transData.titleHi || null,
        titleTa: transData.titleTa || null,
        titleKn: transData.titleKn || null,
        descriptionEn: transData.descriptionEn || null,
        descriptionTe: transData.descriptionTe || null,
        descriptionHi: transData.descriptionHi || null,
        descriptionTa: transData.descriptionTa || null,
        descriptionKn: transData.descriptionKn || null,
        translationVersion: 1
      }
    });

    console.log("CREATED", equipment);
    res.status(201).json(equipment);
  } catch (error) {
    console.error("CREATE EQUIPMENT ERROR STACKTRACE:", error);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

// Update Equipment (Owner Only)
router.put('/:id', requireAuth, requireRole('OWNER'), validate(updateEquipmentSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipmentId = String(req.params.id);
    const updates = req.body;

    // Verify ownership
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    });

    if (!existingEquipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    if (existingEquipment.ownerId !== req.prismaUser.id) {
      res.status(403).json({ error: 'You can only update your own equipment' });
      return;
    }

    // Clean updates to match model fields exactly
    const data: any = {};
    if (updates.title) data.title = String(updates.title);
    if (updates.category) data.category = String(updates.category).toUpperCase();
    if (updates.pricePerDay) data.pricePerDay = parseFloat(String(updates.pricePerDay));
    if (updates.description !== undefined) data.description = String(updates.description);
    if (updates.imageUrl !== undefined) data.imageUrl = String(updates.imageUrl);
    if (updates.location !== undefined) data.location = updates.location ? String(updates.location) : null;
    if (updates.latitude !== undefined) data.latitude = updates.latitude ? parseFloat(String(updates.latitude)) : null;
    if (updates.longitude !== undefined) data.longitude = updates.longitude ? parseFloat(String(updates.longitude)) : null;
    if (updates.available !== undefined) data.available = Boolean(updates.available);

    const equipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data
    });

    if (data.available === false && existingEquipment.available !== false) {
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN', pushToken: { not: null } },
        select: { id: true, pushToken: true }
      });

      await prisma.notification.createMany({
        data: adminUsers.map(admin => ({
          userId: admin.id,
          title: 'Equipment flagged for review',
          message: `Owner ${req.prismaUser.name} flagged ${equipment.title} as unavailable. Review the listing.`,
          type: 'EQUIPMENT_FLAGGED',
          relatedId: equipment.id
        }))
      });


    }

    res.json(equipment);
  } catch (error) {
    console.error('Update Equipment Error:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

// Delete Equipment (Owner Only)
router.delete('/:id', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipmentId = String(req.params.id);

    // Verify ownership
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    });

    if (!existingEquipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    if (existingEquipment.ownerId !== req.prismaUser.id) {
      res.status(403).json({ error: 'You can only delete your own equipment' });
      return;
    }

    // Delete image if exists
    if (existingEquipment.imageUrl && existingEquipment.imageUrl.includes('supabase')) {
      try {
        await deleteFileByUrl(existingEquipment.imageUrl, 'equipment-images');
      } catch (err) {
        console.warn('Failed to delete image from storage:', err);
      }
    }

    await prisma.equipment.delete({
      where: { id: equipmentId }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.prismaUser.id,
        actorRole: req.prismaUser.role,
        action: 'DELETE_EQUIPMENT',
        resource: 'Equipment',
        resourceId: equipmentId,
        metadata: JSON.stringify({ title: existingEquipment.title }),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Delete Equipment Error:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});

export default router;
