'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ChatModal from '@/components/ChatModal';
import ReviewModal from '@/components/ReviewModal';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Phone,
  ShieldCheck,
  Truck,
  RotateCcw,
  X,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';

export default function OwnerBookingsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [chatModal, setChatModal] = useState<{ isOpen: boolean; bookingId: string | null; recipientName: string }>({
    isOpen: false,
    bookingId: null,
    recipientName: ''
  });

  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    bookingId: string;
    equipmentId: string;
    farmerId?: string;
    targetName: string;
  }>({
    isOpen: false,
    bookingId: '',
    equipmentId: '',
    targetName: ''
  });

  const [inspectionModal, setInspectionModal] = useState<{
    isOpen: boolean;
    bookingId: string;
    equipmentTitle: string;
    farmerName: string;
  }>({
    isOpen: false,
    bookingId: '',
    equipmentTitle: '',
    farmerName: ''
  });

  const [inspectionData, setInspectionData] = useState({
    condition: 'GOOD',
    deductionAmount: 0,
    notes: ''
  });
  const [submittingInspection, setSubmittingInspection] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const bookingsRes = await api.get('/bookings?role=OWNER');
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Failed to fetch bookings data', error);
      showToast('Failed to load live bookings data from server.', 'warning');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      showToast(`Booking status updated to ${status}!`, 'success');
      fetchData();
    } catch (error) {
      showToast(`Failed to update booking status.`, 'warning');
    }
  }

  async function handleCompleteInspection(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingInspection(true);
    try {
      await api.post(`/bookings/${inspectionModal.bookingId}/inspection`, inspectionData);
      showToast('Equipment inspection completed & rental finalized!', 'success');
      setInspectionModal(prev => ({ ...prev, isOpen: false }));
      fetchData();
    } catch (error) {
      showToast('Failed to record inspection', 'warning');
    } finally {
      setSubmittingInspection(false);
    }
  }

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
            {t('booking_requests', { defaultValue: 'Fleet Rental Management' })}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Approve incoming requests, manage dispatch stages, conduct post-rental inspections & claim payouts.
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
                <th className="p-6 font-black">{t('yield', { defaultValue: 'Payout' })}</th>
                <th className="p-6 font-black">{t('status', { defaultValue: 'Status' })}</th>
                <th className="p-6 font-black text-right">{t('actions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-slate-400 dark:text-slate-500">
                    <Clock className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={32} />
                    <span className="font-bold">{t('no_active_proposals', { defaultValue: 'No active rental requests yet.' })}</span>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 font-black border border-emerald-200/50 shrink-0">
                          {booking.equipment?.title?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight">{booking.equipment?.title || 'Equipment'}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{booking.equipment?.category}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-6">
                      <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">{booking.farmer?.name || 'Farmer'}</div>
                      <div className="text-[10px] text-slate-400 font-black tracking-widest mt-0.5">{booking.farmer?.phone}</div>
                    </td>

                    <td className="p-6">
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {format(new Date(booking.startDate), 'MMM dd')} - {format(new Date(booking.endDate), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))} Days
                      </div>
                    </td>

                    <td className="p-6">
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(booking.totalPrice)}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        Deposit: Ã¢â€šÂ¹{booking.securityDeposit || 0}
                      </div>
                    </td>

                    <td className="p-6">
                      <span className={`px-2.5 py-1 text-[10px] font-black tracking-widest uppercase rounded-xl border ${
                        booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        booking.status === 'ACTIVE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        booking.status === 'RETURN_PENDING' ? 'bg-teal-50 text-teal-700 border-teal-200 animate-pulse' :
                        booking.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {booking.status === 'PENDING' ? 'Awaiting Approval' : booking.status}
                      </span>
                    </td>

                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">

                        {/* Chat button */}
                        <button
                          onClick={() => setChatModal({ isOpen: true, bookingId: booking.id, recipientName: booking.farmer?.name || 'Farmer' })}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1"
                        >
                          <MessageSquare size={12} className="text-emerald-500" /> Chat
                        </button>

                        {/* Owner Approval Workflow */}
                        {booking.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'ACCEPTED')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'REJECTED')}
                              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {/* Dispatch Stage */}
                        {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED') && (
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'DISPATCHED')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 shadow-sm"
                          >
                            <Truck size={12} /> Mark Dispatched
                          </button>
                        )}

                        {booking.status === 'DISPATCHED' && (
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'ACTIVE')}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                          >
                            Mark Active
                          </button>
                        )}

                        {/* Return Inspection */}
                        {(booking.status === 'RETURN_PENDING' || booking.status === 'ACTIVE') && (
                          <button
                            onClick={() => {
                              setInspectionModal({
                                isOpen: true,
                                bookingId: booking.id,
                                equipmentTitle: booking.equipment?.title || 'Equipment',
                                farmerName: booking.farmer?.name || 'Farmer'
                              });
                              setInspectionData({ condition: 'GOOD', deductionAmount: 0, notes: '' });
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 shadow-md"
                          >
                            <ShieldCheck size={12} /> Conduct Return Inspection
                          </button>
                        )}

                        {booking.status === 'COMPLETED' && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle size={14} /> Completed
                            </span>
                            <button
                              onClick={() => setReviewModal({
                                isOpen: true,
                                bookingId: booking.id,
                                equipmentId: booking.equipmentId,
                                farmerId: booking.farmerId,
                                targetName: booking.farmer?.name || 'Farmer'
                              })}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                            >
                              Ã¢Ëœâ€¦ Rate Farmer
                            </button>
                          </div>
                        )}

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Inspection Modal */}
      {inspectionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-2xl">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Equipment Inspection</h3>
                  <p className="text-xs text-slate-500 font-semibold">{inspectionModal.equipmentTitle} Ã¢â‚¬Â¢ Rented by {inspectionModal.farmerName}</p>
                </div>
              </div>
              <button onClick={() => setInspectionModal(prev => ({ ...prev, isOpen: false }))} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCompleteInspection} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Returned Condition</label>
                <select
                  value={inspectionData.condition}
                  onChange={(e) => setInspectionData(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="GOOD">GOOD Ã¢â‚¬â€ Clean, fully functional, no damage</option>
                  <option value="MINOR_DAMAGE">MINOR_DAMAGE Ã¢â‚¬â€ Minor wear/cleaning required (small deduction)</option>
                  <option value="MAJOR_DAMAGE">MAJOR_DAMAGE Ã¢â‚¬â€ Severe breakdown/damage (security deposit withheld)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Security Deposit Deduction (Ã¢â€šÂ¹)</label>
                <input
                  type="number"
                  min={0}
                  value={inspectionData.deductionAmount}
                  onChange={(e) => setInspectionData(prev => ({ ...prev, deductionAmount: Number(e.target.value) }))}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Inspection Notes & Remarks</label>
                <textarea
                  rows={3}
                  value={inspectionData.notes}
                  onChange={(e) => setInspectionData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Record hours used, fuel level, or any remarks..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInspectionModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInspection}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck size={16} />
                  {submittingInspection ? 'Finalizing...' : 'Finalize & Complete Rental'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ChatModal
        bookingId={chatModal.bookingId}
        isOpen={chatModal.isOpen}
        onClose={() => setChatModal({ isOpen: false, bookingId: null, recipientName: '' })}
        title="Renting Farmer Chat"
        recipientName={chatModal.recipientName}
      />

      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
        bookingId={reviewModal.bookingId}
        equipmentId={reviewModal.equipmentId}
        targetName={reviewModal.farmerId || reviewModal.targetName}
        type="OWNER_RATING"
        onSuccess={fetchData}
      />
    </div>
  );
}
