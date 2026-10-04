"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function AlertsNotifications() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(res => {
      const data = res.data;
      const newAlerts = [];
      if (data.users?.pendingVerification > 0) {
        newAlerts.push({ title: 'Pending Verifications', message: `${data.users.pendingVerification} owners awaiting identity check.` });
      }
      if (data.equipment?.pendingModeration > 0) {
        newAlerts.push({ title: 'Pending Moderation', message: `${data.equipment.pendingModeration} equipment listings awaiting review.` });
      }
      if (data.moderation?.openComplaints > 0) {
        newAlerts.push({ title: 'Open Complaints', message: `${data.moderation.openComplaints} unresolved cases require admin moderation.` });
      }
      setAlerts(newAlerts);
      setLoading(false);
    }).catch(err => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Alerts & Notifications</h1>
      <p className="text-slate-500">Actionable platform alerts.</p>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-4">
          {alerts.length === 0 ? <p className="p-6 bg-white dark:bg-slate-900 rounded-2xl font-bold">No active alerts</p> : null}
          {alerts.map((a, i) => (
            <div key={i} className="p-6 bg-white dark:bg-slate-900 border-l-4 border-amber-500 rounded-2xl shadow-sm">
              <h3 className="font-bold text-lg">{a.title}</h3>
              <p className="text-slate-600 dark:text-slate-400">{a.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
