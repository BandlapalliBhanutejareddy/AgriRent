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
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// Get all Farming Guides grouped by Crop
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const guides = yield prisma_1.prisma.farmingGuide.findMany({
            orderBy: [
                { cropName: 'asc' },
                { stepOrder: 'asc' }
            ]
        });
        // Grouping by crop for easier frontend consumption
        const groupedGuides = guides.reduce((acc, guide) => {
            if (!acc[guide.cropName]) {
                acc[guide.cropName] = [];
            }
            acc[guide.cropName].push(guide);
            return acc;
        }, {});
        res.json(groupedGuides);
    }
    catch (error) {
        console.error('Failed to fetch farming guides:', error);
        res.status(500).json({ error: 'Failed to fetch farming guides' });
    }
}));
// Get Modern Techniques
router.get('/techniques', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const techniques = yield prisma_1.prisma.modernTechnique.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(techniques);
    }
    catch (error) {
        console.error('Failed to fetch modern techniques:', error);
        res.status(500).json({ error: 'Failed to fetch modern techniques' });
    }
}));
exports.default = router;
