import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';

const router = Router();

// Define standard revenue-generating statuses globally for the file
const REVENUE_GENERATING_STATUSES = ['COMPLETED', 'ACTIVE', 'RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'ACCEPTED'];

// Owner Analytics
router.get('/owner', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = String(req.prismaUser.id);

    // Cross-tenant access guard: client must never supply a different ownerId
    if (req.query.ownerId && String(req.query.ownerId) !== ownerId) {
      res.status(403).json({ error: 'Forbidden: Cross-owner analytics access is strictly prohibited' });
      return;
    }

    // Validate period query parameter
    const allowedPeriods = ['7d', '30d', '90d', 'this_month', 'last_month', '1y', 'all'];
    const rawPeriod = req.query.period ? String(req.query.period).toLowerCase().trim() : undefined;
    if (rawPeriod && !allowedPeriods.includes(rawPeriod)) {
      res.status(400).json({ error: `Invalid period '${rawPeriod}'. Supported periods: ${allowedPeriods.join(', ')}` });
      return;
    }

    // Validate optional date range query parameters
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (req.query.startDate) {
      const d = new Date(String(req.query.startDate));
      if (isNaN(d.getTime())) {
        res.status(400).json({ error: 'Invalid startDate format. Use ISO-8601 (e.g. YYYY-MM-DD)' });
        return;
      }
      startDate = d;
    }

    if (req.query.endDate) {
      const d = new Date(String(req.query.endDate));
      if (isNaN(d.getTime())) {
        res.status(400).json({ error: 'Invalid endDate format. Use ISO-8601 (e.g. YYYY-MM-DD)' });
        return;
      }
      endDate = d;
    }

    if (startDate && endDate && startDate > endDate) {
      res.status(400).json({ error: 'startDate cannot be after endDate' });
      return;
    }

    // Determine evaluation window based on period if explicit dates were not passed
    const now = new Date();
    if (!startDate && !endDate && rawPeriod && rawPeriod !== 'all') {
      if (rawPeriod === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
      } else if (rawPeriod === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
      } else if (rawPeriod === '90d') {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        endDate = now;
      } else if (rawPeriod === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
      } else if (rawPeriod === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      } else if (rawPeriod === '1y') {
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        endDate = now;
      }
    }

    // 1. Fetch Owner's Equipment Fleet with reviews
    const equipmentList = await prisma.equipment.findMany({
      where: { ownerId },
      include: {
        reviews: {
          select: { rating: true, createdAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch All Bookings for Owner's Equipment
    const allBookings = await prisma.booking.findMany({
      where: {
        equipment: { ownerId }
      },
      include: {
        equipment: true,
        payments: true,
        returnInspection: true,
        farmer: {
          select: { id: true, name: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Fetch Ratings: Farmer ratings for Owner and general equipment feedback
    const userReviews = await prisma.userReview.findMany({
      where: {
        revieweeId: ownerId,
        role: 'FARMER_RATING_OWNER'
      },
      select: { rating: true }
    });

    const ownerFeedback = await prisma.feedback.findMany({
      where: {
        category: 'Equipment',
        subject: { in: equipmentList.map(e => e.id) }
      },
      select: { rating: true }
    });

    // Filter bookings by date range if specified
    const periodBookings = (startDate || endDate)
      ? allBookings.filter(b => {
          const d = new Date(b.createdAt);
          if (startDate && d < startDate) return false;
          if (endDate && d > endDate) return false;
          return true;
        })
      : allBookings;

    // 4. Booking Status Breakdown
    const ALL_STATUSES = [
      'PENDING', 'ACCEPTED', 'CONFIRMED', 'DISPATCHED', 'OUT_FOR_DELIVERY',
      'IN_TRANSIT', 'DELIVERED', 'ACTIVE', 'RETURN_PENDING', 'RETURN_IN_PROGRESS',
      'RETURNED', 'INSPECTION_PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED'
    ];
    const bookingStatusBreakdown: Record<string, number> = {};
    for (const st of ALL_STATUSES) {
      bookingStatusBreakdown[st] = 0;
    }
    for (const b of periodBookings) {
      const st = b.status.toUpperCase();
      bookingStatusBreakdown[st] = (bookingStatusBreakdown[st] || 0) + 1;
    }

    const totalBookings = periodBookings.length;
    const pendingBookings = bookingStatusBreakdown['PENDING'] || 0;
    const activeRentals = ['ACCEPTED', 'CONFIRMED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE']
      .reduce((sum, s) => sum + (bookingStatusBreakdown[s] || 0), 0);
    const completedBookings = bookingStatusBreakdown['COMPLETED'] || 0;
    const returnPendingBookings = ['RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING']
      .reduce((sum, s) => sum + (bookingStatusBreakdown[s] || 0), 0);
    const cancelledBookings = (bookingStatusBreakdown['CANCELLED'] || 0) + (bookingStatusBreakdown['REJECTED'] || 0);

    // 5. Financial Metrics Integrity
    // Gross Booking Value: Sum of contracted totalPrice for non-cancelled and non-rejected bookings
    const validContracts = periodBookings.filter(b => b.status !== 'CANCELLED' && b.status !== 'REJECTED');
    const grossBookingValue = validContracts.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Completed Revenue: Strictly COMPLETED bookings
    const completedContracts = periodBookings.filter(b => b.status === 'COMPLETED');
    const completedRevenue = completedContracts.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Verified Payments Collected: Inbound platform payments collected via successful transactions or recorded amountPaid
    // Note: Reflects platform payment collections; does not establish confirmation of funds deposited into owner's personal bank account.
    let realizedEarnings = 0;
    for (const b of validContracts) {
      const successfulPayments = (b.payments || []).filter((p: any) =>
        p.status === 'SUCCESS' || p.status === 'PAID' || p.status === 'COMPLETED'
      );
      if (successfulPayments.length > 0) {
        const paidTxSum = successfulPayments.reduce((sum: number, p: any) => sum + (p.amount || 0) - (p.refundedAmount || 0), 0);
        realizedEarnings += Math.max(0, paidTxSum);
      } else if (b.amountPaid != null && b.amountPaid > 0) {
        realizedEarnings += b.amountPaid;
      } else if (b.paymentStatus === 'PAID') {
        realizedEarnings += (b.totalPrice || 0);
      }
    }

    // Uncollected Booking Balance: Outstanding contract balance on valid bookings (totalPrice - amountPaid)
    // Note: Represents outstanding booking balance awaiting farmer payment; not a scheduled owner payout or bank transfer.
    const pendingPayout = validContracts.reduce((sum, b) => {
      if (b.paymentStatus === 'PAID') return sum;
      const remaining = Math.max(0, (b.totalPrice || 0) - (b.amountPaid || 0));
      return sum + remaining;
    }, 0);

    // Security Deposits Held: Held in escrow for active rentals, refundable on return inspection subject to applicable damage deductions (isolated from owner revenue)
    const activeRentalStatuses = ['ACCEPTED', 'CONFIRMED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE', 'RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING'];
    const securityDepositsHeld = periodBookings
      .filter(b => activeRentalStatuses.includes(b.status))
      .reduce((sum, b) => sum + (b.securityDeposit || 0), 0);

    // Inspection Deductions Retained: Damage/cleaning deductions retained by owner from return inspections
    const inspectionDeductions = periodBookings
      .filter(b => b.returnInspection && b.returnInspection.deductionAmount > 0)
      .reduce((sum, b) => sum + (b.returnInspection!.deductionAmount || 0), 0);

    // Legacy calculation for totalRevenue and pendingValue
    const validPaidBookings = periodBookings.filter(b => REVENUE_GENERATING_STATUSES.includes(b.status));
    const totalRevenue = validPaidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const pendingValue = periodBookings.filter(b => b.status === 'PENDING').reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // 6. Defensible Equipment Utilization Calculation
    const utilStart = startDate || (rawPeriod === '7d' ? new Date(now.getTime() - 7 * 86400000) : new Date(now.getTime() - 30 * 86400000));
    const utilEnd = endDate || now;
    const windowMs = Math.max(86400000, utilEnd.getTime() - utilStart.getTime());
    const windowDays = Math.max(1, Math.round(windowMs / 86400000));

    let totalFleetRentedDays = 0;
    let totalFleetAvailableDays = 0;

    const equipmentPerformanceList = equipmentList.map(eq => {
      const eqBookings = periodBookings.filter(b => b.equipmentId === eq.id || b.equipment?.id === eq.id);
      const totalEqBookings = eqBookings.length;
      const activeEqBookings = eqBookings.filter(b => ['ACTIVE', 'ACCEPTED', 'CONFIRMED', 'DISPATCHED'].includes(b.status)).length;
      const completedEqBookings = eqBookings.filter(b => b.status === 'COMPLETED').length;
      const eqGrossRevenue = eqBookings.filter(b => REVENUE_GENERATING_STATUSES.includes(b.status)).reduce((s, b) => s + (b.totalPrice || 0), 0);

      // Calculate days rented in window from authoritative startDate and endDate
      let eqRentedDays = 0;
      for (const b of eqBookings) {
        if (['CANCELLED', 'REJECTED', 'PENDING'].includes(b.status)) continue;
        const bStart = new Date(b.startDate).getTime();
        const bEnd = new Date(b.endDate).getTime();
        const oStart = Math.max(bStart, utilStart.getTime());
        const oEnd = Math.min(bEnd, utilEnd.getTime());
        if (oEnd > oStart) {
          const days = Math.max(1, Math.round((oEnd - oStart) / 86400000));
          eqRentedDays += days;
        }
      }

      const eqCreatedTime = new Date(eq.createdAt).getTime();
      const availableFrom = Math.max(utilStart.getTime(), eqCreatedTime);
      const eqAvailableDays = Math.max(1, Math.min(windowDays, Math.round((utilEnd.getTime() - availableFrom) / 86400000)));
      const eqUtilizationRate = Math.min(100, Math.round((eqRentedDays / eqAvailableDays) * 100));

      totalFleetRentedDays += eqRentedDays;
      totalFleetAvailableDays += eqAvailableDays;

      const eqRatings = eq.reviews?.map((r: any) => r.rating) || [];
      const eqAvgRating = eqRatings.length > 0
        ? Number((eqRatings.reduce((a: number, b: number) => a + b, 0) / eqRatings.length).toFixed(1))
        : 0;

      return {
        id: eq.id,
        title: eq.title,
        category: eq.category,
        imageUrl: eq.imageUrl,
        pricePerDay: eq.pricePerDay,
        available: eq.available,
        totalBookings: totalEqBookings,
        activeBookings: activeEqBookings,
        completedBookings: completedEqBookings,
        grossRevenue: eqGrossRevenue,
        daysRented: eqRentedDays,
        utilizationRate: eqUtilizationRate,
        averageRating: eqAvgRating,
        reviewCount: eqRatings.length
      };
    });

    const fleetUtilizationRate = totalFleetAvailableDays > 0
      ? Math.min(100, Math.round((totalFleetRentedDays / totalFleetAvailableDays) * 100))
      : 0;

    // 7. Booking & Revenue Trends
    const trendBuckets: { date: string; label: string; bookings: number; revenue: number; completedCount: number }[] = [];
    if (rawPeriod === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
        const dayBookings = allBookings.filter(b => new Date(b.createdAt).toISOString().split('T')[0] === dStr);
        const rev = dayBookings.filter(b => REVENUE_GENERATING_STATUSES.includes(b.status)).reduce((s, b) => s + (b.totalPrice || 0), 0);
        const comp = dayBookings.filter(b => b.status === 'COMPLETED').length;
        trendBuckets.push({ date: dStr, label, bookings: dayBookings.length, revenue: rev, completedCount: comp });
      }
    } else if (rawPeriod === '30d' || rawPeriod === 'this_month') {
      const daysCount = rawPeriod === '30d' ? 30 : now.getDate();
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        const dayBookings = allBookings.filter(b => new Date(b.createdAt).toISOString().split('T')[0] === dStr);
        const rev = dayBookings.filter(b => REVENUE_GENERATING_STATUSES.includes(b.status)).reduce((s, b) => s + (b.totalPrice || 0), 0);
        const comp = dayBookings.filter(b => b.status === 'COMPLETED').length;
        trendBuckets.push({ date: dStr, label, bookings: dayBookings.length, revenue: rev, completedCount: comp });
      }
    } else {
      // 6 Monthly Buckets
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yr = d.getFullYear();
        const mIdx = d.getMonth();
        const label = d.toLocaleString('default', { month: 'short' });
        const mBookings = allBookings.filter(b => {
          const bd = new Date(b.createdAt);
          return bd.getFullYear() === yr && bd.getMonth() === mIdx;
        });
        const rev = mBookings.filter(b => REVENUE_GENERATING_STATUSES.includes(b.status)).reduce((s, b) => s + (b.totalPrice || 0), 0);
        const comp = mBookings.filter(b => b.status === 'COMPLETED').length;
        trendBuckets.push({
          date: `${yr}-${String(mIdx + 1).padStart(2, '0')}-01`,
          label,
          bookings: mBookings.length,
          revenue: rev,
          completedCount: comp
        });
      }
    }

    // Top Equipment (sorted by revenue descending)
    const topEquipment = equipmentPerformanceList
      .slice()
      .sort((a, b) => b.grossRevenue - a.grossRevenue)
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        title: e.title,
        bookings: e.totalBookings,
        revenue: e.grossRevenue,
        category: e.category,
        utilizationRate: e.utilizationRate,
        averageRating: e.averageRating
      }));

    // Average Rating across all reviews
    const allRatings = [
      ...userReviews.map(r => r.rating),
      ...equipmentList.flatMap(e => e.reviews?.map((r: any) => r.rating) || []),
      ...ownerFeedback.map(f => f.rating)
    ];
    const avgRating = allRatings.length > 0
      ? Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1))
      : 0;

    res.json({
      // Backward Compatible Fields
      totalRevenue: totalRevenue || 0,
      completedRevenue: completedRevenue || 0,
      totalBookings,
      pendingBookings,
      completedBookings,
      activeRentals,
      pendingValue,
      averageRating: avgRating,
      topEquipment,
      monthlyRevenue: trendBuckets.map(t => ({ month: t.label, revenue: t.revenue })),
      utilization: totalBookings > 0 ? Math.round(((activeRentals + completedBookings) / totalBookings) * 100) : 0,

      // Phase 17 Enhanced Fields
      period: rawPeriod || 'all',
      dateRange: {
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null
      },
      equipmentMetrics: {
        total: equipmentList.length,
        active: equipmentList.filter(e => e.available).length,
        inactive: equipmentList.filter(e => !e.available).length
      },
      bookingStatusBreakdown,
      financialMetrics: {
        grossBookingValue,
        realizedEarnings,
        verifiedPaymentsCollected: realizedEarnings,
        completedRevenue,
        pendingPayout,
        uncollectedBookingBalance: pendingPayout,
        securityDepositsHeld,
        inspectionDeductions
      },
      utilizationMetrics: {
        fleetUtilizationRate,
        totalRentedDays: totalFleetRentedDays,
        totalAvailableDays: totalFleetAvailableDays,
        periodDays: windowDays
      },
      bookingTrends: trendBuckets,
      equipmentPerformance: equipmentPerformanceList
    });
  } catch (error) {
    console.error('Owner Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Owner Analytics Drilldown - Bookings
router.get('/owner/bookings', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = String(req.prismaUser.id);
    const limit = Math.min(100, Math.max(1, req.query.limit ? Number(req.query.limit) : 50));
    const skip = Math.max(0, req.query.offset ? Number(req.query.offset) : (req.query.skip ? Number(req.query.skip) : 0));
    const status = req.query.status ? String(req.query.status).toUpperCase().trim() : undefined;
    const equipmentId = req.query.equipmentId ? String(req.query.equipmentId) : undefined;

    const whereClause: any = {
      equipment: { ownerId }
    };

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (equipmentId) {
      whereClause.equipmentId = equipmentId;
    }

    if (req.query.startDate || req.query.endDate) {
      whereClause.createdAt = {};
      if (req.query.startDate) whereClause.createdAt.gte = new Date(String(req.query.startDate));
      if (req.query.endDate) whereClause.createdAt.lte = new Date(String(req.query.endDate));
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        equipment: { select: { id: true, title: true, category: true, pricePerDay: true } },
        farmer: { select: { id: true, name: true, phone: true } },
        returnInspection: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    });
    res.json(bookings);
  } catch (error) {
    console.error('Owner Bookings Drilldown Error:', error);
    res.status(500).json({ error: 'Failed to fetch detailed bookings' });
  }
});

// Owner Analytics Drilldown - Equipment Performance
router.get('/owner/performance', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = String(req.prismaUser.id);
    const sortBy = req.query.sortBy ? String(req.query.sortBy).toLowerCase() : 'revenue';
    const order = req.query.order && String(req.query.order).toLowerCase() === 'asc' ? 'asc' : 'desc';

    const equipmentList = await prisma.equipment.findMany({
      where: { ownerId },
      include: {
        reviews: { select: { rating: true } },
        bookings: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            totalPrice: true
          }
        }
      }
    });

    const now = new Date();
    const windowStart = new Date(now.getTime() - 30 * 86400000);

    const performance = equipmentList.map(eq => {
      const validBookings = eq.bookings.filter(b => b.status !== 'CANCELLED' && b.status !== 'REJECTED');
      const grossRevenue = eq.bookings.filter(b => REVENUE_GENERATING_STATUSES.includes(b.status)).reduce((s, b) => s + (b.totalPrice || 0), 0);
      const activeBookings = eq.bookings.filter(b => ['ACTIVE', 'ACCEPTED', 'CONFIRMED', 'DISPATCHED'].includes(b.status)).length;
      const completedBookings = eq.bookings.filter(b => b.status === 'COMPLETED').length;

      let rentedDays = 0;
      for (const b of validBookings) {
        if (b.status === 'PENDING') continue;
        const bStart = new Date(b.startDate).getTime();
        const bEnd = new Date(b.endDate).getTime();
        const oStart = Math.max(bStart, windowStart.getTime());
        const oEnd = Math.min(bEnd, now.getTime());
        if (oEnd > oStart) {
          rentedDays += Math.max(1, Math.round((oEnd - oStart) / 86400000));
        }
      }

      const availableDays = Math.max(1, Math.min(30, Math.round((now.getTime() - Math.max(windowStart.getTime(), new Date(eq.createdAt).getTime())) / 86400000)));
      const utilizationRate = Math.min(100, Math.round((rentedDays / availableDays) * 100));
      const ratings = eq.reviews?.map((r: any) => r.rating) || [];
      const averageRating = ratings.length > 0 ? Number((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)) : 0;

      return {
        id: eq.id,
        title: eq.title,
        category: eq.category,
        imageUrl: eq.imageUrl,
        pricePerDay: eq.pricePerDay,
        available: eq.available,
        totalBookings: eq.bookings.length,
        activeBookings,
        completedBookings,
        grossRevenue,
        daysRented: rentedDays,
        utilizationRate,
        averageRating,
        reviewCount: ratings.length
      };
    });

    performance.sort((a, b) => {
      let valA: any = a.grossRevenue;
      let valB: any = b.grossRevenue;
      if (sortBy === 'bookings') { valA = a.totalBookings; valB = b.totalBookings; }
      else if (sortBy === 'utilization') { valA = a.utilizationRate; valB = b.utilizationRate; }
      else if (sortBy === 'rating') { valA = a.averageRating; valB = b.averageRating; }
      else if (sortBy === 'title') { return order === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title); }

      return order === 'asc' ? (valA - valB) : (valB - valA);
    });

    res.json(performance);
  } catch (error) {
    console.error('Owner Equipment Performance Error:', error);
    res.status(500).json({ error: 'Failed to fetch equipment performance' });
  }
});

// Admin Analytics
router.get('/admin', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await prisma.user.count();
    const totalFarmers = await prisma.user.count({ where: { role: 'FARMER' } });
    const totalOwners = await prisma.user.count({ where: { role: 'OWNER' } });
    const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });

    const totalEquipment = await prisma.equipment.count();
    const availableEquipment = await prisma.equipment.count({ where: { available: true } });

    const activeRentals = await prisma.booking.count({ where: { status: 'ACCEPTED' } });
    const pendingBookings = await prisma.booking.count({ where: { status: 'PENDING' } });
    const completedRentals = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const cancelledRentals = await prisma.booking.count({ where: { status: { in: ['REJECTED', 'CANCELLED'] } } });

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    const recentEquipment = await prisma.equipment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { owner: { select: { name: true } } }
    });

    const recentBookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        equipment: { select: { title: true } },
        farmer: { select: { name: true } }
      }
    });

    const allBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['COMPLETED', 'ACTIVE', 'RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING'] }
      }
    });

    const revenueByMonth = allBookings.reduce((acc: any, b) => {
      const month = new Date(b.createdAt).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + (b.totalPrice || 0);
      return acc;
    }, {});

    const revenueGraph = Object.entries(revenueByMonth).map(([name, revenue]) => ({ name, revenue }));

    // Platform Activity (Audit Logs)
    const platformActivity = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      totalUsers,
      totalFarmers,
      totalOwners,
      totalAdmins,
      totalEquipment,
      availableEquipment,
      activeRentals,
      pendingBookings,
      completedRentals,
      cancelledRentals,
      recentUsers,
      recentEquipment,
      recentBookings,
      platformActivity,
      revenueGraph
    });
  } catch (error) {
    console.error('Admin Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Farmer Analytics
router.get('/farmer', requireAuth, requireRole('FARMER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmerId = String(req.prismaUser.id);
    const selectedFarmId = req.query.farmId ? String(req.query.farmId) : undefined;
    const selectedCropId = req.query.cropId ? String(req.query.cropId) : undefined;

    const bookings = await prisma.booking.findMany({
      where: { farmerId },
      include: {
        equipment: {
          include: { owner: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Authoritative calculation of actual rental spending:
    // Only count genuine payments: amountPaid or paid transactions
    const rentalSpending = bookings
      .filter(b => b.status !== 'CANCELLED' && b.status !== 'REJECTED')
      .reduce((sum, b) => {
        const paid = (b.amountPaid != null && b.amountPaid > 0)
          ? b.amountPaid
          : (b.paymentStatus === 'PAID' ? (b.totalPrice || 0) : 0);
        return sum + paid;
      }, 0);

    const totalBookingValue = bookings
      .filter(b => b.status !== 'CANCELLED' && b.status !== 'REJECTED')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const totalSpent = rentalSpending;
    const totalRentals = bookings.length;

    const activeRentals = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'ACTIVE').length;
    const completedRentals = bookings.filter(b => b.status === 'COMPLETED').length;
    const pendingRequests = bookings.filter(b => b.status === 'PENDING').length;

    // Fetch Farmer's Farm & Operations analytics with optional farmId / cropId filtering
    const farms = await prisma.farm.findMany({
      where: {
        ownerId: farmerId,
        ...(selectedFarmId ? { id: selectedFarmId } : {})
      },
      include: {
        budgets: true,
        crops: {
          where: selectedCropId ? { id: selectedCropId } : undefined,
          include: {
            operations: {
              include: { tasks: true }
            }
          }
        }
      }
    });

    let totalBudget = 0;
    let totalOperations = 0;
    let completedOperations = 0;
    let pendingOperations = 0;
    let activeOperations = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    farms.forEach(f => {
      const bgt = f.budgets && f.budgets[0] ? Number(f.budgets[0].totalBudget) : Number((f as any).totalBudget || (f as any).budget || 50000);
      totalBudget += bgt;
      f.crops.forEach(c => {
        c.operations.forEach(op => {
          totalOperations++;
          if (op.status === 'COMPLETED') completedOperations++;
          else if (op.status === 'IN_PROGRESS' || op.status === 'ACTIVE' || op.status === 'PLANNED') {
            pendingOperations++;
            activeOperations++;
          } else {
            pendingOperations++;
          }

          op.tasks.forEach(t => {
            totalTasks++;
            if (t.status === 'COMPLETED') completedTasks++;
          });
        });
      });
    });

    // Also get manual expenses for the farm
    const farmActivities = selectedFarmId ? await prisma.farmActivity.findMany({
      where: { farmId: selectedFarmId, type: 'EXPENSE' }
    }) : [];

    const otherExpenses = farmActivities.reduce((sum, act) => {
      let meta: any = {};
      try { if (act.metadata) meta = JSON.parse(act.metadata); } catch (_) {}
      return sum + (meta.amount ? Number(meta.amount) : 0);
    }, 0);

    const totalSpending = totalSpent + otherExpenses;
    const remainingBudget = Math.max(0, (totalBudget || 50000) - totalSpending);


    const spendingByMonth = bookings
      .filter(b => b.status !== 'CANCELLED' && b.status !== 'REJECTED')
      .reduce((acc: any, b) => {
        const month = new Date(b.createdAt).toLocaleString('default', { month: 'short' });
        const paid = (b.amountPaid != null && b.amountPaid > 0)
          ? b.amountPaid
          : (b.paymentStatus === 'PAID' ? (b.totalPrice || 0) : 0);
        acc[month] = (acc[month] || 0) + paid;
        return acc;
      }, {});

    const spendingGraph = Object.entries(spendingByMonth).map(([name, total]) => ({ name, total }));

    res.json({
      totalSpending: totalSpending || 0,
      totalSpent: totalSpending || 0,
      rentalSpending: totalSpent || 0,
      totalBookingValue: totalBookingValue || 0,
      otherExpenses: otherExpenses || 0,
      totalRentals,
      activeRentals,
      completedRentals,
      pendingRequests,
      totalBudget: totalBudget || 50000,
      remainingBudget: remainingBudget || 0,
      totalOperations,
      activeOperations: activeOperations || (totalOperations - completedOperations),
      completedOperations,
      pendingOperations,
      totalTasks,
      completedTasks,
      operationProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      spendingGraph,
      recentBookings: bookings.slice(0, 10)
    });
  } catch (error) {
    console.error('Farmer Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Farmer Analytics Drilldown - Bookings
router.get('/farmer/bookings', requireAuth, requireRole('FARMER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmerId = String(req.prismaUser.id);
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const bookings = await prisma.booking.findMany({
      where: { farmerId },
      include: {
        equipment: {
          select: {
            title: true,
            owner: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    res.json(bookings);
  } catch (error) {
    console.error('Farmer Bookings Drilldown Error:', error);
    res.status(500).json({ error: 'Failed to fetch detailed bookings' });
  }
});

// Admin Users Directory
router.get('/admin/users', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch platform users' });
  }
});

// Admin User Suspension Toggle
router.put('/admin/users/:id/suspend', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isSuspended: !user.isSuspended }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.prismaUser.id,
        actorRole: req.prismaUser.role,
        action: updated.isSuspended ? 'SUSPEND_USER' : 'ACTIVATE_USER',
        resource: 'User',
        resourceId: updated.id,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

// Admin User Delete
router.delete('/admin/users/:id', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'User permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Admin Equipment Directory
router.get('/admin/equipment', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipment = await prisma.equipment.findMany({
      include: {
        owner: { select: { name: true } },
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch platform equipment' });
  }
});

// Admin Equipment Moderation Toggle
router.put('/admin/equipment/:id/toggle', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const eq = await prisma.equipment.findUnique({ where: { id: String(req.params.id) } });
    if (!eq) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }
    const updated = await prisma.equipment.update({
      where: { id: eq.id },
      data: { available: !eq.available }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to moderate equipment availability' });
  }
});

// Admin Equipment Delete
router.delete('/admin/equipment/:id', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipmentId = String(req.params.id);
    await prisma.booking.deleteMany({ where: { equipmentId } });
    await prisma.equipment.delete({ where: { id: equipmentId } });
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Admin Equipment Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});



// Farmer Analytics
router.get('/farmer', requireAuth, requireRole('FARMER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmerId = String(req.prismaUser.id);
    const bookings = await prisma.booking.findMany({
      where: { farmerId },
      include: {
        equipment: {
          include: { owner: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const activeRentals = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'ACTIVE').length;
    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
    const completedRentals = bookings.filter(b => b.status === 'COMPLETED').length;
    const totalRentals = bookings.length;
    const totalSpending = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Get operations and tasks for farmer's farms
    const farmerFarms = await prisma.farm.findMany({
      where: { ownerId: farmerId },
      include: {
        crops: {
          include: {
            operations: {
              include: { tasks: true }
            }
          }
        }
      }
    });

    let totalOperations = 0;
    let completedOperations = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    for (const farm of farmerFarms) {
      for (const crop of farm.crops) {
        for (const op of crop.operations) {
          totalOperations++;
          if (op.status === 'COMPLETED') completedOperations++;
          for (const task of op.tasks) {
            totalTasks++;
            if (task.status === 'COMPLETED') completedTasks++;
          }
        }
      }
    }

    const activeOperations = totalOperations - completedOperations;
    const pendingTasks = totalTasks - completedTasks;

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    for (const b of bookings) {
      const cat = b.equipment?.category || 'OTHER';
      categoryMap[cat] = (categoryMap[cat] || 0) + (b.totalPrice || 0);
    }

    // Monthly breakdown (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlySpending: { month: string; amount: number; year: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      const yr = d.getFullYear();
      const monthBookings = bookings.filter(b => {
        const bDate = new Date(b.createdAt);
        return bDate.getMonth() === d.getMonth() && bDate.getFullYear() === yr;
      });
      const monthSum = monthBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      monthlySpending.push({ month: mName, amount: monthSum, year: yr });
    }

    // Recent activity list
    const recentActivities: { id: string; title: string; type: string; timestamp: Date }[] = [];
    for (const b of bookings.slice(0, 5)) {
      recentActivities.push({
        id: b.id,
        title: `${b.equipment?.title || 'Equipment'} booked for rental`,
        type: 'RENTAL',
        timestamp: b.createdAt
      });
    }

    res.json({
      success: true,
      data: {
        activeRentals,
        pendingBookings,
        completedRentals,
        totalRentals,
        totalSpending,
        totalSpent: totalSpending,
        totalOperations,
        completedOperations,
        activeOperations,
        totalTasks,
        completedTasks,
        pendingTasks,
        categoryBreakdown: categoryMap,
        monthlySpending,
        recentBookings: bookings.slice(0, 15),
        recentActivities
      }
    });
  } catch (error) {
    console.error('Farmer Analytics Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch farmer analytics' });
  }
});

router.get('/farmer/bookings', requireAuth, requireRole('FARMER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmerId = String(req.prismaUser.id);
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const bookings = await prisma.booking.findMany({
      where: { farmerId },
      include: {
        equipment: {
          include: { owner: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    res.json(bookings);
  } catch (error) {
    console.error('Farmer Bookings Drilldown Error:', error);
    res.status(500).json({ error: 'Failed to fetch detailed bookings' });
  }
});

export default router;
