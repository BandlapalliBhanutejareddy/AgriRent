import { prisma } from '../../lib/prisma';

export interface FarmProfileData {
  crop: string;
  soilType?: string;
  acreage: number;
  location?: string;
  season?: string;
  cropStage: string;
  objective?: string;
  budget?: number;
  preferredLanguage?: string;
}

export interface CanonicalFarmContext {
  farmerId: string;
  farmerName: string;
  farmProfile: FarmProfileData;
  currentDate: string;
  activeBookings: any[];
  upcomingBookings: any[];
  completedBookings: any[];
  availableCandidateEquipment: any[];
}

export class FarmContextService {
  /**
   * Assembles canonical farm context by combining input profile with live DB bookings and equipment inventory
   */
  async buildContext(farmerId: string, farmId: string, cropId: string, overrides: { objective?: string, budget?: number, preferredLanguage?: string } = {}): Promise<CanonicalFarmContext> {
    // 1. Fetch Farmer User details
    const farmer = await prisma.user.findUnique({
      where: { id: farmerId },
      select: { id: true, name: true, preferredLanguage: true }
    });

    if (!farmer) throw new Error('FARMER_NOT_FOUND');

    const farmerName = farmer.name || 'Farmer';
    const currentDateStr = new Date().toISOString();

    // 2. Fetch Farm and verify ownership
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        crops: { where: { id: cropId } },
        budgets: true
      }
    });

    if (!farm) throw new Error('FARM_NOT_FOUND');
    if (farm.ownerId !== farmerId) throw new Error('FORBIDDEN_FARM_ACCESS');
    if (!farm.crops || farm.crops.length === 0) throw new Error('CROP_NOT_FOUND_OR_NOT_OWNED');

    const activeCrop = farm.crops[0];

    // 3. Fetch Farmer Bookings from DB
    const bookings = await prisma.booking.findMany({
      where: { farmerId },
      include: {
        equipment: {
          select: {
            id: true,
            title: true,
            category: true,
            pricePerDay: true,
            ownerId: true,
            location: true
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    const now = new Date();
    const activeBookings = bookings.filter(b => b.status === 'ACTIVE' || b.status === 'ACCEPTED' || b.status === 'DISPATCHED');
    const upcomingBookings = bookings.filter(b => b.status === 'PENDING' || (new Date(b.startDate) > now && b.status !== 'CANCELLED' && b.status !== 'REJECTED'));
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED');

    // 4. Fetch candidate equipment from DB
    const candidateEquipment = await prisma.equipment.findMany({
      where: {
        available: true,
        owner: {
          isSuspended: false
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, phone: true, isVerified: true }
        },
        reviews: {
          select: { rating: true }
        },
        bookings: {
          where: {
            status: { notIn: ['REJECTED', 'CANCELLED', 'REFUNDED'] }
          },
          select: { startDate: true, endDate: true, status: true }
        }
      },
      take: 20
    });

    // 5. Construct DB-verified FarmProfileData
    let budget = 20000;
    if (overrides.budget !== undefined) {
      budget = overrides.budget;
    } else if (farm.budgets && farm.budgets.length > 0 && farm.budgets[0].totalBudget) {
      budget = Number(farm.budgets[0].totalBudget);
    }

    if (!activeCrop.cropName) throw new Error(`DATA_INTEGRITY_ERROR: Missing cropName for crop ${cropId}`);
    if (!farm.soilType) throw new Error(`DATA_INTEGRITY_ERROR: Missing soilType for farm ${farmId}`);
    if (!farm.area) throw new Error(`DATA_INTEGRITY_ERROR: Missing area for farm ${farmId}`);
    if (!farm.location) throw new Error(`DATA_INTEGRITY_ERROR: Missing location for farm ${farmId}`);
    if (!activeCrop.season) throw new Error(`DATA_INTEGRITY_ERROR: Missing season for crop ${cropId}`);
    if (!activeCrop.stage) throw new Error(`DATA_INTEGRITY_ERROR: Missing authoritative lifecycle stage for crop ${cropId}`);

    const farmProfile: FarmProfileData = {
      crop: activeCrop.cropName,
      soilType: farm.soilType,
      acreage: Number(farm.area),
      location: farm.location,
      season: activeCrop.season,
      cropStage: activeCrop.stage,
      objective: overrides.objective || 'Maximize Yield and Minimize Cost',
      budget,
      preferredLanguage: overrides.preferredLanguage || farmer.preferredLanguage || 'en'
    };

    return {
      farmerId,
      farmerName,
      farmProfile,
      currentDate: currentDateStr,
      activeBookings,
      upcomingBookings,
      completedBookings,
      availableCandidateEquipment: candidateEquipment
    };
  }
}

export const farmContextService = new FarmContextService();
