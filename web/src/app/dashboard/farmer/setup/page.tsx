'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { Tractor, MapPin, Leaf, CheckCircle } from 'lucide-react';
import FarmLocationSelector, { LocationSelectedData } from '@/components/FarmLocationSelector';

const STAGES = ['SOWING', 'GERMINATION', 'SEEDLING', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURITY', 'HARVEST'];

export default function FarmerSetupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    area: '',
    soilType: 'Red',
    cropName: '',
    season: 'Kharif',
    stage: 'SOWING',
    totalBudget: '50000'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelected = (data: LocationSelectedData) => {
    setFormData((prev) => ({
      ...prev,
      location: data.name,
      latitude: data.latitude,
      longitude: data.longitude
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please enter a farm name', 'warning');
      return;
    }
    if (!formData.location.trim()) {
      showToast('Please select or specify your farm location', 'warning');
      return;
    }

    setLoading(true);
    
    try {
      await api.post('/farms', {
        ...formData,
        area: Number(formData.area),
        latitude: formData.latitude,
        longitude: formData.longitude
      });
      showToast('Farm created with verified location!', 'success');
      router.push('/dashboard/farmer');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create farm', 'warning');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
        
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Tractor size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Setup Your Farm</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Enter your farm details and field coordinates to activate AI Advisor and Weather alerts</p>
          </div>
        </div>

        {/* Phase 2 & 3: Integrated Location Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
            Farm Coordinates & Location
          </label>
          <FarmLocationSelector
            initialLatitude={formData.latitude}
            initialLongitude={formData.longitude}
            initialName={formData.location}
            onLocationSelected={handleLocationSelected}
            showSavePreferred={false}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Farm Name</label>
              <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none" placeholder="e.g. Green Acres" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Location Name</label>
              <input required name="location" value={formData.location} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none" placeholder="e.g. Tenali, Guntur AP" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Area (Acres)</label>
              <input required type="number" min="1" step="0.5" name="area" value={formData.area} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none" placeholder="e.g. 5" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Soil Type</label>
              <select name="soilType" value={formData.soilType} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none">
                <option value="Red">Red Soil</option>
                <option value="Black">Black Soil</option>
                <option value="Alluvial">Alluvial</option>
                <option value="Sandy Loam">Sandy Loam</option>
                <option value="Clay">Clay</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Leaf size={20} className="text-emerald-500"/> Current Crop Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Crop Name</label>
                <input required name="cropName" value={formData.cropName} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none" placeholder="e.g. Rice, Cotton, Maize" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Season</label>
                <select name="season" value={formData.season} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none">
                  <option value="Kharif">Kharif</option>
                  <option value="Rabi">Rabi</option>
                  <option value="Zaid">Zaid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Current Growth Stage</label>
                <select name="stage" value={formData.stage} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none">
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Total Season Budget (₹)</label>
                <input required type="number" name="totalBudget" value={formData.totalBudget} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none" placeholder="50000" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating Farm Digital Twin...' : 'Complete Farm Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
