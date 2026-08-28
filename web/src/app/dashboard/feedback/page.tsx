'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { Star, MessageSquare, Save, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useTranslation } from "react-i18next";

interface FeedbackItem {
  id: string;
  rating: number;
  category: string;
  subject: string | null;
  message: string;
  status: string;
  adminResponse: string | null;
  createdAt: string;
}

function FeedbackContent() {
  const { t } = useTranslation();
  const { user, activeRole } = useStore();
  const searchParams = useSearchParams();
  
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<string>('General');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const urlType = searchParams.get('type');
    const urlId = searchParams.get('id');
    if (urlType === 'equipment' && urlId) {
      setCategory('Equipment');
      setSubject(urlId);
      setIsLocked(true);
    }
  }, [searchParams]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const [myFeedback, setMyFeedback] = useState<FeedbackItem[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(true);

  const categories = [
    'General', 'Equipment', 'Booking', 'Farmer Experience', 
    'Owner Experience', 'Payment', 'AI Advisor', 'App/Website', 'Bug Report', 'Other'
  ];

  const loadMyFeedback = async () => {
    try {
      setIsLoadingFeedback(true);
      const res = await api.get('/feedback/my');
      setMyFeedback(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to load feedback', err);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  useEffect(() => {
    loadMyFeedback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !category || !message.trim()) {
      setSubmitError('Please provide a rating, category, and your feedback message.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');
      setSubmitSuccess(false);

      await api.post('/feedback', {
        rating,
        category,
        subject: subject.trim(),
        message: message.trim(),
        activeRole: activeRole || user?.role
      });

      setSubmitSuccess(true);
      setRating(5);
      if (!isLocked) {
        setCategory('General');
        setSubject('');
      }
      setMessage('');
      
      // Reload the feedback list
      loadMyFeedback();
      
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (currentRating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive || isSubmitting}
            onClick={() => interactive && setRating(star)}
            className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-transform ${interactive && !isSubmitting ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
          >
            <Star 
              size={interactive ? 32 : 16} 
              className={`${star <= currentRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'} transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Pending</span>;
      case 'REVIEWED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">Reviewed</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Resolved</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="text-emerald-500" size={32} />
            Feedback
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Help us improve your AgroRent experience
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Submission Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Submit Feedback</h2>
            
            {submitSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-start gap-3 border border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle2 className="shrink-0 mt-0.5" size={20} />
                <p className="text-sm font-medium">Thank you! Your feedback has been submitted successfully and will be reviewed by our team.</p>
              </div>
            )}
            
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl text-sm font-medium border border-red-100 dark:border-red-900/50">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-3 flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">How was your experience?</label>
                {renderStars(rating, true)}
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{rating} / 5 Stars</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Category <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isSubmitting || isLocked}
                    className="w-full pl-4 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none disabled:opacity-50"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Subject (Optional)</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isSubmitting || isLocked}
                  placeholder={isLocked ? "Equipment ID" : "Brief summary of your feedback"}
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Your Feedback <span className="text-red-500">*</span></label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Tell us what you liked, what went wrong, or how we can improve..."
                  rows={5}
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all disabled:opacity-50 resize-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <><Loader2 size={20} className="animate-spin" /> Submitting...</>
                ) : (
                  <><Save size={20} /> Submit Feedback</>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Previous Feedback List */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Previous Feedback</h2>
              <button 
                onClick={loadMyFeedback}
                disabled={isLoadingFeedback}
                className="p-2 text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-900/20 rounded-xl transition-all disabled:opacity-50"
              >
                <RefreshCw size={18} className={isLoadingFeedback ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="flex-1">
              {isLoadingFeedback && myFeedback.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <Loader2 size={32} className="animate-spin mb-3 text-emerald-500" />
                  <p className="font-medium">Loading your feedback...</p>
                </div>
              ) : myFeedback.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <MessageSquare size={48} className="mb-4 opacity-20" />
                  <p className="font-medium text-lg text-slate-500 dark:text-slate-400">No feedback submitted yet</p>
                  <p className="text-sm mt-1">Your feedback helps us make AgroRent better for everyone.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myFeedback.map((item) => (
                    <div key={item.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 transition-all hover:border-emerald-200 dark:hover:border-emerald-900/50">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-black tracking-wider text-slate-500 uppercase">{item.category}</span>
                            {getStatusBadge(item.status)}
                          </div>
                          {item.subject && <h3 className="font-bold text-slate-900 dark:text-white">{item.subject}</h3>}
                        </div>
                        <div className="shrink-0 flex flex-col items-end">
                          {renderStars(item.rating)}
                          <span className="text-xs font-medium text-slate-400 mt-1.5">
                            {new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {item.message}
                      </p>
                      
                      {item.adminResponse && (
                        <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 text-sm">
                          <p className="font-bold text-emerald-800 dark:text-emerald-400 mb-1">Admin Response:</p>
                          <p className="text-emerald-700 dark:text-emerald-300">{item.adminResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse text-slate-400">Loading feedback form...</div>}>
      <FeedbackContent />
    </Suspense>
  );
}
