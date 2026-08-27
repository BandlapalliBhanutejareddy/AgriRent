import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import compression from 'compression';
import { responseMiddleware, errorMiddleware } from './middlewares/responseMiddleware';
import { initSocket } from './lib/socket';

import { validateEnv } from './config/env';

// Validate environment variables on startup
validateEnv();

const app = express();
const server = http.createServer(app);
initSocket(server);
const port = process.env.PORT || 4000;

import crypto from 'crypto';

// Strict CORS Whitelist
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-vercel-domain.vercel.app',
  'https://www.agrorent.ai'
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

// Structured Logger with Request IDs
app.use((req, res, next) => {
  const reqId = crypto.randomUUID();
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
app.use(helmet({
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
app.use(compression());

// Granular Rate Limiters (increased for testing)
const isTest = process.env.NODE_ENV === 'test' || process.env.TEST_SERVER_EXTERNAL;
const isPlaywright = process.env.PLAYWRIGHT_TEST === 'true';
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: isPlaywright ? 10000 : (isTest ? 15 : 5), message: 'Too many auth requests' });
const otpLimiter = rateLimit({ windowMs: 60 * 1000, max: isPlaywright ? 10000 : (isTest ? 15 : 3), message: 'Too many OTP requests' });
const aiLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: isPlaywright ? 10000 : (isTest ? 100 : 20), message: 'AI request limit reached' });
const paymentsLimiter = rateLimit({ windowMs: 60 * 1000, max: isPlaywright ? 10000 : (isTest ? 100 : 10), message: 'Too many payment requests' });
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: isPlaywright ? 10000 : (isTest ? 1000 : 100), message: 'Rate limit exceeded' });

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP
});

app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/payments', paymentsLimiter);

import { sanitize } from './middlewares/sanitize';
import { prisma } from './lib/prisma';

app.use(sanitize);
app.use(responseMiddleware);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AgroRent API is running!' });
});

app.get('/api/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unready', database: 'disconnected' });
  }
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
  const reqId = req.headers['x-request-id'] || 'unknown';
  const errorLog = `[${new Date().toISOString()}] [${reqId}] ${err.stack}\n---\n`;
  fs.appendFileSync(path.join(__dirname, '../error.log'), errorLog);
  errorMiddleware(err, req, res, next);
});

const activeServer = server.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});

// Graceful Shutdown
const shutdown = async (signal: string) => {
  console.log(`\n${signal} signal received: closing HTTP server`);
  activeServer.close(async () => {
    console.log('HTTP server closed');
    try {
      await prisma.$disconnect();
      console.log('Prisma connection disconnected');
      process.exit(0);
    } catch (err) {
      console.error('Error during disconnection', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Force keep-alive (Development only)
setInterval(() => {}, 10000);

