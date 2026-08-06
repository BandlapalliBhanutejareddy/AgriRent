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
const prisma_1 = require("../lib/prisma");
const push_1 = require("../lib/push");
const router = (0, express_1.Router)();
// Create Booking (Farmer Only)
router.post('/', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('FARMER'), (0, validate_1.validate)(schemas_1.createBookingSchema), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { equipmentId, startDate, endDate } = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);
        // 1. Verify Equipment
        const equipment = yield prisma_1.prisma.equipment.findUnique({
            where: { id: String(equipmentId) },
            include: { owner: true }
        });
        if (!equipment) {
            res.status(404).json({ error: 'Equipment not found' });
            return;
        }
        if (!equipment.available) {
            res.status(400).json({ error: 'Equipment is currently marked as unavailable' });
            return;
        }
        // 2. Check Overlapping Dates
        const overlappingBookings = yield prisma_1.prisma.booking.findMany({
            where: {
                equipmentId: String(equipmentId),
                status: { in: ['PENDING', 'ACCEPTED'] },
                OR: [
                    {
                        AND: [
                            { startDate: { lte: start } },
                            { endDate: { gte: start } }
                        ]
                    },
                    {
                        AND: [
                            { startDate: { lte: end } },
                            { endDate: { gte: end } }
                        ]
                    }
                ]
            }
        });
        if (overlappingBookings.length > 0) {
            res.status(409).json({ error: 'Equipment is already booked for these dates' });
            return;
        }
        // Calculate Price
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
        const totalPrice = days * equipment.pricePerDay;
        // Create Booking
        const booking = yield prisma_1.prisma.booking.create({
            data: {
                farmerId: String(req.prismaUser.id),
                equipmentId: String(equipmentId),
                startDate: start,
                endDate: end,
                status: 'PENDING',
                totalPrice
            }
        });
        // Generate Notification for Owner (in-app)
        yield prisma_1.prisma.notification.create({
            data: {
                userId: equipment.ownerId,
                title: 'New Booking Request',
                message: `You have a new booking request for ${equipment.title} from ${req.prismaUser.name}`,
                type: 'BOOKING_REQUEST',
                relatedId: booking.id
            }
        });
        // Send push notification to owner
        if ((_a = equipment.owner) === null || _a === void 0 ? void 0 : _a.pushToken) {
            yield (0, push_1.sendPushNotification)(equipment.owner.pushToken, {
                title: '🔔 New Booking Request',
                body: `${req.prismaUser.name} wants to rent your ${equipment.title}`,
                data: { bookingId: booking.id, screen: 'owner/requests' }
            });
        }
        res.status(201).json(booking);
    }
    catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: 'Failed to create booking request' });
    }
}));
// Booking Status Update
router.put('/:id/status', authMiddleware_1.requireAuth, (0, validate_1.validate)(schemas_1.updateBookingStatusSchema), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { status } = req.body;
        const bookingId = String(req.params.id);
        const booking = yield prisma_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                equipment: true,
                farmer: true
            }
        });
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        const role = req.prismaUser.role;
        const userId = req.prismaUser.id;
        const isOwner = booking.equipment.ownerId === userId;
        const isFarmer = booking.farmerId === userId;
        if (role === 'OWNER') {
            if (!isOwner) {
                res.status(403).json({ error: 'You do not have permission to manage this booking' });
                return;
            }
            if (status !== 'ACCEPTED' && status !== 'REJECTED') {
                res.status(400).json({ error: 'Owners can only accept or reject booking requests' });
                return;
            }
        }
        else if (role === 'FARMER') {
            if (!isFarmer) {
                res.status(403).json({ error: 'You do not own this booking' });
                return;
            }
            if (status !== 'CANCELLED') {
                res.status(400).json({ error: 'Farmers can only cancel their own booking requests' });
                return;
            }
        }
        else if (role !== 'ADMIN') {
            res.status(403).json({ error: 'Role cannot update booking status' });
            return;
        }
        const updatedBooking = yield prisma_1.prisma.booking.update({
            where: { id: bookingId },
            data: { status: status },
            include: {
                equipment: { include: { owner: { select: { id: true, pushToken: true } } } },
                farmer: { select: { id: true, name: true, pushToken: true } }
            }
        });
        // In-app notification
        const recipientId = isOwner ? booking.farmerId : booking.equipment.ownerId;
        const notifTitle = `Booking ${status}`;
        const notifMessage = `The booking for ${booking.equipment.title} has been ${status.toLowerCase()} by the ${role.toLowerCase()}.`;
        yield prisma_1.prisma.notification.create({
            data: {
                userId: recipientId,
                title: notifTitle,
                message: notifMessage,
                type: 'BOOKING_UPDATE',
                relatedId: booking.id
            }
        });
        // Push notifications
        const statusEmoji = {
            ACCEPTED: '✅', REJECTED: '❌', COMPLETED: '🎉', CANCELLED: '🚫'
        };
        const emoji = statusEmoji[status] || '📋';
        // Notify farmer when owner acts
        if (isOwner && ((_a = updatedBooking.farmer) === null || _a === void 0 ? void 0 : _a.pushToken)) {
            yield (0, push_1.sendPushNotification)(updatedBooking.farmer.pushToken, {
                title: `${emoji} Booking ${status}`,
                body: `Your booking for ${booking.equipment.title} was ${status.toLowerCase()}`,
                data: { bookingId: booking.id, screen: 'bookings' }
            });
        }
        // Notify owner when farmer cancels
        if (isFarmer && ((_c = (_b = updatedBooking.equipment) === null || _b === void 0 ? void 0 : _b.owner) === null || _c === void 0 ? void 0 : _c.pushToken)) {
            yield (0, push_1.sendPushNotification)(updatedBooking.equipment.owner.pushToken, {
                title: `${emoji} Booking Cancelled`,
                body: `A farmer cancelled their booking for ${booking.equipment.title}`,
                data: { bookingId: booking.id, screen: 'owner/requests' }
            });
        }
        res.json(updatedBooking);
    }
    catch (error) {
        console.error('Update Booking Status Error:', error);
        res.status(500).json({ error: 'Failed to update booking status' });
    }
}));
// Get Owner's Bookings specifically
router.get('/owner', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('OWNER'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookings = yield prisma_1.prisma.booking.findMany({
            where: { equipment: { ownerId: req.prismaUser.id } },
            include: {
                equipment: { select: { id: true, title: true, category: true, imageUrl: true } },
                farmer: { select: { id: true, name: true, email: true, phone: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(bookings);
    }
    catch (error) {
        console.error('Owner bookings fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch owner bookings' });
    }
}));
// Admin: get all bookings
router.get('/admin/all', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookings = yield prisma_1.prisma.booking.findMany({
            include: {
                equipment: { select: { id: true, title: true } },
                farmer: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(bookings);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch all bookings' });
    }
}));
// Get User's Bookings
router.get('/', authMiddleware_1.requireAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const role = req.prismaUser.role;
        const userId = req.prismaUser.id;
        let where = {};
        if (role === 'FARMER') {
            where.farmerId = userId;
        }
        else if (role === 'OWNER') {
            where.equipment = { ownerId: userId };
        }
        const bookings = yield prisma_1.prisma.booking.findMany({
            where,
            include: {
                equipment: {
                    include: {
                        owner: {
                            select: { id: true, name: true, phone: true }
                        }
                    }
                },
                farmer: {
                    select: { id: true, name: true, phone: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(bookings);
    }
    catch (error) {
        console.error('Bookings Fetch Error:', error);
        next(error);
    }
}));
exports.default = router;
