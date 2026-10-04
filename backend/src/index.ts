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
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3000',
  'http://192.168.1.148:3000',
  'https://your-vercel-domain.vercel.app',
  'https://www.agrorent.ai'
];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}
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
      scriptSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  dnsPrefetchControl: { allow: false }
}));
app.use(compression());

// Granular Rate Limiters (increased for testing)
const isTest = process.env.NODE_ENV === 'test' || process.env.TEST_SERVER_EXTERNAL || true;
const isPlaywright = process.env.PLAYWRIGHT_TEST === 'true';
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10000, message: 'Too many auth requests' });
const otpLimiter = rateLimit({ windowMs: 60 * 1000, max: 10000, message: 'Too many OTP requests' });
const aiLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10000, message: 'AI request limit reached' });
const paymentsLimiter = rateLimit({ windowMs: 60 * 1000, max: 10000, message: 'Too many payment requests' });
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 10000, message: 'Rate limit exceeded' });

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
import feedbackRoutes from './routes/feedback';
import adminRoutes from './routes/admin';
import reviewRoutes from './routes/reviews';
import complaintRoutes from './routes/complaints';
import farmRoutes from './routes/farms';
import devRoutes from './routes/dev';

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
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/dev', devRoutes);

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  const fs = require('fs');
  const path = require('path');
  const reqId = req.headers['x-request-id'] || 'unknown';
  const errorLog = `[${new Date().toISOString()}] [${reqId}] ${err.stack}\n---\n`;
  fs.appendFileSync(path.join(__dirname, '../error.log'), errorLog);
  errorMiddleware(err, req, res, next);
});

async function provisionAdmin() {
  const adminEmail = 'bandlapalliteja369@gmail.com';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@123';
  try {
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingAdmin) {
      if (existingAdmin.role !== 'ADMIN') {
        await prisma.user.update({ where: { id: existingAdmin.id }, data: { role: 'ADMIN' } });
        console.log(`Updated existing user ${adminEmail} to ADMIN role.`);
      }
    } else {
      const { supabase } = require('./lib/supabase');
      const { data: authData } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: 'Admin User', role: 'ADMIN' }
      });

      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: 'SUPABASE_AUTH_MANAGED',
          role: 'ADMIN',
          authId: authData?.user?.id,
          isVerified: true
        }
      });
      console.log(`Created initial ADMIN account for ${adminEmail}.`);
    }
  } catch (error) {
    console.error('Failed to provision ADMIN account:', error);
  }
}

provisionAdmin().then(() => {
  const activeServer = server.listen(port as number, () => {
    console.log(`Backend server running on port ${port}`);
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
});

// Force keep-alive (Development only)
setInterval(() => { }, 10000);
