'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Tractor
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from 'react-i18next';

export default function MyRentalsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const bookingsRes = await api.get('/bookings?role=FARMER');
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking(id: string) {
    try {
      await api.put(`/bookings/${id}/status`, { status: 'CANCELLED' });
      setBookings(prev => 
        prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b)
      );
    } catch (error) {
      console.error('Failed to cancel booking', error);
    }
  }

  async function handleRefundBooking(id: string) {
    try {
      if (!confirm('Are you sure you want to cancel and request a refund?')) return;
      await api.post(`/payments/${id}/refund`);
      showToast('Refund initiated successfully', 'success');
      fetchData(); // Refresh to get updated status
    } catch (error) {
      console.error('Failed to initiate refund', error);
      showToast('Failed to initiate refund', 'warning');
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700">
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[32px] shadow-sm border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/10">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('my_rentals', { defaultValue: 'My Rentals' })}</h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">{t('track_orders', { defaultValue: 'Track and manage your orders' })}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
                <th className="p-6 font-black">{t('machinery', { defaultValue: 'Machinery' })}</th>
                <th className="p-6 font-black">{t('owner_detail', { defaultValue: 'Owner Detail' })}</th>
                <th className="p-6 font-black">{t('dates', { defaultValue: 'Dates' })}</th>
                <th className="p-6 font-black">{t('pricing', { defaultValue: 'Pricing' })}</th>
                <th className="p-6 font-black">{t('payment', { defaultValue: 'Payment' })}</th>
                <th className="p-6 font-black">{t('status', { defaultValue: 'Status' })}</th>
                <th className="p-6 font-black text-right">{t('actions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
                      <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 rounded-full shadow-sm">
                        <Tractor size={32} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-white text-lg">{t('no_rentals', { defaultValue: 'No rentals yet' })}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                          {t('no_rentals_desc', { defaultValue: 'You haven\'t requested any machinery rentals yet. Connect with verified fleet owners to lease top-tier machinery.' })}
                        </p>
                      </div>
                      <Link 
                        href="/dashboard/marketplace" 
                        className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5"
                      >
                        {t('explore_marketplace', { defaultValue: 'Explore Marketplace' })}
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-6">
                       <div className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight">{booking.equipment?.title}</div>
                       <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{booking.equipment?.category}</div>
                    </td>
                    <td className="p-6">
                       <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">{booking.owner?.name}</div>
                       <div className="text-[10px] text-slate-400 font-black tracking-widest mt-1">{booking.owner?.phone}</div>
                    </td>
                    <td className="p-6 text-slate-600 dark:text-slate-400 font-medium text-xs">
                       {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-6 font-black text-slate-900 dark:text-white">₹{booking.totalPrice?.toLocaleString()}</td>
                    <td className="p-6">
                      {booking.paymentStatus === 'PAID' ? (
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 w-fit">
                            PAID
                          </span>
                          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/payments/${booking.id}/invoice`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1 font-bold">
                            Download Invoice
                          </a>
                        </div>
                      ) : booking.paymentStatus === 'REFUNDED' ? (
                        <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 w-fit">
                          REFUNDED
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 w-fit">
                          {booking.paymentStatus || 'PENDING'}
                        </span>
                      )}
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm
                        ${booking.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' : 
                          booking.status === 'ACCEPTED' || booking.status === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : 
                          booking.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50' : 
                          'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50'}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      {booking.status === 'PENDING' ? (
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-4 py-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                        >
                          {t('cancel')}
                        </button>
                      ) : booking.paymentStatus === 'PAID' && (booking.status === 'CONFIRMED' || booking.status === 'ACCEPTED') ? (
                        <button 
                          onClick={() => handleRefundBooking(booking.id)}
                          className="px-4 py-2 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                        >
                          Request Refund
                        </button>
                      ) : booking.status === 'COMPLETED' ? (
                        <Link 
                          href={`/dashboard/feedback?type=equipment&id=${booking.equipment?.id}`}
                          className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-200 dark:border-indigo-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm inline-block"
                        >
                          Rate Equipment
                        </Link>
                      ) : null}
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
