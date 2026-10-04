import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Utility for password validation
function validatePasswordStrength(password: string): boolean {
  if (password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUppercase && hasLowercase && hasNumber;
}

// 1. Register User via Supabase Auth & Link Application User
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, error: 'Name, email, password, and role are required' });
      return;
    }

    if (role !== 'FARMER' && role !== 'OWNER') {
      res.status(400).json({ success: false, error: 'Invalid role. Must be FARMER or OWNER' });
      return;
    }

    if (!validatePasswordStrength(String(password))) {
      res.status(400).json({
        success: false,
        error: 'Password does not meet requirements: Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number'
      });
      return;
    }

    // Check if user profile already exists in Prisma DB
    const existingUser = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() }
    });

    if (existingUser) {
      if (existingUser.role === role || existingUser.role === 'BOTH') {
        res.status(400).json({
          success: false,
          error: `An account with this email address already exists as ${existingUser.role}. Please log in.`
        });
        return;
      }

      // Upgrade account role to BOTH
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: 'BOTH' }
      });

      // Sign in via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: String(email).toLowerCase(),
        password: String(password)
      });

      let token = authData?.session?.access_token;

      if (authError || !token) {
        // Create user in Supabase Auth if missing
        const { data: newUserAuth, error: createError } = await supabase.auth.admin.createUser({
          email: String(email).toLowerCase(),
          password: String(password),
          email_confirm: true,
          user_metadata: { name: updatedUser.name, role: updatedUser.role }
        });

        if (!createError && newUserAuth.user) {
          await prisma.user.update({
            where: { id: updatedUser.id },
            data: { authId: newUserAuth.user.id }
          });
          const { data: reloginData } = await supabase.auth.signInWithPassword({
            email: String(email).toLowerCase(),
            password: String(password)
          });
          token = reloginData?.session?.access_token;
        }
      }

      res.json({
        success: true,
        message: `Role capability successfully updated to BOTH!`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          phone: updatedUser.phone,
          preferredLanguage: updatedUser.preferredLanguage
        },
        token: token,
        session: authData?.session
      });
      return;
    }

    // Create user identity in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: String(email).toLowerCase(),
      password: String(password),
      email_confirm: true,
      user_metadata: { name, role, phone }
    });

    if (authError && !authError.message.includes('already registered')) {
      res.status(400).json({ success: false, error: authError.message });
      return;
    }

    const supabaseUserId = authData?.user?.id;

    // Create application User record in Prisma PostgreSQL
    const newUser = await prisma.user.create({
      data: {
        name: String(name),
        email: String(email).toLowerCase(),
        password: 'SUPABASE_AUTH_MANAGED',
        role: role as 'FARMER' | 'OWNER',
        phone: phone ? String(phone) : '',
        authId: supabaseUserId,
        isVerified: true
      }
    });

    // Authenticate with Supabase to obtain session tokens
    const { data: sessionData } = await supabase.auth.signInWithPassword({
      email: String(email).toLowerCase(),
      password: String(password)
    });

    res.json({
      success: true,
      message: 'Account created successfully with Supabase Auth!',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        preferredLanguage: newUser.preferredLanguage
      },
      token: sessionData?.session?.access_token,
      session: sessionData?.session
    });

    await prisma.auditLog.create({
      data: {
        actorId: newUser.id,
        actorRole: newUser.role,
        action: 'REGISTER_SUPABASE_AUTH',
        resource: 'User',
        resourceId: newUser.id,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to complete registration' });
  }
});

// 2. Login User via Supabase Auth
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const cleanEmail = String(email).toLowerCase();

    // 1. Authenticate against Supabase Auth
    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: String(password)
    });

    // Handle legacy seed account auto-provisioning into Supabase Auth
    if (authError) {
      const dbUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (dbUser) {
        // Attempt creating or updating user in Supabase Auth for smooth transition
        const { data: createdAuth, error: createError } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password: String(password),
          email_confirm: true,
          user_metadata: { name: dbUser.name, role: dbUser.role }
        });

        let targetAuthId = createdAuth?.user?.id;

        if (createError && (createError.message.includes('already registered') || createError.message.includes('email_exists'))) {
          // Find existing user across pages in Supabase and sync password
          let page = 1;
          while (page <= 5) {
            const { data: listData } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
            if (!listData || !listData.users || listData.users.length === 0) break;
            const match = listData.users.find(u => u.email?.toLowerCase() === cleanEmail);
            if (match) {
              targetAuthId = match.id;
              await supabase.auth.admin.updateUserById(match.id, {
                password: String(password),
                email_confirm: true,
                user_metadata: { name: dbUser.name, role: dbUser.role }
              });
              break;
            }
            if (listData.users.length < 100) break;
            page++;
          }
        }

        if (targetAuthId) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { authId: targetAuthId }
          });

          // Retry login
          const retryAuth = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: String(password)
          });
          authData = retryAuth.data;
          authError = retryAuth.error;
        }
      }
    }

    if (authError || !authData.session || !authData.user) {
      res.status(401).json({ success: false, error: 'Invalid email or password credentials' });
      return;
    }

    // 2. Lookup application User profile from Prisma PostgreSQL
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { authId: authData.user.id },
          { email: cleanEmail }
        ]
      }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Application profile not found' });
      return;
    }

    // Link authId if missing
    if (!user.authId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { authId: authData.user.id }
      });
    }

    if (user.isSuspended) {
      res.status(403).json({ success: false, error: 'Account suspended by administrator' });
      return;
    }

    // 3. Verify Portal Role Match
    if (role) {
      if (user.role === 'ADMIN' && role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'ROLE_MISMATCH',
          message: 'These credentials belong to an Admin. Please use the Admin portal.'
        });
        return;
      }

      if (role === 'ADMIN' && user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'ROLE_MISMATCH',
          message: 'These credentials do not belong to an Admin.'
        });
        return;
      }

      if (user.role !== 'BOTH' && user.role !== 'ADMIN') {
        if (role === 'FARMER' && user.role !== 'FARMER') {
          res.status(403).json({
            success: false,
            error: 'ROLE_MISMATCH',
            message: 'These credentials belong to an Equipment Owner. Please select Owner portal.'
          });
          return;
        }

        if (role === 'OWNER' && user.role !== 'OWNER') {
          res.status(403).json({
            success: false,
            error: 'ROLE_MISMATCH',
            message: 'These credentials belong to a Farmer. Please select Farmer portal.'
          });
          return;
        }
      }
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        authId: user.authId
      },
      token: authData.session.access_token,
      session: authData.session
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: user.role,
        action: 'LOGIN_SUPABASE_AUTH',
        resource: 'Auth',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });
  } catch (error: any) {
    console.error('Login Route Error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
});

// 3. Request Password Reset via Supabase Auth
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email address is required' });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(String(email).toLowerCase());
    if (error) {
      console.warn('Supabase reset password info:', error.message);
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, password recovery instructions have been initiated via Supabase Auth.'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, error: 'Failed to process forgot password' });
  }
});

// 4. Get Current Authenticated Profile
router.get('/me', requireAuth, async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.prismaUser) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json(req.prismaUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// 5. Update Current Profile
router.put('/me', requireAuth, async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.prismaUser) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const userId = req.prismaUser.id;
    const { name, phone, preferredLanguage, profileImage } = req.body;

    const dataToUpdate: any = {};
    if (name !== undefined && String(name).trim() !== '') {
      dataToUpdate.name = String(name).trim();
    }
    if (phone !== undefined) {
      dataToUpdate.phone = String(phone).trim();
    }
    if (preferredLanguage !== undefined) {
      dataToUpdate.preferredLanguage = String(preferredLanguage).trim();
    }
    if (profileImage !== undefined) {
      dataToUpdate.profileImage = profileImage;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    });

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        preferredLanguage: updatedUser.preferredLanguage,
        profileImage: updatedUser.profileImage
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile details' });
  }
});

// 6. Update Language Preference
router.put('/language', requireAuth, async (req: any, res: Response): Promise<void> => {
  try {
    const { language } = req.body;
    if (!language) {
      res.status(400).json({ success: false, error: 'Language parameter required' });
      return;
    }
    const updatedUser = await prisma.user.update({
      where: { id: req.prismaUser.id },
      data: { preferredLanguage: String(language) }
    });
    res.json({ success: true, preferredLanguage: updatedUser.preferredLanguage });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update language' });
  }
});

// 8. Change Password via Supabase Auth & Prisma DB
router.post('/change-password', requireAuth, async (req: any, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 8) {
      res.status(400).json({ success: false, error: 'New password must be at least 8 characters long.' });
      return;
    }

    const email = req.prismaUser.email;
    if (currentPassword) {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: String(currentPassword)
      });
      if (verifyError) {
        res.status(400).json({ success: false, error: 'Current password is incorrect.' });
        return;
      }
    }

    if (req.prismaUser.authId) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        req.prismaUser.authId,
        { password: String(newPassword) }
      );
      if (updateError) {
        res.status(400).json({ success: false, error: updateError.message });
        return;
      }
    }

    await prisma.user.update({
      where: { id: req.prismaUser.id },
      data: { password: String(newPassword) }
    });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update password' });
  }
});

export default router;
