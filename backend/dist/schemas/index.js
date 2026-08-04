"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingStatusSchema = exports.createBookingSchema = exports.updateEquipmentSchema = exports.createEquipmentSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// Auth Schemas
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().min(5).max(100).optional(),
        name: zod_1.z.string().min(2).max(50).optional(),
        role: zod_1.z.enum(['FARMER', 'OWNER', 'ADMIN']).optional(),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
    }),
});
// Equipment Schemas
exports.createEquipmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).max(100),
        category: zod_1.z.string().min(3).max(50),
        pricePerDay: zod_1.z.number().positive(),
        description: zod_1.z.string().max(1000).optional(),
        imageUrl: zod_1.z.string().url().optional().nullable(),
        location: zod_1.z.string().min(2).max(200).optional().nullable(),
    }),
});
exports.updateEquipmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).max(100).optional(),
        category: zod_1.z.string().min(3).max(50).optional(),
        pricePerDay: zod_1.z.number().positive().optional(),
        description: zod_1.z.string().max(1000).optional(),
        imageUrl: zod_1.z.string().url().optional().nullable(),
        location: zod_1.z.string().min(2).max(200).optional().nullable(),
        available: zod_1.z.boolean().optional(),
    }),
});
// Booking Schemas
exports.createBookingSchema = zod_1.z.object({
    body: zod_1.z.object({
        equipmentId: zod_1.z.string(),
        startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
        endDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
    }).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
        message: "End date must be after start date",
        path: ["endDate"],
    }),
});
exports.updateBookingStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'ACTIVE', 'COMPLETED']),
    }),
});
