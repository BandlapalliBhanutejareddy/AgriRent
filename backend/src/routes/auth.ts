import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middlewares/authMiddleware';
import { sendOtpEmail } from '../lib/email';

const router = Router();

const generateTokens = async (userId: string, req: Request) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  
  // 15 minute access token
  const accessToken = jwt.sign({ userId }, secret, { expiresIn: '15m' });
  
  // 30 day refresh token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  // Store session
  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash,
      expiresAt,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    }
  });

  return { accessToken, refreshToken };
};

// Password validation check utility
function validatePasswordStrength(password: string): boolean {
  if (password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUppercase && hasLowercase && hasNumber;
}

// 1. Traditional User Registration
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

    // Email unique check
    const existingUser = await prisma.user.findUnique({
      where: { email: String(email) }
    });

    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email address is already registered' });
      return;
    }

    // Password strength check
    if (!validatePasswordStrength(String(password))) {
      res.status(400).json({ 
        success: false, 
        error: 'Password does not meet requirements: Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number' 
      });
      return;
    }

    // Hashing password
    const hashedPassword = await bcrypt.hash(String(password), 10);

    // Create unverified user
    const newUser = await prisma.user.create({
      data: {
        name: String(name),
        email: String(email),
        password: hashedPassword,
        role: role as 'FARMER' | 'OWNER',
        phone: phone ? String(phone) : '',
        isVerified: false
      }
    });

    // Generate 6-digit numeric OTP
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    
    // Save OTP to database
    await prisma.oTPVerification.create({
      data: {
        id: 'otp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        email: String(email),
        otp: generatedOtp,
        purpose: 'REGISTER',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });

    // Send real OTP email via Resend (with console log debug backup)
    await sendOtpEmail(String(email), generatedOtp, 'REGISTER');

    res.json({
      success: true,
      message: 'Account created successfully! A secure 6-digit OTP code has been dispatched to your email.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        preferredLanguage: newUser.preferredLanguage
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: newUser.id,
        actorRole: newUser.role,
        action: 'REGISTER',
        resource: 'User',
        resourceId: newUser.id,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete registration' });
  }
});

// 2. Verify 6-Digit Email OTP
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose) {
      res.status(400).json({ success: false, error: 'Email, OTP code, and purpose are required' });
      return;
    }

    // Query direct OTP verification table using Prisma method
    const otps = await prisma.oTPVerification.findMany({
      where: {
        email: String(email),
        otp: String(otp),
        purpose: String(purpose)
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (otps.length === 0) {
      res.status(400).json({ success: false, error: 'Invalid OTP verification code' });
      return;
    }

    if (new Date(otps[0].expiresAt).getTime() < Date.now()) {
      res.status(400).json({ success: false, error: 'Expired OTP verification code' });
      return;
    }

    // For FORGOT_PASSWORD: don't delete the OTP or update user here — reset-password will do that
    if (String(purpose) === 'FORGOT_PASSWORD') {
      res.json({
        success: true,
        message: 'OTP verified. You may now reset your password.'
      });
      return;
    }

    // Mark user as verified (REGISTER only)
    const updatedUser = await prisma.user.update({
      where: { email: String(email) },
      data: { isVerified: true }
    });

    // Delete utilized verification code
    await prisma.oTPVerification.deleteMany({
      where: {
        email: String(email),
        purpose: String(purpose)
      }
    });

    const tokens = await generateTokens(updatedUser.id, req);

    res.json({
      success: true,
      message: 'Email OTP validation successful! Account activated.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        preferredLanguage: updatedUser.preferredLanguage
      },
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// 2b. Resend OTP
router.post('/resend-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) {
      res.status(400).json({ success: false, error: 'Email and purpose are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: String(email) } });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Invalidate previous OTPs for this purpose
    await prisma.oTPVerification.deleteMany({
      where: {
        email: String(email),
        purpose: String(purpose)
      }
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await prisma.oTPVerification.create({
      data: {
        id: 'otp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        email: user.email,
        otp: otp,
        purpose: String(purpose),
        expiresAt: expiresAt
      }
    });

    await sendOtpEmail(user.email, otp, String(purpose));

    res.json({ success: true, message: 'New OTP sent to your email.' });
  } catch (err) {
    console.error('Resend OTP Error:', err);
    res.status(500).json({ success: false, error: 'Failed to resend OTP' });
  }
});

// DEV ONLY: Retrieve latest OTP for browser automation
router.get('/dev-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.query;
    const otps = await prisma.oTPVerification.findMany({
      where: { email: String(email) },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    if (otps.length > 0) {
      res.json({ success: true, otp: otps[0].otp, expiresAt: otps[0].expiresAt, purpose: otps[0].purpose });
    } else {
      res.json({ success: false, otp: null });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve OTP' });
  }
});

// 3. Request Password Recovery OTP
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email address is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email) }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'No account registered with this email address' });
      return;
    }

    // Invalidate old tokens
    await prisma.oTPVerification.deleteMany({
      where: {
        email: String(email),
        purpose: 'FORGOT_PASSWORD'
      }
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry for reset

    await prisma.oTPVerification.create({
      data: {
        id: 'pwd-reset-' + Date.now(),
        email: String(email),
        otp: otp,
        purpose: 'FORGOT_PASSWORD',
        expiresAt: expiresAt
      }
    });

    // Send real recovery OTP email via Resend
    await sendOtpEmail(String(email), otp, 'FORGOT_PASSWORD');

    res.json({
      success: true,
      message: 'Security recovery OTP has been dispatched to your email.'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, error: 'Failed to process forgot password' });
  }
});

// 4. Complete Password Reset using OTP
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ success: false, error: 'Email, OTP, and new password are required' });
      return;
    }

    if (!validatePasswordStrength(String(newPassword))) {
      res.status(400).json({ 
        success: false, 
        error: 'New password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number' 
      });
      return;
    }

    // Verify OTP exists and matches
    const otps: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "OTPVerification" 
       WHERE "email" = $1 AND "otp" = $2 AND "purpose" = $3`,
      String(email),
      String(otp),
      'FORGOT_PASSWORD'
    );

    if (otps.length === 0) {
      res.status(400).json({ success: false, error: 'Invalid OTP code' });
      return;
    }

    if (new Date(otps[0].expiresAt).getTime() < Date.now()) {
      res.status(400).json({ success: false, error: 'Expired OTP code' });
      return;
    }

    // Update user password hashed
    const hashedPassword = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({
      where: { email: String(email) },
      data: { 
        password: hashedPassword,
        isVerified: true // Auto-verify if they recover their account
      }
    });

    // Delete verification code
    await prisma.$executeRawUnsafe(
      `DELETE FROM "OTPVerification" WHERE "email" = $1 AND "purpose" = $2`,
      String(email),
      'FORGOT_PASSWORD'
    );

    res.json({
      success: true,
      message: 'Password reset and saved successfully!'
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// 5. Change Password (Profile Page)
router.post('/change-password', requireAuth, async (req: any, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Current password and new password are required' });
      return;
    }

    if (!validatePasswordStrength(String(newPassword))) {
      res.status(400).json({ 
        success: false, 
        error: 'New password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number' 
      });
      return;
    }

    const userId = req.prismaUser.id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User account not found' });
      return;
    }

    // Check current password
    const isMatch = await bcrypt.compare(String(currentPassword), user.password);
    if (!isMatch) {
      // Direct comparison as seeding fallback
      if (user.password !== String(currentPassword)) {
        res.status(400).json({ success: false, error: 'Incorrect current password' });
        return;
      }
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password updated successfully!'
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update password' });
  }
});

// 6. Traditional login (with verified checks)
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email) }
    });

    if (!user) {
      await prisma.auditLog.create({
        data: {
          actorId: 'anonymous',
          actorRole: 'UNKNOWN',
          action: 'FAILED_LOGIN',
          resource: 'Auth',
          metadata: JSON.stringify({ reason: 'Invalid email', email }),
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        }
      });
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Verification check
    if (!user.isVerified) {
      // Auto-trigger fresh registration OTP for convenient user verification
      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      await prisma.oTPVerification.deleteMany({
        where: {
          email: String(email),
          purpose: 'REGISTER'
        }
      });
      await prisma.oTPVerification.create({
        data: {
          id: 'otp-resend-' + Date.now(),
          email: String(email),
          otp: generatedOtp,
          purpose: 'REGISTER',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        }
      });

      // Send real resend OTP email via Resend
      await sendOtpEmail(String(email), generatedOtp, 'REGISTER');

      res.status(403).json({ 
        success: false, 
        error: 'Email address is not verified yet. A fresh verification OTP has been dispatched to your email!',
        email: user.email
      });
      return;
    }

    if (user.isSuspended) {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorRole: user.role,
          action: 'FAILED_LOGIN',
          resource: 'Auth',
          metadata: JSON.stringify({ reason: 'Account suspended' }),
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        }
      });
      res.status(403).json({ success: false, error: 'Account suspended by administrator' });
      return;
    }

    // Use bcrypt to compare password
    const isMatch = await bcrypt.compare(String(password), user.password);

    if (!isMatch) {
      // Temporary fallback for plain text passwords from seeding
      if (user.password === String(password)) {
        console.warn(`Plain text password match for ${email}.`);
      } else {
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            actorRole: user.role,
            action: 'FAILED_LOGIN',
            resource: 'Auth',
            metadata: JSON.stringify({ reason: 'Invalid password' }),
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        });
        res.status(401).json({ success: false, error: 'Invalid credentials' });
        return;
      }
    }

    let authenticatedUser = user;
    if (req.body.pushToken && typeof req.body.pushToken === 'string') {
      authenticatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { pushToken: req.body.pushToken }
      });
    }

    const tokens = await generateTokens(authenticatedUser.id, req);

    res.json({
      success: true,
      user: {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        role: authenticatedUser.role,
        phone: authenticatedUser.phone,
        preferredLanguage: authenticatedUser.preferredLanguage
      },
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });

    await prisma.auditLog.create({
      data: {
        actorId: authenticatedUser.id,
        actorRole: authenticatedUser.role,
        action: 'LOGIN',
        resource: 'Auth',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });
  } catch (error) {
    console.error('Login Route Error:', error);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

// Get current user profile
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

// 8. Refresh Token Endpoint
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    // Find all active sessions, we have to check hashes
    const activeSessions = await prisma.session.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    let validSession = null;
    for (const session of activeSessions) {
      const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (isMatch) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Revoke the old session (Token Rotation)
    await prisma.session.update({
      where: { id: validSession.id },
      data: { revokedAt: new Date() }
    });

    // Generate new tokens
    const tokens = await generateTokens(validSession.userId, req);

    res.json({
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// 9. Logout Endpoint
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const activeSessions = await prisma.session.findMany({
        where: { revokedAt: null }
      });
      for (const session of activeSessions) {
        if (await bcrypt.compare(refreshToken, session.refreshTokenHash)) {
          await prisma.session.update({
            where: { id: session.id },
            data: { revokedAt: new Date() }
          });
          
          const user = await prisma.user.findUnique({ where: { id: session.userId } });
          if (user) {
            await prisma.auditLog.create({
              data: {
                actorId: user.id,
                actorRole: user.role,
                action: 'LOGOUT',
                resource: 'Auth',
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
              }
            });
          }
          break;
        }
      }
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Update preferred language
router.put('/language', requireAuth, async (req: any, res: Response): Promise<void> => {
  try {
    const { language } = req.body;
    if (!language) {
      res.status(400).json({ error: 'Language is required' });
      return;
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: req.prismaUser.id },
      data: { preferredLanguage: language }
    });
    
    res.json({ success: true, preferredLanguage: updatedUser.preferredLanguage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferred language' });
  }
});

export default router;
