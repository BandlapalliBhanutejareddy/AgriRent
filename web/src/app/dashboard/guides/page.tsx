'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Sprout, BookOpen, ChevronRight, Lightbulb, Search } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from "react-i18next";

export default function GuidesHub() {
    const { t } = useTranslation();
  const [guidesData, setGuidesData] = useState<any>({});
  const [techniques, setTechniques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [guidesRes, techRes] = await Promise.all([
        api.get('/guides'),
        api.get('/guides/techniques')
      ]);
      setGuidesData(guidesRes.data);
      setTechniques(techRes.data);
    } catch (error) {
      console.error('Failed to fetch guides');
    } finally {
      setLoading(false);
    }
  };

  const crops = Object.keys(guidesData);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t('agricultural_knowledge_base')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('expert_vetted_farming_guides_and_modern')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Crop Guides */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Sprout size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('crop_guides')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crops.map((crop) => (
              <Link 
                key={crop} 
                href={`/dashboard/guides/${crop}`}
                className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-250 dark:hover:border-emerald-500 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-2xl border border-emerald-100 dark:border-emerald-900/30">
                      {crop === 'Rice' ? '🌾' : crop === 'Wheat' ? '🌾' : crop === 'Corn' ? '🌽' : crop === 'Potato' ? '🥔' : '🌱'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{crop}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{guidesData[crop].length} {t('steps_to_success')}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Modern Techniques */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <Lightbulb size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('modern_techniques')}</h2>
          </div>

          <div className="space-y-4">
            {techniques.map((tech) => (
              <div key={tech.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white">{tech.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{tech.description}</p>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <BookOpen size={14} className="text-emerald-650 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-650 dark:text-emerald-400 uppercase tracking-wider">{t('recommended_equipment')}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-800/40 px-2 py-1 rounded-lg inline-block">{tech.equipmentSuggestion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
