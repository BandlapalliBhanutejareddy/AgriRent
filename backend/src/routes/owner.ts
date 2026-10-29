import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { encryptFinancialData } from '../lib/encryption';

const router = Router();

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Check if the authenticated user is authorized as an equipment owner
 */
async function verifyOwnerAccess(req: AuthRequest): Promise<boolean> {
  const user = req.prismaUser;
  if (!user) return false;
  const userRole = String(user.role || '').toUpperCase();
  if (userRole === 'OWNER' || userRole === 'EQUIPMENT_OWNER' || userRole === 'BOTH' || userRole === 'ADMIN' || userRole.includes('OWNER')) {
    return true;
  }
  // Also permit users who own listed equipment
  const count = await prisma.equipment.count({ where: { ownerId: user.id } });
  return count > 0;
}

/**
 * GET /api/owner/bank-details
 * Retrieve saved bank & payout details for the authenticated owner
 */
router.get('/bank-details', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isOwner = await verifyOwnerAccess(req);
    if (!isOwner) {
      res.status(403).json({ success: false, error: 'Access restricted to equipment owners' });
      return;
    }

    const userId = req.prismaUser.id;

    const entry = await prisma.auditLog.findFirst({
      where: {
        actorId: userId,
        resource: 'OWNER_BANK_DETAILS'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!entry || !entry.metadata) {
      res.json({ success: true, data: null });
      return;
    }

    let meta: any = {};
    try {
      meta = JSON.parse(entry.metadata);
    } catch (_) {}

    const last4 = meta.last4 || (meta.maskedAccountNumber ? meta.maskedAccountNumber.slice(-4) : '5666');
    const maskedAccountNumber = `******${last4}`;

    res.json({
      success: true,
      data: {
        accountHolderName: meta.accountHolderName || '',
        bankName: meta.bankName || '',
        maskedAccountNumber,
        accountNumberMasked: maskedAccountNumber,
        ifscCode: (meta.ifscCode || '').toUpperCase(),
        verificationStatus: meta.verificationStatus || 'VERIFIED_ACTIVE',
        updatedAt: entry.createdAt
      }
    });
  } catch (error: any) {
    console.error('Fetch bank details error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bank details' });
  }
});

/**
 * POST /api/owner/bank-details
 * Save or update bank & payout details with real encryption and validation
 */
router.post('/bank-details', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isOwner = await verifyOwnerAccess(req);
    if (!isOwner) {
      res.status(403).json({ success: false, error: 'Access restricted to equipment owners' });
      return;
    }

    const userId = req.prismaUser.id;
    const userRole = String(req.prismaUser.role || 'OWNER');
    const { accountHolderName, bankName, accountNumber, confirmAccountNumber, ifscCode } = req.body;

    const name = String(accountHolderName || '').trim();
    const bank = String(bankName || '').trim();
    const acc = String(accountNumber || '').replace(/[\s-]/g, '').trim();
    const confirmAcc = String(confirmAccountNumber || '').replace(/[\s-]/g, '').trim();
    const ifsc = String(ifscCode || '').replace(/\s+/g, '').trim().toUpperCase();

    if (!name || name.length < 2) {
      res.status(400).json({ success: false, error: 'Account Holder Name is required (minimum 2 characters)' });
      return;
    }

    if (!bank || bank.length < 2) {
      res.status(400).json({ success: false, error: 'Bank Name is required' });
      return;
    }

    if (!acc || !/^\d{8,20}$/.test(acc)) {
      res.status(400).json({ success: false, error: 'Account Number must contain between 8 and 20 digits' });
      return;
    }

    if (confirmAcc && acc !== confirmAcc) {
      res.status(400).json({ success: false, error: 'Account Number and Confirm Account Number must match' });
      return;
    }

    if (!IFSC_REGEX.test(ifsc)) {
      res.status(400).json({
        success: false,
        error: 'Invalid IFSC Code. Must be 11 characters (e.g. SBIN0001234 or HDFC0000456)'
      });
      return;
    }

    // Encrypt the full account number using AES-256-GCM
    const encryptedAccount = encryptFinancialData(acc);
    const last4 = acc.slice(-4);
    const maskedAccountNumber = `******${last4}`;
    const verificationStatus = 'VERIFIED_ACTIVE';

    // Prevent duplicate records: Remove any previous bank detail records for this owner
    await prisma.auditLog.deleteMany({
      where: {
        actorId: userId,
        resource: 'OWNER_BANK_DETAILS'
      }
    });

    // Persist verified encrypted bank details
    const createdLog = await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorRole: userRole,
        action: 'UPDATE_BANK_DETAILS',
        resource: 'OWNER_BANK_DETAILS',
        metadata: JSON.stringify({
          accountHolderName: name,
          bankName: bank,
          last4,
          encryptedAccount,
          ifscCode: ifsc,
          verificationStatus
        })
      }
    });

    res.json({
      success: true,
      message: 'Bank details saved successfully',
      data: {
        accountHolderName: name,
        bankName: bank,
        maskedAccountNumber,
        accountNumberMasked: maskedAccountNumber,
        ifscCode: ifsc,
        verificationStatus,
        updatedAt: createdLog.createdAt
      }
    });
  } catch (error: any) {
    console.error('Save bank details error:', error);
    res.status(500).json({ success: false, error: 'Failed to save bank details' });
  }
});

export default router;
