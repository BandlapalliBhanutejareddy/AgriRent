'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  Tractor, 
  RotateCcw, 
  ShieldCheck, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface StatusHistoryItem {
  id?: string;
  status: string;
  title?: string;
  note?: string;
  createdAt: string;
}

interface TrackingTimelineProps {
  status: string;
  statusHistory?: StatusHistoryItem[];
  startDate: string;
  endDate: string;
  returnInspection?: {
    condition: string;
    deductionAmount: number;
    notes?: string;
  };
}

const STAGES = [
  { key: 'PENDING', label: 'Booking Requested', icon: Clock, desc: 'Payment authorized. Awaiting owner approval.' },
  { key: 'CONFIRMED', label: 'Owner Approved', icon: CheckCircle2, desc: 'Owner accepted booking request.' },
  { key: 'DISPATCHED', label: 'Dispatched / Prepared', icon: Package, desc: 'Equipment prepared & ready for pickup/delivery.' },
  { key: 'ACTIVE', label: 'Rental Active', icon: Tractor, desc: 'Equipment delivered & currently in use.' },
  { key: 'RETURN_PENDING', label: 'Return Requested', icon: RotateCcw, desc: 'Farmer requested equipment return.' },
  { key: 'COMPLETED', label: 'Rental Completed', icon: ShieldCheck, desc: 'Owner inspected equipment & finalized rental.' }
];

export default function BookingTrackingTimeline({ 
  status, 
  statusHistory = [], 
  startDate, 
  endDate,
  returnInspection 
}: TrackingTimelineProps) {

  const getStageState = (stageKey: string) => {
    if (status === 'REJECTED' || status === 'CANCELLED') return 'failed';

    const order = ['PENDING', 'CONFIRMED', 'DISPATCHED', 'ACTIVE', 'RETURN_PENDING', 'COMPLETED'];
    const currentIndex = order.indexOf(
      status === 'ACCEPTED' ? 'CONFIRMED' :
      status === 'OUT_FOR_DELIVERY' || status === 'IN_TRANSIT' ? 'DISPATCHED' :
      status === 'DELIVERED' ? 'ACTIVE' :
      status === 'RETURN_IN_PROGRESS' || status === 'RETURNED' || status === 'INSPECTION_PENDING' ? 'RETURN_PENDING' :
      status
    );

    const stageIndex = order.indexOf(stageKey);

    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const isFailed = status === 'REJECTED' || status === 'CANCELLED';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="text-emerald-500" size={22} />
            Real-Time Rental Tracking
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Rental Period: {new Date(startDate).toLocaleDateString()} → {new Date(endDate).toLocaleDateString()}
          </p>
        </div>
        <div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
            isFailed ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' :
            status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
            'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 animate-pulse'
          }`}>
            {isFailed ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            {status}
          </span>
        </div>
      </div>

      {isFailed ? (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle size={24} className="shrink-0" />
          <div>
            <h4 className="text-sm font-bold">Booking {status}</h4>
            <p className="text-xs">
              {status === 'REJECTED' 
                ? 'Owner declined the booking request. A 100% full refund has been credited.' 
                : 'Booking was cancelled. Refund processed.'}
            </p>
          </div>
        </div>
      ) : (
        /* Timeline Stepper */
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {STAGES.map((stage) => {
            const state = getStageState(stage.key);
            const Icon = stage.icon;
            const historyMatch = statusHistory.find(h => 
              h.status === stage.key || 
              (stage.key === 'CONFIRMED' && h.status === 'ACCEPTED') ||
              (stage.key === 'COMPLETED' && h.status === 'COMPLETED')
            );

            return (
              <div key={stage.key} className="relative flex items-start gap-4 group">
                <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all ${
                  state === 'completed' ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' :
                  state === 'current' ? 'bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/40 animate-pulse' :
                  'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {state === 'completed' ? <Check size={14} /> : <Icon size={12} />}
                </div>

                <div className="flex-1 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-sm font-bold ${
                      state === 'completed' ? 'text-emerald-700 dark:text-emerald-400' :
                      state === 'current' ? 'text-blue-700 dark:text-blue-400' :
                      'text-slate-500 dark:text-slate-400'
                    }`}>
                      {stage.label}
                    </h4>
                    {historyMatch?.createdAt && (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(historyMatch.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    {historyMatch?.note || stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {returnInspection && (
        <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck size={16} /> Inspection Result
          </h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            Condition: <span className="font-bold">{returnInspection.condition}</span> | Deposit Deduction: ₹{returnInspection.deductionAmount}
          </p>
          {returnInspection.notes && (
            <p className="text-xs text-emerald-600 dark:text-emerald-500 italic">
              "{returnInspection.notes}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
