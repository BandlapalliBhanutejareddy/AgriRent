import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { requireAuth } from '../middlewares/authMiddleware';
import { sendOtpEmail } from '../lib/email';

const router = Router();

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
    await prisma.$executeRawUnsafe(
      `INSERT INTO "OTPVerification" ("id", "email", "otp", "purpose", "expiresAt", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      'otp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      String(email),
      generatedOtp,
      'REGISTER',
      new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
    );

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

    // Query direct OTP verification table using raw query for maximum compatibility
    const otps: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "OTPVerification" 
       WHERE "email" = $1 AND "otp" = $2 AND "purpose" = $3 AND "expiresAt" > NOW() 
       ORDER BY "createdAt" DESC LIMIT 1`,
      String(email),
      String(otp),
      String(purpose)
    );

    if (otps.length === 0) {
      res.status(400).json({ success: false, error: 'Invalid or expired OTP verification code' });
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
    await prisma.$executeRawUnsafe(
      `DELETE FROM "OTPVerification" WHERE "email" = $1 AND "purpose" = $2`,
      String(email),
      String(purpose)
    );

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
      token: 'demo-token-' + updatedUser.id
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
    await prisma.$executeRawUnsafe(
      `DELETE FROM "OTPVerification" WHERE "email" = $1 AND "purpose" = $2`,
      String(email),
      String(purpose)
    );

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await prisma.$executeRawUnsafe(
      `INSERT INTO "OTPVerification" ("id", "email", "otp", "purpose", "expiresAt", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      'otp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      user.email,
      otp,
      String(purpose),
      expiresAt,
      new Date()
    );

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
    const otps: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "OTPVerification" WHERE "email" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      String(email)
    );
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

    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));

    // Save OTP to database
    await prisma.$executeRawUnsafe(
      `INSERT INTO "OTPVerification" ("id", "email", "otp", "purpose", "expiresAt", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      'otp-forgot-' + Date.now(),
      String(email),
      generatedOtp,
      'FORGOT_PASSWORD',
      new Date(Date.now() + 5 * 60 * 1000)
    );

    // Send real recovery OTP email via Resend
    await sendOtpEmail(String(email), generatedOtp, 'FORGOT_PASSWORD');

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
       WHERE "email" = $1 AND "otp" = $2 AND "purpose" = $3 AND "expiresAt" > NOW()`,
      String(email),
      String(otp),
      'FORGOT_PASSWORD'
    );

    if (otps.length === 0) {
      res.status(400).json({ success: false, error: 'Invalid or expired OTP code' });
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
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Verification check
    if (!user.isVerified) {
      // Auto-trigger fresh registration OTP for convenient user verification
      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      await prisma.$executeRawUnsafe(
        `DELETE FROM "OTPVerification" WHERE "email" = $1 AND "purpose" = $2`,
        String(email),
        'REGISTER'
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO "OTPVerification" ("id", "email", "otp", "purpose", "expiresAt", "createdAt") 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        'otp-resend-' + Date.now(),
        String(email),
        generatedOtp,
        'REGISTER',
        new Date(Date.now() + 5 * 60 * 1000)
      );

      // Send real resend OTP email via Resend
      await sendOtpEmail(String(email), generatedOtp, 'REGISTER');

      res.status(403).json({ 
        success: false, 
        error: 'Email address is not verified yet. A fresh verification OTP has been dispatched to your email!',
        email: user.email
      });
      return;
    }

    // Use bcrypt to compare password
    const isMatch = await bcrypt.compare(String(password), user.password);

    if (!isMatch) {
      // Temporary fallback for plain text passwords from seeding
      if (user.password === String(password)) {
        console.warn(`Plain text password match for ${email}.`);
      } else {
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
      token: 'demo-token-' + authenticatedUser.id
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
