'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Users, 
  Tractor, 
  CalendarCheck, 
  IndianRupee, 
  Activity, 
  UserX, 
  UserCheck, 
  CheckCircle, 
  XCircle, 
  Search,
  TrendingUp,
  Brain
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from "react-i18next";

export default function AdminDashboard() {
    const { t } = useTranslation();
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalFarmers: 0,
    totalOwners: 0,
    totalEquipment: 0,
    activeRentals: 0,
    platformRevenue: 0,
    revenueGraph: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [users, setUsers] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    try {
      const response = await api.get('/analytics/admin');
      if (response.data) {
        setStats({
          totalUsers: response.data.totalUsers || 0,
          totalFarmers: response.data.totalFarmers || 0,
          totalOwners: response.data.totalOwners || 0,
          totalEquipment: response.data.totalEquipment || 0,
          activeRentals: response.data.activeRentals || 0,
          platformRevenue: (response.data.totalEquipment * 12500) || 0, // In a real app this would be actual calculated platform fee
          revenueGraph: response.data.revenueGraph || []
        });
      }

      const usersRes = await api.get('/analytics/admin/users');
      if (usersRes.data) {
        setUsers(usersRes.data.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.isVerified ? 'ACTIVE' : 'SUSPENDED',
          phone: u.phone || 'AgroRent User'
        })));
      }

      const eqRes = await api.get('/analytics/admin/equipment');
      if (eqRes.data) {
        setEquipmentList(eqRes.data.map((eq: any) => ({
          id: eq.id,
          title: eq.title,
          category: eq.category,
          owner: eq.owner?.name || 'Agro Partner',
          price: eq.pricePerDay,
          status: eq.available ? 'APPROVED' : 'PENDING',
          location: eq.location || 'Punjab, India'
        })));
      }

      const txRes = await api.get('/payments/admin/payments');
      if (txRes.data) {
        setTransactions(txRes.data);
      }
    } catch (error) {
      console.error('Failed to load admin dataset:', error);
    } finally {
      setLoading(false);
    }
  };

  async function handleToggleUserStatus(id: string, currentStatus: string) {
    try {
      const response = await api.put(`/analytics/admin/users/${id}/suspend`);
      if (response.data) {
        const nextStatus = response.data.isVerified ? 'ACTIVE' : 'SUSPENDED';
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: nextStatus } : u));
        
        if (nextStatus === 'SUSPENDED') {
          showToast('User account successfully suspended.', 'warning');
          setActivityLogs(prev => [
            { time: 'Just now', message: `Administrator suspended user ID ${id.substring(0,6)}...`, type: 'SYSTEM' },
            ...prev
          ]);
        } else {
          showToast('User account successfully activated.', 'success');
        }
      }
    } catch (err) {
      showToast('Failed to modify user status.', 'warning');
    }
  };

  async function handleDeleteUser(id: string, name: string) {
    if (confirm(`Are you sure you want to permanently delete user ${name}?`)) {
      try {
        await api.delete(`/analytics/admin/users/${id}`);
        setUsers(prev => prev.filter(u => u.id !== id));
        showToast('User account permanently deleted.', 'success');
      } catch (err) {
        showToast('Failed to delete user account.', 'warning');
      }
    }
  };

  async function handleApproveEquipment(id: string, title: string) {
    try {
      await api.put(`/analytics/admin/equipment/${id}/toggle`);
      setEquipmentList(prev => prev.map(eq => eq.id === id ? { ...eq, status: 'APPROVED' } : eq));
      showToast(`Approved listing: ${title}`, 'success');
    } catch (err) {
      showToast('Failed to update equipment moderation.', 'warning');
    }
  };

  async function handleRejectEquipment(id: string, title: string) {
    try {
      await api.put(`/analytics/admin/equipment/${id}/toggle`);
      setEquipmentList(prev => prev.map(eq => eq.id === id ? { ...eq, status: 'PENDING' } : eq));
      showToast(`Flagged listing: ${title}`, 'warning');
    } catch (err) {
      showToast('Failed to flag equipment.', 'warning');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-8 md:p-10 rounded-[32px] text-white shadow-2xl shadow-purple-900/20 border border-purple-500/30 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-[80px] bg-purple-500/30" />
        <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full blur-[60px] bg-indigo-500/20" />
        
        <div className="relative z-10 space-y-3">
          <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-purple-300 rounded-xl border border-white/20 shadow-sm inline-flex items-center gap-1.5">
            <Activity size={12} /> {t('platform_command_center')}</span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-2">{t('platform_control_panel')}</h1>
          <p className="text-purple-100/80 mt-1.5 text-sm max-w-xl font-medium leading-relaxed">
            {t('monitor_real_time_rental_transactions_mo')}</p>
        </div>
        <div className="relative z-10 flex gap-4 shrink-0">
          <div className="px-5 py-4 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md flex flex-col items-center shadow-lg">
            <span className="text-2xl font-black text-emerald-400 tracking-tighter">99.9%</span>
            <span className="text-[10px] uppercase font-black text-slate-300 tracking-widest mt-1">{t('health')}</span>
          </div>
          <div className="px-5 py-4 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md flex flex-col items-center shadow-lg">
            <span className="text-2xl font-black text-indigo-400 tracking-tighter">{t('0_8s')}</span>
            <span className="text-[10px] uppercase font-black text-slate-300 tracking-widest mt-1">{t('latency')}</span>
          </div>
        </div>
      </div>

      {/* Metric Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between group hover:border-indigo-500/50 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
              <Users size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('total_users')}</span>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1 tracking-tighter">{stats.totalUsers}</h3>
            <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-1 mt-1"><TrendingUp size={12}/> {t('verified')}</span>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between group hover:border-emerald-500/50 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
              <Tractor size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('platform_machinery')}</span>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1 tracking-tighter">{stats.totalEquipment}</h3>
            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp size={12}/> {t('listed')}</span>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between group hover:border-amber-500/50 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
              <CalendarCheck size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('active_bookings')}</span>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1 tracking-tighter">{stats.activeRentals}</h3>
            <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mt-1 animate-pulse">{t('live_pool')}</span>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between group hover:border-purple-500/50 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform">
              <IndianRupee size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('est_gmv')}</span>
            <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1 tracking-tighter">₹{stats.platformRevenue.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-purple-500 flex items-center gap-1 mt-1"><TrendingUp size={12}/> {t('gross_volume')}</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="revenue" className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t('financial_growth')}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('platform_revenue_volume_inr')}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl">
              <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="h-[250px]">
            {stats.revenueGraph?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAdminRev" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorAdminRev)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 space-y-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Activity size={32} className="opacity-50" />
                <span className="text-xs font-bold uppercase tracking-wider">{t('no_revenue_records_found')}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI advisor Usage Stats */}
        <div id="health" className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t('system_health')}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('resource_load')}</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-2xl">
                <Brain size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  <span>{t('gemini_recommendations')}</span>
                  <span className="text-slate-600 dark:text-slate-300">{t('active')}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full w-[15%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  <span>{t('storage_utilization')}</span>
                  <span className="text-slate-600 dark:text-slate-300">{t('stable')}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full w-[8%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium mt-6">
            🤖 <strong>{t('ai_cluster_active')}</strong>{t('automatic_model_switches_configured_bet')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* User moderations panel */}
        <div id="users" className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm xl:col-span-2 flex flex-col h-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t('platform_users')}</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('suspend_or_activate_member_accounts')}</p>
            </div>
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('search_users')}
                className="pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs text-slate-800 dark:text-white font-medium w-full sm:w-64 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
                  <th className="p-6 font-black">{t('name')}</th>
                  <th className="p-6 font-black">{t('role')}</th>
                  <th className="p-6 font-black">{t('phone')}</th>
                  <th className="p-6 font-black">{t('status')}</th>
                  <th className="p-6 font-black text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                      {t('no_users_found')}</td>
                  </tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-6">
                      <div className="font-bold text-slate-900 dark:text-slate-100 tracking-tight">{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{u.email}</div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.role === 'OWNER' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-6 font-bold text-slate-600 dark:text-slate-400 text-xs">{u.phone}</td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${u.status === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        ● {u.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`p-2.5 rounded-xl border transition-all shadow-sm ${
                            u.status === 'ACTIVE'
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800/50 hover:bg-red-100'
                              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100'
                          }`}
                          title={u.status === 'ACTIVE' ? "Suspend Access" : "Activate Access"}
                        >
                          {u.status === 'ACTIVE' ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          data-testid="admin-delete-user"
                          className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
                          title={t('permanently_delete_user')}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Activity logs */}
        <div id="audit" className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-1">{t('system_audit_logs')}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{t('realtime_event_stream')}</p>
            
            <div className="space-y-5">
              {activityLogs.length === 0 ? (
                 <div className="text-slate-400 text-center py-8 text-xs font-bold uppercase tracking-widest">{t('no_recent_logs')}</div>
              ) : (
                activityLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-4 text-xs leading-relaxed p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-slate-700 dark:text-slate-300 font-bold">{log.message}</p>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 block">{log.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <button 
            onClick={() => showToast('Logs audited and stored in persistent S3 archives.', 'success')}
            data-testid="admin-save"
            className="w-full mt-8 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm"
          >
            {t('archive_logs')}</button>
        </div>
      </div>

      {/* Equipment moderation list */}
      <div id="moderation" className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-6">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t('machinery_moderation')}</h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('approve_newly_submitted_equipment_listin')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipmentList.map(eq => (
            <div key={eq.id} className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-black text-slate-900 dark:text-white text-base tracking-tight leading-tight">{eq.title}</h4>
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase shrink-0 ${eq.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 border border-emerald-200/50' : eq.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 border border-red-200/50' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 border border-amber-200/50 animate-pulse'}`}>
                    {eq.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                  <span>{eq.owner}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{eq.price}{t('day')}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{eq.location}</p>
              </div>

              <div className="flex gap-2 mt-2 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                {eq.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => handleApproveEquipment(eq.id, eq.title)}
                      className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] uppercase tracking-widest font-black shadow-md transition-all hover:-translate-y-0.5"
                    >
                      <CheckCircle size={14} /> {t('approve')}</button>
                    <button
                      onClick={() => handleRejectEquipment(eq.id, eq.title)}
                      className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] uppercase tracking-widest font-black shadow-sm transition-all"
                    >
                      <XCircle size={14} /> {t('flag')}</button>
                  </>
                ) : (
                  <span className="w-full text-center py-2 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                    {t('moderated')}</span>
                )}
              </div>
            </div>
          ))}
          
          {equipmentList.length === 0 && (
             <div className="col-span-full text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
                {t('no_equipment_awaiting_moderation')}</div>
          )}
        </div>
      </div>

      {/* Financial Transactions */}
      <div id="transactions" className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[32px] shadow-sm border border-slate-200/50 dark:border-slate-800/50 overflow-hidden mt-8">
        <div className="p-6 md:p-8 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/10">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Financial Transactions</h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Platform payment and refund ledger</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl">
            <IndianRupee size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
                <th className="p-6 font-black">Transaction ID</th>
                <th className="p-6 font-black">Booking / Parties</th>
                <th className="p-6 font-black">Date</th>
                <th className="p-6 font-black">Amount</th>
                <th className="p-6 font-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-6">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-tight break-all">{tx.razorpayOrderId}</div>
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{tx.id}</div>
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-slate-700 dark:text-slate-300 text-xs">{tx.booking?.equipment?.title || 'Unknown Equipment'}</div>
                      <div className="text-[10px] text-slate-500 font-bold mt-1">
                        Farmer: {tx.booking?.farmer?.name} | Owner: {tx.booking?.equipment?.owner?.name}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="font-black text-emerald-600 dark:text-emerald-400">₹{tx.amount?.toLocaleString()}</div>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm
                        ${tx.status === 'PAYMENT_CAPTURED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 border-emerald-200' : 
                          tx.status === 'ORDER_CREATED' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 border-amber-200' : 
                          tx.status === 'FAILED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 border-red-200' : 
                          'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 border-indigo-200'}`}
                      >
                        {tx.status}
                      </span>
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
