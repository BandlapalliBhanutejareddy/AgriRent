'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Calendar, 
  Tractor, 
  Clock, 
  CheckCircle, 
  Search, 
  MapPin, 
  CloudSun, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FarmerDashboard() {
  const { t } = useTranslation();
  const { user } = useStore();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [bookingsRes, analyticsRes] = await Promise.all([
        api.get('/bookings?role=FARMER'),
        api.get('/analytics/farmer')
      ]);
      setBookings(bookingsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  async function handleCancelBooking(id: string) {
    try {
      await api.put(`/bookings/${id}/status`, { status: 'CANCELLED' });
      setBookings(prev => 
        prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b)
      );
    } catch (error) {
      console.error('Failed to cancel booking', error);
    }
  };

  async function handleRefundBooking(id: string) {
    try {
      if (!confirm('Are you sure you want to cancel and request a refund?')) return;
      await api.post(`/payments/${id}/refund`);
      showToast('Refund initiated successfully', 'success');
      fetchData(); // Refresh to get updated status
    } catch (error) {
      console.error('Failed to initiate refund', error);
      showToast('Failed to initiate refund', 'warning');
    }
  };

  const activeBookings = bookings.filter(b => b.status === 'ACTIVE' || b.status === 'ACCEPTED');
  const pendingBookings = bookings.filter(b => b.status === 'PENDING');

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Welcome Greeting Hero Box */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary via-secondary to-primary-light p-8 md:p-10 rounded-[32px] text-white shadow-2xl shadow-primary/20 border border-secondary/30 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] bg-accent/20" />
        <div className="absolute top-10 right-10 w-40 h-40 rounded-full blur-[60px] bg-accent/20" />
        
        <div className="relative z-10 space-y-3">
          <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-white rounded-xl border border-white/20 shadow-sm inline-flex items-center gap-1.5">
            <Sparkles size={12} /> {t('farmer_suite', { defaultValue: 'Farmer Suite' })}
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-2">
            {t('good_morning', { defaultValue: 'Good Morning,' })} {user?.name || t('farmer', { defaultValue: 'Farmer' })} 🌾
          </h1>
          <p className="text-emerald-50 max-w-xl text-sm font-medium leading-relaxed opacity-90">
            {t('farmer_hero_desc', { defaultValue: 'Browse state-of-the-art agricultural machinery, consult your AI Farm Advisor, and track scheduled rentals.' })}
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <Link 
            href="/dashboard/marketplace"
            className="flex items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 font-black rounded-2xl transition-all shadow-xl hover:shadow-emerald-900/30 hover:-translate-y-1"
          >
            <Search size={18} />
            {t('find_machinery', { defaultValue: 'Find Machinery' })}
          </Link>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('spending_trends', { defaultValue: 'Spending Trends (Actual)' })}</span>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <div className="h-[250px] w-full">
            {analytics?.spendingGraph?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.spendingGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 space-y-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <TrendingUp size={32} className="opacity-50" />
                <span className="text-xs font-bold uppercase tracking-wider">{t('no_spending_data', { defaultValue: 'No Spending Data Yet' })}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center justify-between group hover:border-emerald-500/50 transition-all duration-300">
            <div>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('active_rentals', { defaultValue: 'Active Rentals' })}</span>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1 tracking-tighter">{activeBookings.length}</h3>
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 mt-1">● {t('deployed', { defaultValue: 'Deployed' })}</span>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
              <CheckCircle size={24} />
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center justify-between group hover:border-amber-500/50 transition-all duration-300">
            <div>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('pending_requests', { defaultValue: 'Pending Requests' })}</span>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1 tracking-tighter">{pendingBookings.length}</h3>
              <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mt-1">● {t('waiting', { defaultValue: 'Waiting' })}</span>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
          </div>
        </div>
      </div>

      <div id="rentals" className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[32px] shadow-sm border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/10">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('rental_history', { defaultValue: 'Rental History' })}</h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">{t('track_orders', { defaultValue: 'Track and manage your orders' })}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
                <th className="p-6 font-black">{t('machinery', { defaultValue: 'Machinery' })}</th>
                <th className="p-6 font-black">{t('owner_detail', { defaultValue: 'Owner Detail' })}</th>
                <th className="p-6 font-black">{t('active_dates', { defaultValue: 'Active Dates' })}</th>
                <th className="p-6 font-black">{t('pricing', { defaultValue: 'Pricing' })}</th>
                <th className="p-6 font-black">{t('payment', { defaultValue: 'Payment' })}</th>
                <th className="p-6 font-black">{t('status', { defaultValue: 'Status' })}</th>
                <th className="p-6 font-black text-right">{t('actions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
                      <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 rounded-full shadow-sm">
                        <Tractor size={32} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-white text-lg">{t('no_rentals', { defaultValue: 'No Rentals Scheduled' })}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                          {t('no_rentals_desc', { defaultValue: 'You haven\'t requested any machinery rentals yet. Connect with verified fleet owners to lease top-tier machinery.' })}
                        </p>
                      </div>
                      <Link 
                        href="/dashboard/marketplace" 
                        className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5"
                      >
                        {t('explore_marketplace')}</Link>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-6">
                       <div className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight">{booking.equipment?.title}</div>
                       <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{booking.equipment?.category}</div>
                    </td>
                    <td className="p-6">
                       <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">{booking.owner?.name}</div>
                       <div className="text-[10px] text-slate-400 font-black tracking-widest mt-1">{booking.owner?.phone}</div>
                    </td>
                    <td className="p-6 text-slate-600 dark:text-slate-400 font-medium text-xs">
                       {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-6 font-black text-slate-900 dark:text-white">₹{booking.totalPrice?.toLocaleString()}</td>
                    <td className="p-6">
                      {booking.paymentStatus === 'PAID' ? (
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 w-fit">
                            PAID
                          </span>
                          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/payments/${booking.id}/invoice`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1 font-bold">
                            Download Invoice
                          </a>
                        </div>
                      ) : booking.paymentStatus === 'REFUNDED' ? (
                        <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 w-fit">
                          REFUNDED
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 w-fit">
                          {booking.paymentStatus || 'PENDING'}
                        </span>
                      )}
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm
                        ${booking.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' : 
                          booking.status === 'ACCEPTED' || booking.status === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : 
                          booking.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50' : 
                          'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50'}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      {booking.status === 'PENDING' ? (
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-4 py-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                        >
                          {t('cancel')}
                        </button>
                      ) : booking.paymentStatus === 'PAID' && (booking.status === 'CONFIRMED' || booking.status === 'ACCEPTED') ? (
                        <button 
                          onClick={() => handleRefundBooking(booking.id)}
                          className="px-4 py-2 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                        >
                          Request Refund
                        </button>
                      ) : booking.status === 'COMPLETED' ? (
                        <Link 
                          href={`/dashboard/feedback?type=equipment&id=${booking.equipment?.id}`}
                          className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-200 dark:border-indigo-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm inline-block"
                        >
                          Rate Equipment
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
