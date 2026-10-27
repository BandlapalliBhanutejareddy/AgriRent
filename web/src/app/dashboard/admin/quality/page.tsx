"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Search,
  Filter,
  RefreshCw,
  Send,
  X,
  User,
  Tractor,
  CalendarDays,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface QualityIssue {
  id: string;
  entity: 'User' | 'Equipment' | 'Booking' | 'Owner';
  recordId: string;
  problem: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  targetUserId?: string;
  targetUserName?: string;
  targetEmail?: string;
  recommendedAction: string;
  actionable: boolean;
  createdAt: string;
}

export default function DataQuality() {
  const { showToast } = useToast();
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  // Modal alert dispatch state
  const [selectedIssue, setSelectedIssue] = useState<QualityIssue | null>(null);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [sendingAlert, setSendingAlert] = useState(false);

  useEffect(() => {
    fetchQualityDiagnostics();
  }, []);

  async function fetchQualityDiagnostics() {
    try {
      setLoading(true);
      const res = await api.get('/admin/data-quality');
      const list = res.data?.data || res.data || [];
      setIssues(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Data quality fetch error:', err);
      showToast('Unable to load data quality diagnostics.', 'error');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAlertModal(issue: QualityIssue) {
    setSelectedIssue(issue);
    setAlertTitle(`Action Required: ${issue.entity} Data Quality Update`);
    setAlertMessage(
      `Dear ${issue.targetUserName || 'User'}, our system detected an issue with your account: "${issue.problem}". Please review: ${issue.recommendedAction}`
    );
  }

  async function handleSendAlert() {
    if (!selectedIssue?.targetUserId) {
      showToast('No user relationship identified for this issue.', 'warning');
      return;
    }
    if (!alertTitle.trim() || !alertMessage.trim()) {
      showToast('Please enter both title and message.', 'warning');
      return;
    }

    setSendingAlert(true);
    try {
      const res = await api.post('/admin/alerts/send', {
        userId: selectedIssue.targetUserId,
        title: alertTitle.trim(),
        message: alertMessage.trim(),
        relatedId: selectedIssue.recordId,
        type: 'ADMIN_ALERT'
      });

      if (res.data?.success) {
        showToast(res.data.message || 'Alert dispatched to recipient Notification Hub.', 'success');
        setSelectedIssue(null);
      } else {
        showToast(res.data?.error || 'Failed to dispatch alert.', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to dispatch alert.', 'error');
    } finally {
      setSendingAlert(false);
    }
  }

  const highCount = issues.filter(i => i.severity === 'HIGH').length;
  const medCount = issues.filter(i => i.severity === 'MEDIUM').length;
  const lowCount = issues.filter(i => i.severity === 'LOW').length;

  const filteredIssues = issues.filter(i => {
    if (severityFilter !== 'ALL' && i.severity !== severityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        i.problem.toLowerCase().includes(q) ||
        i.entity.toLowerCase().includes(q) ||
        (i.targetUserName && i.targetUserName.toLowerCase().includes(q)) ||
        (i.targetEmail && i.targetEmail.toLowerCase().includes(q)) ||
        i.recordId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function getEntityIcon(entity: string) {
    switch (entity) {
      case 'User': return <User size={16} className="text-emerald-500" />;
      case 'Equipment': return <Tractor size={16} className="text-blue-500" />;
      case 'Booking': return <CalendarDays size={16} className="text-purple-500" />;
      case 'Owner': return <CreditCard size={16} className="text-amber-500" />;
      default: return <ShieldAlert size={16} className="text-slate-500" />;
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-400">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-8 rounded-[32px] text-white shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-400">
            Platform Diagnostics & Integrity
          </span>
          <h1 className="text-3xl font-black mt-2">Data Quality & Alert Hub</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time audit of orphaned records, incomplete profiles, invalid pricing, and unconfigured payout details with direct notifications.
          </p>
        </div>

        <button
          onClick={fetchQualityDiagnostics}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Diagnosing...' : 'Refresh Audit'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Diagnostic Issues</span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{issues.length}</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-950 shadow-sm">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">High Severity</span>
          <h2 className="text-2xl font-black text-rose-600 mt-1">{highCount}</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-950 shadow-sm">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Medium Severity</span>
          <h2 className="text-2xl font-black text-amber-600 mt-1">{medCount}</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Low Severity</span>
          <h2 className="text-2xl font-black text-emerald-600 mt-1">{lowCount}</h2>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search problem, user, or record ID..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                severityFilter === sev
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Diagnostics Issues List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
          <h3 className="text-lg font-black text-slate-800 dark:text-white">Zero Data Inconsistencies Detected</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All user profiles, listed machinery rates, rental date intervals, and payout configurations adhere to platform data integrity standards.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-5"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {getEntityIcon(issue.entity)}
                    <span>{issue.entity}</span>
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                      issue.severity === 'HIGH'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        : issue.severity === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}
                  >
                    {issue.severity} Priority
                  </span>

                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {issue.recordId}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {issue.problem}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Recommended Action: </span>
                  {issue.recommendedAction}
                </p>

                {issue.targetUserName && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Affected Account: <span className="font-bold text-slate-800 dark:text-slate-200">{issue.targetUserName}</span> ({issue.targetEmail})
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {issue.targetUserId && (
                  <button
                    onClick={() => handleOpenAlertModal(issue)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Bell size={13} />
                    <span>Send Alert</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Send Notification Alert to Affected User */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-emerald-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Dispatch Administrative Alert</h3>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                Recipient: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedIssue.targetUserName}</span> ({selectedIssue.targetEmail})
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Related Entity: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedIssue.entity}</span> (ID: {selectedIssue.recordId})
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notification Title</label>
                <input
                  type="text"
                  value={alertTitle}
                  onChange={e => setAlertTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notification Message</label>
                <textarea
                  rows={4}
                  value={alertMessage}
                  onChange={e => setAlertMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedIssue(null)}
                disabled={sendingAlert}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendAlert}
                disabled={sendingAlert || !alertTitle.trim() || !alertMessage.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Send size={13} />
                <span>{sendingAlert ? 'Sending Alert...' : 'Confirm & Dispatch Alert'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
