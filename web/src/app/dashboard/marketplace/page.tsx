'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useStore, useThemeStore } from '@/store/useStore';
import { Search, MapPin, User, DollarSign, Moon, Sun } from 'lucide-react';

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);
const parseDate = (date: string) => new Date(date + 'T00:00:00');

export default function MarketplacePage() {
  const { t } = useTranslation();
  const { user } = useStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [message, setMessage] = useState<string | null>(null);
  const [bookingDrafts, setBookingDrafts] = useState<Record<string, { startDate: string; endDate: string; loading: boolean }>>({});

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await api.get('/equipment');
      const data = response.data || [];
      setEquipment(data);
      const draftState = data.reduce((acc: Record<string, any>, item: any) => {
        acc[item.id] = {
          startDate: formatDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000)),
          endDate: formatDateInput(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)),
          loading: false,
        };
        return acc;
      }, {});
      setBookingDrafts(draftState);
    } catch (error) {
      console.error('Failed to load marketplace equipment', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const values = Array.from(new Set(equipment.map((item) => item.category || 'Other')));
    return [t('categories.all'), ...values];
  }, [equipment, t]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      const matchesSearch = search ? (
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.owner?.name?.toLowerCase().includes(search.toLowerCase())
      ) : true;
      const matchesCategory = category === 'All Categories' || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [equipment, search, category]);

  const updateDraft = (id: string, field: 'startDate' | 'endDate', value: string) => {
    setBookingDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleBooking = async (item: any) => {
    if (user?.role !== 'FARMER') {
      setMessage('Only farmers can request equipment rentals. Please log in as a farmer.');
      return;
    }

    const draft = bookingDrafts[item.id];
    if (!draft) return;

    const start = parseDate(draft.startDate);
    const end = parseDate(draft.endDate);

    if (end <= start) {
      setMessage('Please choose an end date after the start date.');
      return;
    }

    setBookingDrafts((prev) => ({
      ...prev,
      [item.id]: { ...prev[item.id], loading: true }
    }));

    try {
      await api.post('/bookings', {
        equipmentId: item.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      setMessage(`Booking request submitted for ${item.name}. The owner will respond soon.`);
    } catch (error: any) {
      console.error('Booking failed', error);
      setMessage(error.response?.data?.error || 'Booking request failed.');
    } finally {
      setBookingDrafts((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], loading: false }
      }));
    }
  };

  const renderBookingControls = (item: any) => {
    const draft = bookingDrafts[item.id];
    if (!draft) return null;

    const start = parseDate(draft.startDate);
    const end = parseDate(draft.endDate);
    const rentalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    const totalPrice = item.pricePerDay * rentalDays;

    return (
      <div className="mt-4 rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold">{t('start_date') || 'Start Date'}</span>
            <input
              type="date"
              value={draft.startDate}
              onChange={(event) => updateDraft(item.id, 'startDate', event.target.value)}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 dark:focus:border-emerald-400"
            />
          </label>
          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold">{t('end_date') || 'End Date'}</span>
            <input
              type="date"
              value={draft.endDate}
              onChange={(event) => updateDraft(item.id, 'endDate', event.target.value)}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 dark:focus:border-emerald-400"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('rental_duration') || 'Rental duration'}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{rentalDays} day{rentalDays === 1 ? '' : 's'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('estimated_total') || 'Estimated total'}</p>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">₹{totalPrice.toLocaleString()}</p>
          </div>
        </div>
        <button
          onClick={() => handleBooking(item)}
          disabled={!item.isAvailable || draft.loading}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-600"
        >
          {draft.loading ? (t('requesting') || 'Requesting…') : item.isAvailable ? (t('request_booking') || 'Request Booking') : (t('not_available') || 'Not Available')}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('marketplace')}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
            {t('marketplace_description') || 'Browse equipment listings and request a rental with calendar booking dates. Farmers can request rentals directly from the web dashboard.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="grid gap-3 sm:grid-cols-2 md:w-80">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 dark:focus:border-emerald-400"
              />
            </div>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 dark:focus:border-emerald-400"
            >
              {categories.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
          {message}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-80 rounded-3xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3 lg:grid-cols-2">
          {filteredEquipment.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-10 text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('no_equipment_found') || 'No equipment found'}</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('try_adjusting_filters') || 'Try adjusting your search or category filters.'}</p>
            </div>
          ) : filteredEquipment.map((item) => (
            <div key={item.id} className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{item.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.category}</p>
                  </div>
                  <div className={`rounded-2xl px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${item.isAvailable ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'}`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 rounded-3xl bg-gray-50 dark:bg-gray-700/50 p-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{item.location || 'Nationwide'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>{item.owner?.name || 'Owner'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} />
                    <span>₹{item.pricePerDay} / day</span>
                  </div>
                </div>

                <div className="mt-5 text-sm leading-7 text-gray-600 dark:text-gray-300">{item.description || 'No description provided by the owner.'}</div>

                {renderBookingControls(item)}

                {user?.role !== 'FARMER' && (
                  <div className="mt-4 rounded-3xl border border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-950/50 p-4 text-sm text-gray-700 dark:text-gray-300">
                    {t('farmer_role_required') || 'Farmer role required to make rental requests. Switch to a farmer account to book equipment.'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
