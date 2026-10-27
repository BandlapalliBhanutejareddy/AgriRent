import { Router, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

// POST /api/calls/initiate - Privacy-Preserving Call Bridge
router.post('/initiate', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { equipmentId, bookingId } = req.body;
    const callerId = req.prismaUser.id;
    const callerRole = req.prismaUser.role;

    if (!equipmentId && !bookingId) {
      res.status(400).json({
        status: 'error',
        code: 'BAD_REQUEST',
        message: 'Either equipmentId or bookingId must be provided to initiate a private call.',
      });
      return;
    }

    let targetName = 'User';
    let targetRole = 'OWNER';
    let hasTargetPhone = false;

    let targetPhoneRaw = '';

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: String(bookingId) },
        include: {
          farmer: { select: { id: true, name: true, phone: true } },
          equipment: {
            include: {
              owner: { select: { id: true, name: true, phone: true } },
            },
          },
        },
      });

      if (!booking) {
        res.status(404).json({ status: 'error', message: 'Booking not found.' });
        return;
      }

      if (booking.farmerId === callerId) {
        // Farmer calling Owner
        targetName = booking.equipment.owner.name;
        targetRole = 'OWNER';
        targetPhoneRaw = booking.equipment.owner.phone || '';
      } else if (booking.equipment.ownerId === callerId) {
        // Owner calling Farmer
        targetName = booking.farmer.name;
        targetRole = 'FARMER';
        targetPhoneRaw = booking.farmer.phone || '';
      } else {
        res.status(403).json({ status: 'error', message: 'You are not authorized to call for this booking.' });
        return;
      }
    } else if (equipmentId) {
      const equipment = await prisma.equipment.findUnique({
        where: { id: String(equipmentId) },
        include: {
          owner: { select: { id: true, name: true, phone: true } },
        },
      });

      if (!equipment) {
        res.status(404).json({ status: 'error', message: 'Equipment not found.' });
        return;
      }

      targetName = equipment.owner.name;
      targetRole = 'OWNER';
      targetPhoneRaw = equipment.owner.phone || '';
    }

    const cleaned = targetPhoneRaw ? targetPhoneRaw.replace(/[\s\-\(\)\+]/g, '') : '';
    hasTargetPhone = /^[6-9]\d{9}$/.test(cleaned) || /^91[6-9]\d{9}$/.test(cleaned);

    if (!hasTargetPhone) {
      res.status(400).json({
        status: 'error',
        code: 'TARGET_PHONE_UNAVAILABLE',
        message: `${targetRole === 'OWNER' ? 'Owner' : 'Farmer'} has not registered a valid phone number.`,
      });
      return;
    }

    const targetPhone = cleaned.startsWith('91') && cleaned.length === 12
      ? `+${cleaned}`
      : (cleaned.length === 10 ? `+91${cleaned}` : cleaned);

    const sessionId = `DIAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const timestamp = new Date().toISOString();

    res.json({
      success: true,
      data: {
        sessionId,
        callerRole,
        targetRole,
        targetName,
        targetPhone,
        relayAvailable: true,
        relayNumber: targetPhone,
        message: 'Phone dialer initialized.',
        createdAt: timestamp,
      },
    });
  } catch (error) {
    console.error('Call Initiation Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to initiate private call bridge.' });
  }
});

export default router;
