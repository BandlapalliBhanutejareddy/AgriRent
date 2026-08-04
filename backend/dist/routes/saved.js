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
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// Get saved equipment
router.get('/', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const saved = yield prisma_1.prisma.savedEquipment.findMany({
            where: { userId: String(req.prismaUser.id) },
            include: {
                equipment: {
                    include: {
                        owner: {
                            select: { id: true, name: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(saved);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch saved equipment' });
    }
}));
// Save/Unsave equipment
router.post('/:equipmentId', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const equipmentId = String(req.params.equipmentId);
        const userId = String(req.prismaUser.id);
        const existing = yield prisma_1.prisma.savedEquipment.findUnique({
            where: {
                userId_equipmentId: {
                    userId,
                    equipmentId
                }
            }
        });
        if (existing) {
            yield prisma_1.prisma.savedEquipment.delete({
                where: { id: String(existing.id) }
            });
            res.json({ saved: false });
        }
        else {
            yield prisma_1.prisma.savedEquipment.create({
                data: {
                    userId,
                    equipmentId
                }
            });
            res.json({ saved: true });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to toggle save status' });
    }
}));
exports.default = router;
