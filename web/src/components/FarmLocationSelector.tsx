'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  Map as MapIcon,
  Check,
  AlertCircle,
  Save,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Crosshair
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

export interface LocationSelectedData {
  latitude: number;
  longitude: number;
  name: string;
}

interface FarmLocationSelectorProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialName?: string;
  farmId?: string;
  onLocationSelected: (data: LocationSelectedData) => void;
  showSavePreferred?: boolean;
}

export default function FarmLocationSelector({
  initialLatitude,
  initialLongitude,
  initialName = '',
  farmId,
  onLocationSelected,
  showSavePreferred = true
}: FarmLocationSelectorProps) {
  const { showToast } = useToast();

  const [mode, setMode] = useState<'GPS' | 'SEARCH' | 'MAP'>('SEARCH');
  const [latitude, setLatitude] = useState<number | null>(initialLatitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialLongitude ?? null);
  const [locationName, setLocationName] = useState<string>(initialName);

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Save farm state
  const [savingPreferred, setSavingPreferred] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Google Maps availability
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<any>(null);
  const googleMarkerInstance = useRef<any>(null);

  // Sync initial props
  useEffect(() => {
    if (initialLatitude != null && initialLongitude != null) {
      setLatitude(initialLatitude);
      setLongitude(initialLongitude);
    }
    if (initialName) {
      setLocationName(initialName);
    }
  }, [initialLatitude, initialLongitude, initialName]);

  // Search Geocoding Handler
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (debounceTimer) clearTimeout(debounceTimer);

    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await api.get(`/farms/weather/geocode?query=${encodeURIComponent(text.trim())}`);
        const data = res.data;
        const list = Array.isArray(data) ? data : (data?.results || data?.data?.results || []);
        setSearchResults(list);
      } catch (err) {
        console.error('Geocode search failed:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    setDebounceTimer(timer);
  };

  const handleSelectSearchResult = (item: any) => {
    const lat = item.latitude;
    const lng = item.longitude;
    const name = item.displayName || item.name;

    setLatitude(lat);
    setLongitude(lng);
    setLocationName(name);
    setSearchResults([]);
    setSearchQuery('');

    onLocationSelected({ latitude: lat, longitude: lng, name });
    showToast(`Location set to ${name}`, 'success');
  };

  // GPS Geolocation Handler
  const handleRequestGPS = () => {
    setGpsError(null);
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);

        try {
          const revRes = await api.get(`/farms/weather/reverse-geocode?lat=${lat}&lng=${lng}`);
          const revData = revRes.data;
          const name = revData?.locationName || revData?.data?.locationName || (typeof revData === 'string' ? revData : `Coordinates ${lat}, ${lng}`);
          setLocationName(name);
          onLocationSelected({ latitude: lat, longitude: lng, name });
          showToast(`Detected location: ${name}`, 'success');
        } catch (_) {
          const fallback = `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
          setLocationName(fallback);
          onLocationSelected({ latitude: lat, longitude: lng, name: fallback });
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        let errorMsg = 'Failed to retrieve location.';
        if (err.code === 1) {
          errorMsg = 'Location permission denied. Please allow location access in your browser or search for your village manually.';
        } else if (err.code === 2) {
          errorMsg = 'GPS signal unavailable. Please use text search or map selection.';
        } else if (err.code === 3) {
          errorMsg = 'Location detection timed out. Please try again or search manually.';
        }
        setGpsError(errorMsg);
        showToast(errorMsg, 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Map Click Handler (Google Maps or Interactive Coordinate Canvas)
  const handleMapCoordSelect = async (lat: number, lng: number) => {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));
    setLatitude(roundedLat);
    setLongitude(roundedLng);

    try {
      const res = await api.get(`/farms/weather/reverse-geocode?lat=${roundedLat}&lng=${roundedLng}`);
      const name = res.data?.locationName || `Pin (${roundedLat}, ${roundedLng})`;
      setLocationName(name);
      onLocationSelected({ latitude: roundedLat, longitude: roundedLng, name });
    } catch (_) {
      const name = `Pin (${roundedLat}, ${roundedLng})`;
      setLocationName(name);
      onLocationSelected({ latitude: roundedLat, longitude: roundedLng, name });
    }
  };

  // Google Maps initialization
  useEffect(() => {
    if (mode === 'MAP' && googleMapsKey && mapContainerRef.current) {
      // Check if google is already loaded
      if ((window as any).google && (window as any).google.maps) {
        initGoogleMap();
      } else {
        const scriptId = 'google-maps-script';
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places`;
          script.async = true;
          script.onload = () => initGoogleMap();
          document.head.appendChild(script);
        }
      }
    }
  }, [mode, googleMapsKey]);

  const initGoogleMap = () => {
    if (!mapContainerRef.current || !(window as any).google) return;
    const centerLat = latitude ?? 16.3067;
    const centerLng = longitude ?? 80.4365;

    const map = new (window as any).google.maps.Map(mapContainerRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom: latitude ? 12 : 6,
      mapTypeControl: false,
      streetViewControl: false
    });
    googleMapInstance.current = map;

    const marker = new (window as any).google.maps.Marker({
      position: { lat: centerLat, lng: centerLng },
      map,
      draggable: true
    });
    googleMarkerInstance.current = marker;

    map.addListener('click', (e: any) => {
      const clickedLat = e.latLng.lat();
      const clickedLng = e.latLng.lng();
      marker.setPosition({ lat: clickedLat, lng: clickedLng });
      handleMapCoordSelect(clickedLat, clickedLng);
    });

    marker.addListener('dragend', (e: any) => {
      const draggedLat = e.latLng.lat();
      const draggedLng = e.latLng.lng();
      handleMapCoordSelect(draggedLat, draggedLng);
    });
  };

  // Save as preferred farm location
  const handleSavePreferred = async () => {
    if (latitude == null || longitude == null) {
      showToast('Please select coordinates first.', 'warning');
      return;
    }

    try {
      setSavingPreferred(true);
      // If farmId is known, update that farm
      if (farmId) {
        await api.put(`/farms/${farmId}`, {
          latitude,
          longitude,
          location: locationName
        });
      } else {
        // Query user farms to find default farm
        const farmsRes = await api.get('/farms');
        const farms = Array.isArray(farmsRes.data) ? farmsRes.data : [];
        if (farms.length > 0) {
          await api.put(`/farms/${farms[0].id}`, {
            latitude,
            longitude,
            location: locationName
          });
        }
      }

      setSavedSuccess(true);
      showToast('Farm coordinates saved as preferred location!', 'success');
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save preferred location:', err);
      showToast('Could not save farm location.', 'error');
    } finally {
      setSavingPreferred(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
      {/* Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Location Services
          </span>
          <h3 className="text-base font-black text-slate-800 dark:text-white">
            Select Farm Coordinates
          </h3>
        </div>

        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setMode('GPS')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'GPS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Navigation size={13} />
            <span>Use GPS</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('SEARCH')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'SEARCH'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search size={13} />
            <span>Search Place</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('MAP')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'MAP'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapIcon size={13} />
            <span>Map Pin</span>
          </button>
        </div>
      </div>

      {/* Mode 1: GPS Current Location */}
      {mode === 'GPS' && (
        <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Crosshair size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                Browser Geolocation Access
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                AgroRent uses your device GPS to fetch high-precision, field-level weather and micro-climate advisories.
                Your location is never shared with third parties.
              </p>
            </div>
          </div>

          {gpsError && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{gpsError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleRequestGPS}
            disabled={gpsLoading}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {gpsLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
            <span>{gpsLoading ? 'Detecting Satellite GPS...' : 'Acquire Current Position'}</span>
          </button>
        </div>
      )}

      {/* Mode 2: Real Geocoding Search */}
      {mode === 'SEARCH' && (
        <div className="space-y-3 relative">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by city, town, village, or district (e.g. Tenali, Guntur)"
              className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
            {searchLoading && (
              <Loader2 size={16} className="absolute right-4 top-3.5 text-slate-400 animate-spin" />
            )}
          </div>

          {/* Search suggestions dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-20 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full p-3.5 text-left text-xs hover:bg-emerald-50/50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin size={15} className="text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-white">{item.displayName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Lat: {item.latitude}, Lng: {item.longitude}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Select</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Interactive Map */}
      {mode === 'MAP' && (
        <div className="space-y-3">
          {googleMapsKey ? (
            <div className="space-y-2">
              <div
                ref={mapContainerRef}
                className="w-full h-64 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800"
              />
              <span className="text-[10px] text-slate-400 block">
                Click anywhere on the map or drag the marker to pin your exact farm fields.
              </span>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                    <MapPin size={14} /> Interactive Coordinate Picker
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Enter precise GPS coordinates directly or search above. To activate full Google Maps tiles, configure <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase shrink-0">
                  Manual Coords Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Latitude (-90 to 90)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude != null ? latitude : ''}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || null)}
                    placeholder="e.g. 16.3067"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Longitude (-180 to 180)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude != null ? longitude : ''}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || null)}
                    placeholder="e.g. 80.4365"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (latitude != null && longitude != null) {
                    handleMapCoordSelect(latitude, longitude);
                  }
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Apply Coordinates
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selected Location Summary Badge */}
      <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <MapPin size={16} />
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-white block">
              {locationName || 'No location selected yet'}
            </span>
            <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
              {latitude != null && longitude != null
                ? `Coordinates: ${latitude.toFixed(6)}°, ${longitude.toFixed(6)}°`
                : 'Select using GPS, Search, or Map above'}
            </span>
          </div>
        </div>

        {showSavePreferred && latitude != null && longitude != null && (
          <button
            type="button"
            onClick={handleSavePreferred}
            disabled={savingPreferred}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              savedSuccess
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
            }`}
          >
            {savingPreferred ? (
              <Loader2 size={13} className="animate-spin" />
            ) : savedSuccess ? (
              <CheckCircle2 size={13} />
            ) : (
              <Save size={13} />
            )}
            <span>{savedSuccess ? 'Saved to Farm Profile' : 'Save as Farm Location'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

