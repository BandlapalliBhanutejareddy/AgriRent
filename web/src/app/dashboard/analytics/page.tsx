'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Activity,
  Tractor,
  BarChart3,
  IndianRupee,
  CalendarDays,
  FileText,
  Search
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';

export default function OwnerAnalyticsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterEquipment, setFilterEquipment] = useState('');
  const [filterFarmer, setFilterFarmer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [analyticsRes, reportRes] = await Promise.all([
        api.get('/analytics/owner'),
        api.get('/analytics/owner/bookings?limit=100')
      ]);
      setAnalytics(analyticsRes.data);
      setReport(reportRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
      showToast('Failed to load analytics data from server.', 'warning');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredReport = report.filter(r => {
    if (filterEquipment && !r.equipment?.name?.toLowerCase().includes(filterEquipment.toLowerCase())) return false;
    if (filterFarmer && !r.farmer?.name?.toLowerCase().includes(filterFarmer.toLowerCase())) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-400 space-y-4 bg-red-50 dark:bg-red-900/10 rounded-[32px] border border-red-100 dark:border-red-900/30 m-6">
        <BarChart3 size={48} className="opacity-50" />
        <span className="font-bold text-lg">{t('analytics.serverError', 'Failed to load analytics data from server.')}</span>
      </div>
    );
  }

  if (report.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-4 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-slate-100 dark:border-slate-800 m-6">
        <BarChart3 size={48} className="opacity-50" />
        <span className="font-bold text-lg">{t('analytics.noData', 'No analytics available')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="text-emerald-500" size={32} />
            {t('revenueReports', 'Revenue Reports & Analytics')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Monitor your revenue and fleet utilization deterministically
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-semibold text-slate-500 uppercase">{t('analytics.rentalValueGenerated', 'Rental Value Generated')}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{formatCurrency(analytics.totalRevenue)}</p>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{t('analytics.allTime', 'ALL TIME')}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">{t('analytics.completedRentals', 'Completed Rentals')}</p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-2">{analytics.completedBookings || 0}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border border-amber-100 dark:border-amber-800 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">{t('analytics.pendingBookings', 'Pending Bookings')}</p>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-2">{analytics.pendingBookings || 0}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">{t('analytics.activeRentals', 'Active Rentals')}</p>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-2">{analytics.activeRentals || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t('revenue_growth', 'Revenue Growth')}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('yield_returns', 'Yield returns in INR')}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl">
              <Activity size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="h-[250px] w-full">
            {analytics.monthlyRevenue?.length > 0 && analytics.monthlyRevenue.some((r: any) => r.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.1} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `Ã¢â€šÂ¹${val}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 space-y-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Activity size={32} className="opacity-50" />
                <span className="text-xs font-bold uppercase tracking-wider">{t('no_revenue_data', 'No Revenue Data yet')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t('top_equipment', 'Top Equipment')}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Revenue by equipment</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
              <Tractor size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="h-[250px] w-full">
            {analytics.topEquipment?.length > 0 && analytics.topEquipment.some((r: any) => r.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topEquipment} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.1} />
                  <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `Ã¢â€šÂ¹${val}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ color: '#3B82F6', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                  />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 space-y-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Tractor size={32} className="opacity-50" />
                <span className="text-xs font-bold uppercase tracking-wider">{t('no_usage_data', 'No completed rentals yet')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm flex items-center gap-2">
            <FileText size={16} className="text-emerald-500"/>
            {t('revenueReportData', 'Revenue Data Table')}
          </h3>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Filter Equipment..."
                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-sm w-40"
                value={filterEquipment}
                onChange={(e) => setFilterEquipment(e.target.value)}
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Filter Farmer..."
                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-sm w-40"
                value={filterFarmer}
                onChange={(e) => setFilterFarmer(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">{t('analytics.filteredRentalValue', 'Filtered Rental Value')}</p>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
              {formatCurrency(filteredReport.filter((b: any) => ['COMPLETED', 'ACTIVE', 'RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'ACCEPTED'].includes(b.status)).reduce((sum, r) => sum + (r.totalPrice || 0), 0))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500 uppercase">{t('analytics.records', 'Records')}</p>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{filteredReport.length}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="pb-3 text-slate-500 font-medium">{t('analytics.date', 'Date')}</th>
                <th className="pb-3 text-slate-500 font-medium">{t('analytics.bookingId', 'Booking ID')}</th>
                <th className="pb-3 text-slate-500 font-medium">{t('analytics.equipment', 'Equipment')}</th>
                <th className="pb-3 text-slate-500 font-medium">{t('analytics.farmer', 'Farmer')}</th>
                <th className="pb-3 text-slate-500 font-medium">{t('analytics.rentalPeriod', 'Rental Period')}</th>
                <th className="pb-3 text-slate-500 font-medium text-right">{t('analytics.amount', 'Amount')}</th>
                <th className="pb-3 text-slate-500 font-medium text-center">{t('analytics.bookingStatus', 'Booking Status')}</th>
                <th className="pb-3 text-slate-500 font-medium text-center">{t('analytics.paymentStatus', 'Payment Status')}</th>
                <th className="pb-3 text-slate-500 font-medium text-right">{t('analytics.amountPaid', 'Amount Paid')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReport.map((r: any) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 font-mono text-xs text-slate-500">{r.id.slice(0, 8)}...</td>
                  <td className="py-4 font-medium">{r.equipment?.name || r.equipment?.title || 'Unknown'}</td>
                  <td className="py-4 text-slate-600 dark:text-slate-400">{r.farmer?.name || 'Unknown'}</td>
                  <td className="py-4">{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
                  <td className="py-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(r.totalPrice || 0)}</td>
                  <td className="py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      r.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      r.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      r.paymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {r.paymentStatus || 'PENDING'}
                    </span>
                  </td>
                  <td className="py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(r.amountPaid || 0)}
                  </td>
                </tr>
              ))}
              {filteredReport.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No revenue data matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
