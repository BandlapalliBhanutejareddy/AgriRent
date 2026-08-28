import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';

const router = Router();

// POST /api/feedback - Submit new feedback
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rating, category, subject, message, attachmentUrl } = req.body;
    const user = req.prismaUser;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Valid rating (1-5) is required' });
      return;
    }

    if (!category || typeof category !== 'string') {
      res.status(400).json({ error: 'Feedback category is required' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ error: 'Feedback message is required' });
      return;
    }

    // Determine active role
    // The client should ideally send the active role, or we use the user's role.
    let activeRole = req.body.activeRole;
    if (!activeRole) {
      activeRole = user.role;
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        rating,
        category,
        subject: subject || null,
        message,
        attachmentUrl: attachmentUrl || null,
        activeRole,
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// GET /api/feedback/my - Get user's feedback
router.get('/my', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.prismaUser;
    
    const feedbackList = await prisma.feedback.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: feedbackList });
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// GET /api/feedback/:id - Get specific feedback details
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.prismaUser;

    const feedback = await prisma.feedback.findUnique({
      where: { id: String(id) }
    });

    if (!feedback) {
      res.status(404).json({ error: 'Feedback not found' });
      return;
    }

    // Only allow the creator or an admin to view
    if (feedback.userId !== user.id && user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error fetching feedback details:', error);
    res.status(500).json({ error: 'Failed to fetch feedback details' });
  }
});

export default router;
