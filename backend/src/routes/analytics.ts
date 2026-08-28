import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';

const router = Router();

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
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    const acceptedBookings = bookings.filter(b => b.status === 'ACCEPTED').length;

    const totalRevenue = bookings
      .filter(b => b.status === 'COMPLETED' || b.paymentStatus === 'PAID')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const topEquipmentMap = bookings.reduce((acc: Record<string, { title: string; bookings: number; revenue: number }>, b) => {
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

    const revenueByMonth = bookings
      .filter(b => b.status === 'COMPLETED' || b.paymentStatus === 'PAID')
      .reduce((acc: Record<string, number>, b) => {
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
      totalBookings,
      pendingBookings,
      completedBookings,
      averageRating: parseFloat(avgRating.toFixed(1)),
      topEquipment,
      monthlyRevenue,
      utilization: totalBookings > 0 ? Math.round(((acceptedBookings + completedBookings) / totalBookings) * 100) : 0
    });
  } catch (error) {
    console.error('Owner Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Admin Analytics
router.get('/admin', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await prisma.user.count();
    const totalFarmers = await prisma.user.count({ where: { role: 'FARMER' } });
    const totalOwners = await prisma.user.count({ where: { role: 'OWNER' } });
    const totalEquipment = await prisma.equipment.count();
    const activeRentals = await prisma.booking.count({ where: { status: 'ACCEPTED' } });

    const allBookings = await prisma.booking.findMany({
      where: {
        OR: [
          { status: 'COMPLETED' },
          { paymentStatus: 'PAID' }
        ]
      }
    });

    const revenueByMonth = allBookings.reduce((acc: any, b) => {
      const month = new Date(b.createdAt).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + (b.totalPrice || 0);
      return acc;
    }, {});

    const revenueGraph = Object.entries(revenueByMonth).map(([name, revenue]) => ({ name, revenue }));

    res.json({
      totalUsers,
      totalFarmers,
      totalOwners,
      totalEquipment,
      activeRentals,
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
    const bookings = await prisma.booking.findMany({
      where: { farmerId },
      include: { equipment: true }
    });

    const totalSpent = bookings
      .filter(b => b.status === 'COMPLETED' || b.paymentStatus === 'PAID')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const activeRentals = bookings.filter(b => b.status === 'ACCEPTED').length;
    const completedRentals = bookings.filter(b => b.status === 'COMPLETED').length;

    const spendingByMonth = bookings
      .filter(b => b.status === 'COMPLETED' || b.paymentStatus === 'PAID')
      .reduce((acc: any, b) => {
        const month = new Date(b.createdAt).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + (b.totalPrice || 0);
        return acc;
      }, {});

    const spendingGraph = Object.entries(spendingByMonth).map(([name, total]) => ({ name, total }));

    res.json({
      totalSpent: totalSpent || 0,
      activeRentals,
      completedRentals,
      spendingGraph
    });
  } catch (error) {
    console.error('Farmer Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
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

export default router;
