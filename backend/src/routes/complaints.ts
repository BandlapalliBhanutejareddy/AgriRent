import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';

const router = Router();

// Submit Complaint / Report
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, description, evidenceUrl, bookingId, targetUserId, equipmentId } = req.body;
    const reporterId = req.prismaUser.id;

    if (!category || !description) {
      res.status(400).json({ error: 'Category and description are required' });
      return;
    }

    const complaint = await prisma.complaint.create({
      data: {
        reporterId,
        targetUserId: targetUserId ? String(targetUserId) : null,
        bookingId: bookingId ? String(bookingId) : null,
        equipmentId: equipmentId ? String(equipmentId) : null,
        category: String(category),
        description: String(description),
        evidenceUrl: evidenceUrl ? String(evidenceUrl) : null,
        status: 'NEW'
      }
    });

    // Notify Admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'New Complaint Filed',
          message: `User ${req.prismaUser.name} filed a complaint: "${category}"`,
          type: 'ADMIN_ALERT',
          relatedId: complaint.id
        }
      });
    }

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Submit Complaint Error:', error);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// Get User's Complaints
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.prismaUser.id;
    const complaints = await prisma.complaint.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

export default router;
