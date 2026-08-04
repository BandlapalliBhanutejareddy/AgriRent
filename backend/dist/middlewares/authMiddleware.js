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
exports.requireRole = exports.requireAuth = void 0;
const prisma_1 = require("../lib/prisma");
const requireAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid authorization header' });
            return;
        }
        const token = authHeader.split(' ')[1];
        // Simple token validation (in production, use JWT)
        if (token.startsWith('demo-token-')) {
            const userId = token.split('demo-token-')[1];
            const user = yield prisma_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (user) {
                req.user = { id: user.id, email: user.email };
                req.prismaUser = user;
                next();
                return;
            }
        }
        res.status(401).json({ error: 'Invalid token' });
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
        if (req.prismaUser.role !== role && req.prismaUser.role !== 'ADMIN') {
            res.status(403).json({ error: `Forbidden: Requires ${role} role` });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
