"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validate_1 = require("../middlewares/validate");
const schemas_1 = require("../schemas");
const storage_1 = require("../lib/storage");
const prisma_1 = require("../lib/prisma");
const push_1 = require("../lib/push");
const axios_1 = __importDefault(require("axios"));
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const router = (0, express_1.Router)();
// Get Equipment List (With Filters)
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, search, minPrice, maxPrice, sort, available, page, limit } = req.query;
        const pageNum = parseInt(String(page)) || 1;
        const limitNum = parseInt(String(limit)) || 20;
        const skip = (pageNum - 1) * limitNum;
        const where = {
            owner: {
                isSuspended: false,
                isVerified: true
            }
        };
        if (available === 'true') {
            where.available = true;
        }
        else if (available === 'false') {
            where.available = false;
        }
        else {
            where.available = true; // Default to available only
        }
        if (category && category !== 'ALL' && category !== 'All Categories') {
            where.category = String(category).toUpperCase();
        }
        if (search) {
            const searchStr = String(search).toLowerCase();
            // Hybrid search: local mapped keyword first
            const dictionary = {
                'ట్రాక్టర్': 'tractor', 'tractor': 'tractor', 'ट्रैक्टर': 'tractor', 'டிராக்டர்': 'tractor', 'ಟ್ರಾಕ್ಟರ್': 'tractor',
                'harvester': 'harvester', 'హార్వెస్టర్': 'harvester', 'हार्वेस्टर': 'harvester', 'அறுவடை இயந்திரம்': 'harvester', 'ಹಾರ್ವೆಸ್ಟರ್': 'harvester',
                'cultivator': 'cultivator', 'కల్టివేటర్': 'cultivator', 'कल्टीवेटर': 'cultivator', 'சாகுபடியாளர்': 'cultivator', 'ಕಲ್ಟಿವೇಟರ್': 'cultivator',
                'rotavator': 'rotavator', 'రోటవేటర్': 'rotavator', 'रोटावेटर': 'rotavator', 'ரோட்டாவேட்டர்': 'rotavator', 'ರೊಟಾವೇಟರ್': 'rotavator',
                'sprayer': 'sprayer', 'స్ప్రేయర్': 'sprayer', 'स्प्रेयर': 'sprayer', 'தெளிப்பான்': 'sprayer', 'ಸಿಂಪಡಿಸುವವನು': 'sprayer',
                'thresher': 'thresher', 'థ్రెషర్': 'thresher', 'थ्रेशर': 'thresher', 'கதிர் அடிப்பான்': 'thresher', 'ಥ್ರೆಷರ್': 'thresher',
                'seed drill': 'seed drill', 'సీడ్ డ్రిల్': 'seed drill', 'सीड ड्रिल': 'seed drill', 'விதை துரப்பணம்': 'seed drill', 'ಬೀಜ ಡ್ರಿಲ್': 'seed drill',
                'power tiller': 'power tiller', 'పవర్ టిల్లర్': 'power tiller', 'पावर टिलर': 'power tiller', 'பவர் டில்லர்': 'power tiller', 'ಪವರ್ ಟಿಲ್ಲರ್': 'power tiller',
                'rice transplanter': 'rice transplanter', 'రైస్ ట్రాన్స్‌ప్లాంటర్': 'rice transplanter', 'राइस ट्रांसप्लांटर': 'rice transplanter', 'நெல் நாற்று நடும் இயந்திரம்': 'rice transplanter', 'ಭತ್ತದ ನಾಟಿ ಯಂತ್ರ': 'rice transplanter'
            };
            let keyword = dictionary[searchStr];
            if (!keyword) {
                // Fallback to AI intent
                try {
                    const aiResponse = yield axios_1.default.post(`${AI_SERVICE_URL}/search-intent`, { query: searchStr });
                    keyword = aiResponse.data.keywords;
                }
                catch (e) {
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
            if (minPrice)
                where.pricePerDay.gte = parseFloat(String(minPrice));
            if (maxPrice)
                where.pricePerDay.lte = parseFloat(String(maxPrice));
        }
        let orderBy = { createdAt: 'desc' };
        if (sort === 'lowest_price')
            orderBy = { pricePerDay: 'asc' };
        if (sort === 'highest_price')
            orderBy = { pricePerDay: 'desc' };
        if (sort === 'newest')
            orderBy = { createdAt: 'desc' };
        // "recommended", "nearest", "highest_rated" can be future extensions, default to createdAt
        const [total, equipment] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.equipment.count({ where }),
            prisma_1.prisma.equipment.findMany({
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
        res.json({
            data: equipment,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Equipment Fetch Error:', error);
        next(error);
    }
}));
// Haversine distance function
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};
// Get Nearby Equipment
router.get('/nearby', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lat, lng, radius = 50 } = req.query;
        if (!lat || !lng) {
            res.status(400).json({ error: 'Latitude and longitude are required' });
            return;
        }
        const equipment = yield prisma_1.prisma.equipment.findMany({
            where: { available: true, latitude: { not: null }, longitude: { not: null } },
            include: { owner: { select: { id: true, name: true } } }
        });
        const targetLat = parseFloat(String(lat));
        const targetLng = parseFloat(String(lng));
        const maxRadius = parseFloat(String(radius));
        const nearbyEquipment = equipment.filter(eq => {
            if (eq.latitude === null || eq.longitude === null)
                return false;
            const distance = getDistanceFromLatLonInKm(targetLat, targetLng, eq.latitude, eq.longitude);
            // Attach distance to the returned object for frontend convenience
            eq.distance = distance;
            return distance <= maxRadius;
        });
        // Sort by distance
        nearbyEquipment.sort((a, b) => a.distance - b.distance);
        res.json(nearbyEquipment);
    }
    catch (error) {
        console.error('Nearby Equipment Error:', error);
        next(error);
    }
}));
// Get My Equipment (Owner Only)
router.get('/my', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('OWNER'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const equipment = yield prisma_1.prisma.equipment.findMany({
            where: { ownerId: String(req.prismaUser.id) },
            orderBy: { createdAt: 'desc' }
        });
        res.json(equipment);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch your equipment' });
    }
}));
// Get Single Equipment (Public)
router.get('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const equipment = yield prisma_1.prisma.equipment.findUnique({
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
        res.json(equipment);
    }
    catch (error) {
        console.error('Single Equipment Fetch Error:', error);
        next(error);
    }
}));
// Create Equipment (Owner Only)
router.post('/', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('OWNER'), (0, validate_1.validate)(schemas_1.createEquipmentSchema), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("CREATE PAYLOAD", req.body);
    try {
        const { title, category, pricePerDay, description, imageUrl, location } = req.body;
        let finalImageUrl = imageUrl ? String(imageUrl) : '';
        let transData = {};
        try {
            const aiResponse = yield axios_1.default.post(`${AI_SERVICE_URL}/translate-listing`, {
                title: String(title),
                description: description ? String(description) : ''
            });
            transData = aiResponse.data;
        }
        catch (e) {
            console.warn('AI translation failed, storing without translations', e);
        }
        const equipment = yield prisma_1.prisma.equipment.create({
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
    }
    catch (error) {
        console.error("CREATE EQUIPMENT ERROR STACKTRACE:", error);
        res.status(500).json({ error: 'Failed to create equipment' });
    }
}));
// Update Equipment (Owner Only)
router.put('/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('OWNER'), (0, validate_1.validate)(schemas_1.updateEquipmentSchema), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const equipmentId = String(req.params.id);
        const updates = req.body;
        // Verify ownership
        const existingEquipment = yield prisma_1.prisma.equipment.findUnique({
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
        const data = {};
        if (updates.title)
            data.title = String(updates.title);
        if (updates.category)
            data.category = String(updates.category).toUpperCase();
        if (updates.pricePerDay)
            data.pricePerDay = parseFloat(String(updates.pricePerDay));
        if (updates.description !== undefined)
            data.description = String(updates.description);
        if (updates.imageUrl !== undefined)
            data.imageUrl = String(updates.imageUrl);
        if (updates.location !== undefined)
            data.location = updates.location ? String(updates.location) : null;
        if (updates.latitude !== undefined)
            data.latitude = updates.latitude ? parseFloat(String(updates.latitude)) : null;
        if (updates.longitude !== undefined)
            data.longitude = updates.longitude ? parseFloat(String(updates.longitude)) : null;
        if (updates.available !== undefined)
            data.available = Boolean(updates.available);
        const equipment = yield prisma_1.prisma.equipment.update({
            where: { id: equipmentId },
            data
        });
        if (data.available === false && existingEquipment.available !== false) {
            const adminUsers = yield prisma_1.prisma.user.findMany({
                where: { role: 'ADMIN', pushToken: { not: null } },
                select: { id: true, pushToken: true }
            });
            yield prisma_1.prisma.notification.createMany({
                data: adminUsers.map(admin => ({
                    userId: admin.id,
                    title: 'Equipment flagged for review',
                    message: `Owner ${req.prismaUser.name} flagged ${equipment.title} as unavailable. Review the listing.`,
                    type: 'EQUIPMENT_FLAGGED',
                    relatedId: equipment.id
                }))
            });
            const pushTokens = adminUsers
                .map(admin => admin.pushToken)
                .filter(Boolean);
            if (pushTokens.length > 0) {
                yield (0, push_1.sendPushNotification)(pushTokens, {
                    title: 'Equipment flagged for review',
                    body: `${req.prismaUser.name} marked ${equipment.title} unavailable. Please review.`,
                    data: { equipmentId: equipment.id, screen: 'admin/alerts' }
                });
            }
        }
        res.json(equipment);
    }
    catch (error) {
        console.error('Update Equipment Error:', error);
        res.status(500).json({ error: 'Failed to update equipment' });
    }
}));
// Delete Equipment (Owner Only)
router.delete('/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('OWNER'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const equipmentId = String(req.params.id);
        // Verify ownership
        const existingEquipment = yield prisma_1.prisma.equipment.findUnique({
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
                yield (0, storage_1.deleteFileByUrl)(existingEquipment.imageUrl, 'equipment-images');
            }
            catch (err) {
                console.warn('Failed to delete image from storage:', err);
            }
        }
        yield prisma_1.prisma.equipment.delete({
            where: { id: equipmentId }
        });
        yield prisma_1.prisma.auditLog.create({
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
    }
    catch (error) {
        console.error('Delete Equipment Error:', error);
        res.status(500).json({ error: 'Failed to delete equipment' });
    }
}));
exports.default = router;
