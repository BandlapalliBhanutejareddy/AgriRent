import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const prisma = new PrismaClient();

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
    
    // Developer Bypass for testing
    if (token === 'dev-token' && process.env.NODE_ENV !== 'production') {
      const devUser = await prisma.user.findFirst({
        where: { role: req.path.includes('owner') || req.path.includes('equipment') ? 'OWNER' : 'FARMER' }
      });
      
      if (devUser) {
        req.user = { id: devUser.authId || devUser.id, email: devUser.email || 'dev@agrorent.com' };
        req.prismaUser = devUser;
        next();
        return;
      }
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Attach Supabase user to request
    req.user = user;

    // Fetch corresponding Prisma user to ensure role/auth sync
    const prismaUser = await prisma.user.findUnique({
      where: { authId: user.id }
    });

    if (prismaUser) {
      req.prismaUser = prismaUser;
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during authentication' });
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
