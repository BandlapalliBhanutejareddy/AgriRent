'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

export default function OwnerBookingsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const bookingsRes = await api.get('/bookings?role=OWNER');
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Failed to fetch bookings data', error);
      showToast('Failed to load live bookings data from server.', 'warning');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  async function handleUpdateStatus(id: string, status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED') {
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

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ClipboardList className="text-emerald-500" size={32} />
            {t('booking_requests')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Manage your fleet's rental requests and active bookings
          </p>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[32px] shadow-sm border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
                <th className="p-6 font-black">{t('machinery', { defaultValue: 'Machinery' })}</th>
                <th className="p-6 font-black">{t('renting_farmer', { defaultValue: 'Renting Farmer' })}</th>
                <th className="p-6 font-black">{t('dates', { defaultValue: 'Dates' })}</th>
                <th className="p-6 font-black">{t('yield', { defaultValue: 'Yield' })}</th>
                <th className="p-6 font-black">{t('payment', { defaultValue: 'Payment' })}</th>
                <th className="p-6 font-black">{t('status', { defaultValue: 'Status' })}</th>
                <th className="p-6 font-black text-right">{t('actions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-slate-400 dark:text-slate-500">
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
                             {booking.equipment?.title?.charAt(0) || 'E'}
                        </div>
                        <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight">{booking.equipment?.title || 'Unknown Equipment'}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{booking.equipment?.category || 'Category'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">{booking.farmer?.name || 'Unknown Farmer'}</div>
                      <div className="text-[10px] text-slate-400 font-black tracking-widest mt-1">{booking.farmer?.phone}</div>
                    </td>
                    <td className="p-6">
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {format(new Date(booking.startDate), 'MMM dd')} - {format(new Date(booking.endDate), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))} Days
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ₹{booking.totalPrice?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-2.5 py-1 text-[10px] font-black tracking-widest uppercase rounded-xl border ${
                        booking.paymentStatus === 'PAID' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800' 
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800'
                      }`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`px-2.5 py-1 text-[10px] font-black tracking-widest uppercase rounded-xl border ${
                        booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800' :
                        booking.status === 'ACCEPTED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' :
                        booking.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800' :
                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      {booking.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(booking.id, 'ACCEPTED')}
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800"
                            title="Accept Request"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(booking.id, 'REJECTED')}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-xl transition-colors border border-red-200 dark:border-red-800"
                            title="Reject Request"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                      {booking.status === 'ACCEPTED' && (
                        <div className="flex justify-end">
                          <button 
                            onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800 text-[10px] font-black uppercase tracking-widest"
                            title="Mark as Completed"
                          >
                            Mark Completed
                          </button>
                        </div>
                      )}
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
