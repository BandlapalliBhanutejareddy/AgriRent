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
        api.get('/bookings'),
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-8 md:p-10 rounded-[32px] text-white shadow-2xl shadow-blue-900/20 border border-blue-500/30 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] bg-indigo-500/40" />
        <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full blur-[60px] bg-blue-400/20" />
        
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
          <div className="px-5 py-4 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md text-center shadow-lg">
            <span className="block text-[10px] uppercase font-black text-blue-200 tracking-widest">{t('fleet_util', { defaultValue: 'Fleet Util.' })}</span>
            <span className="text-2xl font-black text-white mt-1 block">84%</span>
          </div>
          <div className="px-5 py-4 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md text-center shadow-lg">
            <span className="block text-[10px] uppercase font-black text-blue-200 tracking-widest">{t('rating', { defaultValue: 'Rating' })}</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">4.9 ★</span>
          </div>
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

      {/* Analytics Charts Row */}
      {analytics && (
        <div id="analytics" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t('revenue_growth', { defaultValue: 'Revenue Growth' })}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('yield_returns', { defaultValue: 'Yield returns in INR' })}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl">
                <Activity size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="h-[250px] w-full">
              {analytics.revenueGraph?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.revenueGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                      itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 space-y-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Activity size={32} className="opacity-50" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t('no_revenue_data', { defaultValue: 'No Revenue Data' })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t('deployment_rate', { defaultValue: 'Deployment Rate' })}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('aggregated_utilization', { defaultValue: 'Aggregated utilization' })}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
                <Tractor size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="h-[250px] w-full">
              {analytics.revenueGraph?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.revenueGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                      itemStyle={{ color: '#3B82F6', fontWeight: 'bold' }}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                    />
                    <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 space-y-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Tractor size={32} className="opacity-50" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t('no_usage_data', { defaultValue: 'No Usage Data' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div id="bookings" className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[32px] shadow-sm border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/10">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('live_booking_requests', { defaultValue: 'Live Booking Requests' })}</h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">{t('manage_farmer_requests', { defaultValue: 'Manage and moderate farmer requests' })}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
                <th className="p-6 font-black">{t('machinery', { defaultValue: 'Machinery' })}</th>
                <th className="p-6 font-black">{t('renting_farmer', { defaultValue: 'Renting Farmer' })}</th>
                <th className="p-6 font-black">{t('dates', { defaultValue: 'Dates' })}</th>
                <th className="p-6 font-black">{t('yield', { defaultValue: 'Yield' })}</th>
                <th className="p-6 font-black">{t('status', { defaultValue: 'Status' })}</th>
                <th className="p-6 font-black text-right">{t('actions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-slate-400 dark:text-slate-500">
                    <Clock className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={32} />
                    <span className="font-bold">{t('no_active_proposals', { defaultValue: 'No active booking proposals yet.' })}</span>
                    <p className="text-xs mt-1">{t('complete_registry_prompt', { defaultValue: 'Complete your fleet registry to attract rentals!' })}</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                             {booking.equipment?.name?.charAt(0) || 'T'}
                        </div>
                        <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight">{booking.equipment?.name || 'Mahindra Arjun'}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{booking.equipment?.category || 'Tractor'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">{booking.farmer?.name || 'Ramesh Kumar'}</div>
                      <div className="text-[10px] text-slate-400 font-black tracking-widest mt-1">{booking.farmer?.phone}</div>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {new Date(booking.startDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="font-black text-slate-900 dark:text-white">₹{booking.totalPrice.toLocaleString()}</div>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm
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
                        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleUpdateStatus(booking.id, 'ACCEPTED')}
                            className="p-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                            title={t('accept_request')}
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(booking.id, 'REJECTED')}
                            className="p-2.5 bg-white dark:bg-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
                            title={t('reject_request')}
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setSelectedBooking(booking)}
                          className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline transition-colors uppercase tracking-widest px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50"
                        >
                          {t('invoice_details', { defaultValue: 'Invoice Details' })}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Invoice Dialog Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl w-full max-w-md rounded-[32px] p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl space-y-8"
            >
              <div className="flex items-center justify-between pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
                <div>
                  <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">{t('rental_invoice_summary', { defaultValue: 'Rental Invoice Summary' })}</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">{t('id')}{selectedBooking.id}</span>
                </div>
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-2xl transition-all"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-4 border border-slate-200/50 dark:border-slate-700/50">
                  <Tractor size={32} className="text-blue-500 shrink-0" />
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{selectedBooking.equipment?.name || 'Swaraj Tractor'}</h4>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1 block">{selectedBooking.equipment?.category}</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-3">
                    <span className="text-slate-400 font-black uppercase tracking-widest">{t('farmer_name', { defaultValue: 'Farmer Name' })}</span>
                    <span className="font-bold text-slate-800 dark:text-white">{selectedBooking.farmer?.name || 'Ramesh Kumar'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-3">
                    <span className="text-slate-400 font-black uppercase tracking-widest">{t('farmer_contact', { defaultValue: 'Farmer Contact' })}</span>
                    <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" /> {selectedBooking.farmer?.phone}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-3">
                    <span className="text-slate-400 font-black uppercase tracking-widest">{t('duration', { defaultValue: 'Duration' })}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                      <CalendarDays size={12} className="text-slate-400" /> {new Date(selectedBooking.startDate).toLocaleDateString()} {t('to')}{new Date(selectedBooking.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-black pt-3">
                    <span className="text-slate-900 dark:text-white tracking-tight">{t('grand_total_payout', { defaultValue: 'Grand Total Payout' })}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">₹{selectedBooking.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-5 border border-blue-100 dark:border-blue-900/40 rounded-2xl text-[10px] text-blue-800 dark:text-blue-300 leading-relaxed font-bold flex gap-3 shadow-inner">
                <ShieldCheck size={20} className="shrink-0 text-blue-500" />
                <p>{t('escrow_protection', { defaultValue: 'This transaction is fully protected under AgroRent Escrow Protection. Security deposit of 20% is held until machinery is safely returned.' })}</p>
              </div>

              <button 
                onClick={() => setSelectedBooking(null)}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all hover:-translate-y-0.5"
              >
                {t('close_receipt', { defaultValue: 'Close Receipt' })}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
