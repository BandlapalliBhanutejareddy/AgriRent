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
// Get user notifications
router.get('/', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield prisma_1.prisma.notification.findMany({
            where: { userId: String(req.prismaUser.id) },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
}));
// Mark notification as read
router.put('/:id/read', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notificationId = String(req.params.id);
        yield prisma_1.prisma.notification.update({
            where: {
                id: notificationId,
                userId: String(req.prismaUser.id) // Ensure ownership
            },
            data: { read: true }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
}));
// Mark all as read
router.put('/read-all', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.prisma.notification.updateMany({
            where: {
                userId: String(req.prismaUser.id),
                read: false
            },
            data: { read: true }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update notifications' });
    }
}));
// Delete notification
router.delete('/:id', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notificationId = String(req.params.id);
        yield prisma_1.prisma.notification.delete({
            where: {
                id: notificationId,
                userId: String(req.prismaUser.id)
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
}));
exports.default = router;
