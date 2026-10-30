import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { verifyFallbackToken } from '../lib/jwtFallback';

// Extend the Express Request interface to include the user
export interface AuthRequest extends Request {
  user?: any;
  prismaUser?: any;
  file?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // 1. Try Supabase Access Token
    let supabaseUser: any = null;
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        supabaseUser = data.user;
      }
    } catch {
      // Supabase is offline or placeholder in CI
    }

    if (supabaseUser) {
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { authId: supabaseUser.id },
            { email: supabaseUser.email }
          ]
        }
      });

      if (user) {
        if (!user.authId && supabaseUser.id) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { authId: supabaseUser.id }
          });
        }

        if (user.isSuspended) {
          res.status(403).json({ error: 'Account suspended by administrator' });
          return;
        }

        req.user = { id: user.id, email: user.email, authId: user.authId };
        req.prismaUser = user;
        next();
        return;
      }
    }

    // 2. Try Fallback Token
    const fallback = verifyFallbackToken(token);
    if (fallback) {
      const user = await prisma.user.findUnique({
        where: { id: fallback.sub }
      });

      if (user) {
        if (user.isSuspended) {
          res.status(403).json({ error: 'Account suspended by administrator' });
          return;
        }

        req.user = { id: user.id, email: user.email, authId: user.authId || user.id };
        req.prismaUser = user;
        next();
        return;
      }
    }

    res.status(401).json({ error: 'Invalid or expired authentication token' });
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    next(err);
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    // 1. Try Supabase Access Token
    let supabaseUser: any = null;
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        supabaseUser = data.user;
      }
    } catch {
      // Supabase is offline or placeholder in CI
    }

    if (supabaseUser) {
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { authId: supabaseUser.id },
            { email: supabaseUser.email }
          ]
        }
      });

      if (user && !user.isSuspended) {
        req.user = { id: user.id, email: user.email, authId: user.authId || user.id };
        req.prismaUser = user;
        return next();
      }
    }

    // 2. Try Fallback Token
    const fallback = verifyFallbackToken(token);
    if (fallback) {
      const user = await prisma.user.findUnique({
        where: { id: fallback.sub }
      });

      if (user && !user.isSuspended) {
        req.user = { id: user.id, email: user.email, authId: user.authId || user.id };
        req.prismaUser = user;
        return next();
      }
    }

    next();
  } catch {
    next();
  }
};

export const requireRole = (role: 'FARMER' | 'OWNER' | 'ADMIN') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.prismaUser) {
      res.status(401).json({ error: 'User profile not found in database' });
      return;
    }

    const userRole = String(req.prismaUser.role || '').toUpperCase();
    const isOwnerRole = role === 'OWNER' && (userRole === 'EQUIPMENT_OWNER' || userRole === 'OWNER' || userRole === 'BOTH' || userRole.includes('OWNER'));
    const isFarmerRole = role === 'FARMER' && (userRole === 'FARMER' || userRole === 'BOTH' || userRole.includes('FARMER'));

    const hasRequiredRole =
      userRole === 'ADMIN' ||
      userRole === role ||
      userRole === 'BOTH' ||
      isOwnerRole ||
      isFarmerRole ||
      (typeof userRole === 'string' && userRole.split(',').map((r: string) => r.trim()).includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({ error: `Forbidden: Requires ${role} role` });
      return;
    }

    next();
  };
};
