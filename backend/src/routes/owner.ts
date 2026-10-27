import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';

const router = Router();

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * GET /api/owner/bank-details
 * Retrieve saved bank & payout details for the authenticated owner
 */
router.get('/bank-details', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req as any).prismaUser.id;
    const userRole = (req as any).prismaUser.role;
    const isOwner = userRole === 'OWNER' || userRole === 'EQUIPMENT_OWNER' || userRole === 'BOTH' || userRole === 'ADMIN';
    if (!isOwner) {
      res.status(403).json({ success: false, error: 'Access restricted to equipment owners' });
      return;
    }

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

    const accNum = String(meta.accountNumber || '');
    const last4 = accNum.length >= 4 ? accNum.slice(-4) : accNum;
    const maskedAccountNumber = last4 ? `•••• •••• ${last4}` : '';

    res.json({
      success: true,
      data: {
        accountHolderName: meta.accountHolderName || '',
        bankName: meta.bankName || '',
        maskedAccountNumber,
        accountNumberMasked: maskedAccountNumber,
        ifscCode: (meta.ifscCode || '').toUpperCase(),
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
 * Save or update bank & payout details with validation
 */
router.post('/bank-details', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req as any).prismaUser.id;
    const userRole = (req as any).prismaUser.role;
    const isOwner = userRole === 'OWNER' || userRole === 'EQUIPMENT_OWNER' || userRole === 'BOTH' || userRole === 'ADMIN';
    if (!isOwner) {
      res.status(403).json({ success: false, error: 'Access restricted to equipment owners' });
      return;
    }
    const { accountHolderName, bankName, accountNumber, confirmAccountNumber, ifscCode } = req.body;

    const name = String(accountHolderName || '').trim();
    const bank = String(bankName || '').trim();
    const acc = String(accountNumber || '').trim();
    const confirmAcc = String(confirmAccountNumber || '').trim();
    const ifsc = String(ifscCode || '').trim().toUpperCase();

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
        error: 'Invalid IFSC Code. Must be 11 characters (4 letters, 0, followed by 6 alphanumeric characters)'
      });
      return;
    }

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorRole: userRole,
        action: 'UPDATE_BANK_DETAILS',
        resource: 'OWNER_BANK_DETAILS',
        metadata: JSON.stringify({
          accountHolderName: name,
          bankName: bank,
          accountNumber: acc,
          ifscCode: ifsc
        })
      }
    });

    const last4 = acc.length >= 4 ? acc.slice(-4) : acc;
    const maskedAccountNumber = `•••• •••• ${last4}`;

    res.json({
      success: true,
      message: 'Bank details saved successfully',
      data: {
        accountHolderName: name,
        bankName: bank,
        maskedAccountNumber,
        accountNumberMasked: maskedAccountNumber,
        ifscCode: ifsc
      }
    });
  } catch (error: any) {
    console.error('Save bank details error:', error);
    res.status(500).json({ success: false, error: 'Failed to save bank details' });
  }
});

export default router;
