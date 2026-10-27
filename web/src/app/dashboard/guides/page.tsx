'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Sprout,
  BookOpen,
  ChevronRight,
  Lightbulb,
  Search,
  BookMarked,
  BrainCircuit,
  Tractor,
  ExternalLink,
  Droplets,
  Layers,
  Sparkles,
  Info,
  X,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from "react-i18next";
import { useStore } from '@/store/useStore';

interface ModernTechnique {
  id: string;
  title: string;
  description: string;
  relatedCrop: string;
  equipmentSuggestion: string;
  imageUrl?: string;
  benefit?: string;
  fullDetails?: string;
}

const DEFAULT_CROPS = [
  { name: 'Rice', icon: '🌾', season: 'Kharif', duration: '120-150 Days', soil: 'Clay / Loam' },
  { name: 'Wheat', icon: '🌾', season: 'Rabi', duration: '110-130 Days', soil: 'Well-drained Loam' },
  { name: 'Maize', icon: '🌽', season: 'Kharif / Rabi', duration: '90-110 Days', soil: 'Sandy Loam' },
  { name: 'Cotton', icon: '☁️', season: 'Kharif', duration: '150-180 Days', soil: 'Black Cotton Soil' },
  { name: 'Sugarcane', icon: '🎋', season: 'Annual', duration: '300-360 Days', soil: 'Deep Rich Loam' },
  { name: 'Potato', icon: '🥔', season: 'Rabi', duration: '90-120 Days', soil: 'Loose Sandy Loam' },
  { name: 'Tomato', icon: '🍅', season: 'All Season', duration: '70-90 Days', soil: 'Rich Loam' },
  { name: 'Groundnut', icon: '🥜', season: 'Kharif / Zaid', duration: '100-120 Days', soil: 'Red Sandy Loam' }
];

export default function GuidesHub() {
  const { t } = useTranslation();
  const { user } = useStore();
  const [guidesData, setGuidesData] = useState<any>({});
  const [techniques, setTechniques] = useState<ModernTechnique[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCrop, setSearchCrop] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState<ModernTechnique | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [guidesRes, techRes] = await Promise.all([
        api.get('/guides').catch(() => ({ data: {} })),
        api.get('/guides/techniques').catch(() => ({ data: [] }))
      ]);
      setGuidesData(guidesRes.data || {});
      const techList = techRes.data || [];
      setTechniques(Array.isArray(techList) ? techList : []);
    } catch (error) {
      console.error('Failed to fetch guides:', error);
      setGuidesData({});
      setTechniques([]);
    } finally {
      setLoading(false);
    }
  }

  // Merge API crops with curated crop catalog
  const availableCrops = Object.keys(guidesData);
  const displayCrops = DEFAULT_CROPS.filter(c => {
    if (!searchCrop.trim()) return true;
    return c.name.toLowerCase().includes(searchCrop.toLowerCase());
  });

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse max-w-6xl mx-auto">
        <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Compact Modern Hero Banner */}
      <div className="bg-[#163A2D] rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden shadow-xl border border-emerald-900/40">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BrainCircuit size={160} />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#84CC16]/20 text-[#84CC16] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#84CC16]/30">
            <Sprout size={13} /> {t('agricultural_knowledge_base', 'Agricultural Knowledge & Precision Guides')}
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Crop Lifecycle & Modern Farming Guides
          </h1>
          <p className="text-emerald-100/80 font-medium text-xs sm:text-sm leading-relaxed">
            Vetted agronomic milestones, stage-specific machinery requirements, and modern precision techniques tailored for Indian farmers.
          </p>
        </div>
      </div>

      {/* Horizontal Crop Selection Carousel / Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BookMarked size={20} className="text-[#163A2D] dark:text-[#84CC16]" />
              <span>Select Crop Guide</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">Explore sowing, irrigation, and harvesting equipment for each crop</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchCrop}
              onChange={e => setSearchCrop(e.target.value)}
              placeholder="Filter crops (e.g. Rice, Wheat)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
            />
          </div>
        </div>

        {/* Horizontal Crop Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
          {displayCrops.map((crop) => (
            <Link
              key={crop.name}
              href={`/dashboard/guides/${encodeURIComponent(crop.name)}`}
              className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-[#84CC16] hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-2xl border border-emerald-100 dark:border-emerald-900/50 group-hover:scale-105 transition-transform">
                  {crop.icon}
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {crop.season}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight group-hover:text-emerald-600 transition-colors">
                  {crop.name}
                </h3>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-1">
                  <span>{crop.duration}</span>
                  <span className="text-emerald-600 dark:text-[#84CC16] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    View <ChevronRight size={11} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Modern Farming Techniques - Compact Responsive Grid */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Lightbulb size={20} className="text-[#84CC16]" />
              <span>Modern Precision Farming Techniques</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">Field-tested methodologies to increase yield, conserve water, and lower operational expense</p>
          </div>

          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#84CC16] rounded-full text-xs font-black uppercase">
            {techniques.length > 0 ? `${techniques.length} Techniques` : 'Curated Techniques'}
          </span>
        </div>

        {/* Compact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(techniques.length > 0 ? techniques : [
            {
              id: 'tech-sri',
              title: 'System of Rice Intensification (SRI)',
              description: 'Method to increase rice yield with 40% less water and 80% fewer seedlings through alternate wetting and drying.',
              relatedCrop: 'Rice / Paddy',
              equipmentSuggestion: 'Cono-Weeder & Laser Land Leveler',
              benefit: '40% Water Savings • 25% Higher Yield'
            },
            {
              id: 'tech-zero-till',
              title: 'Zero-Tillage Wheat Direct Seeding',
              description: 'Planting wheat directly into standing rice stubble without preliminary tillage, preserving residual moisture.',
              relatedCrop: 'Wheat',
              equipmentSuggestion: 'Happy Seeder / Turbo Seeder',
              benefit: 'Prevents Stubble Burning • Saves ₹2,500/acre'
            },
            {
              id: 'tech-drip',
              title: 'Solar Micro-Drip Fertigation',
              description: 'Automated application of water and dissolved nutrients directly to root zones at regular micro-intervals.',
              relatedCrop: 'Tomato / Cotton / Sugarcane',
              equipmentSuggestion: 'Solar Drip Kit & Fertigation Venturi',
              benefit: '50% Fertilizer Efficiency • Zero Runoff'
            },
            {
              id: 'tech-laser',
              title: 'Laser Guided Land Leveling',
              description: 'Precision leveling of farm soil surfaces within ±2cm accuracy using laser transmitter and hydraulic scraper.',
              relatedCrop: 'All Field Crops',
              equipmentSuggestion: 'Laser Land Leveler (55+ HP)',
              benefit: 'Uniform Irrigation • 20% Water Reduction'
            },
            {
              id: 'tech-drone',
              title: 'Precision Agri-Drone Spraying',
              description: 'Ultra-low-volume spray of bio-fertilizers and pest controls with GPS boundary lock and zero crop trampling.',
              relatedCrop: 'Cotton / Maize / Paddy',
              equipmentSuggestion: 'Agricultural Spraying Drone (10L-16L)',
              benefit: '90% Water Reduction • 10 Acres/Hour'
            },
            {
              id: 'tech-rotary',
              title: 'Mulch In-Situ Soil Incorporation',
              description: 'Shredding and blending harvested crop residues into the top 10cm soil profile to build organic humus.',
              relatedCrop: 'Sugarcane / Maize',
              equipmentSuggestion: 'Rotavator & Mulcher Shredder',
              benefit: 'Enhances Soil Microbes • Moisture Lock'
            }
          ]).map((tech) => (
            <div
              key={tech.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#84CC16]">
                    {tech.relatedCrop}
                  </span>
                  <button
                    onClick={() => setSelectedTechnique(tech)}
                    className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    Details ↗
                  </button>
                </div>

                <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug">
                  {tech.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
                  {tech.description}
                </p>

                {tech.benefit && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] font-bold">
                    <Sparkles size={11} />
                    <span>{tech.benefit}</span>
                  </div>
                )}
              </div>

              {/* Machinery Link Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                  <Tractor size={14} className="text-emerald-600 dark:text-[#84CC16]" />
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[160px]">
                    {tech.equipmentSuggestion}
                  </span>
                </div>

                <Link
                  href={`/dashboard/marketplace?search=${encodeURIComponent(tech.equipmentSuggestion.split(' ')[0])}`}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-emerald-600 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  Rent Machinery
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Detail Modal for Modern Technique */}
      {selectedTechnique && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-start pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#84CC16]">
                  {selectedTechnique.relatedCrop}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {selectedTechnique.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTechnique(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
              <p>{selectedTechnique.description}</p>

              {selectedTechnique.benefit && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-2xl flex items-center gap-2">
                  <Sparkles size={16} className="shrink-0 text-amber-500" />
                  <span className="font-bold">{selectedTechnique.benefit}</span>
                </div>
              )}

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Recommended Machinery</span>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Tractor size={18} className="text-emerald-600" />
                  <span>{selectedTechnique.equipmentSuggestion}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Leasing this machinery on AgroRent eliminates capital expense while achieving precision agronomic targets.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTechnique(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
              <Link
                href={`/dashboard/marketplace?search=${encodeURIComponent(selectedTechnique.equipmentSuggestion.split(' ')[0])}`}
                onClick={() => setSelectedTechnique(null)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <span>Browse Equipment on Market</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Agronomic References Strip */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 font-medium">
          <Info size={16} className="text-slate-400" />
          <span>Validated with agronomic package of practices from ICAR & State Agricultural Universities (TNAU, ANGRAU).</span>
        </div>
        <Link
          href="/dashboard/ai-advisor"
          className="text-emerald-600 dark:text-[#84CC16] font-bold hover:underline inline-flex items-center gap-1 shrink-0"
        >
          <span>Ask AI Assistant for Crop Advice</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
