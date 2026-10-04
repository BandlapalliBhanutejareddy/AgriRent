'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from './ToastProvider';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  targetUserId?: string;
  equipmentId?: string;
}

export default function ComplaintModal({
  isOpen,
  onClose,
  bookingId,
  targetUserId,
  equipmentId
}: ComplaintModalProps) {
  const { showToast } = useToast();
  const [category, setCategory] = useState('EQUIPMENT_ISSUE');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please describe the issue in detail', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/complaints', {
        category,
        description,
        evidenceUrl: evidenceUrl || undefined,
        bookingId,
        targetUserId,
        equipmentId
      });
      showToast('Complaint/Report submitted to Admin Moderation.', 'success');
      onClose();
    } catch (err: any) {
      showToast('Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-2xl">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Report Issue / File Dispute</h3>
              <p className="text-xs text-slate-500 font-semibold">AgroRent Admin moderation team will review your case</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="EQUIPMENT_ISSUE">Equipment Breakdown / Damage / Poor Condition</option>
              <option value="BEHAVIOUR_ISSUE">Unprofessional Behaviour / Harassment</option>
              <option value="PAYMENT_DISPUTE">Payment / Refund Dispute</option>
              <option value="LATE_DELIVERY">Late Delivery / No-Show</option>
              <option value="OTHER">Other Dispute</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what went wrong in detail..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Photo / Evidence URL (Optional)</label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
