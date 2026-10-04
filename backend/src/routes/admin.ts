import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';

const router = Router();

// Require Admin role for all admin routes
router.use(requireAuth, requireRole('ADMIN'));

// 1. Get Live Real Database Platform Stats (No Hardcoded Values)
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      farmers,
      owners,
      admins,
      suspendedUsers,
      pendingVerification,
      totalEquipment,
      availableEquipment,
      pendingModeration,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      rejectedBookings,
      payments,
      complaints,
      feedbacks
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: ['FARMER', 'BOTH'] } } }),
      prisma.user.count({ where: { role: { in: ['OWNER', 'BOTH'] } } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.user.count({ where: { role: { in: ['OWNER', 'BOTH'] }, isVerified: false } }),
      prisma.equipment.count(),
      prisma.equipment.count({ where: { available: true } }),
      prisma.equipment.count({ where: { available: false } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: { in: ['ACCEPTED', 'CONFIRMED'] } } }),
      prisma.booking.count({ where: { status: 'ACTIVE' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.booking.count({ where: { status: 'REJECTED' } }),
      prisma.paymentTransaction.findMany({ select: { amount: true, status: true, refundedAmount: true } }),
      prisma.complaint.count({ where: { status: { in: ['NEW', 'UNDER_REVIEW'] } } }),
      prisma.feedback.count()
    ]);

    const gmv = payments
      .filter(p => p.status === 'SUCCESS' || p.status === 'PAID')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalRefunds = payments
      .filter(p => p.status === 'REFUNDED')
      .reduce((sum, p) => sum + (p.refundedAmount || p.amount || 0), 0);

    const platformCommission = Math.round((gmv - totalRefunds) * 0.10); // 10% platform fee
    const ownerNetPayout = Math.round((gmv - totalRefunds) * 0.90);

    res.json({
      users: {
        total: totalUsers,
        farmers,
        owners,
        admins,
        suspended: suspendedUsers,
        pendingVerification: pendingVerification
      },
      equipment: {
        total: totalEquipment,
        available: availableEquipment,
        rented: activeBookings,
        pendingModeration: pendingModeration
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        active: activeBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        rejected: rejectedBookings
      },
      financial: {
        gmv,
        platformRevenue: platformCommission,
        ownerRevenue: ownerNetPayout,
        refunds: totalRefunds
      },
      moderation: {
        openComplaints: complaints,
        totalFeedback: feedbacks
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// 2. Get All Users List
router.get('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, search, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    let where: any = {};
    if (role && role !== 'All') where.role = String(role);
    if (status === 'Active') where.isSuspended = false;
    if (status === 'Inactive' || status === 'Suspended') where.isSuspended = true;

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          isSuspended: true,
          createdAt: true,
          _count: {
            select: { bookings: true, equipments: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      })
    ]);

    res.json({ data: users, total, page: pageNum, limit: limitNum });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 3. User Detail Deep Profile
router.get('/users/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: { include: { equipment: true } },
        equipments: true,
        feedbacks: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// 4. Suspend / Reactivate User
router.put('/users/:id/suspend', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.id);
    const { isSuspended, reason } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: Boolean(isSuspended) }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.prismaUser.id,
        actorRole: 'ADMIN',
        action: isSuspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
        resource: 'User',
        resourceId: userId,
        metadata: JSON.stringify({ reason: reason || 'Admin Action' })
      }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user suspension status' });
  }
});

// 5. Verify / Reject Owner Registration
router.put('/users/:id/verify', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.id);
    const { isVerified } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: Boolean(isVerified) }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.prismaUser.id,
        actorRole: 'ADMIN',
        action: isVerified ? 'VERIFY_OWNER' : 'REJECT_OWNER',
        resource: 'User',
        resourceId: userId
      }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update owner verification' });
  }
});

// 6. Get Equipment for Moderation
router.get('/equipment', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, status } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    let where: any = {};
    if (status === 'Available') where.available = true;
    if (status === 'Disabled') where.available = false;
    
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { owner: { name: { contains: String(search), mode: 'insensitive' } } }
      ];
    }

    const [total, equipment] = await Promise.all([
      prisma.equipment.count({ where }),
      prisma.equipment.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { bookings: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      })
    ]);
    res.json({ data: equipment, total, page: pageNum, limit: limitNum });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment moderation list' });
  }
});

// 7. Equipment Moderation Action
router.put('/equipment/:id/moderation', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipmentId = String(req.params.id);
    const { available, reason } = req.body;

    const updated = await prisma.equipment.update({
      where: { id: equipmentId },
      data: { available: Boolean(available) }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.prismaUser.id,
        actorRole: 'ADMIN',
        action: available ? 'APPROVE_EQUIPMENT' : 'DISABLE_EQUIPMENT',
        resource: 'Equipment',
        resourceId: equipmentId,
        metadata: JSON.stringify({ reason: reason || 'Moderation decision' })
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update equipment moderation' });
  }
});

// 8. Consolidated Feedback & Complaints Feed
router.get('/feedback-complaints', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [feedbacks, complaints, equipmentReviews, userReviews] = await Promise.all([
      prisma.feedback.findMany({ include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.complaint.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.equipmentReview.findMany({ include: { equipment: { select: { title: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.userReview.findMany({ orderBy: { createdAt: 'desc' } })
    ]);

    res.json({
      feedbacks,
      complaints,
      equipmentReviews,
      userReviews
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feedback and complaints center' });
  }
});

// 9. Update Complaint Status / Resolve Action
router.put('/complaints/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const complaintId = String(req.params.id);
    const { status, adminNotes } = req.body;

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: String(status),
        adminNotes: adminNotes || null
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.prismaUser.id,
        actorRole: 'ADMIN',
        action: 'RESOLVE_COMPLAINT',
        resource: 'Complaint',
        resourceId: complaintId,
        metadata: JSON.stringify({ status, adminNotes })
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
});

// 10. Get Audit Logs
router.get('/audit-logs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      })
    ]);
    res.json({ data: logs, total, page: pageNum, limit: limitNum });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// 11. Get Bookings / Revenue Report
router.get('/bookings', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, status } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    let where: any = {};
    if (status && status !== 'All') where.status = String(status);
    
    if (search) {
      where.OR = [
        { id: { contains: String(search), mode: 'insensitive' } },
        { farmer: { name: { contains: String(search), mode: 'insensitive' } } },
        { owner: { name: { contains: String(search), mode: 'insensitive' } } }
      ];
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          equipment: { 
            select: { 
              title: true,
              owner: { select: { name: true, email: true } }
            } 
          },
          farmer: { select: { name: true, email: true } },
          payments: { select: { amount: true, status: true }, take: 1 }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      })
    ]);

    const formattedBookings = bookings.map(b => ({
      id: b.id,
      createdAt: b.createdAt,
      status: b.status,
      equipment: { title: b.equipment?.title },
      owner: b.equipment?.owner,
      farmer: b.farmer,
      payment: b.payments?.[0] || { amount: b.amountPaid, status: b.paymentStatus }
    }));

    res.json({ data: formattedBookings, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('Booking fetch error', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// 12. System Health
router.get('/system-health', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const health = [];
    
    // DB
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      health.push({ service: 'Database', status: 'ONLINE', responseTime: Date.now() - start });
    } catch (e: any) {
      health.push({ service: 'Database', status: 'OFFLINE', error: e.message });
    }

    // AI
    try {
      const start = Date.now();
      const aiResponse = await fetch('http://127.0.0.1:11434/api/tags');
      if (aiResponse.ok) {
        health.push({ service: 'Ollama AI', status: 'ONLINE', responseTime: Date.now() - start });
      } else {
        health.push({ service: 'Ollama AI', status: 'DEGRADED', error: 'Bad status' });
      }
    } catch (e: any) {
      health.push({ service: 'Ollama AI', status: 'OFFLINE', error: 'Not reachable' });
    }

    health.push({ service: 'Backend API', status: 'ONLINE', responseTime: 1 });

    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

// 13. Data Quality
router.get('/data-quality', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const issues: any[] = [];
    
    const [emptyUsers, pendingEquip, unconfirmedBookings] = await Promise.all([
      prisma.user.findMany({ where: { OR: [{ name: '' }, { phone: null }] }, take: 10 }),
      prisma.equipment.findMany({ where: { pricePerDay: { lte: 0 } }, take: 10 }),
      prisma.booking.findMany({ where: { status: 'PENDING', createdAt: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, take: 10 })
    ]);

    emptyUsers.forEach((u: any) => issues.push({ entity: 'User', id: u.id, problem: 'Incomplete Profile (Missing phone or name)', createdAt: u.createdAt, action: 'Request user profile update' }));
    pendingEquip.forEach((e: any) => issues.push({ entity: 'Equipment', id: e.id, problem: 'Zero or Negative Daily Rate', createdAt: e.createdAt, action: 'Disable equipment listing' }));
    unconfirmedBookings.forEach((b: any) => issues.push({ entity: 'Booking', id: b.id, problem: 'Stale Pending Booking (>7 days)', createdAt: b.createdAt, action: 'Auto-expire or cancel booking' }));

    res.json(issues);
  } catch (error: any) {
    console.error('Data Quality Error:', error);
    res.status(500).json({ error: 'Failed to fetch data quality' });
  }
});

export default router;
