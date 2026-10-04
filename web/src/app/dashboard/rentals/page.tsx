'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ChatModal from '@/components/ChatModal';
import BookingTrackingTimeline from '@/components/BookingTrackingTimeline';
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
  Download
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
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('my_rentals', { defaultValue: 'My Equipment Rentals' })}
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Track rental stages, request equipment returns, download tax invoices & rate owner service.
          </p>
        </div>
        <Link
          href="/dashboard/marketplace"
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 text-center shrink-0"
        >
          + Rent More Machinery
        </Link>
      </div>

      {/* Rentals List */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-16 text-center border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
              <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full">
                <Tractor size={36} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-white text-lg">No active or past rentals</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Lease verified tractors, rotavators, and harvesters from nearby equipment owners with zero hidden fees.
                </p>
              </div>
              <Link
                href="/dashboard/marketplace"
                className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
              >
                Browse Machinery Marketplace
              </Link>
            </div>
          </div>
        ) : (
          bookings.map((booking) => {
            const isExpanded = expandedBookingId === booking.id;
            const isCompleted = booking.status === 'COMPLETED';
            const isPending = booking.status === 'PENDING';
            const isActive = booking.status === 'ACTIVE' || booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' || booking.status === 'DISPATCHED';

            return (
              <div
                key={booking.id}
                className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/80 dark:border-slate-800/80 p-5 md:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                  {/* Equipment & Owner Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shrink-0">
                      <img
                        src={booking.equipment?.imageUrl || '/equipment/tractor.jpg'}
                        alt={booking.equipment?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                          {booking.equipment?.title}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          booking.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          booking.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          booking.status === 'REJECTED' || booking.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                          {booking.status === 'PENDING' ? 'Ã¢ÂÂ³ Pending Approval' : booking.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-2">
                        <span>Owner: <strong className="text-slate-700 dark:text-slate-300">{booking.equipment?.owner?.name || 'Verified Owner'}</strong></span>
                        <span>Ã¢â‚¬Â¢</span>
                        <span>Dates: <strong className="text-indigo-600 dark:text-indigo-400">{new Date(booking.startDate).toLocaleDateString()} &rarr; {new Date(booking.endDate).toLocaleDateString()}</strong></span>
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400">Total: {formatCurrency(booking.totalPrice)}</span>
                        {booking.securityDeposit > 0 && (
                          <span className="text-slate-400">Deposit: Ã¢â€šÂ¹{booking.securityDeposit}</span>
                        )}
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[9px] uppercase tracking-wider font-black">
                          {booking.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 justify-end">

                    {/* Chat button */}
                    <button
                      onClick={() => setChatModal({ isOpen: true, bookingId: booking.id, recipientName: booking.equipment?.owner?.name || 'Owner' })}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <MessageSquare size={14} className="text-emerald-500" /> Chat Owner
                    </button>

                    {/* Phone button */}
                    {booking.equipment?.owner?.phone && (
                      <a
                        href={`tel:${booking.equipment.owner.phone}`}
                        className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <Phone size={14} className="text-blue-500" /> Call
                      </a>
                    )}

                    {/* Tracking Timeline Drawer Toggle */}
                    <button
                      onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                      className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <Truck size={14} />
                      Tracking {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* Context Actions */}
                    {isPending && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Cancel Request
                      </button>
                    )}

                    {isActive && (
                      <button
                        onClick={() => handleRequestReturn(booking.id)}
                        className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                      >
                        Request Return
                      </button>
                    )}

                    {booking.status === 'RETURN_PENDING' && (
                      <span className="px-3 py-2 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold italic">
                        Return Pending Owner Inspection
                      </span>
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
                        className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <Star size={14} className="fill-amber-400" /> Rate Experience
                      </button>
                    )}

                    {/* Report Dispute button */}
                    <button
                      onClick={() => setComplaintModal({ isOpen: true, bookingId: booking.id, equipmentId: booking.equipmentId, targetUserId: booking.equipment?.ownerId })}
                      className="p-2.5 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                      title="File Dispute / Report Issue"
                    >
                      <AlertTriangle size={16} />
                    </button>

                  </div>
                </div>

                {/* Collapsible Tracking Timeline */}
                {isExpanded && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                    <BookingTrackingTimeline
                      status={booking.status}
                      statusHistory={booking.statusHistory}
                      startDate={booking.startDate}
                      endDate={booking.endDate}
                      returnInspection={booking.returnInspection}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ChatModal
        bookingId={chatModal.bookingId}
        isOpen={chatModal.isOpen}
        onClose={() => setChatModal({ isOpen: false, bookingId: null, recipientName: '' })}
        title="Equipment Owner Chat"
        recipientName={chatModal.recipientName}
      />

      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
        bookingId={reviewModal.bookingId}
        equipmentId={reviewModal.equipmentId}
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
