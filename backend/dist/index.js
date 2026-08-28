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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = __importDefault(require("http"));
const compression_1 = __importDefault(require("compression"));
const responseMiddleware_1 = require("./middlewares/responseMiddleware");
const socket_1 = require("./lib/socket");
const env_1 = require("./config/env");
// Validate environment variables on startup
(0, env_1.validateEnv)();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
(0, socket_1.initSocket)(server);
const port = process.env.PORT || 4000;
const crypto_1 = __importDefault(require("crypto"));
// Strict CORS Whitelist
const allowedOrigins = [
    'http://localhost:3000',
    'https://your-vercel-domain.vercel.app',
    'https://www.agrorent.ai'
];
if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express_1.default.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
// Structured Logger with Request IDs
app.use((req, res, next) => {
    const reqId = crypto_1.default.randomUUID();
    req.headers['x-request-id'] = reqId;
    res.setHeader('x-request-id', reqId);
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] [${reqId}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
});
// Security Middleware (Helmet)
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
            frameSrc: ["'self'", "https://api.razorpay.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.razorpay.com"]
        },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    dnsPrefetchControl: { allow: false }
}));
app.use((0, compression_1.default)());
// Granular Rate Limiters (increased for testing)
const isTest = process.env.NODE_ENV === 'test' || process.env.TEST_SERVER_EXTERNAL;
const isPlaywright = process.env.PLAYWRIGHT_TEST === 'true';
const authLimiter = (0, express_rate_limit_1.default)({ windowMs: 60 * 1000, max: isPlaywright ? 10000 : (isTest ? 15 : 5), message: 'Too many auth requests' });
const otpLimiter = (0, express_rate_limit_1.default)({ windowMs: 60 * 1000, max: isPlaywright ? 10000 : (isTest ? 15 : 3), message: 'Too many OTP requests' });
const aiLimiter = (0, express_rate_limit_1.default)({ windowMs: 60 * 60 * 1000, max: isPlaywright ? 10000 : (isTest ? 100 : 20), message: 'AI request limit reached' });
const paymentsLimiter = (0, express_rate_limit_1.default)({ windowMs: 60 * 1000, max: isPlaywright ? 10000 : (isTest ? 100 : 10), message: 'Too many payment requests' });
const generalLimiter = (0, express_rate_limit_1.default)({ windowMs: 60 * 1000, max: isPlaywright ? 10000 : (isTest ? 1000 : 100), message: 'Rate limit exceeded' });
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Limit each IP
});
app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/payments', paymentsLimiter);
const sanitize_1 = require("./middlewares/sanitize");
const prisma_1 = require("./lib/prisma");
app.use(sanitize_1.sanitize);
app.use(responseMiddleware_1.responseMiddleware);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AgroRent API is running!' });
});
app.get('/api/ready', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: 'ready', database: 'connected' });
    }
    catch (error) {
        res.status(503).json({ status: 'unready', database: 'disconnected' });
    }
}));
const auth_1 = __importDefault(require("./routes/auth"));
app.use('/api/auth', auth_1.default);
const equipment_1 = __importDefault(require("./routes/equipment"));
const bookings_1 = __importDefault(require("./routes/bookings"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const saved_1 = __importDefault(require("./routes/saved"));
const chat_1 = __importDefault(require("./routes/chat"));
const guides_1 = __importDefault(require("./routes/guides"));
const upload_1 = __importDefault(require("./routes/upload"));
const ai_1 = __importDefault(require("./routes/ai"));
const payments_1 = __importDefault(require("./routes/payments"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const feedback_1 = __importDefault(require("./routes/feedback"));
app.use('/api/equipment', equipment_1.default);
app.use('/api/bookings', bookings_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/saved', saved_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/guides', guides_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/feedback', feedback_1.default);
// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    const fs = require('fs');
    const path = require('path');
    const reqId = req.headers['x-request-id'] || 'unknown';
    const errorLog = `[${new Date().toISOString()}] [${reqId}] ${err.stack}\n---\n`;
    fs.appendFileSync(path.join(__dirname, '../error.log'), errorLog);
    (0, responseMiddleware_1.errorMiddleware)(err, req, res, next);
});
const activeServer = server.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
// Graceful Shutdown
const shutdown = (signal) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`\n${signal} signal received: closing HTTP server`);
    activeServer.close(() => __awaiter(void 0, void 0, void 0, function* () {
        console.log('HTTP server closed');
        try {
            yield prisma_1.prisma.$disconnect();
            console.log('Prisma connection disconnected');
            process.exit(0);
        }
        catch (err) {
            console.error('Error during disconnection', err);
            process.exit(1);
        }
    }));
});
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
// Force keep-alive (Development only)
setInterval(() => { }, 10000);
