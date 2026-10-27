'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Tractor, Trash2, ArrowRight, MapPin, IndianRupee, Star, Phone, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/formatters';

export default function SavedEquipmentPage() {
  const { showToast } = useToast();
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedItems();
  }, []);

  async function fetchSavedItems() {
    try {
      setLoading(true);
      const res = await api.get('/saved');
      setSavedItems(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch saved equipment:', err);
      showToast('Failed to load saved equipment.', 'warning');
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(equipmentId: string) {
    try {
      setRemovingId(equipmentId);
      await api.delete(`/saved/${equipmentId}`);
      setSavedItems((prev) => prev.filter((item) => item.equipment?.id !== equipmentId && item.equipmentId !== equipmentId));
      showToast('Machinery removed from your saved list.', 'success');
    } catch (err: any) {
      console.error('Failed to remove saved equipment:', err);
      showToast('Failed to remove item.', 'warning');
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-8 rounded-[32px] text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-500/30 inline-flex items-center gap-1.5">
            <Bookmark size={13} /> Saved Machinery
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2">
            My Shortlisted Equipment
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Access, compare rates, and quickly book your favorite tractors and agricultural implements.
          </p>
        </div>
        <Link
          href="/dashboard/marketplace"
          className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all shrink-0"
        >
          <span>Explore Marketplace</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      {savedItems.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Bookmark size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white">
            No saved equipment yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
            Browse the marketplace and bookmark machinery to easily access and book them for upcoming seasonal operations.
          </p>
          <Link
            href="/dashboard/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Tractor size={16} />
            <span>Browse Agricultural Catalog</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItems.map((item) => {
            const eq = item.equipment;
            if (!eq) return null;
            const avgRating =
              eq.reviews && eq.reviews.length > 0
                ? (eq.reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / eq.reviews.length).toFixed(1)
                : '5.0';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {eq.imageUrl ? (
                      <img
                        src={eq.imageUrl}
                        alt={eq.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Tractor size={48} />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-xl text-[10px] font-black uppercase tracking-wider">
                      {eq.category}
                    </span>
                    <button
                      type="button"
                      disabled={removingId === eq.id}
                      onClick={() => handleRemove(eq.id)}
                      className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-900/90 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-xl shadow-md transition-all cursor-pointer"
                      title="Remove from saved"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1">
                        {eq.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg shrink-0">
                        <Star size={13} fill="currentColor" />
                        <span>{avgRating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {eq.description || 'Verified machinery listed by owner on AgroRent platform.'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{eq.location || 'Registered Hub'}</span>
                    </div>

                    {eq.owner && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 pt-1">
                        <span className="text-slate-400">Owner:</span>
                        <span>{eq.owner.name || 'Verified Owner'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Rate</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(eq.pricePerDay)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold"> / day</span>
                  </div>

                  <Link
                    href={`/dashboard/marketplace?equipmentId=${eq.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <span>Book Now</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
