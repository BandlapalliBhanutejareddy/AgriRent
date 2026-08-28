'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Calendar, 
  IndianRupee, 
  Tractor, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Activity,
  Phone,
  CalendarDays,
  ShieldCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function OwnerDashboard() {
  const { t } = useTranslation();
  const { user } = useStore();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [bookingsRes, analyticsRes] = await Promise.all([
        api.get('/bookings?role=OWNER'),
        api.get('/analytics/owner')
      ]);
      setBookings(bookingsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      showToast('Failed to load live dashboard data from server.', 'warning');
      setBookings([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  async function handleUpdateStatus(id: string, status: 'ACCEPTED' | 'REJECTED') {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      setBookings(prev => 
        prev.map(b => b.id === id ? { ...b, status } : b)
      );
      showToast(`Booking request successfully ${status.toLowerCase()}!`, 'success');
    } catch (error) {
      showToast(`Failed to update booking status.`, 'warning');
    }
  };

  const activeBookings = bookings.filter(b => b.status === 'ACTIVE' || b.status === 'ACCEPTED').length;
  const pendingRequests = bookings.filter(b => b.status === 'PENDING').length;
  const totalEarnings = analytics?.totalRevenue || 0;

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Welcome Greeting Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-slate-900 via-primary to-slate-900 p-8 md:p-10 rounded-[32px] text-white shadow-2xl shadow-slate-900/40 border border-slate-700/50 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] bg-secondary/30" />
        <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full blur-[60px] bg-accent/10" />
        
        <div className="relative z-10 space-y-3">
          <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-white rounded-xl border border-white/20 shadow-sm inline-flex items-center gap-1.5">
            <Tractor size={12} /> {t('owner_fleet_console', { defaultValue: 'Owner Fleet Console' })}
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-2">
            {t('welcome', { defaultValue: 'Welcome' })}, {user?.name || 'Equipment Owner'} 🚜
          </h1>
          <p className="text-blue-100 max-w-xl text-sm font-medium leading-relaxed opacity-90">
            {t('dashboard_subtitle', { defaultValue: 'Monitor real-time rental yield, approve pending farmer requests, manage listed fleet inventory, and review monthly payouts.' })}
          </p>
        </div>
        <div className="relative z-10 flex gap-4 shrink-0">
          {/* Removed hardcoded non-functional stats */}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between group hover:border-emerald-500/50 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
              <IndianRupee size={24} strokeWidth={2.5} />
            </div>
            <div className="flex items-center text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200/50 dark:border-emerald-800/50">
              <TrendingUp size={12} className="mr-1.5" /> {t('ytd', { defaultValue: 'YTD' })}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('gross_earnings', { defaultValue: 'Gross Earnings' })}</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1 tracking-tighter">₹{totalEarnings.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between group hover:border-indigo-500/50 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
              <Calendar size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50">{t('live', { defaultValue: 'Live' })}</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('active_bookings', { defaultValue: 'Active Bookings' })}</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1 tracking-tighter">{activeBookings}</p>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between group hover:border-amber-500/50 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
              <Clock size={24} strokeWidth={2.5} />
            </div>
            {pendingRequests > 0 && (
              <div className="flex items-center text-amber-700 bg-amber-100 dark:bg-amber-900/40 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-200/50 dark:border-amber-800/50 animate-pulse">
                {t('action_req', { defaultValue: 'Action Req' })}
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('pending_requests', { defaultValue: 'Pending Requests' })}</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1 tracking-tighter">{pendingRequests}</p>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between group hover:border-blue-500/50 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
              <Tractor size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('fleet_count', { defaultValue: 'Fleet Count' })}</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1 tracking-tighter">{bookings.filter(b => b.equipment).length}</p>
          </div>
        </div>

      </div>



    </div>
  );
}
