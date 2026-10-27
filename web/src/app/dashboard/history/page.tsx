'use client';

import React, { useEffect, useState } from 'react';
import { History, Calendar, CheckCircle2, Clock, XCircle, Search, Phone, MessageSquare, Tractor, IndianRupee, Eye, Filter, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/formatters';
import ChatModal from '@/components/ChatModal';
import BookingTrackingTimeline from '@/components/BookingTrackingTimeline';

export default function OwnerRentalHistoryPage() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'ACTIVE' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedTimelineBooking, setSelectedTimelineBooking] = useState<any | null>(null);
  const [chatModal, setChatModal] = useState<{ isOpen: boolean; bookingId: string | null; recipientName: string }>({
    isOpen: false,
    bookingId: null,
    recipientName: ''
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      setLoading(true);
      const res = await api.get('/bookings?role=OWNER');
      const data = res.data || [];
      setBookings(data);
      setFilteredBookings(data);
    } catch (err: any) {
      console.error('Failed to fetch rental history:', err);
      showToast('Failed to load rental history from server.', 'warning');
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let list = bookings;

    if (statusFilter === 'COMPLETED') {
      list = list.filter((b) => b.status === 'COMPLETED');
    } else if (statusFilter === 'ACTIVE') {
      list = list.filter((b) => ['ACTIVE', 'ACCEPTED', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes(b.status));
    } else if (statusFilter === 'CANCELLED') {
      list = list.filter((b) => ['CANCELLED', 'REJECTED'].includes(b.status));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((b) =>
        (b.equipment?.title || '').toLowerCase().includes(q) ||
        (b.farmer?.name || '').toLowerCase().includes(q) ||
        (b.id || '').toLowerCase().includes(q)
      );
    }

    setFilteredBookings(list);
  }, [statusFilter, searchQuery, bookings]);

  // Derived Financial Metrics
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
  const totalCompletedRevenue = completedBookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
  const totalReceivedPaid = bookings.reduce((acc, b) => acc + (b.amountPaid || (b.paymentStatus === 'PAID' ? b.totalPrice : 0) || 0), 0);
  const activeCount = bookings.filter((b) => ['ACTIVE', 'ACCEPTED', 'DISPATCHED'].includes(b.status)).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-[32px] text-white shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-xl text-xs font-black uppercase tracking-wider border border-indigo-500/30 inline-flex items-center gap-1.5">
            <History size={13} /> Fleet Rental History
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2">
            Rental History & Operations Ledger
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Complete historical record of all dispatched, completed, and active equipment rentals with payment tracking integrity.
          </p>
        </div>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Completed Yield</span>
          <div className="flex items-center gap-2 mt-2">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <IndianRupee size={20} />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(totalCompletedRevenue)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold block mt-2">
            From {completedBookings.length} completed rental contracts
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Settled / Collected Payments</span>
          <div className="flex items-center gap-2 mt-2">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(totalReceivedPaid)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold block mt-2">
            Direct farmer escrow & bank settlements
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Active & Deployed Units</span>
          <div className="flex items-center gap-2 mt-2">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Tractor size={20} />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {activeCount}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold block mt-2">
            Machinery currently operating in the field
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by equipment, farmer, or ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'COMPLETED', 'ACTIVE', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'ALL' ? `All (${bookings.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      {filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <History size={36} className="text-slate-400 mx-auto" />
          <h3 className="text-base font-black text-slate-800 dark:text-white">
            No matching rental records found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or filter selection.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6">Machinery & ID</th>
                  <th className="py-4 px-6">Farmer</th>
                  <th className="py-4 px-6">Rental Period</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Payment</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                          {b.equipment?.imageUrl ? (
                            <img src={b.equipment.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Tractor size={18} />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="block font-black">{b.equipment?.title || 'Machinery'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">#{b.id.slice(-8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300">
                      <div>
                        <span>{b.farmer?.name || 'Verified Farmer'}</span>
                        {b.farmer?.phone && (
                          <span className="text-[10px] text-slate-400 block">{b.farmer.phone}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                      <span>{b.startDate ? new Date(b.startDate).toLocaleDateString() : 'N/A'}</span>
                      <span className="text-slate-400"> → </span>
                      <span>{b.endDate ? new Date(b.endDate).toLocaleDateString() : 'N/A'}</span>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(b.totalPrice)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        b.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                        b.status === 'ACTIVE' || b.status === 'DISPATCHED' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' :
                        b.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                        'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        b.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {b.paymentStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTimelineBooking(b)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all cursor-pointer"
                          title="View Tracking Timeline"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setChatModal({ isOpen: true, bookingId: b.id, recipientName: b.farmer?.name || 'Farmer' })}
                          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-all cursor-pointer"
                          title="Open Chat"
                        >
                          <MessageSquare size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tracking Timeline Modal */}
      {selectedTimelineBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Booking #{selectedTimelineBooking.id.slice(-8)} — Lifecycle History
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTimelineBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <BookingTrackingTimeline
              status={selectedTimelineBooking.status}
              statusHistory={selectedTimelineBooking.statusHistory || []}
              startDate={selectedTimelineBooking.startDate}
              endDate={selectedTimelineBooking.endDate}
              returnInspection={selectedTimelineBooking.returnInspection}
            />
          </div>
        </div>
      )}

      {/* Chat Modal */}
      <ChatModal
        bookingId={chatModal.bookingId}
        isOpen={chatModal.isOpen}
        onClose={() => setChatModal({ isOpen: false, bookingId: null, recipientName: '' })}
        recipientName={chatModal.recipientName}
      />
    </div>
  );
}
