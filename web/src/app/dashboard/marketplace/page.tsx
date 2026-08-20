'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useStore, useThemeStore } from '@/store/useStore';
import { 
  Search, 
  MapPin, 
  User, 
  DollarSign, 
  Moon, 
  Sun, 
  Star, 
  Phone, 
  Info, 
  ShieldCheck, 
  X, 
  CalendarDays, 
  Tractor,
  Compass,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ToastProvider';

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);
const parseDate = (date: string) => new Date(date + 'T00:00:00');

function MarketplaceContent() {
  const { t } = useTranslation();
  const { user } = useStore();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { isDarkMode, toggleTheme } = useThemeStore();
  
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [bookingDrafts, setBookingDrafts] = useState<Record<string, { startDate: string; endDate: string; loading: boolean }>>({});
  const [isListening, setIsListening] = useState(false);
  
  // Selected specs modal
  const [selectedSpecsItem, setSelectedSpecsItem] = useState<any | null>(null);

  // Read URL search params on mount
  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearch(query);
    }
  }, [searchParams]);

  // Fetch when filters change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEquipment();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, category, page]);

  async function fetchEquipment() {
    try {
      setLoading(true);
      const response = await api.get('/equipment', {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          category: category === 'All Categories' || category === (t('categories.all') || 'All Categories') ? undefined : category
        }
      });
      const data = response.data?.data || [];
      const pagination = response.data?.pagination || { page: 1, totalPages: 1, total: 0 };
      
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.total);
      
      // Use actual data from backend
      const enriched = data.map((item: any, idx: number) => ({
        ...item,
        owner: item.owner || { name: 'Unknown Owner', phone: 'N/A' },
        rating: item.rating || 0,
        reviewCount: item.reviewCount || 0,
        distance: item.distance || '0',
        securityDeposit: item.securityDeposit || 0,
        reviews: item.reviews || []
      }));

      setEquipment(enriched);
      setupDrafts(enriched);
    } catch (error) {
      console.error('Failed to load equipment', error);
      showToast('Unable to load equipment. Please try again.', 'error');
      setEquipment([]);
      setupDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  function setupDrafts(items: any[]) {
    const draftState = items.reduce((acc: Record<string, any>, item: any) => {
      acc[item.id] = {
        startDate: formatDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        endDate: formatDateInput(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)),
        loading: false,
      };
      return acc;
    }, {});
    setBookingDrafts(draftState);
  };

  const categories = useMemo(() => {
    return [
      t('categories.all') || 'All Categories',
      'TRACTOR', 'HARVESTER', 'IMPLEMENT', 'ROTAVATOR', 'CULTIVATOR', 'SEED DRILL', 'SPRAYER', 'POWER TILLER', 'RICE TRANSPLANTER'
    ];
  }, [t]);

  const filteredEquipment = equipment; // Filters are applied on backend

  function updateDraft(id: string, field: 'startDate' | 'endDate', value: string) {
    setBookingDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  function handleVoiceSearch() {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearch(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      
      recognition.start();
    } else {
      showToast('Voice search is not supported in this browser.', 'warning');
    }
  };

  async function handleBooking(item: any) {
    if (user?.role !== 'FARMER') {
      showToast('Only farmers can request equipment rentals.', 'warning');
      return;
    }

    const draft = bookingDrafts[item.id];
    if (!draft) return;

    const start = parseDate(draft.startDate);
    const end = parseDate(draft.endDate);

    if (end <= start) {
      showToast('Please choose an end date after the start date.', 'warning');
      return;
    }

    setBookingDrafts((prev) => ({
      ...prev,
      [item.id]: { ...prev[item.id], loading: true }
    }));

    try {
      // 1. Create Booking
      const bookingRes = await api.post('/bookings', {
        equipmentId: item.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      const bookingId = bookingRes.data.id;

      // 2. Load Razorpay script dynamically
      const res = await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!res) {
        showToast('Razorpay SDK failed to load. Are you online?', 'warning');
        return;
      }

      // 3. Create Razorpay Order
      const orderRes = await api.post('/payments/create-order', { bookingId });
      const { orderId, amount, currency } = orderRes.data;

      // 4. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_xxxxx',
        amount: amount,
        currency: currency,
        name: 'AgroRent AI',
        description: `Rental Payment for ${item.title}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            showToast('Processing payment verification...', 'success');
            // 5. Verify Signature
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingId
            });
            showToast(`Rental booking confirmed for ${item.title}!`, 'success');
            setSelectedSpecsItem(null);
            fetchEquipment(); // refresh data
          } catch (err) {
            showToast('Payment verification failed. Contact support.', 'warning');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone
        },
        theme: {
          color: '#059669' // emerald-600
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to initiate booking payment.', 'warning');
    } finally {
      setBookingDrafts((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], loading: false }
      }));
    }
  };

  function renderBookingCardControls(item: any) {
    const draft = bookingDrafts[item.id];
    if (!draft) return null;

    const start = parseDate(draft.startDate);
    const end = parseDate(draft.endDate);
    const rentalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    const totalPrice = item.pricePerDay * rentalDays;

    return (
      <div className="mt-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-[10px] font-black text-slate-400 uppercase tracking-wide">
            <span>{t('start_date')}</span>
            <input
              type="date"
              value={draft.startDate}
              onChange={(event) => updateDraft(item.id, 'startDate', event.target.value)}
              className="w-full rounded-xl border border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-emerald-500"
            />
          </label>
          <label className="space-y-1 text-[10px] font-black text-slate-400 uppercase tracking-wide">
            <span>{t('end_date')}</span>
            <input
              type="date"
              value={draft.endDate}
              onChange={(event) => updateDraft(item.id, 'endDate', event.target.value)}
              className="w-full rounded-xl border border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-emerald-500"
            />
          </label>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-400 block font-bold">{t('duration')}</span>
            <span className="font-bold text-slate-800 dark:text-white">{rentalDays} {t('day')}{rentalDays === 1 ? '' : 's'}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block font-bold">{t('estimated_yield')}</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">₹{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {user?.role === 'FARMER' ? (
          <button
            onClick={() => handleBooking(item)}
            data-testid="booking-submit"
            disabled={!item.available || draft.loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/10"
          >
            {draft.loading ? t('submitting', { defaultValue: 'Processing...' }) : t('pay_and_book', { defaultValue: 'Pay & Confirm Booking' })}
          </button>
        ) : (
          <div className="text-[10px] text-center p-2.5 bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-slate-350 border border-amber-100 dark:border-slate-750 rounded-xl font-bold">
            {t('switch_to_farmer_to_rent')}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-850 dark:text-white tracking-tight">{t('marketplace') || 'Machinery Marketplace'}</h1>
          <p className="mt-1 text-slate-450 dark:text-slate-500 text-xs font-semibold max-w-xl">
            {t('marketplace_desc', { defaultValue: 'Browse listed agricultural inventory, inspect owner testimonials, map security deposits, and request rental bookings.' })}
          </p>
        </div>

        {/* Global actions filters */}
        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto">
          <button
            onClick={toggleTheme}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shrink-0"
            title={t('toggle_theme_view')}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className="flex-grow sm:flex-grow-0 grid grid-cols-2 gap-3 max-w-md w-full">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                data-testid="equipment-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('search_equipment_placeholder', { defaultValue: 'Search tools...' })}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 pl-10 pr-10 text-xs text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-all"
              />
              <button 
                onClick={handleVoiceSearch}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-emerald-500'}`}
                title={t('voice_search', { defaultValue: 'Voice Search' })}
              >
                <Mic size={16} />
              </button>
            </div>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs text-slate-800 dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
            >
              {categories.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-80 rounded-[32px] bg-slate-100 dark:bg-slate-900 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEquipment.length === 0 ? (
            
            /* Illustrated Fallback State */
            <div className="col-span-full rounded-[32px] border-2 border-slate-200 dark:border-slate-800 border-dashed bg-white dark:bg-slate-900 p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-350">
                <Tractor size={40} />
              </div>
              <div className="max-w-xs">
                <p className="text-lg font-bold text-slate-850 dark:text-white">{t('no_equipment_matches', { defaultValue: 'No Equipment Matches' })}</p>
                <p className="mt-1 text-xs text-slate-450 dark:text-slate-500 font-semibold leading-relaxed">
                  {t('try_broadening_search', { defaultValue: 'Try broadening your keyword queries, resetting tractor categories, or adjusting crop preferences.' })}
                </p>
              </div>
              <button 
                onClick={() => { setSearch(''); setCategory('All Categories'); setPage(1); }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                {t('reset_filters', { defaultValue: 'Reset Filters' })}
              </button>
            </div>
          ) : filteredEquipment.map((item) => {
            const hasOwnerImage = item.imageUrl && item.imageUrl.trim() !== '' && !item.imageUrl.includes('images.unsplash.com');
            const cat = item.category ? item.category.toLowerCase() : '';
            let staticImage = '/equipment/default.jpg';
            if (cat.includes('harvester')) staticImage = '/equipment/harvester.jpg';
            else if (cat.includes('rotavator')) staticImage = '/equipment/rotavator.jpg';
            else if (cat.includes('cultivator')) staticImage = '/equipment/cultivator.jpg';
            else if (cat.includes('sprayer')) staticImage = '/equipment/sprayer.jpg';
            else if (cat.includes('thresher')) staticImage = '/equipment/thresher.jpg';
            else if (cat.includes('seed drill') || cat.includes('seeder')) staticImage = '/equipment/seed-drill.jpg';
            else if (cat.includes('power tiller')) staticImage = '/equipment/power-tiller.jpg';
            else if (cat.includes('rice transplanter') || cat.includes('transplanter')) staticImage = '/equipment/rice-transplanter.jpg';
            else if (cat.includes('tractor')) staticImage = '/equipment/tractor.jpg';
            
            const displayImage = hasOwnerImage ? item.imageUrl : staticImage;

            return (
            <div key={item.id} className="rounded-[32px] border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-350">
              <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 relative">
                <img src={displayImage} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center shadow-xl">
                  <span className="text-white font-black text-sm tracking-tight">₹{item.pricePerDay}</span>
                  <span className="text-white/70 font-semibold text-[10px] ml-1 uppercase tracking-widest">/{t('per_day', { defaultValue: 'day' })}</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                
                {/* Header Accents */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-850 dark:text-white line-clamp-1">{item.title}</h2>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{t(item.category.toLowerCase(), { defaultValue: item.category })}</span>
                  </div>
                  <div className={`rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${item.available ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'}`}>
                    {item.available ? t('available', { defaultValue: 'Available' }) : t('booked', { defaultValue: 'Booked' })}
                  </div>
                </div>

                {/* Rating badge */}
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                    <Star size={14} fill="currentColor" />
                    <span>{item.rating}</span>
                  </div>
                  <span className="text-slate-400 font-semibold">({item.reviewCount} {t('reviews', { defaultValue: 'Reviews' })})</span>
                  <span className="text-slate-300 dark:text-slate-800">•</span>
                  <span className="text-slate-450 dark:text-slate-400 font-bold flex items-center gap-0.5">
                    <Compass size={12} /> {item.distance} {t('km_away', { defaultValue: 'km away' })}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-semibold">
                  {item.description || 'No description listed by the owner.'}
                </p>

                {/* Info block */}
                <div className="grid gap-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 text-xs text-slate-600 dark:text-slate-350 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <MapPin size={14} className="text-slate-400" />
                    <span>{item.location || 'Nellore, AP'}</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <User size={14} className="text-slate-400" />
                    <span>{item.owner?.name || 'Teja Owner'}</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <DollarSign size={14} className="text-slate-400" />
                    <span className="font-bold text-slate-850 dark:text-white">₹{item.pricePerDay} {t('per_day', { defaultValue: 'per day' })}</span>
                  </div>
                </div>

                {/* Specs dialog trigger */}
                <button
                  onClick={() => setSelectedSpecsItem(item)}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/50 border border-slate-150 dark:border-slate-750 text-slate-655 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  {t('inspect_specs', { defaultValue: 'Inspect Specifications & Reviews' })}
                </button>

                {/* Calendar / Booking drafts */}
                {renderBookingCardControls(item)}
              </div>
            </div>
            );
          })}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="col-span-full flex items-center justify-between mt-8 p-4 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase rounded-xl transition-colors"
              >
                {t('previous')}
              </button>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t('page')} {page} {t('of')} {totalPages} <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg">{totalItems} {t('items')}</span>
              </div>
              <button 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase rounded-xl transition-colors"
              >
                {t('next')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* High-Fidelity Specifications Modal */}
      <AnimatePresence>
        {selectedSpecsItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-slate-850 dark:text-white uppercase text-xs tracking-wider">{t('specifications_reviews', { defaultValue: 'Specifications & Reviews' })}</h3>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">{selectedSpecsItem.title}</span>
                </div>
                <button 
                  onClick={() => setSelectedSpecsItem(null)}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 text-xs text-slate-600 dark:text-slate-350">
                
                {/* Highlights grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-2xl text-center">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">{t('security_deposit', { defaultValue: 'Security Deposit' })}</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 block">₹{selectedSpecsItem.securityDeposit.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-2xl text-center">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">{t('distance_label', { defaultValue: 'Distance' })}</span>
                    <span className="text-sm font-black text-indigo-500 mt-1 block">{selectedSpecsItem.distance} {t('km')}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-2xl text-center">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">{t('rating_yield', { defaultValue: 'Rating Yield' })}</span>
                    <span className="text-sm font-black text-amber-500 mt-1 block">★ {selectedSpecsItem.rating}</span>
                  </div>
                </div>

                {/* Owner contact block */}
                <div className="p-4 bg-slate-50 dark:bg-slate-850/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-slate-800 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <User size={18} />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800 dark:text-white">{selectedSpecsItem.owner?.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-tight">{t('verified_partner', { defaultValue: 'Verified AgroRent Partner' })}</span>
                    </div>
                  </div>
                  <a 
                    href={`tel:${selectedSpecsItem.owner?.phone}`} 
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                  >
                    <Phone size={12} /> {t('contact_button', { defaultValue: 'Contact' })}
                  </a>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-850 dark:text-white uppercase tracking-wider text-[10px]">{t('machine_description', { defaultValue: 'Machine Description' })}</h4>
                  <p className="leading-relaxed font-semibold text-slate-500 dark:text-slate-400">
                    {selectedSpecsItem.description || 'No description listed by the owner.'}
                  </p>
                </div>

                {/* Reviews section */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-black text-slate-850 dark:text-white uppercase tracking-wider text-[10px]">{t('farmer_testimonials')}</h4>
                  <div className="space-y-3.5">
                    {selectedSpecsItem.reviews.map((rev: any, idx: number) => (
                      <div key={idx} className="p-3.5 bg-slate-50/50 dark:bg-slate-800/25 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 dark:text-white text-xs">{rev.author}</span>
                          <div className="flex gap-0.5 text-amber-500">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} size={10} fill="currentColor" />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-semibold italic">"{rev.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Booking Drawer embedded inside Specs */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-black text-slate-850 dark:text-white uppercase tracking-wider text-[10px] mb-3">{t('instant_booking_placement')}</h4>
                  {renderBookingCardControls(selectedSpecsItem)}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function MarketplacePage() {
    const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="h-80 rounded-[32px] bg-slate-100 dark:bg-slate-900 animate-pulse" />}>
      <MarketplaceContent />
    </Suspense>
  );
}
