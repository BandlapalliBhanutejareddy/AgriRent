import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { registerSchema } from '../schemas';

const router = Router();
const prisma = new PrismaClient();

// Sync Supabase Auth User with Prisma Database User
router.post('/sync', requireAuth, validate(registerSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supabaseUser = req.user;
    const { role, name, phone } = req.body;

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { authId: supabaseUser.id }
    });

    if (user) {
      // User exists, return profile
      res.json(user);
      return;
    }

    // Check if phone is already registered to another user (without authId)
    if (phone) {
      user = await prisma.user.findUnique({
        where: { phone }
      });
      
      if (user) {
        // Link existing user to new Auth ID
        user = await prisma.user.update({
          where: { id: user.id },
          data: { authId: supabaseUser.id }
        });
        res.json(user);
        return;
      }
    }

    // Create new user profile
    if (!role || (role !== 'FARMER' && role !== 'OWNER')) {
      res.status(400).json({ error: 'Valid role (FARMER or OWNER) is required for new accounts' });
      return;
    }

    user = await prisma.user.create({
      data: {
        authId: supabaseUser.id,
        email: supabaseUser.email || (phone?.includes('@') ? phone : null),
        phone: phone && !phone.includes('@') ? phone : (supabaseUser.phone || 'UNKNOWN'),
        name: name,
        role: role,
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Auth sync error:', error);
    res.status(500).json({ error: 'Failed to sync user profile' });
  }
});

// Phone Login (for Mobile Demo/OTP flow)
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get Current User Profile
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.prismaUser) {
    res.json(req.prismaUser);
  } else {
    res.status(404).json({ error: 'User profile not found. Please sync your profile.' });
  }
});

export default router;
