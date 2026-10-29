'use client';

import React, { useEffect, useState } from 'react';
import {
  CloudSun,
  CloudRain,
  RefreshCw,
  Calendar,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import FarmLocationSelector, { LocationSelectedData } from '@/components/FarmLocationSelector';

export default function WeatherPage() {
  const { showToast } = useToast();

  // Weather state
  const [selectedLocation, setSelectedLocation] = useState<LocationSelectedData | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialWeather();
  }, []);

  async function fetchInitialWeather() {
    try {
      setWeatherLoading(true);
      setWeatherError(null);
      const res = await api.get('/farms/weather/lookup');
      const payload = res.data?.data || res.data;
      if (payload && (payload.location || payload.current)) {
        setWeatherData(payload);
        if (payload.location) {
          setSelectedLocation({
            latitude: payload.location.latitude,
            longitude: payload.location.longitude,
            name: payload.location.name
          });
        }
      }
    } catch (err: any) {
      console.warn('Initial weather lookup prompt:', err.response?.data?.error);
      if (err.response?.data?.code === 'WEATHER_LOCATION_UNAVAILABLE') {
        setWeatherError('Please select a location above using GPS, Search, or Map Pin to view weather.');
      } else {
        setWeatherError('Weather service is currently offline. Please try selecting a location.');
      }
    } finally {
      setWeatherLoading(false);
    }
  }

  async function fetchWeatherByLocation(lat: number, lng: number, name?: string) {
    try {
      setWeatherLoading(true);
      setWeatherError(null);
      const params = new URLSearchParams();
      params.append('lat', String(lat));
      params.append('lng', String(lng));
      if (name) params.append('name', name);

      const res = await api.get(`/farms/weather/lookup?${params.toString()}`);
      const payload = res.data?.data || res.data;
      if (payload && (payload.location || payload.current)) {
        setWeatherData(payload);
        setSelectedLocation({ latitude: lat, longitude: lng, name: payload.location?.name || name || '' });
      } else {
        setWeatherError(res.data?.error || 'Failed to retrieve weather for selected coordinates.');
      }
    } catch (err: any) {
      console.error('Failed to fetch weather:', err);
      setWeatherError(err.response?.data?.error || 'Unable to retrieve weather. Please check your network.');
    } finally {
      setWeatherLoading(false);
    }
  }

  const handleLocationSelected = (data: LocationSelectedData) => {
    setSelectedLocation(data);
    fetchWeatherByLocation(data.latitude, data.longitude, data.name);
  };

  const current = weatherData?.current;
  const forecast = weatherData?.forecast || [];
  const locInfo = weatherData?.location;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-8 rounded-[32px] text-white shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-xl text-xs font-black uppercase tracking-wider border border-teal-500/30 inline-flex items-center gap-1.5">
            <CloudSun size={13} /> Agronomic Climate & Micro-Weather Intelligence
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2">
            Field Weather & Agricultural Advisories
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Coordinate-accurate 7-day agricultural forecasts and machinery operational spraying windows powered by Open-Meteo.
          </p>
        </div>

        {selectedLocation && (
          <button
            onClick={() => fetchWeatherByLocation(selectedLocation.latitude, selectedLocation.longitude, selectedLocation.name)}
            disabled={weatherLoading}
            className="px-4 py-2.5 bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/30 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={14} className={weatherLoading ? 'animate-spin' : ''} />
            <span>Refresh Forecast</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Location Selection (GPS / Search / Map) */}
        <FarmLocationSelector
          initialLatitude={selectedLocation?.latitude}
          initialLongitude={selectedLocation?.longitude}
          initialName={selectedLocation?.name}
          onLocationSelected={handleLocationSelected}
        />

        {weatherLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
            <div className="md:col-span-2 h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          </div>
        ) : current ? (
          <>
            {/* Primary Current Weather Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2 bg-gradient-to-br from-teal-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-wider">
                        Current Field Conditions
                      </span>
                      {weatherData?.isCached && (
                        <span className="px-2 py-0.5 bg-black/20 rounded-md text-[9px] font-mono">
                          Cached
                        </span>
                      )}
                    </div>
                    <div className="text-5xl font-black tracking-tight mt-4">
                      {current.temperature != null ? `${Math.round(current.temperature)}°C` : 'N/A'}
                    </div>
                    <p className="text-teal-100 font-bold text-sm mt-1">
                      {current.weatherDescription}
                    </p>
                  </div>
                  <CloudSun size={64} className="text-white/80" />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-teal-200 text-[10px] block font-bold uppercase">Humidity</span>
                    <span className="text-base font-black">{current.humidity ?? 0}%</span>
                  </div>
                  <div>
                    <span className="text-teal-200 text-[10px] block font-bold uppercase">Wind Velocity</span>
                    <span className="text-base font-black">{current.windSpeed ?? 0} km/h</span>
                  </div>
                  <div>
                    <span className="text-teal-200 text-[10px] block font-bold uppercase">Precipitation</span>
                    <span className="text-base font-black">{current.precipitation ?? 0} mm</span>
                  </div>
                </div>
              </div>

              {/* Agricultural Field & Machinery Advisory */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                    <Sparkles size={12} /> Agricultural Machinery Advisory
                  </span>
                  <h3 className="text-base font-black text-slate-800 dark:text-white mt-2">
                    Optimal Field Work Windows
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {(current.precipitation ?? 0) > 2
                      ? 'Heavy precipitation detected. Postpone tractor rotavator, cultivator passes, and seeding operations to avoid severe topsoil compaction.'
                      : (current.windSpeed ?? 0) > 20
                      ? 'High wind velocity detected. Pause chemical knapsack or tractor boom spraying to eliminate pesticide drift risks.'
                      : 'Weather conditions are optimal for tractor cultivation, rotavator soil preparation, seed drill passes, and boom spraying.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">Spraying Condition:</span>
                    <span className={`font-bold ${
                      (current.windSpeed ?? 10) < 15 && (current.precipitation ?? 0) === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {(current.windSpeed ?? 10) < 15 && (current.precipitation ?? 0) === 0
                        ? 'Optimal (<15 km/h, No Rain)'
                        : 'Caution (Drift or Rain Risk)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">Harvester Operations:</span>
                    <span className={`font-bold ${
                      (current.precipitation ?? 0) === 0
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {(current.precipitation ?? 0) === 0 ? 'Favorable Dry Canopy' : 'Wait for Crop to Dry'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Day Forecast Strip */}
            {forecast.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar size={16} /> 7-Day Agricultural Forecast
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Timezone: {locInfo?.timezone || 'Local'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {forecast.slice(0, 7).map((day: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-2"
                    >
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        {day.date ? new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : `Day ${idx + 1}`}
                      </span>
                      <div className="my-1 flex justify-center text-teal-500">
                        {day.precipitation > 1 || day.precipitationProbability > 50 ? (
                          <CloudRain size={28} />
                        ) : (
                          <CloudSun size={28} />
                        )}
                      </div>
                      <div className="text-xs font-black text-slate-800 dark:text-white">
                        {Math.round(day.maxTemperature ?? 30)}° / {Math.round(day.minTemperature ?? 20)}°
                      </div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Rain: {day.precipitationProbability ?? 0}%
                      </span>
                      <span className="text-[9px] text-teal-600 dark:text-teal-400 block truncate font-medium">
                        {day.weatherDescription}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] text-slate-400">
                  <span>Data Source: {weatherData?.source || 'Open-Meteo'}</span>
                  <span>Retrieved: {new Date(weatherData?.fetchedAt || Date.now()).toLocaleString()}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <CloudSun size={36} className="text-slate-400 mx-auto" />
            <h3 className="text-base font-black text-slate-800 dark:text-white">
              {weatherError || 'No Location Selected'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Use the location selector above to detect your GPS position, search for your town/village, or drop a map pin.
            </p>
            {selectedLocation && (
              <button
                onClick={() => fetchWeatherByLocation(selectedLocation.latitude, selectedLocation.longitude, selectedLocation.name)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
              >
                <RefreshCw size={13} />
                <span>Retry Weather Forecast</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
