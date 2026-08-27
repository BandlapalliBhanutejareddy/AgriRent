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
const paymentStates_1 = require("../constants/paymentStates");
const invoice_1 = require("../lib/invoice");
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
        if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('xxxxx')) {
            res.status(503).json({ error: 'Payment gateway is currently unavailable pending production credentials.' });
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
        // Persist Payment Intent
        const paymentTransaction = yield prisma_1.prisma.paymentTransaction.create({
            data: {
                bookingId: booking.id,
                razorpayOrderId: order.id,
                amount: booking.totalPrice,
                currency: 'INR',
                status: paymentStates_1.PaymentStatus.ORDER_CREATED
            }
        });
        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            transactionId: paymentTransaction.id
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
            yield prisma_1.prisma.paymentTransaction.update({
                where: { razorpayOrderId: razorpay_order_id },
                data: { status: paymentStates_1.PaymentStatus.FAILED, failureReason: 'Invalid signature' }
            });
            res.status(400).json({ error: 'Payment verification failed: Invalid signature' });
            return;
        }
        // Update Transaction and Booking
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.paymentTransaction.update({
                where: { razorpayOrderId: razorpay_order_id },
                data: {
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    status: paymentStates_1.PaymentStatus.PAYMENT_CAPTURED
                }
            });
            yield tx.booking.update({
                where: { id: bookingId },
                data: {
                    paymentStatus: 'PAID',
                    paymentId: razorpay_payment_id,
                    status: 'CONFIRMED' // Auto confirm on successful payment verification
                }
            });
        }));
        res.json({ success: true, message: 'Payment verified successfully' });
    }
    catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
}));
// Download Invoice
router.get('/:bookingId/invoice', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookingId = String(req.params.bookingId);
        // Authorization check
        const booking = yield prisma_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { equipment: true }
        });
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        if (booking.farmerId !== req.prismaUser.id && booking.equipment.ownerId !== req.prismaUser.id && req.prismaUser.role !== 'ADMIN') {
            res.status(403).json({ error: 'Not authorized to view this invoice' });
            return;
        }
        if (booking.paymentStatus !== 'PAID') {
            res.status(400).json({ error: 'Invoice is only available for paid bookings' });
            return;
        }
        const pdfBytes = yield (0, invoice_1.generateInvoicePdf)(bookingId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${bookingId}.pdf`);
        res.send(Buffer.from(pdfBytes));
    }
    catch (error) {
        console.error('Invoice Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate invoice' });
    }
}));
// Process Refund
router.post('/:bookingId/refund', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookingId = String(req.params.bookingId);
        const booking = yield prisma_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { payments: true, equipment: true }
        });
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        if (booking.farmerId !== req.prismaUser.id && booking.equipment.ownerId !== req.prismaUser.id && req.prismaUser.role !== 'ADMIN') {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }
        if (booking.paymentStatus !== 'PAID') {
            res.status(400).json({ error: 'Can only refund paid bookings' });
            return;
        }
        const payment = booking.payments.find((p) => p.status === paymentStates_1.PaymentStatus.PAYMENT_CAPTURED);
        if (!payment || !payment.razorpayPaymentId) {
            res.status(400).json({ error: 'No valid payment transaction found' });
            return;
        }
        // Update state to REFUND_REQUESTED
        yield prisma_1.prisma.paymentTransaction.update({
            where: { id: payment.id },
            data: { status: paymentStates_1.PaymentStatus.REFUND_REQUESTED }
        });
        // Initiate Razorpay Refund
        const refund = yield razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(payment.amount * 100),
            speed: 'normal'
        });
        if (!refund) {
            res.status(500).json({ error: 'Failed to initiate refund with Razorpay' });
            return;
        }
        // Update state to REFUND_PROCESSING
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.paymentTransaction.update({
                where: { id: payment.id },
                data: { status: paymentStates_1.PaymentStatus.REFUND_PROCESSING }
            });
            yield tx.booking.update({
                where: { id: bookingId },
                data: { paymentStatus: 'REFUND_PROCESSING' }
            });
            yield tx.auditLog.create({
                data: {
                    actorId: req.prismaUser.id,
                    actorRole: req.prismaUser.role,
                    action: 'REFUND_INITIATED',
                    resource: 'PaymentTransaction',
                    resourceId: payment.id,
                    metadata: JSON.stringify({ bookingId, refundId: refund.id }),
                    ip: req.ip || req.connection.remoteAddress,
                    userAgent: req.headers['user-agent']
                }
            });
        }));
        res.json({ success: true, message: 'Refund initiated successfully', refundId: refund.id });
    }
    catch (error) {
        console.error('Refund Error:', error);
        res.status(500).json({ error: 'Refund processing failed' });
    }
}));
// Webhook Handler
router.post('/webhook', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
        const bodyStr = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
        const expectedSignature = crypto_1.default
            .createHmac('sha256', secret)
            .update(bodyStr)
            .digest('hex');
        if (expectedSignature !== signature) {
            console.warn('Webhook signature mismatch');
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }
        const event = req.body.event;
        const payload = req.body.payload;
        if (!event || !payload) {
            res.status(400).json({ error: 'Invalid payload format' });
            return;
        }
        // Idempotency: checking if event was already processed based on payment ID and status
        // For this example, we assume idempotency is handled by the deterministic state machine transitions.
        if (event === 'payment.captured') {
            const paymentEntity = payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const transaction = yield prisma_1.prisma.paymentTransaction.findUnique({
                where: { razorpayOrderId: orderId }
            });
            if (transaction && transaction.status !== paymentStates_1.PaymentStatus.PAYMENT_CAPTURED) {
                yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                    yield tx.paymentTransaction.update({
                        where: { id: transaction.id },
                        data: { status: paymentStates_1.PaymentStatus.PAYMENT_CAPTURED, razorpayPaymentId: paymentEntity.id }
                    });
                    yield tx.booking.update({
                        where: { id: transaction.bookingId },
                        data: { paymentStatus: 'PAID', paymentId: paymentEntity.id, status: 'CONFIRMED' }
                    });
                    yield tx.auditLog.create({
                        data: {
                            actorId: 'system',
                            actorRole: 'ADMIN',
                            action: 'PAYMENT_CAPTURED',
                            resource: 'PaymentTransaction',
                            resourceId: transaction.id,
                            metadata: JSON.stringify({ orderId, paymentId: paymentEntity.id }),
                            ip: req.ip || req.connection.remoteAddress,
                            userAgent: req.headers['user-agent']
                        }
                    });
                }));
            }
        }
        else if (event === 'payment.failed') {
            const paymentEntity = payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const transaction = yield prisma_1.prisma.paymentTransaction.findUnique({
                where: { razorpayOrderId: orderId }
            });
            if (transaction && transaction.status !== paymentStates_1.PaymentStatus.FAILED) {
                yield prisma_1.prisma.paymentTransaction.update({
                    where: { id: transaction.id },
                    data: { status: paymentStates_1.PaymentStatus.FAILED, failureReason: paymentEntity.error_description || 'Payment Failed' }
                });
            }
        }
        else if (event === 'refund.processed') {
            const refundEntity = payload.refund.entity;
            const paymentId = refundEntity.payment_id;
            const transaction = yield prisma_1.prisma.paymentTransaction.findFirst({
                where: { razorpayPaymentId: paymentId }
            });
            if (transaction && transaction.status !== paymentStates_1.PaymentStatus.REFUNDED) {
                yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                    yield tx.paymentTransaction.update({
                        where: { id: transaction.id },
                        data: { status: paymentStates_1.PaymentStatus.REFUNDED, refundedAmount: refundEntity.amount / 100 }
                    });
                    yield tx.booking.update({
                        where: { id: transaction.bookingId },
                        data: { paymentStatus: 'REFUNDED', status: 'CANCELLED' }
                    });
                    yield tx.auditLog.create({
                        data: {
                            actorId: 'system',
                            actorRole: 'ADMIN',
                            action: 'REFUND_PROCESSED',
                            resource: 'PaymentTransaction',
                            resourceId: transaction.id,
                            metadata: JSON.stringify({ paymentId, refundId: refundEntity.id, amount: refundEntity.amount / 100 }),
                            ip: req.ip || req.connection.remoteAddress,
                            userAgent: req.headers['user-agent']
                        }
                    });
                }));
            }
        }
        res.status(200).json({ status: 'ok' });
    }
    catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}));
exports.default = router;
