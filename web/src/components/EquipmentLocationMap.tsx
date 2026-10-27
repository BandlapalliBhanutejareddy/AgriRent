'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Compass, CheckCircle2, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

interface EquipmentLocationMapProps {
  equipmentId?: string;
  title: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isOwner?: boolean;
  onCoordinatesUpdated?: (lat: number, lng: number) => void;
}

export default function EquipmentLocationMap({
  equipmentId,
  title,
  location,
  latitude: initialLat,
  longitude: initialLng,
  isOwner = false,
  onCoordinatesUpdated
}: EquipmentLocationMapProps) {
  const { showToast } = useToast();
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualLat, setManualLat] = useState(initialLat ? String(initialLat) : '');
  const [manualLng, setManualLng] = useState(initialLng ? String(initialLng) : '');

  const hasCoordinates = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
    : 'https://maps.google.com';

  const handleRegisterCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'warning');
      return;
    }

    setIsUpdating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLat = parseFloat(position.coords.latitude.toFixed(6));
        const newLng = parseFloat(position.coords.longitude.toFixed(6));

        try {
          if (equipmentId) {
            await api.put(`/equipment/${equipmentId}`, {
              latitude: newLat,
              longitude: newLng,
            });
          }
          setLat(newLat);
          setLng(newLng);
          setManualLat(String(newLat));
          setManualLng(String(newLng));
          onCoordinatesUpdated?.(newLat, newLng);
          showToast('Pickup location coordinates registered and saved!', 'success');
        } catch (err: any) {
          console.error('Failed to update coordinates:', err);
          showToast(err.response?.data?.error || 'Failed to save location coordinates.', 'warning');
        } finally {
          setIsUpdating(false);
        }
      },
      (error) => {
        setIsUpdating(false);
        console.warn('Geolocation error:', error);
        showToast('Unable to detect GPS position. You can enter coordinates manually.', 'warning');
        setManualMode(true);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSaveManualCoordinates = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLat = parseFloat(manualLat);
    const parsedLng = parseFloat(manualLng);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      showToast('Please enter a valid latitude between -90 and 90', 'warning');
      return;
    }

    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      showToast('Please enter a valid longitude between -180 and 180', 'warning');
      return;
    }

    setIsUpdating(true);
    try {
      if (equipmentId) {
        await api.put(`/equipment/${equipmentId}`, {
          latitude: parsedLat,
          longitude: parsedLng,
        });
      }
      setLat(parsedLat);
      setLng(parsedLng);
      setManualMode(false);
      onCoordinatesUpdated?.(parsedLat, parsedLng);
      showToast('Coordinates successfully updated!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update coordinates.', 'warning');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Compass size={22} />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              Registered Pickup Location
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {location || 'Designated Farm Hub / Equipment Yard'}
            </p>
          </div>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
        >
          <Navigation size={14} className="text-emerald-500" />
          <span>Open in Google Maps</span>
          <ExternalLink size={12} className="opacity-60" />
        </a>
      </div>

      {hasCoordinates ? (
        <div className="space-y-3">
          {/* Interactive OpenStreetMap Embed */}
          <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
            <iframe
              title={`Map for ${title}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng! - 0.015}%2C${lat! - 0.015}%2C${lng! + 0.015}%2C${lat! + 0.015}&layer=mapnik&marker=${lat}%2C${lng}`}
            />
            <div className="absolute bottom-2 left-2 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Verified Pickup Coordinates: {lat?.toFixed(4)}, {lng?.toFixed(4)}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 size={15} />
              <span>Exact pickup coordinates verified by equipment owner.</span>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setManualMode(!manualMode)}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 underline cursor-pointer"
              >
                {manualMode ? 'Close Edit' : 'Edit Coordinates'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl space-y-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Exact GPS coordinates not registered yet</p>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                General Pickup Area: <span className="font-semibold">{location || 'Registered with Equipment Owner'}</span>.
                You can still request this machinery; the owner will confirm the exact delivery or pickup handover point.
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleRegisterCurrentLocation}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                <span>Register Current GPS Position</span>
              </button>
              <button
                type="button"
                onClick={() => setManualMode(!manualMode)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                <span>{manualMode ? 'Cancel' : 'Enter Manually'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {isOwner && manualMode && (
        <form onSubmit={handleSaveManualCoordinates} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 mt-3 animate-in fade-in duration-300">
          <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Manual Coordinate Input (DD)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Latitude (e.g. 16.3067)</label>
              <input
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="16.3067"
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Longitude (e.g. 80.4365)</label>
              <input
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="80.4365"
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              {isUpdating ? 'Saving...' : 'Save Coordinates'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
