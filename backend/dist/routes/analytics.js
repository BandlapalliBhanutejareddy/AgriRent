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
// Owner Analytics
router.get('/owner', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('OWNER'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ownerId = String(req.prismaUser.id);
        // Get all bookings for this owner's equipment
        const bookings = yield prisma_1.prisma.booking.findMany({
            where: {
                equipment: { ownerId }
            },
            include: { equipment: true }
        });
        const totalBookings = bookings.length;
        const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
        const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
        const acceptedBookings = bookings.filter(b => b.status === 'ACCEPTED').length;
        const totalRevenue = bookings
            .filter(b => ['ACCEPTED', 'COMPLETED'].includes(b.status) || b.paymentStatus === 'PAID')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        const topEquipmentMap = bookings.reduce((acc, b) => {
            var _a;
            const title = ((_a = b.equipment) === null || _a === void 0 ? void 0 : _a.title) || 'Unknown Equipment';
            if (!acc[title])
                acc[title] = { title, bookings: 0, revenue: 0 };
            acc[title].bookings += 1;
            acc[title].revenue += b.totalPrice || 0;
            return acc;
        }, {});
        const topEquipment = Object.values(topEquipmentMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
        const monthLabels = Array.from({ length: 6 }).map((_, index) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - index));
            return date.toLocaleString('default', { month: 'short' });
        });
        const revenueByMonth = bookings
            .filter(b => ['ACCEPTED', 'COMPLETED'].includes(b.status) || b.paymentStatus === 'PAID')
            .reduce((acc, b) => {
            const month = new Date(b.createdAt).toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + (b.totalPrice || 0);
            return acc;
        }, {});
        const monthlyRevenue = monthLabels.map(month => ({
            month,
            revenue: revenueByMonth[month] || 0
        }));
        res.json({
            totalRevenue: totalRevenue || 0,
            totalBookings,
            pendingBookings,
            completedBookings,
            averageRating: 4.6,
            topEquipment,
            monthlyRevenue,
            utilization: totalBookings > 0 ? Math.round(((acceptedBookings + completedBookings) / totalBookings) * 100) : 0
        });
    }
    catch (error) {
        console.error('Owner Analytics Error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
}));
// Admin Analytics
router.get('/admin', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalUsers = yield prisma_1.prisma.user.count();
        const totalFarmers = yield prisma_1.prisma.user.count({ where: { role: 'FARMER' } });
        const totalOwners = yield prisma_1.prisma.user.count({ where: { role: 'OWNER' } });
        const totalEquipment = yield prisma_1.prisma.equipment.count();
        const activeRentals = yield prisma_1.prisma.booking.count({ where: { status: 'ACCEPTED' } });
        const allBookings = yield prisma_1.prisma.booking.findMany({
            where: {
                status: { in: ['ACCEPTED', 'COMPLETED'] },
                paymentStatus: 'PAID'
            }
        });
        const revenueByMonth = allBookings.reduce((acc, b) => {
            const month = new Date(b.createdAt).toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + (b.totalPrice || 0);
            return acc;
        }, {});
        const revenueGraph = Object.entries(revenueByMonth).map(([name, revenue]) => ({ name, revenue }));
        res.json({
            totalUsers,
            totalFarmers,
            totalOwners,
            totalEquipment,
            activeRentals,
            revenueGraph
        });
    }
    catch (error) {
        console.error('Admin Analytics Error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
}));
// Farmer Analytics
router.get('/farmer', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('FARMER'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const farmerId = String(req.prismaUser.id);
        const bookings = yield prisma_1.prisma.booking.findMany({
            where: { farmerId },
            include: { equipment: true }
        });
        const totalSpent = bookings
            .filter(b => b.status === 'ACCEPTED' || b.status === 'COMPLETED' || b.paymentStatus === 'PAID')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        const activeRentals = bookings.filter(b => b.status === 'ACCEPTED').length;
        const completedRentals = bookings.filter(b => b.status === 'COMPLETED').length;
        const spendingByMonth = bookings
            .filter(b => b.status === 'ACCEPTED' || b.status === 'COMPLETED' || b.paymentStatus === 'PAID')
            .reduce((acc, b) => {
            const month = new Date(b.createdAt).toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + (b.totalPrice || 0);
            return acc;
        }, {});
        const spendingGraph = Object.entries(spendingByMonth).map(([name, total]) => ({ name, total }));
        res.json({
            totalSpent: totalSpent || 0,
            activeRentals,
            completedRentals,
            spendingGraph
        });
    }
    catch (error) {
        console.error('Farmer Analytics Error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
}));
// Admin Users Directory
router.get('/admin/users', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch platform users' });
    }
}));
// Admin User Suspension Toggle
router.put('/admin/users/:id/suspend', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: String(req.params.id) } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const updated = yield prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { isSuspended: !user.isSuspended }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to toggle user status' });
    }
}));
// Admin User Delete
router.delete('/admin/users/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.prisma.user.delete({ where: { id: String(req.params.id) } });
        res.json({ message: 'User permanently deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
}));
// Admin Equipment Directory
router.get('/admin/equipment', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const equipment = yield prisma_1.prisma.equipment.findMany({
            include: {
                owner: { select: { name: true } },
                _count: { select: { bookings: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(equipment);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch platform equipment' });
    }
}));
// Admin Equipment Moderation Toggle
router.put('/admin/equipment/:id/toggle', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eq = yield prisma_1.prisma.equipment.findUnique({ where: { id: String(req.params.id) } });
        if (!eq) {
            res.status(404).json({ error: 'Equipment not found' });
            return;
        }
        const updated = yield prisma_1.prisma.equipment.update({
            where: { id: eq.id },
            data: { available: !eq.available }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to moderate equipment availability' });
    }
}));
// Admin Equipment Delete
router.delete('/admin/equipment/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const equipmentId = String(req.params.id);
        yield prisma_1.prisma.booking.deleteMany({ where: { equipmentId } });
        yield prisma_1.prisma.equipment.delete({ where: { id: equipmentId } });
        res.json({ message: 'Equipment deleted successfully' });
    }
    catch (error) {
        console.error('Admin Equipment Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete equipment' });
    }
}));
exports.default = router;
