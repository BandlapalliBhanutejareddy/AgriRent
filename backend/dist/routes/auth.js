"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const email_1 = require("../lib/email");
const router = (0, express_1.Router)();
// Password validation check utility
function validatePasswordStrength(password) {
    if (password.length < 8)
        return false;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasUppercase && hasLowercase && hasNumber;
}
// 1. Traditional User Registration
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existingUser = yield prisma_1.prisma.user.findUnique({
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
        const hashedPassword = yield bcrypt_1.default.hash(String(password), 10);
        // Create unverified user
        const newUser = yield prisma_1.prisma.user.create({
            data: {
                name: String(name),
                email: String(email),
                password: hashedPassword,
                role: role,
                phone: phone ? String(phone) : '',
                isVerified: false
            }
        });
        // Generate 6-digit numeric OTP
        const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
        // Save OTP to database
        yield prisma_1.prisma.$executeRawUnsafe(`INSERT INTO "OTPVerification" ("id", "email", "otp", "purpose", "expiresAt", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, NOW())`, 'otp-' + Date.now() + '-' + Math.floor(Math.random() * 1000), String(email), generatedOtp, 'REGISTER', new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
        );
        // Send real OTP email via Resend (with console log debug backup)
        yield (0, email_1.sendOtpEmail)(String(email), generatedOtp, 'REGISTER');
        res.json({
            success: true,
            message: 'Account created successfully! A secure 6-digit OTP code has been dispatched to your email.',
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            }
        });
    }
    catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, error: 'Failed to complete registration' });
    }
}));
// 2. Verify 6-Digit Email OTP
router.post('/verify-otp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp, purpose } = req.body;
        if (!email || !otp || !purpose) {
            res.status(400).json({ success: false, error: 'Email, OTP code, and purpose are required' });
            return;
        }
        // Query direct OTP verification table using raw query for maximum compatibility
        const otps = yield prisma_1.prisma.$queryRawUnsafe(`SELECT * FROM "OTPVerification" 
       WHERE "email" = $1 AND "otp" = $2 AND "purpose" = $3 AND "expiresAt" > NOW() 
       ORDER BY "createdAt" DESC LIMIT 1`, String(email), String(otp), String(purpose));
        if (otps.length === 0) {
            res.status(400).json({ success: false, error: 'Invalid or expired OTP verification code' });
            return;
        }
        // Mark user as verified
        yield prisma_1.prisma.user.update({
            where: { email: String(email) },
            data: { isVerified: true }
        });
        // Delete utilized verification code
        yield prisma_1.prisma.$executeRawUnsafe(`DELETE FROM "OTPVerification" WHERE "email" = $1 AND "purpose" = $2`, String(email), String(purpose));
        res.json({
            success: true,
            message: 'Email OTP validation successful! Account activated.'
        });
    }
    catch (error) {
        console.error('OTP Verification Error:', error);
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
}));
// 3. Request Password Recovery OTP
router.post('/forgot-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, error: 'Email address is required' });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { email: String(email) }
        });
        if (!user) {
            res.status(404).json({ success: false, error: 'No account registered with this email address' });
            return;
        }
        const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
        // Save OTP to database
        yield prisma_1.prisma.$executeRawUnsafe(`INSERT INTO "OTPVerification" ("id", "email", "otp", "purpose", "expiresAt", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, NOW())`, 'otp-forgot-' + Date.now(), String(email), generatedOtp, 'FORGOT_PASSWORD', new Date(Date.now() + 5 * 60 * 1000));
        // Send real recovery OTP email via Resend
        yield (0, email_1.sendOtpEmail)(String(email), generatedOtp, 'FORGOT_PASSWORD');
        res.json({
            success: true,
            message: 'Security recovery OTP has been dispatched to your email.'
        });
    }
    catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ success: false, error: 'Failed to process forgot password' });
    }
}));
// 4. Complete Password Reset using OTP
router.post('/reset-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const otps = yield prisma_1.prisma.$queryRawUnsafe(`SELECT * FROM "OTPVerification" 
       WHERE "email" = $1 AND "otp" = $2 AND "purpose" = $3 AND "expiresAt" > NOW()`, String(email), String(otp), 'FORGOT_PASSWORD');
        if (otps.length === 0) {
            res.status(400).json({ success: false, error: 'Invalid or expired OTP code' });
            return;
        }
        // Update user password hashed
        const hashedPassword = yield bcrypt_1.default.hash(String(newPassword), 10);
        yield prisma_1.prisma.user.update({
            where: { email: String(email) },
            data: {
                password: hashedPassword,
                isVerified: true // Auto-verify if they recover their account
            }
        });
        // Delete verification code
        yield prisma_1.prisma.$executeRawUnsafe(`DELETE FROM "OTPVerification" WHERE "email" = $1 AND "purpose" = $2`, String(email), 'FORGOT_PASSWORD');
        res.json({
            success: true,
            message: 'Password reset and saved successfully!'
        });
    }
    catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ success: false, error: 'Failed to reset password' });
    }
}));
// 5. Change Password (Profile Page)
router.post('/change-password', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            res.status(404).json({ success: false, error: 'User account not found' });
            return;
        }
        // Check current password
        const isMatch = yield bcrypt_1.default.compare(String(currentPassword), user.password);
        if (!isMatch) {
            // Direct comparison as seeding fallback
            if (user.password !== String(currentPassword)) {
                res.status(400).json({ success: false, error: 'Incorrect current password' });
                return;
            }
        }
        // Hash and update
        const hashedPassword = yield bcrypt_1.default.hash(String(newPassword), 10);
        yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        res.json({
            success: true,
            message: 'Password updated successfully!'
        });
    }
    catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update password' });
    }
}));
// 6. Traditional login (with verified checks)
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, error: 'Email and password required' });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
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
            yield prisma_1.prisma.$executeRawUnsafe(`DELETE FROM "OTPVerification" WHERE "email" = $1 AND "purpose" = $2`, String(email), 'REGISTER');
            yield prisma_1.prisma.$executeRawUnsafe(`INSERT INTO "OTPVerification" ("id", "email", "otp", "purpose", "expiresAt", "createdAt") 
         VALUES ($1, $2, $3, $4, $5, NOW())`, 'otp-resend-' + Date.now(), String(email), generatedOtp, 'REGISTER', new Date(Date.now() + 5 * 60 * 1000));
            // Send real resend OTP email via Resend
            yield (0, email_1.sendOtpEmail)(String(email), generatedOtp, 'REGISTER');
            res.status(403).json({
                success: false,
                error: 'Email address is not verified yet. A fresh verification OTP has been dispatched to your email!',
                email: user.email
            });
            return;
        }
        // Use bcrypt to compare password
        const isMatch = yield bcrypt_1.default.compare(String(password), user.password);
        if (!isMatch) {
            // Temporary fallback for plain text passwords from seeding
            if (user.password === String(password)) {
                console.warn(`Plain text password match for ${email}.`);
            }
            else {
                res.status(401).json({ success: false, error: 'Invalid credentials' });
                return;
            }
        }
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone
            },
            token: 'demo-token-' + user.id
        });
    }
    catch (error) {
        console.error('Login Route Error:', error);
        res.status(500).json({ success: false, error: 'Database connection failed' });
    }
}));
// Get current user profile
router.get('/me', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.prismaUser) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        res.json(req.prismaUser);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}));
exports.default = router;
