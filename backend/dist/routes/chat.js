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
const socket_1 = require("../lib/socket");
const router = (0, express_1.Router)();
// Get chat history for a specific booking
router.get('/booking/:bookingId', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookingId = String(req.params.bookingId);
        // Verify user is part of this booking
        const booking = yield prisma_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { equipment: true }
        });
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        const userId = String(req.prismaUser.id);
        const isFarmer = booking.farmerId === userId;
        const isOwner = booking.equipment.ownerId === userId;
        if (!isFarmer && !isOwner) {
            res.status(403).json({ error: 'You are not a participant in this booking' });
            return;
        }
        const messages = yield prisma_1.prisma.message.findMany({
            where: { bookingId },
            include: {
                sender: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    }
    catch (error) {
        console.error('Fetch Messages Error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}));
// Send a message related to a booking
router.post('/booking/:bookingId', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookingId = String(req.params.bookingId);
        const { text } = req.body;
        if (!text || String(text).trim() === '') {
            res.status(400).json({ error: 'Message text is required' });
            return;
        }
        const userId = String(req.prismaUser.id);
        // Verify user is part of this booking
        const booking = yield prisma_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { equipment: true }
        });
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        const isFarmer = booking.farmerId === userId;
        const isOwner = booking.equipment.ownerId === userId;
        if (!isFarmer && !isOwner) {
            res.status(403).json({ error: 'You are not a participant in this booking' });
            return;
        }
        // Determine receiver
        const receiverId = isFarmer ? booking.equipment.ownerId : booking.farmerId;
        const chatMessage = yield prisma_1.prisma.message.create({
            data: {
                bookingId,
                senderId: userId,
                text: String(text)
            },
            include: {
                sender: { select: { id: true, name: true, role: true } }
            }
        });
        // Create a notification for the receiver
        yield prisma_1.prisma.notification.create({
            data: {
                userId: receiverId,
                title: 'New Message',
                message: `You have a new message from ${req.prismaUser.name} regarding your booking.`,
                type: 'CHAT_MESSAGE',
                relatedId: bookingId
            }
        });
        // Emit realtime event
        (0, socket_1.emitToUser)(receiverId, 'new_message', chatMessage);
        res.status(201).json(chatMessage);
    }
    catch (error) {
        console.error('Send Message Error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
}));
exports.default = router;
