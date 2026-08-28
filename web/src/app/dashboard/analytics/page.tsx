'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Activity,
  Tractor,
  BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from 'react-i18next';

export default function OwnerAnalyticsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const analyticsRes = await api.get('/analytics/owner');
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
      showToast('Failed to load analytics data from server.', 'warning');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-4">
        <BarChart3 size={48} className="opacity-50" />
        <span className="font-bold text-lg">No analytics available</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="text-emerald-500" size={32} />
            {t('analytics')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Monitor your revenue and fleet utilization
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `₹${val}`} />
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
                <span className="text-xs font-bold uppercase tracking-wider">{t('no_revenue_data', { defaultValue: 'No Revenue Data yet' })}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t('top_equipment', { defaultValue: 'Top Equipment' })}</h3>
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
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `₹${val}`} />
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
                <span className="text-xs font-bold uppercase tracking-wider">{t('no_usage_data', { defaultValue: 'No completed rentals yet' })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
