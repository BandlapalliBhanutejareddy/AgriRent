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
exports.requireRole = exports.requireAuth = void 0;
const prisma_1 = require("../lib/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const requireAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid authorization header' });
            return;
        }
        const token = authHeader.split(' ')[1];
        // Validate JWT
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        try {
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            const user = yield prisma_1.prisma.user.findUnique({
                where: { id: decoded.userId }
            });
            if (user) {
                if (user.isSuspended) {
                    res.status(403).json({ error: 'Account suspended' });
                    return;
                }
                req.user = { id: user.id, email: user.email };
                req.prismaUser = user;
                next();
                return;
            }
            res.status(401).json({ error: 'User not found' });
        }
        catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
            }
            else {
                res.status(401).json({ error: 'Invalid token' });
            }
        }
    }
    catch (err) {
        console.error('Auth Middleware Error:', err);
        next(err);
    }
});
exports.requireAuth = requireAuth;
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.prismaUser) {
            res.status(401).json({ error: 'User profile not found in database' });
            return;
        }
        const userRole = req.prismaUser.role;
        const hasRequiredRole = userRole === 'ADMIN' ||
            userRole === role ||
            userRole === 'BOTH' ||
            (typeof userRole === 'string' && userRole.split(',').map((r) => r.trim()).includes(role));
        if (!hasRequiredRole) {
            res.status(403).json({ error: `Forbidden: Requires ${role} role` });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
