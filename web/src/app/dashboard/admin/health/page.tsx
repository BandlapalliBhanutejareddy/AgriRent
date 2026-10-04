"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function SystemHealth() {
  const [health, setHealth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/system-health').then(res => {
      setHealth(res.data || []);
      setLoading(false);
    }).catch(err => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">System Health</h1>
      <p className="text-slate-500">Live technical status of platform components.</p>
      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {health.map((h, i) => (
            <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <h3 className="font-bold text-lg">{h.service}</h3>
              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${h.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-700' : h.status === 'DEGRADED' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{h.status}</span>
                {h.responseTime && <span className="text-xs text-slate-400">{h.responseTime}ms</span>}
              </div>
              {h.error && <p className="text-xs text-red-500 mt-2">{h.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
