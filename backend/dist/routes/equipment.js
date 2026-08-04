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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validate_1 = require("../middlewares/validate");
const schemas_1 = require("../schemas");
const storage_1 = require("../lib/storage");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// Get Equipment List (With Filters)
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, search, minPrice, maxPrice, sort, available } = req.query;
        const where = {};
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
            const searchStr = String(search);
            where.OR = [
                { title: { contains: searchStr, mode: 'insensitive' } },
                { description: { contains: searchStr, mode: 'insensitive' } },
                { location: { contains: searchStr, mode: 'insensitive' } }
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
        if (sort === 'price_asc')
            orderBy = { pricePerDay: 'asc' };
        if (sort === 'price_desc')
            orderBy = { pricePerDay: 'desc' };
        const equipment = yield prisma_1.prisma.equipment.findMany({
            where,
            orderBy,
            include: {
                owner: {
                    select: { id: true, name: true }
                }
            }
        });
        res.json(equipment);
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
        const equipment = yield prisma_1.prisma.equipment.create({
            data: {
                title: String(title),
                category: String(category).toUpperCase(),
                pricePerDay: parseFloat(String(pricePerDay)),
                description: description ? String(description) : '',
                imageUrl: imageUrl ? String(imageUrl) : '',
                location: location ? String(location) : null,
                latitude: req.body.latitude ? parseFloat(String(req.body.latitude)) : null,
                longitude: req.body.longitude ? parseFloat(String(req.body.longitude)) : null,
                ownerId: String(req.prismaUser.id),
                available: true
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
        res.json({ message: 'Equipment deleted successfully' });
    }
    catch (error) {
        console.error('Delete Equipment Error:', error);
        res.status(500).json({ error: 'Failed to delete equipment' });
    }
}));
exports.default = router;
