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
      const catUpper = String(category).trim().toUpperCase();
      const categoryMap: Record<string, string[]> = {
        'TRACTOR': ['TRACTOR', 'TRACTORS'],
        'TRACTORS': ['TRACTOR', 'TRACTORS'],
        'HARVESTER': ['HARVESTER', 'HARVESTERS'],
        'HARVESTERS': ['HARVESTER', 'HARVESTERS'],
        'POWER_TILLERS': ['POWER_TILLERS', 'POWER_TILLER', 'TILLER', 'POWER TILLER'],
        'POWER TILLERS': ['POWER_TILLERS', 'POWER_TILLER', 'TILLER', 'POWER TILLER'],
        'POWER_TILLER': ['POWER_TILLERS', 'POWER_TILLER', 'TILLER', 'POWER TILLER'],
        'POWER TILLER': ['POWER_TILLERS', 'POWER_TILLER', 'TILLER', 'POWER TILLER'],
        'TILLER': ['POWER_TILLERS', 'POWER_TILLER', 'TILLER', 'POWER TILLER'],
        'IMPLEMENTS': ['IMPLEMENTS', 'ROTAVATOR', 'THRESHER', 'SEED DRILL'],
        'SPRAYER': ['SPRAYER', 'SPRAYERS'],
        'SPRAYERS': ['SPRAYER', 'SPRAYERS'],
        'PUMP': ['IRRIGATION', 'PUMP', 'PUMPS', 'WATER PUMP'],
        'PUMPS': ['IRRIGATION', 'PUMP', 'PUMPS', 'WATER PUMP'],
        'IRRIGATION': ['IRRIGATION', 'PUMP', 'PUMPS', 'WATER PUMP'],
        'CULTIVATOR': ['CULTIVATOR', 'CULTIVATORS'],
      };

      if (categoryMap[catUpper]) {
        where.category = { in: categoryMap[catUpper] };
      } else {
        where.category = { equals: catUpper, mode: 'insensitive' };
      }
    }

    if (search) {
      const searchStr = String(search).toLowerCase();
      // Hybrid search: local mapped keyword first
      const dictionary: Record<string, string> = {
        // Telugu
        'ట్రాక్టర్': 'tractor', 'హార్వెస్టర్': 'harvester', 'కల్టివేటర్': 'cultivator', 'రోటవేటర్': 'rotavator',
        'స్ప్రేయర్': 'sprayer', 'థ్రెషర్': 'thresher', 'సీడ్ డ్రిల్': 'seed drill', 'పవర్ టిల్లర్': 'power tiller', 'రైస్ ట్రాన్స్‌ప్లాంటర్': 'rice transplanter',
        // Hindi
        'ट्रैक्टर': 'tractor', 'हार्वेस्टर': 'harvester', 'कल्तीवेटर': 'cultivator', 'रोटावेटर': 'rotavator',
        'स्प्रेयर': 'sprayer', 'थ्रेशर': 'thresher', 'सीड ड्रिल': 'seed drill', 'पावर टिलर': 'power tiller', 'राइस ट्रांसप्लांटर': 'rice transplanter',
        // Tamil
        'டிராக்டர்': 'tractor', 'அறுவடை இயந்திரம்': 'harvester', 'சாகுபடியாளர்': 'cultivator', 'ரோட்டாவேட்டர்': 'rotavator',
        'தெளிப்பான்': 'sprayer', 'கதிர் அடிப்பான்': 'thresher', 'விதை துரப்பணம்': 'seed drill', 'பவர் டில்லர்': 'power tiller', 'நெல் நாற்று நடும் இயந்திரம்': 'rice transplanter',
        // Kannada
        'ಟ್ರಾಕ್ಟರ್': 'tractor', 'ಹಾರ್ವೆಸ್ಟರ್': 'harvester', 'ಕಲ್ಟಿವೇಟರ್': 'cultivator', 'ರೊಟಾವೇಟರ್': 'rotavator',
        'ಸಿಂಪಡಿಸುವವನು': 'sprayer', 'ಥ್ರೆಷರ್': 'thresher', 'ಬೀಜ ಡ್ರಿಲ್': 'seed drill', 'ಪವರ್ ಟಿಲ್ಲರ್': 'power tiller', 'ಭತ್ತದ ನಾಟಿ ಯಂತ್ರ': 'rice transplanter',
        // English canonical
        'tractor': 'tractor', 'harvester': 'harvester', 'cultivator': 'cultivator', 'rotavator': 'rotavator',
        'sprayer': 'sprayer', 'thresher': 'thresher', 'seed drill': 'seed drill', 'power tiller': 'power tiller', 'rice transplanter': 'rice transplanter'
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

// Get My Equipment (Owner Only) - supports both /my and /owner
router.get(['/my', '/owner'], requireAuth, requireRole('OWNER'), async (req: AuthRequest, res: Response): Promise<void> => {
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

// Get Equipment Categories Taxonomy (Public)
router.get('/categories', async (req: Request, res: Response, next: any): Promise<void> => {
  try {
    const categories = [
      { id: 'TRACTORS', name: 'Tractors', description: 'Heavy and compact agricultural tractors' },
      { id: 'HARVESTERS', name: 'Harvesters', description: 'Combine harvesters and grain equipment' },
      { id: 'POWER_TILLERS', name: 'Power Tillers', description: 'Rotary tillers and soil cultivation units' },
      { id: 'IMPLEMENTS', name: 'Implements', description: 'Rotavators, plows, and seed drills' },
      { id: 'SPRAYERS', name: 'Sprayers', description: 'Boom sprayers and pest control equipment' },
      { id: 'IRRIGATION', name: 'Irrigation & Pumps', description: 'Water pumps, diesel engines, and sprinkler rigs' },
      { id: 'CULTIVATORS', name: 'Cultivators', description: 'Secondary tillage and weed control cultivators' },
      { id: 'ATTACHMENTS', name: 'Attachments & Tools', description: 'Trolleys, loaders, and specialized attachments' }
    ];
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

// Get Single Equipment (Public)
router.get('/:id', async (req: Request, res: Response, next: any): Promise<void> => {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: String(req.params.id) },
      include: {
        owner: {
          select: { id: true, name: true }
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
    // Validate Owner Phone Number requirement (Indian mobile format: 10 digits or +91)
    const ownerUser = await prisma.user.findUnique({
      where: { id: req.prismaUser.id },
      select: { phone: true },
    });

    const phoneStr = ownerUser?.phone ? String(ownerUser.phone).replace(/[\s\-\(\)\+]/g, '') : '';
    const isValidPhone = (/^[6-9]\d{9}$/.test(phoneStr) || /^91[6-9]\d{9}$/.test(phoneStr));

    if (!isValidPhone) {
      res.status(400).json({
        status: 'error',
        code: 'PHONE_NUMBER_REQUIRED',
        message: 'Please add a valid phone number to your profile before listing equipment.',
      });
      return;
    }

    // Validate Owner Bank Details requirement before listing equipment for rent
    const bankEntry = await prisma.auditLog.findFirst({
      where: {
        actorId: req.prismaUser.id,
        resource: 'OWNER_BANK_DETAILS'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!bankEntry || !bankEntry.metadata) {
      res.status(400).json({
        status: 'error',
        code: 'BANK_DETAILS_REQUIRED',
        message: 'Please provide and save your bank account payout details before listing equipment for rent.',
      });
      return;
    }

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
    if (updates.available !== undefined) {
      data.available = Boolean(updates.available);

      // If owner is activating a listing, enforce bank details requirement
      if (data.available === true && existingEquipment.available !== true) {
        const bankEntry = await prisma.auditLog.findFirst({
          where: {
            actorId: req.prismaUser.id,
            resource: 'OWNER_BANK_DETAILS'
          },
          orderBy: { createdAt: 'desc' }
        });

        if (!bankEntry || !bankEntry.metadata) {
          res.status(400).json({
            status: 'error',
            code: 'BANK_DETAILS_REQUIRED',
            message: 'Please provide and save your bank account payout details before publishing an active listing.',
          });
          return;
        }
      }
    }

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

/**
 * GET /api/equipment/:id/maintenance
 * Retrieve maintenance and service history for an equipment item
 */
router.get('/:id/maintenance', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipmentId = String(req.params.id);
    const userId = (req as any).prismaUser.id;
    const isAdmin = (req as any).prismaUser.role === 'ADMIN';

    const equip = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      select: { id: true, title: true, ownerId: true }
    });

    if (!equip) {
      res.status(404).json({ success: false, error: 'Equipment not found' });
      return;
    }

    if (!isAdmin && equip.ownerId !== userId) {
      res.status(403).json({ success: false, error: 'Forbidden: You do not own this equipment.' });
      return;
    }

    const records = await prisma.auditLog.findMany({
      where: {
        resource: 'EQUIPMENT_MAINTENANCE',
        resourceId: equipmentId
      },
      orderBy: { createdAt: 'desc' }
    });

    const maintenanceList = records.map((r) => {
      let meta: any = {};
      try {
        if (r.metadata) meta = JSON.parse(r.metadata);
      } catch (_) {}

      return {
        id: r.id,
        equipmentId,
        equipmentTitle: equip.title,
        serviceType: meta.serviceType || 'Routine Service',
        serviceDate: meta.serviceDate || r.createdAt.toISOString(),
        cost: meta.cost != null ? Number(meta.cost) : 0,
        providerName: meta.providerName || '',
        notes: meta.notes || '',
        nextServiceDue: meta.nextServiceDue || '',
        createdAt: r.createdAt
      };
    });

    res.json({
      success: true,
      data: maintenanceList
    });
  } catch (error: any) {
    console.error('Fetch maintenance records error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch maintenance records' });
  }
});

/**
 * POST /api/equipment/:id/maintenance
 * Record service or maintenance for an equipment item
 */
router.post('/:id/maintenance', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipmentId = String(req.params.id);
    const userId = (req as any).prismaUser.id;
    const userRole = (req as any).prismaUser.role;
    const isAdmin = userRole === 'ADMIN';

    const equip = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    });

    if (!equip) {
      res.status(404).json({ success: false, error: 'Equipment not found' });
      return;
    }

    if (!isAdmin && equip.ownerId !== userId) {
      res.status(403).json({ success: false, error: 'Forbidden: You can only log maintenance for your own equipment.' });
      return;
    }

    const { serviceType, serviceDate, cost, providerName, notes, nextServiceDue } = req.body;

    const validTypes = [
      'Routine Service',
      'Oil Change',
      'Tyre Replacement',
      'Engine Repair',
      'Blade/Attachment Sharpening',
      'Electrical',
      'General Inspection',
      'Other'
    ];

    const type = String(serviceType || '').trim();
    if (!type) {
      res.status(400).json({ success: false, error: 'Service Type is required' });
      return;
    }

    const parsedCost = cost != null ? Number(cost) : 0;
    if (isNaN(parsedCost) || parsedCost < 0) {
      res.status(400).json({ success: false, error: 'Cost must be a valid non-negative number' });
      return;
    }

    const parsedDate = serviceDate ? new Date(serviceDate).toISOString() : new Date().toISOString();

    const record = await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorRole: userRole,
        action: 'LOG_MAINTENANCE',
        resource: 'EQUIPMENT_MAINTENANCE',
        resourceId: equipmentId,
        metadata: JSON.stringify({
          serviceType: type,
          serviceDate: parsedDate,
          cost: parsedCost,
          providerName: String(providerName || '').trim(),
          notes: String(notes || '').trim(),
          nextServiceDue: String(nextServiceDue || '').trim(),
          equipmentTitle: equip.title
        })
      }
    });

    res.json({
      success: true,
      message: 'Maintenance record saved successfully',
      data: {
        id: record.id,
        equipmentId,
        serviceType: type,
        serviceDate: parsedDate,
        cost: parsedCost,
        providerName: String(providerName || '').trim(),
        notes: String(notes || '').trim(),
        nextServiceDue: String(nextServiceDue || '').trim(),
        createdAt: record.createdAt
      }
    });
  } catch (error: any) {
    console.error('Log maintenance record error:', error);
    res.status(500).json({ success: false, error: 'Failed to record maintenance' });
  }
});

export default router;
