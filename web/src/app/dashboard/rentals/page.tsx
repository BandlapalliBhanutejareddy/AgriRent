'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import ChatModal from '@/components/ChatModal';
import BookingTrackingTimeline from '@/components/BookingTrackingTimeline';
import EquipmentLocationMap from '@/components/EquipmentLocationMap';
import ReviewModal from '@/components/ReviewModal';
import ComplaintModal from '@/components/ComplaintModal';
import {
  Tractor,
  Phone,
  MessageSquare,
  Truck,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  CalendarDays,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';

export default function MyRentalsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Tracking timeline drawer state
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Modals
  const [chatModal, setChatModal] = useState<{ isOpen: boolean; bookingId: string | null; recipientName: string }>({
    isOpen: false,
    bookingId: null,
    recipientName: ''
  });

  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    bookingId: string;
    equipmentId: string;
    ownerId?: string;
    targetName: string;
  }>({
    isOpen: false,
    bookingId: '',
    equipmentId: '',
    targetName: ''
  });

  const [complaintModal, setComplaintModal] = useState<{
    isOpen: boolean;
    bookingId?: string;
    equipmentId?: string;
    targetUserId?: string;
  }>({
    isOpen: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const bookingsRes = await api.get('/bookings?role=FARMER');
      const list = bookingsRes.data?.data || bookingsRes.data || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to fetch farmer bookings', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking(id: string) {
    try {
      if (!confirm('Cancel this booking request? Your payment will be refunded immediately.')) return;
      await api.put(`/bookings/${id}/status`, { status: 'CANCELLED' });
      showToast('Booking cancelled & full refund issued.', 'success');
      fetchData();
    } catch (error) {
      showToast('Failed to cancel booking', 'warning');
    }
  }

  async function handleRequestReturn(bookingId: string) {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'RETURN_PENDING' });
      showToast('Return request submitted to owner!', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to submit return request', 'warning');
    }
  }

  // Summary Metrics
  const summary = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter(b => ['ACTIVE', 'ACCEPTED', 'CONFIRMED', 'DISPATCHED'].includes(b.status)).length;
    const completed = bookings.filter(b => b.status === 'COMPLETED').length;
    const cancelled = bookings.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status)).length;
    const totalRentalValue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const actualPaid = bookings
      .filter(b => b.paymentStatus === 'PAID' || b.paymentStatus === 'SUCCESS' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.amountPaid || b.totalPrice || 0), 0);

    return { total, active, completed, cancelled, totalRentalValue, actualPaid };
  }, [bookings]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (paymentFilter !== 'ALL' && (b.paymentStatus || 'PENDING') !== paymentFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const equipTitle = (b.equipment?.title || '').toLowerCase();
        const ownerName = (b.equipment?.owner?.name || '').toLowerCase();
        const bookingId = (b.id || '').toLowerCase();
        return equipTitle.includes(q) || ownerName.includes(q) || bookingId.includes(q);
      }
      return true;
    });
  }, [bookings, search, statusFilter, paymentFilter]);

  function getDurationDays(startDate: string, endDate: string) {
    if (!startDate || !endDate) return 1;
    const diff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }

  function getBookingStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center justify-center whitespace-nowrap min-w-[120px] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/30">Pending Approval</span>;
      case 'ACCEPTED':
      case 'CONFIRMED':
        return <span className="inline-flex items-center justify-center whitespace-nowrap min-w-[120px] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">Confirmed</span>;
      case 'DISPATCHED':
        return <span className="inline-flex items-center justify-center whitespace-nowrap min-w-[120px] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">Dispatched</span>;
      case 'ACTIVE':
        return <span className="inline-flex items-center justify-center whitespace-nowrap min-w-[120px] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Active Lease</span>;
      case 'RETURN_PENDING':
        return <span className="inline-flex items-center justify-center whitespace-nowrap min-w-[120px] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30">Return Pending</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center justify-center whitespace-nowrap min-w-[120px] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">Completed</span>;
      case 'CANCELLED':
      case 'REJECTED':
        return <span className="inline-flex items-center justify-center whitespace-nowrap min-w-[120px] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">{status}</span>;
      default:
        return <span className="inline-flex items-center justify-center whitespace-nowrap min-w-[120px] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/30">{status}</span>;
    }
  }

  function getPaymentBadge(status: string) {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'PAID' || s === 'SUCCESS') {
      return <span className="inline-flex items-center justify-center whitespace-nowrap min-w-[110px] px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Paid Escrow</span>;
    }
    if (s === 'REFUNDED') {
      return <span className="inline-flex items-center justify-center whitespace-nowrap min-w-[110px] px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">Refunded</span>;
    }
    if (s === 'FAILED') {
      return <span className="inline-flex items-center justify-center whitespace-nowrap min-w-[110px] px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">Failed</span>;
    }
    return <span className="inline-flex items-center justify-center whitespace-nowrap min-w-[110px] px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">Payment Pending</span>;
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-8 rounded-[32px] text-white shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-white/10 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider border border-white/10 inline-flex items-center gap-1.5">
            <CalendarDays size={13} /> Farmer Rental Operations
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2">
            My Equipment Rentals & Tracking
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Complete lifecycle history, genuine dispatch milestones, unified rental calculations, and service ratings.
          </p>
        </div>

        <Link
          href="/dashboard/marketplace"
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shrink-0 active:scale-95"
        >
          + Rent More Machinery
        </Link>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Bookings</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{summary.total}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200/70 dark:border-blue-950 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 block">Active Rentals</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">{summary.active}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-950 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 block">Completed</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{summary.completed}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200/70 dark:border-rose-950 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block">Cancelled</span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">{summary.cancelled}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Rental Value</span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block font-mono">{formatCurrency(summary.totalRentalValue)}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-950 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Actual Paid</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block font-mono">{formatCurrency(summary.actualPaid)}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by equipment, booking ID, or owner..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Booking Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Booking Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Confirmed</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid / Settled</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              title="Table View"
            >
              <TableIcon size={16} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              title="Card View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Cards */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-16 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <Tractor size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-black text-slate-800 dark:text-white">No Rentals Match Your Filters</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Try resetting your search query or status filter to see other rental records.
          </p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('ALL'); setPaymentFilter('ALL'); }}
            className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3.5 px-4">Equipment & Booking ID</th>
                  <th className="py-3.5 px-4">Owner Contact</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Rental Dates</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Rental Total</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Booking Status</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Payment Status</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredBookings.map((booking) => {
                  const duration = getDurationDays(booking.startDate, booking.endDate);
                  const isExpanded = expandedBookingId === booking.id;
                  const isPending = booking.status === 'PENDING';
                  const isActive = ['ACTIVE', 'ACCEPTED', 'CONFIRMED', 'DISPATCHED'].includes(booking.status);
                  const isCompleted = booking.status === 'COMPLETED';

                  return (
                    <React.Fragment key={booking.id}>
                      <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Equipment */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={booking.equipment?.imageUrl || '/equipment/tractor.jpg'}
                            alt={booking.equipment?.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {booking.equipment?.title || 'Machinery'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {booking.id.slice(0, 10)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {booking.equipment?.owner?.name || 'Verified Owner'}
                        </div>
                        {booking.equipment?.owner?.phone && (
                          <div className="text-[11px] text-slate-400 font-medium">
                            {booking.equipment.owner.phone}
                          </div>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-bold">
                          {new Date(booking.startDate).toLocaleDateString()} &rarr; {new Date(booking.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          Duration: {duration} day{duration > 1 ? 's' : ''}
                        </div>
                      </td>

                      {/* Rental Total */}
                      <td className="py-4 px-4 text-right">
                        <div className="font-black text-slate-900 dark:text-white font-mono text-sm">
                          {formatCurrency(booking.totalPrice)}
                        </div>
                        {booking.securityDeposit > 0 && (
                          <div className="text-[10px] text-slate-400">Deposit: ₹{booking.securityDeposit}</div>
                        )}
                      </td>

                      {/* Booking Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {getBookingStatusBadge(booking.status)}
                      </td>

                      {/* Payment Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {getPaymentBadge(booking.paymentStatus)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-all"
                            title="View Lifecycle Timeline"
                          >
                            <Truck size={12} />
                            <span>Track</span>
                          </button>

                          <button
                            onClick={() => setChatModal({ isOpen: true, bookingId: booking.id, recipientName: booking.equipment?.owner?.name || 'Owner' })}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition-all"
                            title="Chat with Owner"
                          >
                            <MessageSquare size={13} className="text-emerald-500" />
                          </button>

                          {isPending && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-all"
                            >
                              Cancel
                            </button>
                          )}

                          {isActive && (
                            <button
                              onClick={() => handleRequestReturn(booking.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm"
                            >
                              Return
                            </button>
                          )}

                          {isCompleted && (
                            <button
                              onClick={() => setReviewModal({
                                isOpen: true,
                                bookingId: booking.id,
                                equipmentId: booking.equipmentId,
                                ownerId: booking.equipment?.ownerId,
                                targetName: booking.equipment?.owner?.name || 'Owner'
                              })}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-all"
                              title="Rate Machinery & Owner"
                            >
                              <Star size={13} className="fill-amber-400 text-amber-400" />
                            </button>
                          )}

                          <button
                            onClick={() => setComplaintModal({ isOpen: true, bookingId: booking.id, equipmentId: booking.equipmentId, targetUserId: booking.equipment?.ownerId })}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Report Issue"
                          >
                            <AlertTriangle size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`expanded-${booking.id}`} className="bg-slate-50/90 dark:bg-slate-850/90 border-b border-blue-200/50 dark:border-blue-900/50">
                        <td colSpan={7} className="p-6">
                          <div className="space-y-4 max-w-4xl">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Truck size={14} className="text-blue-500" />
                                <span>Lifecycle Timeline — {booking.equipment?.title}</span>
                              </h4>
                              <button
                                onClick={() => setExpandedBookingId(null)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white"
                              >
                                Close ✕
                              </button>
                            </div>
                            <BookingTrackingTimeline
                              status={booking.status}
                              statusHistory={booking.statusHistory}
                              startDate={booking.startDate}
                              endDate={booking.endDate}
                              returnInspection={booking.returnInspection}
                            />
                            {booking.equipment?.latitude && booking.equipment?.longitude && (
                              <div className="pt-2">
                                <EquipmentLocationMap
                                  equipmentId={booking.equipment.id}
                                  title={booking.equipment.title}
                                  location={booking.equipment.location}
                                  latitude={booking.equipment.latitude}
                                  longitude={booking.equipment.longitude}
                                  isOwner={false}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const isExpanded = expandedBookingId === booking.id;
            const isCompleted = booking.status === 'COMPLETED';
            const isPending = booking.status === 'PENDING';
            const isActive = ['ACTIVE', 'ACCEPTED', 'CONFIRMED', 'DISPATCHED'].includes(booking.status);

            return (
              <div
                key={booking.id}
                className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/80 dark:border-slate-800/80 p-5 md:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={booking.equipment?.imageUrl || '/equipment/tractor.jpg'}
                      alt={booking.equipment?.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                          {booking.equipment?.title}
                        </h3>
                        {getBookingStatusBadge(booking.status)}
                      </div>

                      <p className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-2">
                        <span>Owner: <strong className="text-slate-700 dark:text-slate-300">{booking.equipment?.owner?.name || 'Verified Owner'}</strong></span>
                        <span>•</span>
                        <span>Dates: <strong className="text-indigo-600 dark:text-indigo-400">{new Date(booking.startDate).toLocaleDateString()} &rarr; {new Date(booking.endDate).toLocaleDateString()}</strong></span>
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">Total: {formatCurrency(booking.totalPrice)}</span>
                        {booking.securityDeposit > 0 && (
                          <span className="text-slate-400">Deposit: ₹{booking.securityDeposit}</span>
                        )}
                        {getPaymentBadge(booking.paymentStatus)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <button
                      onClick={() => setChatModal({ isOpen: true, bookingId: booking.id, recipientName: booking.equipment?.owner?.name || 'Owner' })}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <MessageSquare size={14} className="text-emerald-500" /> Chat Owner
                    </button>

                    <button
                      onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                      className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <Truck size={14} />
                      Tracking {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isPending && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Cancel Request
                      </button>
                    )}

                    {isActive && (
                      <button
                        onClick={() => handleRequestReturn(booking.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                      >
                        Request Return
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        onClick={() => setReviewModal({
                          isOpen: true,
                          bookingId: booking.id,
                          equipmentId: booking.equipmentId,
                          ownerId: booking.equipment?.ownerId,
                          targetName: booking.equipment?.owner?.name || 'Owner'
                        })}
                        className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <Star size={14} className="fill-amber-400 text-amber-400" /> Rate Experience
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Tracking Drawer for selected booking */}
      {expandedBookingId && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-md space-y-6 animate-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Truck size={18} className="text-blue-500" />
                <span>Truthful Booking Lifecycle Timeline</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Booking ID: {expandedBookingId}</p>
            </div>
            <button
              onClick={() => setExpandedBookingId(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              Close Drawer ✕
            </button>
          </div>

          {(() => {
            const b = bookings.find(item => item.id === expandedBookingId);
            if (!b) return null;
            return (
              <div className="space-y-6">
                <BookingTrackingTimeline
                  status={b.status}
                  statusHistory={b.statusHistory}
                  startDate={b.startDate}
                  endDate={b.endDate}
                  returnInspection={b.returnInspection}
                />
                <EquipmentLocationMap
                  equipmentId={b.equipment?.id}
                  title={b.equipment?.title || 'Machinery'}
                  location={b.equipment?.location}
                  latitude={b.equipment?.latitude}
                  longitude={b.equipment?.longitude}
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* Chat, Review, and Complaint Modals */}
      <ChatModal
        isOpen={chatModal.isOpen}
        onClose={() => setChatModal({ isOpen: false, bookingId: null, recipientName: '' })}
        bookingId={chatModal.bookingId || ''}
        recipientName={chatModal.recipientName}
      />

      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, bookingId: '', equipmentId: '', targetName: '' })}
        bookingId={reviewModal.bookingId}
        equipmentId={reviewModal.equipmentId}
        ownerId={reviewModal.ownerId}
        targetName={reviewModal.targetName}
        type="FARMER_RATING"
        onSuccess={fetchData}
      />

      <ComplaintModal
        isOpen={complaintModal.isOpen}
        onClose={() => setComplaintModal({ isOpen: false })}
        bookingId={complaintModal.bookingId}
        equipmentId={complaintModal.equipmentId}
        targetUserId={complaintModal.targetUserId}
      />
    </div>
  );
}
