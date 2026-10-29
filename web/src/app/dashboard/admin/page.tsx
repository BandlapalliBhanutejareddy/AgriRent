"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  Tractor,
  CalendarCheck,
  IndianRupee,
  Activity,
  ShieldAlert,
  UserCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Percent,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from "react-i18next";
import { formatCurrency } from '@/lib/formatters';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'EQUIPMENT' | 'BOOKINGS' | 'COMPLAINTS' | 'ANALYTICS'>('OVERVIEW');

  // Stats
  const [stats, setStats] = useState<any>({
    users: { total: 0, farmers: 0, owners: 0, admins: 0, suspended: 0, pendingVerification: 0 },
    equipment: { total: 0, available: 0, rented: 0, pendingModeration: 0 },
    bookings: { total: 0, pending: 0, confirmed: 0, active: 0, completed: 0, cancelled: 0, rejected: 0 },
    financial: { gmv: 0, platformRevenue: 0, ownerRevenue: 0, refunds: 0 },
    moderation: { openComplaints: 0, totalFeedback: 0 }
  });

  // Analytics states
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [equipmentAnalytics, setEquipmentAnalytics] = useState<any>(null);
  const [ownerEarnings, setOwnerEarnings] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Table Data & Pagination State
  const [users, setUsers] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [complaintsData, setComplaintsData] = useState<{ feedbacks: any[]; complaints: any[]; equipmentReviews: any[]; userReviews: any[]; }>({ feedbacks: [], complaints: [], equipmentReviews: [], userReviews: [] });

  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [apiError, setApiError] = useState(false);

  // Detail Modals
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.replace('#', '').toUpperCase();
      if (['USERS', 'EQUIPMENT', 'BOOKINGS', 'COMPLAINTS', 'ANALYTICS'].includes(hash)) {
        setActiveTab(hash as any);
      } else {
        setActiveTab('OVERVIEW');
      }
      setPage(1); // Reset page on tab change
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, page, limit, searchQuery, filterRole, filterStatus, analyticsPeriod]);

  async function fetchAnalyticsData(period: string) {
    try {
      setAnalyticsLoading(true);
      const [eqRes, earnRes] = await Promise.all([
        api.get(`/admin/equipment-analytics?period=${period}`),
        api.get(`/admin/owner-earnings?period=${period}`)
      ]);
      setEquipmentAnalytics(eqRes.data?.data || eqRes.data || null);
      setOwnerEarnings(earnRes.data?.data || earnRes.data || null);
    } catch (err: any) {
      console.error('Analytics load error:', err);
      showToast('Failed to load equipment and owner analytics.', 'warning');
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      setApiError(false);
      if (activeTab === 'OVERVIEW') {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } else if (activeTab === 'USERS') {
        const res = await api.get(`/admin/users?page=${page}&limit=${limit}&search=${searchQuery}&role=${filterRole}&status=${filterStatus}`);
        setUsers(res.data.data || []);
        setTotalItems(res.data.total || 0);
      } else if (activeTab === 'EQUIPMENT') {
        const res = await api.get(`/admin/equipment?page=${page}&limit=${limit}&search=${searchQuery}&status=${filterStatus}`);
        setEquipmentList(res.data.data || []);
        setTotalItems(res.data.total || 0);
      } else if (activeTab === 'BOOKINGS') {
        const res = await api.get(`/admin/bookings?page=${page}&limit=${limit}&search=${searchQuery}&status=${filterStatus}`);
        setBookingsList(res.data.data || []);
        setTotalItems(res.data.total || 0);
      } else if (activeTab === 'COMPLAINTS') {
        const res = await api.get('/admin/feedback-complaints');
        setComplaintsData(res.data || { feedbacks: [], complaints: [], equipmentReviews: [], userReviews: [] });
      } else if (activeTab === 'ANALYTICS') {
        await fetchAnalyticsData(analyticsPeriod);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
      showToast('Failed to load live admin data', 'warning');
      setApiError(true);
      setTotalItems(0);
      setBookingsList([]);
      setUsers([]);
      setEquipmentList([]);
    } finally {
      setLoading(false);
    }
  }

  const navigateTo = (tab: string) => {
    window.location.hash = tab.toLowerCase();
  };

  async function handleToggleUserStatus(userId: string, isSuspended: boolean) {
    try {
      await api.put(`/admin/users/${userId}/suspend`, { isSuspended: !isSuspended });
      showToast(isSuspended ? 'User un-suspended successfully' : 'User suspended', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to update user status', 'warning');
    }
  }

  async function handleVerifyOwner(userId: string, isVerified: boolean) {
    try {
      await api.put(`/admin/users/${userId}/verify`, { isVerified: !isVerified });
      showToast(isVerified ? 'Owner verification revoked' : 'Owner verified successfully!', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to verify owner', 'warning');
    }
  }

  async function handleEquipmentModeration(equipmentId: string, available: boolean) {
    try {
      await api.put(`/admin/equipment/${equipmentId}/moderation`, { available: !available });
      showToast(available ? 'Equipment listing disabled' : 'Equipment listing approved!', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to update equipment status', 'warning');
    }
  }

  async function handleUpdateComplaintStatus(complaintId: string, status: string) {
    try {
      await api.put(`/admin/complaints/${complaintId}/status`, { status });
      showToast(`Complaint status updated to ${status}`, 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to update complaint status', 'warning');
    }
  }

  async function openUserDetails(userId: string) {
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setSelectedUser(res.data);
    } catch (err) {
      showToast('Failed to load user details', 'warning');
    }
  }

  const PaginationControls = () => {
    const totalPages = Math.ceil(totalItems / limit) || 1;
    return (
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 text-xs font-semibold text-slate-500">
        <div>
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems}
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="bg-slate-100 dark:bg-slate-800 rounded p-1">
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-50"><ChevronLeft size={16} /></button>
            <span className="p-1">Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-50"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-8 md:p-10 rounded-[32px] text-white shadow-2xl border border-emerald-500/30 relative overflow-hidden backdrop-blur-xl space-y-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30 inline-flex items-center gap-1.5">
              <Activity size={12} /> AgroRent Control Center
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-2">Platform Administration</h1>
          </div>

          <div className="flex flex-wrap gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/15">
            {[
              { key: 'OVERVIEW', label: 'Overview' },
              { key: 'USERS', label: 'Users' },
              { key: 'EQUIPMENT', label: 'Equipment' },
              { key: 'BOOKINGS', label: 'Bookings' },
              { key: 'COMPLAINTS', label: 'Disputes' },
              { key: 'ANALYTICS', label: 'Analytics & Yield' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => navigateTo(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === tab.key
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && activeTab === 'OVERVIEW' && <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-[32px] animate-pulse" />}

      {/* OVERVIEW */}
      {!loading && activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div onClick={() => navigateTo('USERS')} className="cursor-pointer hover:scale-[1.02] transition-transform bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-2xl w-fit">
                <Users size={24} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Marketplace Users</span>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.users.total}</h3>
                <p className="text-xs text-indigo-500 font-bold mt-1">Farmers: {stats.users.farmers} | Owners: {stats.users.owners}</p>
              </div>
            </div>

            <div onClick={() => navigateTo('EQUIPMENT')} className="cursor-pointer hover:scale-[1.02] transition-transform bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-2xl w-fit">
                <Tractor size={24} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Fleet Equipment</span>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.equipment.total}</h3>
                <p className="text-xs text-emerald-500 font-bold mt-1">Available: {stats.equipment.available} | Rented: {stats.equipment.rented}</p>
              </div>
            </div>

            <div onClick={() => navigateTo('BOOKINGS')} className="cursor-pointer hover:scale-[1.02] transition-transform bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-2xl w-fit">
                <CalendarCheck size={24} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Bookings Volume</span>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.bookings.total}</h3>
                <p className="text-xs text-amber-500 font-bold mt-1">Active: {stats.bookings.active} | Pending: {stats.bookings.pending}</p>
              </div>
            </div>

            <div onClick={() => navigateTo('BOOKINGS')} className="cursor-pointer hover:scale-[1.02] transition-transform bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-500 rounded-2xl w-fit">
                <IndianRupee size={24} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Gross GMV</span>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.financial.gmv)}</h3>
                <p className="text-xs text-purple-500 font-bold mt-1">Platform Fee: {formatCurrency(stats.financial.platformRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-[28px] p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/50 text-amber-600 rounded-2xl">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm">Open Disputes & Complaints</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{stats.moderation.openComplaints} unresolved cases require admin moderation.</p>
                </div>
              </div>
              <button onClick={() => navigateTo('COMPLAINTS')} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0">
                Review Cases
              </button>
            </div>

            <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-[28px] p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-2xl">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">Owner Verification Requests</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{stats.users.pendingVerification} pending owners awaiting identity check.</p>
                </div>
              </div>
              <button onClick={() => navigateTo('USERS')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0">
                Manage Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {activeTab === 'USERS' && (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">User Accounts Moderation</h3>
            </div>
            <div className="flex gap-4 items-center flex-wrap">
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                <option value="All">All Roles</option>
                <option value="FARMER">Farmer</option>
                <option value="OWNER">Owner</option>
                <option value="BOTH">Both</option>
                <option value="ADMIN">Admin</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Suspended</option>
              </select>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search user..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4">User ID / Name</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Enrollment</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {apiError ? <tr><td colSpan={6} className="p-8 text-center text-red-500 text-xs font-bold">Unable to load data. <button onClick={fetchData} className="ml-2 underline">Retry</button></td></tr> : users.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-xs font-bold">No users found.</td></tr> : null}
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {u.name || 'User'}
                        <button onClick={() => openUserDetails(u.id)} className="text-emerald-600 hover:text-emerald-700"><Eye size={14} /></button>
                      </div>
                      <div className="text-xs text-slate-400">{u.email} | {u.phone || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{u.role}</span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {['OWNER', 'BOTH'].includes(u.role) ? (
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${u.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {u.isVerified ? '✓ Verified' : 'Unverified'}
                        </span>
                      ) : <span className="text-xs text-slate-400">-</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${u.isSuspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {u.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {['OWNER', 'BOTH'].includes(u.role) && (
                          <button onClick={() => handleVerifyOwner(u.id, u.isVerified)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100">
                            {u.isVerified ? 'Revoke KYC' : 'Approve KYC'}
                          </button>
                        )}
                        <button onClick={() => handleToggleUserStatus(u.id, u.isSuspended)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${u.isSuspended ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                          {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls />
        </div>
      )}

      {/* EQUIPMENT */}
      {activeTab === 'EQUIPMENT' && (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Equipment Moderation</h3>
            </div>
            <div className="flex gap-4 items-center flex-wrap">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                <option value="All">All Status</option>
                <option value="Available">Available / Approved</option>
                <option value="Disabled">Disabled</option>
              </select>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search equipment..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4">Equipment / ID</th>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {apiError ? <tr><td colSpan={6} className="p-8 text-center text-red-500 text-xs font-bold">Unable to load data. <button onClick={fetchData} className="ml-2 underline">Retry</button></td></tr> : equipmentList.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-xs font-bold">No equipment found.</td></tr> : null}
                {equipmentList.map(eq => (
                  <tr key={eq.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{eq.title}</div>
                      <div className="text-[10px] text-slate-400">{eq.category} | ID: {eq.id.slice(-6).toUpperCase()}</div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {eq.owner?.name || 'Owner'}
                      <div className="text-[10px] text-slate-400">{eq.owner?.email}</div>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-700 dark:text-slate-300">₹{eq.pricePerDay}/day</td>
                    <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{new Date(eq.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${eq.available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {eq.available ? 'APPROVED' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEquipmentModeration(eq.id, eq.available)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${eq.available ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                        {eq.available ? 'Disable' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls />
        </div>
      )}

      {/* BOOKINGS */}
      {activeTab === 'BOOKINGS' && (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Bookings & Revenue Report</h3>
            </div>
            <div className="flex gap-4 items-center flex-wrap">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                <option value="All">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search ID, farmer, owner..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4">Date / Booking ID</th>
                  <th className="p-4">Equipment</th>
                  <th className="p-4">Farmer</th>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Crop / Operation</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {apiError ? <tr><td colSpan={7} className="p-8 text-center text-red-500 text-xs font-bold">Unable to load booking data. <button onClick={fetchData} className="ml-2 underline">Retry</button></td></tr> : bookingsList.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-slate-500 text-xs font-bold">No bookings found.</td></tr> : null}
                {bookingsList.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white">{new Date(b.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{b.id.slice(-8).toUpperCase()}</div>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-700 dark:text-slate-300">{b.equipment?.title || 'Unknown'}</td>
                    <td className="p-4 text-xs">
                      <div className="font-bold text-slate-700 dark:text-slate-300">{b.farmer?.name || 'Unknown'}</div>
                      <div className="text-[10px] text-slate-400">{b.farmer?.email}</div>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="font-bold text-slate-700 dark:text-slate-300">{b.owner?.name || 'Unknown'}</div>
                      <div className="text-[10px] text-slate-400">{b.owner?.email}</div>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {b.crop ? b.crop.name : 'Not available'}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-emerald-600">{b.payment?.amount != null ? formatCurrency(b.payment.amount) : (b.totalPrice != null ? formatCurrency(b.totalPrice) : '-')}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest">{b.payment?.status || (b.status === 'COMPLETED' ? 'PAID' : 'PENDING')}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls />
        </div>
      )}

      {/* COMPLAINTS */}
      {activeTab === 'COMPLAINTS' && (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Disputes & Complaints</h3>
          </div>
          <div className="space-y-4">
            {complaintsData.complaints.length === 0 ? (
              <p className="text-center py-12 text-slate-400 font-bold text-xs">No disputes or complaints found.</p>
            ) : (
              complaintsData.complaints.map(comp => (
                <div key={comp.id} className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase tracking-wider">{comp.category}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{new Date(comp.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{comp.description}</p>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Status: <strong className="text-amber-600">{comp.status}</strong></span>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateComplaintStatus(comp.id, 'RESOLVED')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700">Resolve</button>
                      <button onClick={() => handleUpdateComplaintStatus(comp.id, 'DISMISSED')} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-300">Dismiss</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* EQUIPMENT & OWNER ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Period Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Operational Analytics & Earnings</h3>
              <p className="text-xs text-slate-500">Live metrics derived directly from real booking transactions and equipment utilization.</p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
              {[
                { key: '7d', label: 'Last 7 Days' },
                { key: '30d', label: 'Last 30 Days' },
                { key: '90d', label: 'Last 90 Days' },
                { key: 'all', label: 'All Time' }
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => setAnalyticsPeriod(p.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    analyticsPeriod === p.key
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fleet Utilization</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {equipmentAnalytics?.summary?.utilizedCount || 0} / {equipmentAnalytics?.summary?.totalEquipmentCount || 0}
              </div>
              <p className="text-[11px] text-emerald-600 font-bold">
                {equipmentAnalytics?.summary?.totalEquipmentCount
                  ? Math.round(((equipmentAnalytics?.summary?.utilizedCount || 0) / equipmentAnalytics?.summary?.totalEquipmentCount) * 100)
                  : 0}% Active Utilization
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Gross Rental Volume</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(equipmentAnalytics?.summary?.totalCompletedRevenue || 0)}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Completed Rental Value</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Collected Escrow</span>
              <div className="text-2xl font-black text-emerald-600">
                {formatCurrency(ownerEarnings?.totals?.totalCollectedAmount || 0)}
              </div>
              <p className="text-[11px] text-emerald-600/80 font-bold">Successfully Paid via PG</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-indigo-200 dark:border-indigo-900/50 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Platform Revenue (10%)</span>
              <div className="text-2xl font-black text-indigo-600">
                {formatCurrency(ownerEarnings?.totals?.totalPlatformFee || 0)}
              </div>
              <p className="text-[11px] text-indigo-500/80 font-bold">Net Owner Payout (90%): {formatCurrency(ownerEarnings?.totals?.totalOwnerNetEarnings || 0)}</p>
            </div>
          </div>

          {/* Top Rented Equipment Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Top Rented Equipment & Utilization</h3>
                <p className="text-xs text-slate-400">Ranked by actual completed rentals and demand requests</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase rounded-full">
                {equipmentAnalytics?.topRented?.length || 0} Listed Items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Equipment Title</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Owner</th>
                    <th className="py-3 px-3 text-right">Daily Rate</th>
                    <th className="py-3 px-3 text-center">Requests</th>
                    <th className="py-3 px-3 text-center">Completed</th>
                    <th className="py-3 px-3 text-right">Gross Value</th>
                    <th className="py-3 px-3 text-center">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {equipmentAnalytics?.topRented?.map((eq: any) => (
                    <tr key={eq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">{eq.title}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {eq.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{eq.ownerName}</div>
                        <div className="text-[10px] text-slate-400">{eq.ownerEmail}</div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold">{formatCurrency(eq.pricePerDay)}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">{eq.totalRequests}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-600">{eq.completedRentals}</td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(eq.grossRevenue)}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          eq.utilizationRate > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {eq.utilizationRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Best Owner Earnings Ranking */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Best Owner Earnings Ranking</h3>
                <p className="text-xs text-slate-400">Ranked by actual confirmed rental escrow collections and completed transactions</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase rounded-full">
                {ownerEarnings?.rankings?.length || 0} Registered Owners
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Owner Details</th>
                    <th className="py-3 px-3 text-center">Fleet Size</th>
                    <th className="py-3 px-3 text-center">Completed</th>
                    <th className="py-3 px-3 text-right">Gross Rental Value</th>
                    <th className="py-3 px-3 text-right">Collected Revenue</th>
                    <th className="py-3 px-3 text-right">Platform Fee (10%)</th>
                    <th className="py-3 px-3 text-right">Owner Net (90%)</th>
                    <th className="py-3 px-3 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {ownerEarnings?.rankings?.map((owner: any, idx: number) => (
                    <tr
                      key={owner.ownerId}
                      onClick={() => setSelectedUser(owner)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-3 font-black text-slate-400">#{idx + 1}</td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{owner.name}</span>
                          {idx === 0 && <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded text-[9px] font-black">TOP</span>}
                        </div>
                        <div className="text-[10px] text-slate-400">{owner.email} • {owner.phone || 'No phone'}</div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">{owner.equipmentCount} units</td>
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-600">{owner.completedRentals}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(owner.grossCompletedRentalValue)}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600">{formatCurrency(owner.actualCollectedAmount)}</td>
                      <td className="py-3.5 px-3 text-right font-mono text-indigo-600">{formatCurrency(owner.platformFee)}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">{formatCurrency(owner.ownerNetEarnings)}</td>
                      <td className="py-3.5 px-3 text-right font-mono text-amber-600">{formatCurrency(owner.outstandingPayable)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-2xl w-full p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800"><XCircle size={20} /></button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-1">Name</span><div className="font-semibold">{selectedUser.name || 'Not provided'}</div></div>
                <div><span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-1">Email</span><div className="font-semibold">{selectedUser.email}</div></div>
                <div><span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-1">Phone</span><div className="font-semibold">{selectedUser.phone || 'Not provided'}</div></div>
                <div><span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-1">Role</span><div className="font-semibold">{selectedUser.role}</div></div>
                <div><span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-1">Created At</span><div className="font-semibold">{new Date(selectedUser.createdAt).toLocaleDateString()}</div></div>
                <div><span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-1">Status</span><div className="font-semibold">{selectedUser.isSuspended ? 'Suspended' : 'Active'}</div></div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-1">Activity</span>
                <p>Bookings: {selectedUser.bookings?.length || 0}</p>
                <p>Equipment: {selectedUser.equipments?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
