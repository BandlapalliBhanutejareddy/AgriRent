import { z } from 'zod';

// Auth Schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phone: z.string().min(5).max(100).optional(),
    name: z.string().min(2).max(50).optional(),
    role: z.enum(['FARMER', 'OWNER', 'ADMIN']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

// Equipment Schemas
export const createEquipmentSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100),
    category: z.string().min(3).max(50),
    pricePerDay: z.number().positive(),
    description: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional().nullable(),
    location: z.string().min(2).max(200).optional().nullable(),
  }),
});

export const updateEquipmentSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100).optional(),
    category: z.string().min(3).max(50).optional(),
    pricePerDay: z.number().positive().optional(),
    description: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional().nullable(),
    location: z.string().min(2).max(200).optional().nullable(),
    available: z.boolean().optional(),
  }),
});

// Booking Schemas
export const createBookingSchema = z.object({
  body: z.object({
    equipmentId: z.string(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  }).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  }),
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'ACTIVE', 'COMPLETED']),
  }),
});
