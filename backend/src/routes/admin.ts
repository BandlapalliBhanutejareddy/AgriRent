import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { emitToUser } from '../lib/socket';

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
      feedbacks,
      cropGroupsList
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
      prisma.feedback.count(),
      prisma.farmCrop.findMany({ select: { cropName: true }, distinct: ['cropName'] })
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
      cropGroups: {
        total: cropGroupsList.length,
        items: cropGroupsList.map(c => c.cropName)
      },
      totalCropGroups: cropGroupsList.length,
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

    res.json({ success: true, data: users, total, page: pageNum, limit: limitNum });
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
    res.json({ success: true, data: equipment, total, page: pageNum, limit: limitNum });
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
    res.json({ success: true, data: logs, total, page: pageNum, limit: limitNum });
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
        { equipment: { title: { contains: String(search), mode: 'insensitive' } } },
        { equipment: { owner: { name: { contains: String(search), mode: 'insensitive' } } } }
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
      totalPrice: b.totalPrice,
      equipment: { title: b.equipment?.title },
      owner: b.equipment?.owner,
      farmer: b.farmer,
      payment: b.payments?.[0] || { amount: b.amountPaid ?? b.totalPrice, status: b.paymentStatus }
    }));

    res.json({ success: true, data: formattedBookings, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('Booking fetch error', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// 11b. Get Payments List for Admin
router.get('/payments', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, status } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    let where: any = {};
    if (status && status !== 'All') where.status = String(status);

    const [total, payments] = await Promise.all([
      prisma.paymentTransaction.count({ where }),
      prisma.paymentTransaction.findMany({
        where,
        include: {
          booking: {
            include: {
              farmer: { select: { id: true, name: true, email: true } },
              equipment: {
                include: {
                  owner: { select: { id: true, name: true, email: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      })
    ]);

    const formattedPayments = payments.map(p => ({
      id: p.id,
      transactionRef: p.transactionRef,
      bookingId: p.bookingId,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      status: p.status,
      createdAt: p.createdAt,
      farmerName: p.booking?.farmer?.name || 'Farmer',
      ownerName: p.booking?.equipment?.owner?.name || 'Owner',
      equipmentTitle: p.booking?.equipment?.title || 'Equipment'
    }));

    res.json({ success: true, data: formattedPayments, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('Admin Payments Error:', error);
    res.status(500).json({ error: 'Failed to fetch admin payments' });
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

// 12b. System Health Interactive Diagnostic Endpoints
router.post('/system-health/test-db', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    res.json({
      success: true,
      service: 'Database',
      status: 'ONLINE',
      latencyMs,
      timestamp: new Date().toISOString(),
      message: `Database ping successful (${latencyMs}ms). PostgreSQL connection is healthy.`
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      service: 'Database',
      status: 'OFFLINE',
      error: err.message || 'Database query failed.',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/system-health/test-ai', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const start = Date.now();
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const aiRes = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;
    if (aiRes.ok) {
      const data: any = await aiRes.json();
      const models = Array.isArray(data.models) ? data.models.map((m: any) => m.name) : [];
      res.json({
        success: true,
        service: 'Ollama AI',
        status: 'ONLINE',
        latencyMs,
        models,
        message: `Ollama AI connected (${latencyMs}ms). Active models: ${models.join(', ') || 'None loaded'}.`
      });
    } else {
      res.json({
        success: false,
        service: 'Ollama AI',
        status: 'DEGRADED',
        latencyMs,
        error: `Ollama returned HTTP ${aiRes.status}`,
        message: 'Ollama is responding but returned a non-OK status.'
      });
    }
  } catch (err: any) {
    res.json({
      success: false,
      service: 'Ollama AI',
      status: 'OFFLINE',
      error: 'Ollama host not reachable on local or remote endpoint.',
      message: 'AI advisor service is currently offline. AgroRent falls back to agronomic knowledge base.'
    });
  }
});

router.post('/system-health/test-api', async (req: AuthRequest, res: Response): Promise<void> => {
  const memory = process.memoryUsage();
  res.json({
    success: true,
    service: 'Backend API',
    status: 'ONLINE',
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    memoryUsageMb: {
      rss: (memory.rss / (1024 * 1024)).toFixed(1),
      heapUsed: (memory.heapUsed / (1024 * 1024)).toFixed(1),
      heapTotal: (memory.heapTotal / (1024 * 1024)).toFixed(1)
    },
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    message: 'Backend API is fully operational and responsive.'
  });
});

// 13. Equipment Trend Analytics (7d, 30d, 90d, all)
router.get('/equipment-analytics', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { period = '30d' } = req.query;
    let startDate: Date | null = null;
    const now = new Date();

    if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const bookingWhere: any = {};
    if (startDate) {
      bookingWhere.createdAt = { gte: startDate };
    }

    const [allEquipments, bookings, payments] = await Promise.all([
      prisma.equipment.findMany({
        include: {
          owner: { select: { id: true, name: true, email: true } },
          bookings: {
            where: bookingWhere,
            select: { id: true, status: true, totalPrice: true, createdAt: true, startDate: true, endDate: true }
          }
        }
      }),
      prisma.booking.findMany({
        where: bookingWhere,
        include: {
          equipment: { select: { id: true, title: true, category: true } }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.paymentTransaction.findMany({
        where: startDate ? { createdAt: { gte: startDate } } : {},
        select: { amount: true, status: true, createdAt: true }
      })
    ]);

    // 1. Most frequently rented & highest value equipment
    const equipmentRankings = allEquipments.map(eq => {
      const completedBookings = eq.bookings.filter(b => b.status === 'COMPLETED');
      const grossRevenue = completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const totalRequests = eq.bookings.length;
      const activeOrCompleted = eq.bookings.filter(b => b.status === 'ACTIVE' || b.status === 'COMPLETED').length;

      // Approximate utilization: total rental days in period / period days
      const daysInPeriod = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      let totalDaysRented = 0;
      for (const b of eq.bookings.filter(b => b.status === 'COMPLETED' || b.status === 'ACTIVE')) {
        if (b.startDate && b.endDate) {
          const diff = Math.max(1, Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)));
          totalDaysRented += diff;
        }
      }
      const utilizationRate = Math.min(100, Math.round((totalDaysRented / daysInPeriod) * 100));

      return {
        id: eq.id,
        title: eq.title,
        category: eq.category,
        pricePerDay: eq.pricePerDay,
        available: eq.available,
        ownerName: eq.owner?.name || 'Owner',
        ownerEmail: eq.owner?.email || '',
        totalRequests,
        completedRentals: completedBookings.length,
        grossRevenue,
        utilizationRate,
        isZeroUtilization: totalRequests === 0
      };
    });

    equipmentRankings.sort((a, b) => b.completedRentals - a.completedRentals || b.grossRevenue - a.grossRevenue);

    // 2. Category Performance
    const categoryMap: { [cat: string]: { count: number; bookings: number; revenue: number } } = {};
    for (const eq of allEquipments) {
      const cat = eq.category || 'Other';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, bookings: 0, revenue: 0 };
      categoryMap[cat].count++;
      categoryMap[cat].bookings += eq.bookings.length;
      categoryMap[cat].revenue += eq.bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    }

    const categoryPerformance = Object.entries(categoryMap).map(([category, stats]) => ({
      category,
      ...stats
    }));

    // 3. Booking Demand Over Time (grouped by day)
    const demandTrendMap: { [dateStr: string]: { requests: number; completed: number; revenue: number } } = {};
    for (const b of bookings) {
      const dateKey = new Date(b.createdAt).toISOString().split('T')[0];
      if (!demandTrendMap[dateKey]) demandTrendMap[dateKey] = { requests: 0, completed: 0, revenue: 0 };
      demandTrendMap[dateKey].requests++;
      if (b.status === 'COMPLETED') {
        demandTrendMap[dateKey].completed++;
        demandTrendMap[dateKey].revenue += b.totalPrice || 0;
      }
    }

    const demandTrend = Object.entries(demandTrendMap).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      period,
      topRented: equipmentRankings.slice(0, 10),
      highestRevenue: [...equipmentRankings].sort((a, b) => b.grossRevenue - a.grossRevenue).slice(0, 10),
      zeroUtilization: equipmentRankings.filter(e => e.isZeroUtilization).slice(0, 10),
      categoryPerformance,
      demandTrend,
      summary: {
        totalEquipmentCount: allEquipments.length,
        availableCount: allEquipments.filter(e => e.available).length,
        utilizedCount: equipmentRankings.filter(e => !e.isZeroUtilization).length,
        totalCompletedRevenue: equipmentRankings.reduce((sum, e) => sum + e.grossRevenue, 0)
      }
    });
  } catch (error: any) {
    console.error('Equipment Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch equipment analytics' });
  }
});

// 14. Best Owner Earnings Ranking (Completed & Paid Transactions)
router.get('/owner-earnings', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { period = '30d' } = req.query;
    let startDate: Date | null = null;
    const now = new Date();

    if (period === '7d') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (period === '30d') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    else if (period === '90d') startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const bookingWhere: any = {};
    if (startDate) bookingWhere.createdAt = { gte: startDate };

    const owners = await prisma.user.findMany({
      where: { role: { in: ['OWNER', 'BOTH'] } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        equipments: {
          select: {
            id: true,
            title: true,
            bookings: {
              where: bookingWhere,
              include: {
                payments: { select: { amount: true, status: true } }
              }
            }
          }
        }
      }
    });

    const rankings = owners.map(owner => {
      let totalCompletedRentals = 0;
      let grossCompletedRentalValue = 0;
      let actualCollectedAmount = 0;

      for (const eq of owner.equipments) {
        for (const b of eq.bookings) {
          if (b.status === 'COMPLETED') {
            totalCompletedRentals++;
            grossCompletedRentalValue += b.totalPrice || 0;
          }
          // Sum successfully paid transactions
          const paidTransactions = b.payments.filter(p => p.status === 'PAID' || p.status === 'SUCCESS');
          for (const p of paidTransactions) {
            actualCollectedAmount += p.amount || 0;
          }
        }
      }

      // Business financial model: 10% platform commission, 90% owner net earnings
      const platformFee = Math.round(actualCollectedAmount * 0.10);
      const ownerNetEarnings = actualCollectedAmount - platformFee;
      // Outstanding payable is difference between completed rental value and actual collected
      const outstandingPayable = Math.max(0, grossCompletedRentalValue - actualCollectedAmount);

      return {
        ownerId: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        equipmentCount: owner.equipments.length,
        completedRentals: totalCompletedRentals,
        grossCompletedRentalValue,
        actualCollectedAmount,
        platformFee,
        ownerNetEarnings,
        outstandingPayable
      };
    });

    // Sort by confirmed collected earnings descending
    rankings.sort((a, b) => b.ownerNetEarnings - a.ownerNetEarnings || b.completedRentals - a.completedRentals);

    res.json({
      period,
      rankings,
      totals: {
        totalGrossRentalValue: rankings.reduce((sum, r) => sum + r.grossCompletedRentalValue, 0),
        totalCollectedAmount: rankings.reduce((sum, r) => sum + r.actualCollectedAmount, 0),
        totalPlatformFee: rankings.reduce((sum, r) => sum + r.platformFee, 0),
        totalOwnerNetEarnings: rankings.reduce((sum, r) => sum + r.ownerNetEarnings, 0),
        totalOutstandingPayable: rankings.reduce((sum, r) => sum + r.outstandingPayable, 0)
      }
    });
  } catch (error: any) {
    console.error('Owner Earnings Error:', error);
    res.status(500).json({ error: 'Failed to fetch owner earnings' });
  }
});

// 15. Crop Performance Analytics (Data-Driven from Farming Guides & Equipment)
router.get('/crop-analytics', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [guides, techniques, allBookings, farmCrops] = await Promise.all([
      prisma.farmingGuide.findMany(),
      prisma.modernTechnique.findMany(),
      prisma.booking.findMany({
        include: { equipment: { select: { title: true, category: true } } }
      }),
      prisma.farmCrop.findMany()
    ]);

    // Aggregate crop demand from farm crop plantings, farming guides, and modern techniques
    const cropCounts: { [crop: string]: { guideCount: number; techniqueCount: number; farmCount: number } } = {};
    for (const g of guides) {
      const name = g.cropName || 'General';
      if (!cropCounts[name]) cropCounts[name] = { guideCount: 0, techniqueCount: 0, farmCount: 0 };
      cropCounts[name].guideCount++;
    }
    for (const t of techniques) {
      const name = t.relatedCrop || 'General';
      if (!cropCounts[name]) cropCounts[name] = { guideCount: 0, techniqueCount: 0, farmCount: 0 };
      cropCounts[name].techniqueCount++;
    }
    for (const fc of farmCrops) {
      const name = fc.cropName || 'General';
      if (!cropCounts[name]) cropCounts[name] = { guideCount: 0, techniqueCount: 0, farmCount: 0 };
      cropCounts[name].farmCount++;
    }

    const cropList = Object.entries(cropCounts).map(([crop, counts]) => ({
      crop,
      totalActivity: counts.guideCount + counts.techniqueCount + counts.farmCount,
      ...counts
    })).sort((a, b) => b.totalActivity - a.totalActivity);

    res.json({
      crops: cropList,
      totalTrackedCrops: cropList.length,
      note: 'Metrics reflect actual crop guides, modern farming techniques, and active farm crop plantings.'
    });
  } catch (error: any) {
    console.error('Crop Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch crop analytics' });
  }
});

// 16. Enhanced Data Quality Diagnostics (Actionable & Grouped)
router.get('/data-quality', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const issues: any[] = [];

    const [incompleteUsers, invalidPriceEquip, staleBookings, ownersWithoutBank] = await Promise.all([
      // 1. Missing required profile fields
      prisma.user.findMany({
        where: {
          OR: [
            { name: '' },
            { phone: null },
            { phone: '' }
          ]
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      }),
      // 2. Equipment with invalid or zero price
      prisma.equipment.findMany({
        where: { pricePerDay: { lte: 0 } },
        include: { owner: { select: { id: true, name: true, email: true } } }
      }),
      // 3. Stale pending bookings (>7 days without owner response)
      prisma.booking.findMany({
        where: {
          status: 'PENDING',
          createdAt: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        include: {
          farmer: { select: { id: true, name: true, email: true } },
          equipment: { include: { owner: { select: { id: true, name: true, email: true } } } }
        }
      }),
      // 4. Owners with equipment but missing bank/payout details
      prisma.user.findMany({
        where: {
          role: { in: ['OWNER', 'BOTH'] },
          equipments: { some: {} }
        },
        select: { id: true, name: true, email: true, createdAt: true }
      })
    ]);

    // Check bank audit logs for owners
    const bankAuditLogs = await prisma.auditLog.findMany({
      where: { action: 'UPDATE_BANK_DETAILS' },
      select: { actorId: true },
      distinct: ['actorId']
    });
    const ownersWithBankSet = new Set(bankAuditLogs.map(l => l.actorId));

    // Compile actionable issues
    incompleteUsers.forEach(u => {
      issues.push({
        id: `user-inc-${u.id}`,
        entity: 'User',
        recordId: u.id,
        problem: `Incomplete Profile: missing ${!u.name ? 'full name' : 'phone number'}.`,
        severity: 'MEDIUM',
        targetUserId: u.id,
        targetUserName: u.name || 'User',
        targetEmail: u.email,
        recommendedAction: 'Notify user to complete contact phone and profile details.',
        actionable: true,
        createdAt: u.createdAt
      });
    });

    invalidPriceEquip.forEach(e => {
      issues.push({
        id: `equip-rate-${e.id}`,
        entity: 'Equipment',
        recordId: e.id,
        problem: `Invalid Pricing: ${e.title} has rate ₹${e.pricePerDay}/day.`,
        severity: 'HIGH',
        targetUserId: e.owner?.id,
        targetUserName: e.owner?.name || 'Owner',
        targetEmail: e.owner?.email || '',
        recommendedAction: 'Notify owner to set a valid daily rental rate.',
        actionable: true,
        createdAt: e.createdAt
      });
    });

    staleBookings.forEach(b => {
      issues.push({
        id: `book-stale-${b.id}`,
        entity: 'Booking',
        recordId: b.id,
        problem: `Stale Booking Request: pending for over 7 days for ${b.equipment?.title || 'Machinery'}.`,
        severity: 'HIGH',
        targetUserId: b.equipment?.owner?.id || b.farmer?.id,
        targetUserName: b.equipment?.owner?.name || 'Owner',
        targetEmail: b.equipment?.owner?.email || '',
        recommendedAction: 'Send alert to owner to accept or reject pending booking.',
        actionable: true,
        createdAt: b.createdAt
      });
    });

    ownersWithoutBank.filter(o => !ownersWithBankSet.has(o.id)).forEach(o => {
      issues.push({
        id: `owner-bank-${o.id}`,
        entity: 'Owner',
        recordId: o.id,
        problem: `Missing Payout Details: active equipment owner has not registered bank account.`,
        severity: 'MEDIUM',
        targetUserId: o.id,
        targetUserName: o.name,
        targetEmail: o.email,
        recommendedAction: 'Notify owner to configure bank account and IFSC code for rental payouts.',
        actionable: true,
        createdAt: o.createdAt
      });
    });

    res.json(issues);
  } catch (error: any) {
    console.error('Data Quality Diagnostics Error:', error);
    res.status(500).json({ error: 'Failed to fetch data quality diagnostics' });
  }
});

// 17. Send Admin Alert / Notification or Broadcast
router.post('/alerts/send', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, targetRole, title, message, relatedId, type = 'ADMIN_ALERT' } = req.body;

    if (!title || !String(title).trim() || !message || !String(message).trim()) {
      res.status(400).json({ success: false, error: 'Headline title and message body are required.' });
      return;
    }

    const cleanTitle = String(title).trim();
    const cleanMsg = String(message).trim();

    // Broadcast Mode
    if (targetRole || userId === 'ALL' || (!userId && targetRole)) {
      const roleFilter = (targetRole || 'ALL').toUpperCase().trim();
      let whereClause: any = { isSuspended: false };

      if (roleFilter === 'FARMER') {
        whereClause.role = { in: ['FARMER', 'BOTH'] };
      } else if (roleFilter === 'OWNER') {
        whereClause.role = { in: ['OWNER', 'BOTH'] };
      } else if (roleFilter === 'ADMIN') {
        whereClause.role = 'ADMIN';
      }

      const matchingUsers = await prisma.user.findMany({
        where: whereClause,
        select: { id: true, name: true, email: true }
      });

      if (matchingUsers.length === 0) {
        res.status(400).json({
          success: false,
          error: `No active users found for audience filter "${roleFilter}".`
        });
        return;
      }

      await prisma.notification.createMany({
        data: matchingUsers.map(u => ({
          userId: u.id,
          title: cleanTitle,
          message: cleanMsg,
          relatedId: relatedId ? String(relatedId) : null,
          type: String(type)
        }))
      });

      // Realtime in-app socket push to active connections
      for (const u of matchingUsers) {
        emitToUser(u.id, 'notification', {
          title: cleanTitle,
          message: cleanMsg,
          type: String(type),
          createdAt: new Date()
        });
      }

      await prisma.auditLog.create({
        data: {
          actorId: req.prismaUser.id,
          actorRole: 'ADMIN',
          action: 'DISPATCH_BROADCAST_ALERT',
          resource: 'Notification',
          metadata: JSON.stringify({
            audience: roleFilter,
            recipientCount: matchingUsers.length,
            title: cleanTitle
          })
        }
      });

      res.json({
        success: true,
        message: `Broadcast alert dispatched to ${matchingUsers.length} ${roleFilter === 'ALL' ? 'users' : roleFilter.toLowerCase() + 's'} successfully.`,
        deliveredCount: matchingUsers.length
      });
      return;
    }

    // Single User Mode
    if (!userId) {
      res.status(400).json({ success: false, error: 'User ID or target audience role is required.' });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true, name: true, email: true }
    });

    if (!targetUser) {
      res.status(404).json({ success: false, error: 'Target user record not found.' });
      return;
    }

    const newNotif = await prisma.notification.create({
      data: {
        userId: targetUser.id,
        title: cleanTitle,
        message: cleanMsg,
        relatedId: relatedId ? String(relatedId) : null,
        type: String(type)
      }
    });

    emitToUser(targetUser.id, 'notification', newNotif);

    await prisma.auditLog.create({
      data: {
        actorId: req.prismaUser.id,
        actorRole: 'ADMIN',
        action: 'SEND_ADMIN_ALERT',
        resource: 'Notification',
        resourceId: newNotif.id,
        metadata: JSON.stringify({
          recipientId: targetUser.id,
          recipientEmail: targetUser.email,
          title: cleanTitle
        })
      }
    });

    res.json({
      success: true,
      message: `Alert sent to ${targetUser.name} (${targetUser.email}) successfully.`,
      notification: newNotif
    });
  } catch (error: any) {
    console.error('Send Admin Alert Error:', error);
    res.status(500).json({ success: false, error: 'Failed to dispatch administrative alert.' });
  }
});

// Alias for broadcast
router.post('/alerts/broadcast', async (req: AuthRequest, res: Response): Promise<void> => {
  req.body.targetRole = req.body.targetRole || req.body.target || 'ALL';
  // Forward to /alerts/send handler logic
  const { targetRole, title, message, relatedId, type = 'BROADCAST_ALERT' } = req.body;
  if (!title || !String(title).trim() || !message || !String(message).trim()) {
    res.status(400).json({ success: false, error: 'Headline title and message body are required.' });
    return;
  }
  const cleanTitle = String(title).trim();
  const cleanMsg = String(message).trim();
  const roleFilter = (targetRole || 'ALL').toUpperCase().trim();
  let whereClause: any = { isSuspended: false };

  if (roleFilter === 'FARMER') {
    whereClause.role = { in: ['FARMER', 'BOTH'] };
  } else if (roleFilter === 'OWNER') {
    whereClause.role = { in: ['OWNER', 'BOTH'] };
  } else if (roleFilter === 'ADMIN') {
    whereClause.role = 'ADMIN';
  }

  const matchingUsers = await prisma.user.findMany({
    where: whereClause,
    select: { id: true, name: true, email: true }
  });

  if (matchingUsers.length === 0) {
    res.status(400).json({
      success: false,
      error: `No active users found for audience filter "${roleFilter}".`
    });
    return;
  }

  await prisma.notification.createMany({
    data: matchingUsers.map(u => ({
      userId: u.id,
      title: cleanTitle,
      message: cleanMsg,
      relatedId: relatedId ? String(relatedId) : null,
      type: String(type)
    }))
  });

  for (const u of matchingUsers) {
    emitToUser(u.id, 'notification', {
      title: cleanTitle,
      message: cleanMsg,
      type: String(type),
      createdAt: new Date()
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: req.prismaUser.id,
      actorRole: 'ADMIN',
      action: 'DISPATCH_BROADCAST_ALERT',
      resource: 'Notification',
      metadata: JSON.stringify({
        audience: roleFilter,
        recipientCount: matchingUsers.length,
        title: cleanTitle
      })
    }
  });

  res.json({
    success: true,
    message: `Broadcast alert dispatched to ${matchingUsers.length} ${roleFilter === 'ALL' ? 'users' : roleFilter.toLowerCase() + 's'} successfully.`,
    deliveredCount: matchingUsers.length
  });
});

// Additional alias for direct broadcast
router.post('/broadcast', async (req: AuthRequest, res: Response): Promise<void> => {
  req.body.targetRole = req.body.targetRole || req.body.target || 'ALL';
  const { targetRole, title, message, relatedId, type = 'BROADCAST_ALERT' } = req.body;
  if (!title || !String(title).trim() || !message || !String(message).trim()) {
    res.status(400).json({ success: false, error: 'Headline title and message body are required.' });
    return;
  }
  const cleanTitle = String(title).trim();
  const cleanMsg = String(message).trim();
  const roleFilter = (targetRole || 'ALL').toUpperCase().trim();
  let whereClause: any = { isSuspended: false };

  if (roleFilter === 'FARMER') {
    whereClause.role = { in: ['FARMER', 'BOTH'] };
  } else if (roleFilter === 'OWNER') {
    whereClause.role = { in: ['OWNER', 'BOTH'] };
  } else if (roleFilter === 'ADMIN') {
    whereClause.role = 'ADMIN';
  }

  const matchingUsers = await prisma.user.findMany({
    where: whereClause,
    select: { id: true, name: true, email: true }
  });

  if (matchingUsers.length === 0) {
    res.status(400).json({
      success: false,
      error: `No active users found for audience filter "${roleFilter}".`
    });
    return;
  }

  await prisma.notification.createMany({
    data: matchingUsers.map(u => ({
      userId: u.id,
      title: cleanTitle,
      message: cleanMsg,
      relatedId: relatedId ? String(relatedId) : null,
      type: String(type)
    }))
  });

  for (const u of matchingUsers) {
    emitToUser(u.id, 'notification', {
      title: cleanTitle,
      message: cleanMsg,
      type: String(type),
      createdAt: new Date()
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: req.prismaUser.id,
      actorRole: 'ADMIN',
      action: 'DISPATCH_BROADCAST_ALERT',
      resource: 'Notification',
      metadata: JSON.stringify({
        audience: roleFilter,
        recipientCount: matchingUsers.length,
        title: cleanTitle
      })
    }
  });

  res.json({
    success: true,
    message: `Broadcast alert dispatched to ${matchingUsers.length} ${roleFilter === 'ALL' ? 'users' : roleFilter.toLowerCase() + 's'} successfully.`,
    deliveredCount: matchingUsers.length
  });
});

export default router;
