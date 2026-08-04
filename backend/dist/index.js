"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = __importDefault(require("http"));
const compression_1 = __importDefault(require("compression"));
const responseMiddleware_1 = require("./middlewares/responseMiddleware");
const socket_1 = require("./lib/socket");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
(0, socket_1.initSocket)(server);
const port = process.env.PORT || 4000;
// 1. CORS FIRST (Essential for all responses including errors)
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Simple request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// Security Middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10000, // Relaxed for dashboard concurrent requests
    message: 'Rate limit exceeded',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);
const sanitize_1 = require("./middlewares/sanitize");
app.use(sanitize_1.sanitize);
app.use(responseMiddleware_1.responseMiddleware);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AgroRent API is running!' });
});
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
// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    const fs = require('fs');
    const path = require('path');
    const errorLog = `[${new Date().toISOString()}] ${err.stack}\n---\n`;
    fs.appendFileSync(path.join(__dirname, '../error.log'), errorLog);
    (0, responseMiddleware_1.errorMiddleware)(err, req, res, next);
});
server.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
// Force keep-alive
setInterval(() => { }, 10000);
