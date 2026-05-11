import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { responseMiddleware, errorMiddleware } from './middlewares/responseMiddleware';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 4000;

// Security Middleware
app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', apiLimiter);

import { sanitize } from './middlewares/sanitize';

app.use(cors());
app.use(express.json());
app.use(sanitize);
app.use(responseMiddleware);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AgroRent API is running!' });
});

import authRoutes from './routes/auth';

app.use('/api/auth', authRoutes);

import equipmentRoutes from './routes/equipment';
import bookingRoutes from './routes/bookings';
import notificationRoutes from './routes/notifications';
import savedRoutes from './routes/saved';
import chatRoutes from './routes/chat';
import guideRoutes from './routes/guides';
import uploadRoutes from './routes/upload';

app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/upload', uploadRoutes);

// Centralized Error Handling Middleware
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
