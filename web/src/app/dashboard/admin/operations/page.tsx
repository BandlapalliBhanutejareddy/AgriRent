"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

export default function OperationsMonitor() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/bookings?limit=50').then(res => {
      setBookings(res.data?.data || []);
      setLoading(false);
    }).catch(err => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Operations Monitor</h1>
      <p className="text-slate-500">Live operational view of rentals.</p>
      {loading ? <p>Loading...</p> : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">
                <th className="p-4">ID</th>
                <th className="p-4">Equipment</th>
                <th className="p-4">Owner</th>
                <th className="p-4">Farmer</th>
                <th className="p-4">Status</th>
                <th className="p-4">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bookings.length === 0 ? <tr><td colSpan={6} className="p-4 text-center">No active bookings</td></tr> : null}
              {bookings.map(b => (
                <tr key={b.id}>
                  <td className="p-4 font-mono text-xs">{b.id.slice(-8).toUpperCase()}</td>
                  <td className="p-4">{b.equipment?.title}</td>
                  <td className="p-4">{b.owner?.name}</td>
                  <td className="p-4">{b.farmer?.name}</td>
                  <td className="p-4 font-bold">{b.status}</td>
                  <td className="p-4 text-emerald-600">{b.payment?.amount ? formatCurrency(b.payment.amount) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
