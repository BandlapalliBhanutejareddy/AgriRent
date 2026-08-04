import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import compression from 'compression';
import { responseMiddleware, errorMiddleware } from './middlewares/responseMiddleware';
import { initSocket } from './lib/socket';

dotenv.config();

const app = express();
const server = http.createServer(app);
initSocket(server);
const port = process.env.PORT || 4000;

// 1. CORS FIRST (Essential for all responses including errors)
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Security Middleware
app.use(helmet());
app.use(compression());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Relaxed for dashboard concurrent requests
  message: 'Rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

import { sanitize } from './middlewares/sanitize';

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
import aiRoutes from './routes/ai';
import paymentRoutes from './routes/payments';
import analyticsRoutes from './routes/analytics';

app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  const fs = require('fs');
  const path = require('path');
  const errorLog = `[${new Date().toISOString()}] ${err.stack}\n---\n`;
  fs.appendFileSync(path.join(__dirname, '../error.log'), errorLog);
  errorMiddleware(err, req, res, next);
});

server.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});

// Force keep-alive
setInterval(() => {}, 10000);

