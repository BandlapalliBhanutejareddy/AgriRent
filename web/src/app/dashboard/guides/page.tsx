'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Sprout, BookOpen, ChevronRight, Lightbulb, Search } from 'lucide-react';
import Link from 'next/link';

export default function GuidesHub() {
  const [guidesData, setGuidesData] = useState<any>({});
  const [techniques, setTechniques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Agricultural Knowledge Base</h1>
        <p className="text-slate-500 mt-1">Expert-vetted farming guides and modern agricultural techniques.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Crop Guides */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Sprout size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Crop Guides</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crops.map((crop) => (
              <Link 
                key={crop} 
                href={`/dashboard/guides/${crop}`}
                className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl">
                      {crop === 'Rice' ? '🌾' : crop === 'Wheat' ? '🌾' : crop === 'Corn' ? '🌽' : crop === 'Potato' ? '🥔' : '🌱'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{crop}</h3>
                      <p className="text-sm text-slate-500">{guidesData[crop].length} Steps to Success</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Modern Techniques */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Lightbulb size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Modern Techniques</h2>
          </div>

          <div className="space-y-4">
            {techniques.map((tech) => (
              <div key={tech.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900">{tech.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{tech.description}</p>
                <div className="pt-3 border-t border-slate-50 flex items-center gap-2">
                  <BookOpen size={14} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Recommended Equipment</span>
                </div>
                <p className="text-xs font-medium text-slate-700">{tech.equipmentSuggestion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
