import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';

const router = Router();

// 1. Submit Equipment Review (Farmer)
router.post('/equipment', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, rating, performanceRating, conditionRating, cleanlinessRating, valueRating, comment } = req.body;
    const userId = req.prismaUser.id;

    if (!bookingId || !rating) {
      res.status(400).json({ error: 'bookingId and rating are required' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: String(bookingId) },
      include: { equipment: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.farmerId !== userId) {
      res.status(403).json({ error: 'Only the farmer who rented this equipment can leave a review' });
      return;
    }

    if (booking.status !== 'COMPLETED' && booking.status !== 'RETURNED') {
      res.status(400).json({ error: 'Reviews can only be submitted after the rental is completed' });
      return;
    }

    // Check for existing review
    const existing = await prisma.equipmentReview.findFirst({
      where: { bookingId: String(bookingId), farmerId: userId }
    });

    if (existing) {
      res.status(409).json({ error: 'You have already submitted a review for this rental' });
      return;
    }

    const review = await prisma.equipmentReview.create({
      data: {
        bookingId: String(bookingId),
        farmerId: userId,
        equipmentId: booking.equipmentId,
        rating: Math.min(5, Math.max(1, Number(rating))),
        performanceRating: performanceRating ? Number(performanceRating) : null,
        conditionRating: conditionRating ? Number(conditionRating) : null,
        cleanlinessRating: cleanlinessRating ? Number(cleanlinessRating) : null,
        valueRating: valueRating ? Number(valueRating) : null,
        comment: comment || ''
      }
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Equipment Review Error:', error);
    res.status(500).json({ error: 'Failed to submit equipment review' });
  }
});

// 2. Submit User Review (Farmer rates Owner or Owner rates Farmer)
router.post('/user', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, targetUserId, rating, behaviourRating, communicationRating, timelinessRating, comment } = req.body;
    const reviewerId = req.prismaUser.id;

    if (!bookingId || !targetUserId || !rating) {
      res.status(400).json({ error: 'bookingId, targetUserId, and rating are required' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: String(bookingId) },
      include: { equipment: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const isFarmer = booking.farmerId === reviewerId;
    const isOwner = booking.equipment.ownerId === reviewerId;

    if (!isFarmer && !isOwner) {
      res.status(403).json({ error: 'You are not a participant in this rental' });
      return;
    }

    const role = isFarmer ? 'FARMER_RATING_OWNER' : 'OWNER_RATING_FARMER';
    const revieweeId = isFarmer ? booking.equipment.ownerId : booking.farmerId;

    if (revieweeId !== String(targetUserId)) {
      res.status(400).json({ error: 'Target user does not match booking participant' });
      return;
    }

    // Check duplicate
    const existing = await prisma.userReview.findFirst({
      where: { bookingId: String(bookingId), reviewerId }
    });

    if (existing) {
      res.status(409).json({ error: 'You have already submitted a user review for this rental' });
      return;
    }

    const review = await prisma.userReview.create({
      data: {
        bookingId: String(bookingId),
        reviewerId,
        revieweeId,
        role,
        rating: Math.min(5, Math.max(1, Number(rating))),
        behaviourRating: behaviourRating ? Number(behaviourRating) : null,
        communicationRating: communicationRating ? Number(communicationRating) : null,
        timelinessRating: timelinessRating ? Number(timelinessRating) : null,
        comment: comment || ''
      }
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('User Review Error:', error);
    res.status(500).json({ error: 'Failed to submit user review' });
  }
});

// 3. Get Reviews for Equipment
router.get('/equipment/:equipmentId', async (req: any, res: Response): Promise<void> => {
  try {
    const { equipmentId } = req.params;
    const reviews = await prisma.equipmentReview.findMany({
      where: { equipmentId: String(equipmentId) },
      orderBy: { createdAt: 'desc' }
    });

    const averageRating = reviews.length > 0 
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
      : 5.0;

    res.json({
      equipmentId,
      averageRating,
      totalReviews: reviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment reviews' });
  }
});

export default router;
