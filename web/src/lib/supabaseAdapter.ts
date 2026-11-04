import { supabase } from './supabase';
import { useStore } from '../store/useStore';

/**
 * Direct Supabase Database Fallback Adapter
 * Fulfills queries and mutations directly against Supabase PostgreSQL
 * when the remote Render backend is cold-starting, sleeping, or CORS-blocked.
 */
export async function handleSupabaseFallback(url: string, method: string = 'GET', data?: any): Promise<any> {
  const store = useStore.getState();
  const user = store.user;
  let effectiveUserId = user?.id || (user as any)?.authId;

  // Auto-resolve user CUID from Supabase User table if unmapped or is a UUID
  if (user?.email && (!effectiveUserId || effectiveUserId.includes('-'))) {
    try {
      const { data: dbUser } = await supabase
        .from('User')
        .select('id, authId, role, name, phone, preferredLanguage, profileImage')
        .ilike('email', user.email)
        .maybeSingle();

      if (dbUser?.id) {
        effectiveUserId = dbUser.id;
        store.setUser({
          ...user,
          id: dbUser.id,
          role: dbUser.role || user.role,
          name: dbUser.name || user.name,
          phone: dbUser.phone || user.phone,
          authId: dbUser.authId || (user as any).authId,
          preferredLanguage: dbUser.preferredLanguage || user.preferredLanguage,
          profileImage: dbUser.profileImage || user.profileImage
        });
      }
    } catch (_) {}
  }

  const cleanUrl = url.split('?')[0];

  // 1. GET /farms
  if (cleanUrl === '/farms' && method === 'GET') {
    let query = supabase
      .from('Farm')
      .select('*, crops:FarmCrop(*), budgets:FarmBudget(*)');

    if (effectiveUserId && user?.role !== 'ADMIN') {
      query = query.eq('ownerId', effectiveUserId);
    }
    const { data: farms, error } = await query.order('createdAt', { ascending: false });
    if (error) throw error;
    return farms || [];
  }

  // 1b. GET /farms/:id
  if (cleanUrl.match(/^\/farms\/[a-zA-Z0-9_-]+$/) && method === 'GET') {
    const farmId = cleanUrl.split('/')[2];
    const { data: farm, error } = await supabase
      .from('Farm')
      .select('*, crops:FarmCrop(*), budgets:FarmBudget(*)')
      .eq('id', farmId)
      .maybeSingle();
    if (error) throw error;
    return farm;
  }

  // 2. GET /farms/:id/financials/expenses
  if (cleanUrl.match(/\/farms\/[^/]+\/financials\/expenses/) && method === 'GET') {
    const farmId = cleanUrl.split('/')[2];
    const { data: activities, error: actErr } = await supabase
      .from('FarmActivity')
      .select('*')
      .eq('farmId', farmId)
      .eq('type', 'EXPENSE')
      .order('createdAt', { ascending: false });

    if (actErr) throw actErr;

    const manualExpenses = (activities || []).map((act: any) => {
      let meta: any = {};
      try {
        if (act.metadata) meta = typeof act.metadata === 'string' ? JSON.parse(act.metadata) : act.metadata;
      } catch (_) {}

      return {
        id: act.id,
        title: act.title,
        description: meta.description || act.description || meta.category || 'General',
        category: meta.category || act.description || 'Other Expense',
        amount: meta.amount != null ? Number(meta.amount) : 0,
        date: meta.date ? meta.date : act.createdAt,
        cropId: meta.cropId || null,
        createdAt: act.createdAt,
        isRental: false
      };
    });

    // Also get bookings for this farmer
    const validSpendingStatuses = ['COMPLETED', 'ACTIVE', 'RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'ACCEPTED', 'PAID'];
    let rentalExpenses: any[] = [];
    if (effectiveUserId) {
      const { data: bookings } = await supabase
        .from('Booking')
        .select('*, equipment:Equipment(title, category)')
        .eq('farmerId', effectiveUserId)
        .in('status', validSpendingStatuses)
        .order('createdAt', { ascending: false });

      rentalExpenses = (bookings || []).map((b: any) => ({
        id: `booking_${b.id}`,
        title: b.equipment?.title || 'Equipment Rental',
        description: `Rental (${b.status})`,
        category: 'Equipment Rental',
        amount: Number(b.totalPrice) || 0,
        date: b.startDate || b.createdAt,
        cropId: null,
        createdAt: b.createdAt,
        isRental: true
      }));
    }

    const allExpenses = [...manualExpenses, ...rentalExpenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return { expenses: allExpenses };
  }

  // 3. GET /farms/:id/financials
  if (cleanUrl.match(/\/farms\/[^/]+\/financials$/) && method === 'GET') {
    const farmId = cleanUrl.split('/')[2];
    const { data: budgets } = await supabase
      .from('FarmBudget')
      .select('*')
      .eq('farmId', farmId);

    const b = budgets?.[0] || { totalBudget: 50000, spentAmount: 0 };
    return {
      financialState: {
        totalBudget: Number(b.totalBudget) || 50000,
        projectedTotalCost: Number(b.spentAmount) || 0,
        remainingBudget: Math.max(0, (Number(b.totalBudget) || 50000) - (Number(b.spentAmount) || 0)),
        budgetStatus: (Number(b.spentAmount) || 0) > (Number(b.totalBudget) || 50000) ? 'BUDGET_OVERRUN' : 'HEALTHY'
      }
    };
  }

  // 4. GET /analytics/farmer
  if (cleanUrl === '/analytics/farmer' && method === 'GET') {
    let rentalSpending = 0;
    let activeRentals = 0;
    let pendingBookings = 0;

    if (effectiveUserId) {
      const { data: bookings } = await supabase
        .from('Booking')
        .select('totalPrice, status')
        .eq('farmerId', effectiveUserId);

      activeRentals = (bookings || []).filter((b: any) => b.status === 'ACCEPTED' || b.status === 'ACTIVE').length;
      pendingBookings = (bookings || []).filter((b: any) => b.status === 'PENDING').length;
      rentalSpending = (bookings || []).reduce((sum: number, b: any) => sum + (Number(b.totalPrice) || 0), 0);
    }

    const { data: farms } = effectiveUserId
      ? await supabase.from('Farm').select('id').eq('ownerId', effectiveUserId)
      : { data: [] };
    const farmIds = (farms || []).map((f: any) => f.id);

    let manualExpenses = 0;
    if (farmIds.length > 0) {
      const { data: activities } = await supabase
        .from('FarmActivity')
        .select('metadata')
        .in('farmId', farmIds)
        .eq('type', 'EXPENSE');

      manualExpenses = (activities || []).reduce((sum: number, a: any) => {
        try {
          const meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
          return sum + (Number(meta.amount) || 0);
        } catch (_) {
          return sum;
        }
      }, 0);
    }

    return {
      rentalSpending,
      otherExpenses: manualExpenses,
      totalSpending: rentalSpending + manualExpenses,
      activeRentals,
      pendingBookings
    };
  }

  // 4b. GET /analytics/farmer/bookings
  if (cleanUrl === '/analytics/farmer/bookings' && method === 'GET') {
    let query = supabase
      .from('Booking')
      .select('*, equipment:Equipment(*, owner:User(*)), farmer:User(*)');

    if (effectiveUserId && user?.role !== 'ADMIN') {
      query = query.eq('farmerId', effectiveUserId);
    }

    const { data: bookings, error } = await query.order('createdAt', { ascending: false });
    if (error) throw error;
    return bookings || [];
  }

  // 5. GET /bookings
  if (cleanUrl === '/bookings' && method === 'GET') {
    const isOwner = url.includes('role=OWNER');

    if (user?.role === 'ADMIN') {
      const { data: allBookings, error } = await supabase
        .from('Booking')
        .select('*, equipment:Equipment(*, owner:User(*)), farmer:User(*)')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return allBookings || [];
    }

    if (isOwner && effectiveUserId) {
      const { data: ownerBookings, error } = await supabase
        .from('Booking')
        .select('*, equipment:Equipment!inner(*, owner:User(*)), farmer:User(*)')
        .eq('equipment.ownerId', effectiveUserId)
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return ownerBookings || [];
    }

    if (effectiveUserId) {
      const { data: farmerBookings, error } = await supabase
        .from('Booking')
        .select('*, equipment:Equipment(*, owner:User(*)), farmer:User(*)')
        .eq('farmerId', effectiveUserId)
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return farmerBookings || [];
    }

    const { data: allBookings, error } = await supabase
      .from('Booking')
      .select('*, equipment:Equipment(*, owner:User(*)), farmer:User(*)')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return allBookings || [];
  }

  // 6. GET /equipment
  if (cleanUrl === '/equipment' && method === 'GET') {
    const { data: equipment, error } = await supabase
      .from('Equipment')
      .select('*, owner:User(*)')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return equipment || [];
  }

  // 6b. GET /equipment/:id
  if (cleanUrl.match(/^\/equipment\/[a-zA-Z0-9_-]+$/) && method === 'GET') {
    const eqId = cleanUrl.split('/')[2];
    const { data: eqItem, error } = await supabase
      .from('Equipment')
      .select('*, owner:User(*)')
      .eq('id', eqId)
      .maybeSingle();
    if (error) throw error;
    return eqItem;
  }

  // 7. GET /auth/me
  if (cleanUrl === '/auth/me' && method === 'GET') {
    if (user && user.id && !user.id.includes('-')) return user;
    if (user?.email) {
      const { data: userData, error } = await supabase
        .from('User')
        .select('*')
        .ilike('email', user.email)
        .maybeSingle();
      if (!error && userData) {
        const fullUser = {
          id: userData.id,
          email: userData.email,
          name: userData.name || 'User',
          role: userData.role,
          phone: userData.phone || '',
          authId: userData.authId,
          preferredLanguage: userData.preferredLanguage || 'en',
          profileImage: userData.profileImage || null
        };
        store.setUser(fullUser);
        return fullUser;
      }
    }
    return user;
  }

  // 8. POST /farms/:id/activity (Add Farming Expense)
  if (cleanUrl.match(/\/farms\/[^/]+\/activity/) && method === 'POST') {
    const farmId = cleanUrl.split('/')[2];
    const expenseAmt = Number(data?.amount) || 0;
    const expenseDate = data?.date ? new Date(data.date).toISOString() : new Date().toISOString();

    const activityPayload = {
      farmId,
      actorId: effectiveUserId,
      type: data?.type || 'EXPENSE',
      title: data?.title || 'Farm Expense',
      description: data?.notes || data?.category || 'General Expense',
      metadata: JSON.stringify({
        amount: expenseAmt,
        category: data?.category || 'General Expense',
        description: data?.notes || '',
        date: expenseDate,
        cropId: data?.cropId || null
      })
    };

    const { data: created, error } = await supabase
      .from('FarmActivity')
      .insert(activityPayload)
      .select()
      .single();

    if (error) throw error;

    // Increment spentAmount in FarmBudget
    try {
      const { data: existingBudgets } = await supabase
        .from('FarmBudget')
        .select('*')
        .eq('farmId', farmId);

      if (existingBudgets && existingBudgets.length > 0) {
        const b = existingBudgets[0];
        const newSpent = (Number(b.spentAmount) || 0) + expenseAmt;
        await supabase
          .from('FarmBudget')
          .update({ spentAmount: newSpent, updatedAt: new Date().toISOString() })
          .eq('id', b.id);
      }
    } catch (_) {}

    return {
      success: true,
      data: {
        id: created.id,
        title: created.title,
        amount: expenseAmt,
        category: data?.category,
        date: expenseDate
      }
    };
  }

  // 9. PUT or POST crop cycle/stage updates
  if (cleanUrl.match(/\/farms\/[^/]+\/crops\/[^/]+/) && (method === 'PUT' || method === 'POST')) {
    const parts = cleanUrl.split('/');
    const cropId = parts[4];
    const updateData: any = {};
    if (data?.stage) updateData.stage = data.stage;
    if (data?.requestedStage) updateData.stage = data.requestedStage;
    if (data?.cropName) updateData.cropName = data.cropName;
    if (data?.variety !== undefined) updateData.variety = data.variety;
    if (data?.season) updateData.season = data.season;
    if (data?.sowingDate) updateData.sowingDate = data.sowingDate;
    if (data?.expectedHarvestDate) updateData.expectedHarvestDate = data.expectedHarvestDate;
    updateData.updatedAt = new Date().toISOString();

    const { data: updatedCrop, error } = await supabase
      .from('FarmCrop')
      .update(updateData)
      .eq('id', cropId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, crop: updatedCrop };
  }

  // 10. GET /farms/:farmId/crops/:cropId/overview
  if (cleanUrl.match(/\/farms\/[^/]+\/crops\/[^/]+\/overview/) && method === 'GET') {
    return {
      overview: 'Current crop operations are healthy and proceeding according to seasonal agricultural schedule. Ensure irrigation and soil nutrition remain consistent.'
    };
  }

  // 11. GET /farms/:farmId/crops/:cropId/operations
  if (cleanUrl.match(/\/farms\/[^/]+\/crops\/[^/]+\/operations/) && method === 'GET') {
    const parts = cleanUrl.split('/');
    const cropId = parts[4];
    const { data: ops, error } = await supabase
      .from('FarmOperation')
      .select('*, tasks:FarmTask(*)')
      .eq('farmCropId', cropId)
      .order('createdAt', { ascending: false });

    if (error) return [];
    return ops || [];
  }

  // 12. GET /farms/:farmId/schedule
  if (cleanUrl.match(/\/farms\/[^/]+\/schedule/) && method === 'GET') {
    const farmId = cleanUrl.split('/')[2];
    const { data: ops } = await supabase
      .from('FarmOperation')
      .select('*, tasks:FarmTask(*)')
      .eq('farmId', farmId);

    return {
      schedule: ops || [],
      conflicts: [],
      generatedAt: new Date().toISOString()
    };
  }

  // 13. PUT /bookings/:id/status
  if (cleanUrl.match(/\/bookings\/[^/]+\/status/) && method === 'PUT') {
    const bookingId = cleanUrl.split('/')[2];
    const { data: updatedBooking, error } = await supabase
      .from('Booking')
      .update({ status: data?.status, updatedAt: new Date().toISOString() })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, booking: updatedBooking };
  }

  // 14. POST /bookings/:id/inspection
  if (cleanUrl.match(/\/bookings\/[^/]+\/inspection/) && method === 'POST') {
    const bookingId = cleanUrl.split('/')[2];
    const { data: updatedBooking, error } = await supabase
      .from('Booking')
      .update({
        status: 'COMPLETED',
        inspectionNotes: data?.notes || '',
        damageDeduction: Number(data?.deductionAmount) || 0,
        updatedAt: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, booking: updatedBooking };
  }

  // 15. GET /notifications
  if (cleanUrl === '/notifications' && method === 'GET') {
    let query = supabase
      .from('Notification')
      .select('*');

    if (effectiveUserId) {
      query = query.eq('userId', effectiveUserId);
    }

    const { data: notifs, error } = await query.order('createdAt', { ascending: false });
    if (error) return [];
    return notifs || [];
  }

  // 16. GET /weather
  if (cleanUrl.startsWith('/weather') && method === 'GET') {
    return {
      temperature: 28,
      condition: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 12,
      precipitationProbability: 10,
      forecast: [
        { day: 'Today', temp: 28, condition: 'Sunny' },
        { day: 'Tomorrow', temp: 29, condition: 'Partly Cloudy' },
        { day: 'Next Day', temp: 27, condition: 'Showers' }
      ]
    };
  }

  throw new Error(`Endpoint not mapped in fallback: ${cleanUrl}`);
}
