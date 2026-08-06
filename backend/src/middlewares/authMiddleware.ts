import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

// Extend the Express Request interface to include the user
export interface AuthRequest extends Request {
  user?: any;
  prismaUser?: any;
  file?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: any): Promise<void> => {
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
      const decoded: any = jwt.verify(token, secret);
      
      const user = await prisma.user.findUnique({
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
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      } else {
        res.status(401).json({ error: 'Invalid token' });
      }
    }
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    next(err);
  }
};

export const requireRole = (role: 'FARMER' | 'OWNER' | 'ADMIN') => {
  return (req: AuthRequest, res: Response, next: any): void => {
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
