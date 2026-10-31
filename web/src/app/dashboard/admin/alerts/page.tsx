"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import {
  Bell,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Tractor,
  AlertTriangle,
  RefreshCw,
  Search,
  MessageSquare,
  Clock,
  Layers,
  ArrowRight,
  Eye,
  Users,
  CheckCheck
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

type TabType = 'VERIFICATIONS' | 'MODERATION' | 'COMPLAINTS' | 'BROADCASTS';

export default function AdminActionCenterPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('VERIFICATIONS');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Summary Metrics
  const [stats, setStats] = useState({
    pendingVerification: 0,
    pendingModeration: 0,
    openComplaints: 0
  });

  // Data lists
  const [owners, setOwners] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Broadcast Alert Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'FARMER' | 'OWNER'>('ALL');
  const [broadcastCategory, setBroadcastCategory] = useState<'GENERAL' | 'WEATHER' | 'EQUIPMENT' | 'SUBSIDY' | 'MAINTENANCE' | 'SYSTEM'>('GENERAL');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Recipients Read Receipt Drill-down Modal State
  const [selectedBroadcast, setSelectedBroadcast] = useState<any | null>(null);
  const [recipientsData, setRecipientsData] = useState<any | null>(null);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipientsTab, setRecipientsTab] = useState<'ALL' | 'WATCHED' | 'UNWATCHED'>('ALL');
  const [recipientSearch, setRecipientSearch] = useState('');

  async function handleOpenRecipientsModal(item: any) {
    setSelectedBroadcast(item);
    setRecipientsData(null);
    setRecipientsTab('ALL');
    setRecipientSearch('');
    try {
      setLoadingRecipients(true);
      const broadcastKey = item.broadcastId || item.id;
      const res = await api.get(`/admin/alerts/${broadcastKey}/recipients`);
      setRecipientsData(res.data);
    } catch (err: any) {
      console.error('Failed to load recipient details', err);
      showToast('Could not load recipient read receipt list', 'error');
    } finally {
      setLoadingRecipients(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      const [statsRes, usersRes, equipRes, complaintsRes, historyRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: {} })),
        api.get('/admin/users', { params: { role: 'OWNER', limit: 50 } }).catch(() => ({ data: { data: [] } })),
        api.get('/admin/equipment', { params: { limit: 50 } }).catch(() => ({ data: { data: [] } })),
        api.get('/admin/feedback-complaints').catch(() => ({ data: { complaints: [] } })),
        api.get('/admin/alerts/history').catch(() => ({ data: { logs: [] } }))
      ]);

      const s = statsRes.data || {};
      setStats({
        pendingVerification: s.users?.pendingVerification ?? 0,
        pendingModeration: s.equipment?.pendingModeration ?? 0,
        openComplaints: s.moderation?.openComplaints ?? 0
      });

      const userList = usersRes.data?.data || usersRes.data?.users || (Array.isArray(usersRes.data) ? usersRes.data : []);
      setOwners(userList);

      const equipList = equipRes.data?.data || (Array.isArray(equipRes.data) ? equipRes.data : []);
      setEquipment(equipList);

      const complaintList = complaintsRes.data?.complaints || [];
      setComplaints(complaintList);

      const logsList = historyRes.data?.logs || [];
      setBroadcastHistory(logsList);
    } catch (err) {
      console.error('Failed to load admin action center data', err);
      showToast('Failed to load alerts & action center data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadAllData();
  }

  // 1. Owner Verification Action
  async function handleVerifyOwner(userId: string, isVerified: boolean) {
    try {
      await api.put(`/admin/users/${userId}/verify`, { isVerified });
      setOwners(prev =>
        prev.map(u => (u.id === userId ? { ...u, isVerified } : u))
      );
      setStats(prev => ({
        ...prev,
        pendingVerification: Math.max(0, isVerified ? prev.pendingVerification - 1 : prev.pendingVerification + 1)
      }));
      showToast(isVerified ? 'Owner identity verified successfully' : 'Owner verification revoked', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update owner verification', 'error');
    }
  }

  // 2. Equipment Moderation Action
  async function handleModerateEquipment(equipmentId: string, available: boolean) {
    try {
      await api.put(`/admin/equipment/${equipmentId}/moderation`, {
        available,
        reason: available ? 'Approved by admin' : 'Disabled by administrator'
      });
      setEquipment(prev =>
        prev.map(e => (e.id === equipmentId ? { ...e, available } : e))
      );
      showToast(available ? 'Equipment listing approved and published' : 'Equipment listing disabled', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update equipment moderation', 'error');
    }
  }

  // 3. Complaint Status Action
  async function handleResolveComplaint(complaintId: string, status: 'RESOLVED' | 'DISMISSED') {
    try {
      await api.put(`/admin/complaints/${complaintId}/status`, {
        status,
        adminNotes: status === 'RESOLVED' ? 'Issue investigated and resolved by Admin' : 'Complaint dismissed after review'
      });
      setComplaints(prev =>
        prev.map(c => (c.id === complaintId ? { ...c, status } : c))
      );
      setStats(prev => ({
        ...prev,
        openComplaints: Math.max(0, prev.openComplaints - 1)
      }));
      showToast(`Complaint status updated to ${status}`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update complaint status', 'error');
    }
  }

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast('Please enter both headline title and message body', 'error');
      return;
    }
    try {
      setSendingBroadcast(true);
      let res;
      try {
        res = await api.post('/admin/alerts/send', {
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          targetRole: broadcastTarget,
          category: broadcastCategory,
          type: 'ADMIN_BROADCAST'
        });
      } catch (sendErr) {
        res = await api.post('/admin/alerts/broadcast', {
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          targetRole: broadcastTarget,
          category: broadcastCategory,
          type: 'ADMIN_BROADCAST'
        });
      }
      showToast(res.data?.message || 'Broadcast alert dispatched successfully', 'success');
      setShowBroadcastModal(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      api.get('/admin/alerts/history').then(r => setBroadcastHistory(r.data?.logs || [])).catch(() => { });
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || 'Failed to dispatch alert', 'error');
    } finally {
      setSendingBroadcast(false);
    }
  }

  const allRecipients = recipientsData?.recipients || [
    ...(recipientsData?.watchedUsers || []),
    ...(recipientsData?.unwatchedUsers || [])
  ];

  const filteredRecipients = allRecipients.filter((r: any) => {
    if (recipientsTab === 'WATCHED' && !(r.read || r.watched)) return false;
    if (recipientsTab === 'UNWATCHED' && (r.read || r.watched)) return false;
    if (recipientSearch.trim()) {
      const q = recipientSearch.toLowerCase().trim();
      const matchName = (r.name || '').toLowerCase().includes(q);
      const matchEmail = (r.email || '').toLowerCase().includes(q);
      const matchRole = (r.role || '').toLowerCase().includes(q);
      const matchPhone = (r.phone || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchRole || matchPhone;
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-8 rounded-[32px] text-white shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-white/10 text-purple-400 rounded-xl text-xs font-black uppercase tracking-wider border border-white/10 inline-flex items-center gap-1.5">
            <Bell size={13} /> Administrative Operations Center
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2">
            Alerts & Interactive Action Center
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Conduct owner identity approvals, moderate equipment fleet listings, broadcast alerts, and resolve farmer disputes in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 active:scale-95"
          >
            <Bell size={14} />
            <span>Send Broadcast Alert</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-white/15 flex items-center gap-2 active:scale-95"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Action Cards (Clickable) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => setActiveTab('VERIFICATIONS')}
          className={`p-6 rounded-3xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${activeTab === 'VERIFICATIONS'
            ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Identity Verification
            </span>
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-xl">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-3">
            {stats.pendingVerification}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-between">
            <span>Owners awaiting verification</span>
            <ArrowRight size={13} className="text-blue-500" />
          </p>
        </div>

        <div
          onClick={() => setActiveTab('MODERATION')}
          className={`p-6 rounded-3xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${activeTab === 'MODERATION'
            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Fleet Moderation
            </span>
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 rounded-xl">
              <Tractor size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-3">
            {equipment.filter(e => !e.available).length || stats.pendingModeration}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-between">
            <span>Equipment items needing moderation</span>
            <ArrowRight size={13} className="text-amber-500" />
          </p>
        </div>

        <div
          onClick={() => setActiveTab('COMPLAINTS')}
          className={`p-6 rounded-3xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${activeTab === 'COMPLAINTS'
            ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/20'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Dispute Resolution
            </span>
            <div className="p-2.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 rounded-xl">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-3">
            {complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'DISMISSED').length || stats.openComplaints}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-between">
            <span>Active unresolved complaints</span>
            <ArrowRight size={13} className="text-rose-500" />
          </p>
        </div>
      </div>

      {/* Main Action Workspace */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('VERIFICATIONS')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'VERIFICATIONS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
            >
              Owner Verifications ({owners.filter(o => !o.isVerified).length})
            </button>

            <button
              onClick={() => setActiveTab('MODERATION')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'MODERATION'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
            >
              Equipment Moderation ({equipment.length})
            </button>

            <button
              onClick={() => setActiveTab('COMPLAINTS')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'COMPLAINTS'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
            >
              Complaints Center ({complaints.length})
            </button>

            <button
              onClick={() => setActiveTab('BROADCASTS')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'BROADCASTS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
            >
              Broadcast History ({broadcastHistory.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter current view..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Tab 1: Owner Verifications */}
        {activeTab === 'VERIFICATIONS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-850 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6">Owner Identity</th>
                  <th className="py-4 px-4">Contact</th>
                  <th className="py-4 px-4">Role</th>
                  <th className="py-4 px-4 text-center">Verification Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {owners
                  .filter(o => !searchQuery || o.name?.toLowerCase().includes(searchQuery.toLowerCase()) || o.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((owner) => (
                    <tr key={owner.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {owner.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {owner.id.slice(0, 10)}...</div>
                      </td>
                      <td className="py-4 px-4 font-medium">
                        <div>{owner.email}</div>
                        {owner.phone && <div className="text-[11px] text-slate-400">{owner.phone}</div>}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {owner.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {owner.isVerified ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400">
                            Pending Verification
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {owner.isVerified ? (
                          <button
                            onClick={() => handleVerifyOwner(owner.id, false)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerifyOwner(owner.id, true)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                          >
                            Approve Identity
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Equipment Moderation */}
        {activeTab === 'MODERATION' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-850 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6">Machinery Listing</th>
                  <th className="py-4 px-4">Owner</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4 text-right">Rate</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {equipment
                  .filter(e => !searchQuery || e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || e.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl || '/equipment/tractor.jpg'}
                            alt={item.title}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                            <div className="text-[10px] text-slate-400">{item.location || 'Location Not Specified'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {item.owner?.name || 'Verified Owner'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-black font-mono text-slate-900 dark:text-white">
                        {formatCurrency(item.pricePerDay)}/day
                      </td>
                      <td className="py-4 px-4 text-center">
                        {item.available ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                            Available & Live
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
                            Disabled / Offline
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {item.available ? (
                          <button
                            onClick={() => handleModerateEquipment(item.id, false)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Disable Listing
                          </button>
                        ) : (
                          <button
                            onClick={() => handleModerateEquipment(item.id, true)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                          >
                            Approve Listing
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Complaints & Moderation */}
        {activeTab === 'COMPLAINTS' && (
          <div className="overflow-x-auto">
            {complaints.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="font-bold text-sm">No Open Complaints</p>
                <p className="text-xs mt-1">Platform dispute queue is clear.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-850 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Category & Issue</th>
                    <th className="py-4 px-4">Priority</th>
                    <th className="py-4 px-4">Complainant / Target</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Resolution Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {complaints
                    .filter(c => !searchQuery || c.description?.toLowerCase().includes(searchQuery.toLowerCase()) || c.category?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((complaint) => {
                      const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'DISMISSED';
                      return (
                        <tr key={complaint.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-4 px-6 max-w-xs">
                            <div className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider text-purple-600 dark:text-purple-400">
                              {complaint.category || 'General Complaint'}
                            </div>
                            <div className="text-xs text-slate-700 dark:text-slate-300 mt-1 line-clamp-2">
                              {complaint.description}
                            </div>
                            {complaint.adminNotes && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 italic">
                                Note: {complaint.adminNotes}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${complaint.priority === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-200' :
                              complaint.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                              {complaint.priority || 'MEDIUM'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-mono text-[10px] text-slate-400">User: {complaint.userId?.slice(0, 10)}...</div>
                            {complaint.bookingId && (
                              <div className="font-mono text-[10px] text-indigo-400">Booking: {complaint.bookingId.slice(0, 10)}...</div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isResolved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                              {complaint.status || 'OPEN'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {!isResolved && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleResolveComplaint(complaint.id, 'RESOLVED')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                                >
                                  Resolve
                                </button>
                                <button
                                  onClick={() => handleResolveComplaint(complaint.id, 'DISMISSED')}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 4. BROADCASTS HISTORY TAB */}
        {activeTab === 'BROADCASTS' && (
          <div className="overflow-x-auto">
            {broadcastHistory.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={36} />
                <p className="text-slate-500 font-bold text-sm">No broadcast alerts recorded yet.</p>
                <p className="text-slate-400 text-xs mt-1">Dispatched enterprise alerts will appear here with delivery details.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-6">Timestamp</th>
                    <th className="py-3 px-6">Target Audience</th>
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6">Headline Title</th>
                    <th className="py-3 px-6">Recipients Reached</th>
                    <th className="py-3 px-6">Watched Status</th>
                    <th className="py-3 px-6 text-right">Recipient Tracking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {broadcastHistory.map((item, idx) => {
                    const meta = item.metadata ? (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata) : {};
                    const audience = item.audience || meta.audience || 'ALL';
                    const category = item.category || meta.category || 'GENERAL';
                    const title = item.title || meta.title || 'Broadcast Alert';
                    const message = item.message || meta.message || '';
                    const count = item.recipientCount ?? meta.recipientCount ?? item.deliveredCount ?? meta.deliveredCount ?? 0;
                    const watched = item.acknowledgedCount ?? meta.acknowledgedCount ?? 0;
                    const percentage = item.readPercentage ?? meta.readPercentage ?? (count > 0 ? Math.round((watched / count) * 100) : 0);

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-4 px-6 text-slate-500 text-[11px] whitespace-nowrap">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent'}
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                            {audience}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 dark:text-white">{title}</div>
                          {message && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                              {message}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {count} {count === 1 ? 'user' : 'users'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              watched > 0
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {watched} / {count} watched ({percentage}%)
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleOpenRecipientsModal(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold transition-all shadow-sm border border-purple-200 dark:border-purple-800"
                          >
                            <Users size={13} />
                            <span>Who Watched?</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Broadcast Alert Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded-2xl">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Send Broadcast Alert
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Dispatch an urgent broadcast notice to platform users.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Target Audience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ALL', label: 'All Users' },
                    { id: 'FARMER', label: 'Farmers' },
                    { id: 'OWNER', label: 'Owners' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBroadcastTarget(item.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition-all ${broadcastTarget === item.id
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Alert Category
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {(['GENERAL', 'WEATHER', 'EQUIPMENT', 'SUBSIDY', 'MAINTENANCE', 'SYSTEM'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setBroadcastCategory(cat)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase transition-all ${broadcastCategory === cat
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Headline Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical Weather Advisory or Subsidy Announcement"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Message Body
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detailed instructions or operational alert for selected recipients..."
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  disabled={sendingBroadcast}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {sendingBroadcast ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <span>Dispatch Alert</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipient Watched / Unwatched Tracking Modal */}
      {selectedBroadcast && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    {selectedBroadcast.audience || 'ALL'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {selectedBroadcast.category || 'GENERAL'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedBroadcast.createdAt ? new Date(selectedBroadcast.createdAt).toLocaleString() : ''}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5">
                  {selectedBroadcast.title || 'Broadcast Alert'}
                </h3>
                {selectedBroadcast.message && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                    "{selectedBroadcast.message}"
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setSelectedBroadcast(null); setRecipientsData(null); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-3 gap-3 my-4 shrink-0">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Dispatched</span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {recipientsData?.stats?.totalRecipients ?? selectedBroadcast.recipientCount ?? 0}
                </span>
              </div>
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Watched / Seen</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {recipientsData?.stats?.acknowledgedCount ?? selectedBroadcast.acknowledgedCount ?? 0}
                </span>
              </div>
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-800/50 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Not Watched (Pending)</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                  {recipientsData?.stats?.unreadCount ?? (selectedBroadcast.recipientCount - (selectedBroadcast.acknowledgedCount || 0))}
                </span>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 shrink-0">
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setRecipientsTab('ALL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    recipientsTab === 'ALL'
                      ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  All ({recipientsData?.stats?.totalRecipients ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientsTab('WATCHED')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    recipientsTab === 'WATCHED'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  Watched ({recipientsData?.stats?.acknowledgedCount ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientsTab('UNWATCHED')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    recipientsTab === 'UNWATCHED'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-400'
                  }`}
                >
                  Not Watched ({recipientsData?.stats?.unreadCount ?? 0})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Filter by name, email, role..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-y-auto flex-1 border border-slate-100 dark:border-slate-800 rounded-2xl">
              {loadingRecipients ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw className="animate-spin mx-auto mb-2 text-purple-600" size={24} />
                  <p className="text-xs font-bold">Loading recipient delivery receipts...</p>
                </div>
              ) : filteredRecipients.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-xs">No matching recipients found in this view.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-black text-slate-500">
                    <tr>
                      <th className="py-2.5 px-4">Recipient Name</th>
                      <th className="py-2.5 px-4">Contact</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Delivery & Read Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRecipients.map((rec: any, idx: number) => {
                      const isWatched = rec.read === true || rec.watched === true;
                      return (
                        <tr key={rec.id || rec.notificationId || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {rec.name}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            <div>{rec.email}</div>
                            {rec.phone && rec.phone !== 'N/A' && <div className="text-[10px] text-slate-400">{rec.phone}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {rec.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isWatched ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                <CheckCircle2 size={13} />
                                <span>Watched</span>
                                {rec.watchedAt && (
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    ({new Date(rec.watchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                                <Clock size={13} />
                                <span>Not Watched Yet</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
