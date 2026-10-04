'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Sprout, BookOpen, ChevronRight, Lightbulb, Search, BookMarked, BrainCircuit, Tractor } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from "react-i18next";
import { useStore } from '@/store/useStore';

export default function GuidesHub() {
  const { t } = useTranslation();
  const { user } = useStore();
  const [guidesData, setGuidesData] = useState<any>({});
  const [techniques, setTechniques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [guidesRes, techRes] = await Promise.all([
        api.get('/guides'),
        api.get('/guides/techniques')
      ]);
      setGuidesData(guidesRes.data || {});
      setTechniques(techRes.data || []);
    } catch (error) {
      console.error('Failed to fetch guides:', error);
      setGuidesData({});
      setTechniques([]);
    } finally {
      setLoading(false);
    }
  };

  const crops = Object.keys(guidesData);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse max-w-5xl mx-auto">
        <div className="h-8 bg-slate-200 rounded-lg w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-white rounded-3xl border border-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Hero Header */}
      <div className="bg-slate-900 rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BrainCircuit size={160} />
        </div>
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/30">
            <Sprout size={14} /> AgroRent Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">{t('agricultural_knowledge_base', 'Farming Guide')}</h1>
          <p className="text-slate-400 font-semibold text-lg leading-relaxed">
            {t('expert_vetted_farming_guides_and_modern', 'Expert-vetted farming guides and modern techniques.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Crop Guides */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm border border-emerald-100">
              <BookMarked size={20} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('crop_guides', 'Crop Guide')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crops.map((crop) => (
              <Link
                key={crop}
                href={`/dashboard/guides/${encodeURIComponent(crop)}`}
                className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110" />
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl border border-slate-100 group-hover:scale-105 transition-transform">
                      {crop === 'Rice' ? 'Ã°Å¸Å’Â¾' : crop === 'Wheat' ? 'Ã°Å¸Å’Â¾' : crop === 'Corn' ? 'Ã°Å¸Å’Â½' : crop === 'Potato' ? 'Ã°Å¸Â¥â€' : 'Ã°Å¸Å’Â±'}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-xl tracking-tight group-hover:text-emerald-600 transition-colors">{crop}</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5 flex items-center gap-1">
                        View Guide <ChevronRight size={12} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Modern Techniques */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm border border-indigo-100">
              <Lightbulb size={20} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('modern_techniques', 'Modern Techniques')}</h2>
          </div>

          <div className="space-y-4">
            {techniques.map((tech) => (
              <div key={tech.id} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-black text-slate-900 leading-tight">{tech.title}</h3>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed">{tech.description}</p>
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Tractor size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{t('recommended_equipment', 'Recommended Machine')}</span>
                  </div>
                  <span className="inline-block px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700">
                    {tech.equipmentSuggestion}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
