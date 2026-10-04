import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';

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

    // Validate Supabase Access Token
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      res.status(401).json({ error: 'Invalid or expired authentication token' });
      return;
    }

    // Lookup application User by Supabase authId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { authId: supabaseUser.id },
          { email: supabaseUser.email }
        ]
      }
    });

    if (user) {
      // Link authId if missing on legacy record
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

    res.status(401).json({ error: 'Application user profile not found' });
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    next(err);
  }
};

export const requireRole = (role: 'FARMER' | 'OWNER' | 'ADMIN') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.prismaUser) {
      res.status(401).json({ error: 'User profile not found in database' });
      return;
    }

    const userRole = req.prismaUser.role;
    const hasRequiredRole =
      userRole === 'ADMIN' ||
      userRole === role ||
      userRole === 'BOTH' ||
      (typeof userRole === 'string' && userRole.split(',').map((r: string) => r.trim()).includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({ error: `Forbidden: Requires ${role} role` });
      return;
    }

    next();
  };
};
