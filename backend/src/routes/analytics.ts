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

    // Get all bookings for this owner's equipment
    const bookings = await prisma.booking.findMany({
      where: {
        equipment: { ownerId }
      },
      include: { equipment: true }
    });

    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;

    // According to new unified definition, active rentals are ACCEPTED + ACTIVE
    const activeRentals = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'ACTIVE').length;

    // Completed is just COMPLETED
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;

    // Rental value generated MUST be exactly the sum of totalPrice for REVENUE_GENERATING_STATUSES
    const validPaidBookings = bookings.filter(b => REVENUE_GENERATING_STATUSES.includes(b.status));
    const totalRevenue = validPaidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const pendingValue = bookings.filter(b => b.status === 'PENDING').reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const topEquipmentMap = validPaidBookings.reduce((acc: Record<string, { title: string; bookings: number; revenue: number }>, b) => {
      const title = b.equipment?.title || 'Unknown Equipment';
      if (!acc[title]) acc[title] = { title, bookings: 0, revenue: 0 };
      acc[title].bookings += 1;
      acc[title].revenue += b.totalPrice || 0;
      return acc;
    }, {});

    const topEquipment = Object.values(topEquipmentMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const monthLabels = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return date.toLocaleString('default', { month: 'short' });
    });

    const revenueByMonth = validPaidBookings.reduce((acc: Record<string, number>, b) => {
      const month = new Date(b.createdAt).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + (b.totalPrice || 0);
      return acc;
    }, {});

    const monthlyRevenue = monthLabels.map(month => ({
      month,
      revenue: revenueByMonth[month] || 0
    }));

    const equipmentList = await prisma.equipment.findMany({
      where: { ownerId },
      select: { id: true }
    });

    const ownerFeedback = await prisma.feedback.findMany({
      where: {
        category: 'Equipment',
        subject: { in: equipmentList.map(e => e.id) }
      }
    });

    const avgRating = ownerFeedback.length > 0
      ? ownerFeedback.reduce((sum, f) => sum + f.rating, 0) / ownerFeedback.length
      : 0;

    res.json({
      totalRevenue: totalRevenue || 0,
      completedRevenue: validPaidBookings.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      totalBookings,
      pendingBookings,
      completedBookings,
      activeRentals,
      pendingValue,
      averageRating: parseFloat(avgRating.toFixed(1)),
      topEquipment,
      monthlyRevenue,
      utilization: totalBookings > 0 ? Math.round(((activeRentals + completedBookings) / totalBookings) * 100) : 0
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
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const bookings = await prisma.booking.findMany({
      where: {
        equipment: { ownerId }
      },
      include: {
        equipment: { select: { title: true } },
        farmer: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    res.json(bookings);
  } catch (error) {
    console.error('Owner Bookings Drilldown Error:', error);
    res.status(500).json({ error: 'Failed to fetch detailed bookings' });
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
          include: { owner: { select: { name: true, phone: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const validSpendingStatuses = ['COMPLETED', 'ACTIVE', 'RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'ACCEPTED'];
    const totalSpent = bookings
      .filter(b => validSpendingStatuses.includes(b.status))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

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
      .filter(b => validSpendingStatuses.includes(b.status))
      .reduce((acc: any, b) => {
        const month = new Date(b.createdAt).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + (b.totalPrice || 0);
        return acc;
      }, {});

    const spendingGraph = Object.entries(spendingByMonth).map(([name, total]) => ({ name, total }));

    res.json({
      totalSpending: totalSpending || 0,
      totalSpent: totalSpending || 0,
      rentalSpending: totalSpent || 0,
      otherExpenses: otherExpenses || 0,
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
