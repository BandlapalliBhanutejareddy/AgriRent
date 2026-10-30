import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { requireAuth } from '../middlewares/authMiddleware';
import { generateFallbackToken } from '../lib/jwtFallback';

const bcrypt = require('bcryptjs');

const router = Router();
const revokedRefreshTokens = new Set<string>();

// Utility for password validation
function validatePasswordStrength(password: string): boolean {
  if (password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUppercase && hasLowercase && hasNumber;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

    if (!validateEmail(String(email).trim())) {
      res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
      return;
    }

    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone.length > 0 && cleanPhone.length < 10) {
        res.status(400).json({ success: false, error: 'Please enter a valid 10-digit phone number.' });
        return;
      }
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
      res.status(400).json({
        success: false,
        error: `An account with this email address already exists. Please log in.`
      });
      return;
    }

    // Create user identity in Supabase Auth (or fallback if offline/CI)
    let supabaseUserId: string | undefined;
    let sessionToken: string | undefined;
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: String(email).toLowerCase(),
        password: String(password),
        email_confirm: true,
        user_metadata: { name, role, phone }
      });
      if (authData?.user) {
        supabaseUserId = authData.user.id;
        const { data: sessionData } = await supabase.auth.signInWithPassword({
          email: String(email).toLowerCase(),
          password: String(password)
        });
        sessionToken = sessionData?.session?.access_token;
      }
    } catch (e) {
      // Supabase is offline or placeholder in CI
    }

    // Create application User record in Prisma PostgreSQL
    const newUser = await prisma.user.create({
      data: {
        name: String(name),
        email: String(email).toLowerCase(),
        password: 'SUPABASE_AUTH_MANAGED',
        role: role as 'FARMER' | 'OWNER',
        phone: phone ? String(phone) : '',
        authId: supabaseUserId || `local_${Date.now()}`,
        isVerified: true
      }
    });

    if (!sessionToken) {
      sessionToken = generateFallbackToken(newUser);
    }

    res.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        phone: newUser.phone,
        preferredLanguage: newUser.preferredLanguage,
        profileImage: newUser.profileImage
      },
      token: sessionToken,
      session: { access_token: sessionToken }
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

// 1b. Continue with Google (Secure OAuth Identity Token Verification)
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    let { idToken, accessToken, role } = req.body || {};
    if (!accessToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      accessToken = req.headers.authorization.split(' ')[1];
    }

    if (!idToken && !accessToken) {
      res.status(400).json({ success: false, error: 'Google ID token or access token is required.' });
      return;
    }

    const cleanReqRole = String(role || '').toUpperCase();
    const targetRole = (cleanReqRole === 'OWNER' || cleanReqRole === 'EQUIPMENT_OWNER') ? 'OWNER' : 'FARMER'; // Default FARMER, never allow self-registering as ADMIN

    let googleData: any = null;

    // 1. Try ID Token verification if provided
    if (idToken) {
      try {
        const gResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (gResponse.ok) {
          googleData = await gResponse.json();
        }
      } catch (netErr: any) {
        console.warn('Google idToken verify netErr:', netErr?.message);
      }
    }

    // 2. Try Access Token verification if idToken wasn't valid or provided
    if ((!googleData || !googleData.email) && accessToken) {
      try {
        // First try Google userinfo endpoint
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (userInfoRes.ok) {
          const info = await userInfoRes.json();
          googleData = {
            email: info.email,
            email_verified: info.email_verified,
            name: info.name,
            sub: info.sub,
            picture: info.picture
          };
        }
      } catch (uiErr: any) {
        console.warn('Google userinfo netErr:', uiErr?.message);
      }

      // If still not verified, check if accessToken is a Supabase Auth session token
      if (!googleData || !googleData.email) {
        try {
          const { data: sbUser, error: sbErr } = await supabase.auth.getUser(accessToken);
          if (!sbErr && sbUser?.user?.email) {
            googleData = {
              email: sbUser.user.email,
              email_verified: true,
              name: sbUser.user.user_metadata?.full_name || sbUser.user.user_metadata?.name || sbUser.user.email.split('@')[0],
              sub: sbUser.user.id,
              picture: sbUser.user.user_metadata?.avatar_url || sbUser.user.user_metadata?.picture
            };
          }
        } catch (_) {}
      }
    }

    if (!googleData || !googleData.email || (googleData.email_verified !== 'true' && googleData.email_verified !== true)) {
      res.status(401).json({
        success: false,
        error: 'Invalid, expired, or unverified Google identity token.'
      });
      return;
    }

    const verifiedEmail = String(googleData.email).toLowerCase().trim();
    const verifiedName = String(googleData.name || verifiedEmail.split('@')[0]).trim();
    const googleSub = String(googleData.sub);

    // Look up existing user by verified email or google sub identifier
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: verifiedEmail },
          { authId: googleSub }
        ]
      }
    });

    let isNewUser = false;

    if (user) {
      if (user.isSuspended) {
        res.status(403).json({ success: false, error: 'Account suspended by administrator.' });
        return;
      }

      // Link googleSub if missing or local placeholder
      if (!user.authId || user.authId.startsWith('local_')) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { authId: googleSub }
        });
      }
    } else {
      // Create fresh user in Prisma PostgreSQL
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          name: verifiedName,
          email: verifiedEmail,
          password: 'GOOGLE_OAUTH_MANAGED',
          role: targetRole,
          authId: googleSub,
          isVerified: true,
          profileImage: googleData.picture || null
        }
      });

      // Synchronize into Supabase Auth admin
      try {
        await supabase.auth.admin.createUser({
          email: verifiedEmail,
          email_confirm: true,
          user_metadata: { name: verifiedName, role: targetRole, provider: 'google', sub: googleSub }
        });
      } catch (sbErr: any) {
        console.warn('Supabase auth admin registration note:', sbErr?.message);
      }
    }

    // Generate reliable fallback token that auth middleware accepts
    const fallbackToken = generateFallbackToken(user);

    // Also attempt Supabase token generation if possible
    let sessionToken: string | null = null;
    try {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: verifiedEmail
      });
      sessionToken = linkData?.properties?.hashed_token || null;
    } catch (_) {}

    const issuedToken = fallbackToken; // Always use verified cryptographic fallback token for consistency

    res.json({
      success: true,
      message: isNewUser ? 'Welcome to AgroRent AI! Your Google account is now linked.' : 'Welcome back!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        profileImage: user.profileImage,
        authId: user.authId
      },
      token: issuedToken,
      session: {
        access_token: issuedToken,
        user: {
          id: user.authId || user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      },
      isNewUser
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: user.role,
        action: isNewUser ? 'REGISTER_GOOGLE_OAUTH' : 'LOGIN_GOOGLE_OAUTH',
        resource: 'Auth',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });
  } catch (error: any) {
    console.error('Google Auth Route Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Google authentication failed.' });
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
      let dbUser: any = null;
      try {
        dbUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      } catch (dbErr: any) {
        console.warn('Prisma lookup failed during auth fallback:', dbErr.message);
        if (dbErr.name === 'PrismaClientInitializationError' || dbErr.message?.includes('tenant/user') || dbErr.message?.includes("Can't reach database server")) {
          res.status(503).json({
            success: false,
            error: 'Database service is temporarily unavailable. Please verify that the Supabase project is active.',
            code: 'DATABASE_UNAVAILABLE'
          });
          return;
        }
      }
      if (dbUser) {
        let isDbPasswordValid = false;
        if (dbUser.password && (dbUser.password.startsWith('$2a$') || dbUser.password.startsWith('$2b$') || dbUser.password.startsWith('$2y$'))) {
          try {
            isDbPasswordValid = bcrypt.compareSync(String(password), dbUser.password);
          } catch (_) {
            isDbPasswordValid = false;
          }
        } else if (dbUser.password && dbUser.password !== 'SUPABASE_AUTH_MANAGED' && dbUser.password !== 'GOOGLE_OAUTH_MANAGED') {
          isDbPasswordValid = dbUser.password === String(password);
        }

        if (!isDbPasswordValid && dbUser.password !== 'SUPABASE_AUTH_MANAGED') {
          await prisma.auditLog.create({
            data: {
              actorId: dbUser.id,
              actorRole: dbUser.role,
              action: 'FAILED_LOGIN',
              resource: 'Auth',
              ip: req.ip || req.connection.remoteAddress,
              userAgent: req.headers['user-agent']
            }
          }).catch(() => {});

          res.status(401).json({ success: false, error: 'Invalid email or password credentials' });
          return;
        }

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
          try {
            const retryAuth = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: String(password)
            });
            authData = retryAuth.data;
            authError = retryAuth.error;
          } catch {
            // Supabase offline
          }
        }

        // CI & Offline Fallback: if Supabase Auth is unreachable/unconfigured, validate with database credentials
        if ((authError || !authData?.session) && dbUser && isDbPasswordValid) {
          const fallbackToken = generateFallbackToken(dbUser);
          authData = {
            session: {
              access_token: fallbackToken,
              refresh_token: fallbackToken,
              token_type: 'bearer',
              expires_in: 604800,
              user: {
                id: dbUser.authId || dbUser.id,
                email: dbUser.email,
                user_metadata: { name: dbUser.name, role: dbUser.role }
              }
            },
            user: {
              id: dbUser.authId || dbUser.id,
              email: dbUser.email
            }
          } as any;
          authError = null;
        }
      }
    }

    if (authError || !authData?.session || !authData?.user) {
      if (cleanEmail) {
        const failedUser = await prisma.user.findUnique({ where: { email: cleanEmail } }).catch(() => null);
        if (failedUser) {
          await prisma.auditLog.create({
            data: {
              actorId: failedUser.id,
              actorRole: failedUser.role,
              action: 'FAILED_LOGIN',
              resource: 'Auth',
              ip: req.ip || req.connection.remoteAddress,
              userAgent: req.headers['user-agent']
            }
          }).catch(() => {});
        }
      }
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
        profileImage: user.profileImage,
        authId: user.authId
      },
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      session: authData.session
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: user.role,
        action: 'LOGIN',
        resource: 'Auth',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });
  } catch (error: any) {
    console.error('Login Route Error:', error);
    if (error.name === 'PrismaClientInitializationError' || error.message?.includes('tenant/user') || error.message?.includes('fetch failed') || error.message?.includes("Can't reach database server")) {
      res.status(503).json({
        success: false,
        error: 'Database service is temporarily unavailable. Please verify that the Supabase project is active.',
        code: 'DATABASE_UNAVAILABLE'
      });
      return;
    }
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

// 9. Refresh Session Token
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token is required' });
      return;
    }

    if (revokedRefreshTokens.has(String(refreshToken))) {
      res.status(401).json({ success: false, error: 'Session revoked or expired' });
      return;
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: String(refreshToken) });
    if (error || !data.session) {
      res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
      return;
    }

    res.json({
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      session: data.session
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to refresh token' });
  }
});

// 10. Logout & Invalidate Session
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const refreshToken = req.body?.refreshToken;

    if (refreshToken) {
      revokedRefreshTokens.add(String(refreshToken));
    }

    if (token) {
      try {
        await supabase.auth.admin.signOut(token);
      } catch (_) {}
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to log out' });
  }
});

export default router;
