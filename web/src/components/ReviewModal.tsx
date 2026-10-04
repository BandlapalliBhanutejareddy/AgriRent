'use client';

import React, { useState } from 'react';
import { Star, X, Check, Award } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from './ToastProvider';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  equipmentId: string;
  ownerId?: string;
  farmerId?: string;
  targetName: string;
  type: 'FARMER_RATING' | 'OWNER_RATING';
  onSuccess?: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  bookingId,
  equipmentId,
  ownerId,
  farmerId,
  targetName,
  type,
  onSuccess
}: ReviewModalProps) {
  const { showToast } = useToast();
  const [equipmentRating, setEquipmentRating] = useState(5);
  const [performanceRating, setPerformanceRating] = useState(5);
  const [conditionRating, setConditionRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);

  const [userRating, setUserRating] = useState(5);
  const [behaviourRating, setBehaviourRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);

  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (type === 'FARMER_RATING') {
        // Farmer rates Equipment & Owner
        await api.post('/reviews/equipment', {
          bookingId,
          equipmentId,
          rating: equipmentRating,
          performanceRating,
          conditionRating,
          cleanlinessRating,
          comment
        });

        if (targetName || ownerId) {
          await api.post('/reviews/user', {
            bookingId,
            targetUserId: ownerId || targetName,
            rating: userRating,
            behaviourRating,
            communicationRating,
            comment
          }).catch(() => {}); // handle secondary user review smoothly
        }

        showToast('Thank you for rating your rental experience!', 'success');
      } else {
        // Owner rates Farmer
        await api.post('/reviews/user', {
          bookingId,
          targetUserId: targetName,
          rating: userRating,
          behaviourRating,
          communicationRating,
          comment
        });
        showToast('Farmer review submitted successfully!', 'success');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarPicker = (val: number, setVal: (v: number) => void, label: string) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setVal(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              size={18}
              className={star <= val ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-2xl">
              <Award size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {type === 'FARMER_RATING' ? 'Rate Rental & Owner' : 'Rate Farmer'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold">Share your honest feedback to build marketplace trust</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {type === 'FARMER_RATING' ? (
            <>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Equipment Quality
                </h4>
                {renderStarPicker(equipmentRating, setEquipmentRating, 'Overall Equipment Rating')}
                {renderStarPicker(performanceRating, setPerformanceRating, 'Performance')}
                {renderStarPicker(conditionRating, setConditionRating, 'Machine Condition')}
                {renderStarPicker(cleanlinessRating, setCleanlinessRating, 'Cleanliness')}
              </div>

              <div className="space-y-1 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Owner Experience
                </h4>
                {renderStarPicker(userRating, setUserRating, 'Owner Rating')}
                {renderStarPicker(behaviourRating, setBehaviourRating, 'Communication')}
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Farmer Evaluation
              </h4>
              {renderStarPicker(userRating, setUserRating, 'Overall Farmer Rating')}
              {renderStarPicker(behaviourRating, setBehaviourRating, 'Equipment Care & Behaviour')}
              {renderStarPicker(communicationRating, setCommunicationRating, 'Timeliness')}
            </div>
          )}

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Detailed Feedback (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your comments regarding equipment performance, punctuality, or handling..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check size={16} />
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
