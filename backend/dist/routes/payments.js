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
const prisma_1 = require("../lib/prisma");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_xxxxx',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
});
// Create Payment Order
router.post('/create-order', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bookingId } = req.body;
        if (!bookingId) {
            res.status(400).json({ error: 'Booking ID is required' });
            return;
        }
        const booking = yield prisma_1.prisma.booking.findUnique({
            where: { id: bookingId }
        });
        if (!booking || !booking.totalPrice) {
            res.status(404).json({ error: 'Booking not found or price not set' });
            return;
        }
        if (booking.paymentStatus === 'PAID') {
            res.status(400).json({ error: 'Booking is already paid' });
            return;
        }
        const amountInPaise = Math.round(booking.totalPrice * 100); // Razorpay requires amount in smallest currency unit
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_booking_${booking.id}`,
        };
        const order = yield razorpay.orders.create(options);
        if (!order) {
            res.status(500).json({ error: 'Failed to create Razorpay order' });
            return;
        }
        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    }
    catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ error: 'Failed to initialize payment' });
    }
}));
// Verify Payment Signature
router.post('/verify', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
        const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
        const generated_signature = crypto_1.default
            .createHmac('sha256', secret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');
        if (generated_signature !== razorpay_signature) {
            res.status(400).json({ error: 'Payment verification failed: Invalid signature' });
            return;
        }
        // Update Booking status to PAID
        const booking = yield prisma_1.prisma.booking.update({
            where: { id: bookingId },
            data: {
                paymentStatus: 'PAID',
                paymentId: razorpay_payment_id,
                status: 'ACCEPTED' // Auto accept on payment (optional business logic)
            }
        });
        res.json({ success: true, booking });
    }
    catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
}));
exports.default = router;
