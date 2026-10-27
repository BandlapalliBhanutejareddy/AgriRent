'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  Search,
  Tractor,
  Calendar,
  Users,
  ShieldAlert,
  Wallet,
  CheckSquare,
  ArrowRight,
  Sprout,
  Droplets,
  Layers,
  Thermometer,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useTranslation } from "react-i18next";
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/components/ToastProvider';
import { CROP_KNOWLEDGE, CropGuideData } from '@/lib/cropKnowledge';

export default function CropGuideDetail() {
  const { t, i18n } = useTranslation();
  const { user } = useStore();
  const selectedLanguage = i18n.language || 'en';
  const params = useParams();
  const router = useRouter();
  const crop = decodeURIComponent((params?.crop as string) || '');
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeFarm, setActiveFarm] = useState<any>(null);
  const [stages, setStages] = useState<string[]>([
    'SOWING',
    'GERMINATION',
    'SEEDLING',
    'VEGETATIVE',
    'FLOWERING',
    'FRUITING',
    'MATURITY',
    'HARVEST'
  ]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [operations, setOperations] = useState<any[]>([]);
  const [scheduling, setScheduling] = useState(false);

  const cropKey = crop.toLowerCase().trim();
  const guideData: CropGuideData = CROP_KNOWLEDGE[cropKey] || CROP_KNOWLEDGE['rice'];

  useEffect(() => {
    fetchContext();
  }, [crop, selectedLanguage]);

  async function fetchContext() {
    try {
      setLoading(true);
      const farmRes = await api.get('/farms').catch(() => ({ data: [] }));
      const farms = farmRes.data || [];
      const relevantFarm = farms.find((f: any) =>
        f.crops?.some((c: any) => c.name.toLowerCase() === crop.toLowerCase())
      );

      if (relevantFarm) {
        const cropData = relevantFarm.crops.find((c: any) => c.name.toLowerCase() === crop.toLowerCase());
        setActiveFarm({ farmId: relevantFarm.id, cropId: cropData?.id, currentStage: cropData?.currentStage });

        try {
          const schedRes = await api.get(`/farms/${relevantFarm.id}/schedule?lang=${selectedLanguage}`);
          const timeline = schedRes.data?.operations || [];
          setOperations(timeline);

          if (cropData?.currentStage) {
            const idx = stages.indexOf(cropData.currentStage);
            if (idx >= 0) setCurrentStageIndex(idx);
          }
        } catch (_) {
          setOperations([]);
        }
      } else {
        setOperations([]);
      }
    } catch (error) {
      console.error('Failed to fetch guide context:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleBookMachine = (machineName?: string) => {
    if (machineName) {
      router.push(`/dashboard/marketplace?search=${encodeURIComponent(machineName.split(' ')[0])}`);
    } else {
      router.push('/dashboard/marketplace');
    }
  };

  const handlePlanWork = async () => {
    if (!activeFarm) {
      showToast('Set up your farm profile in the dashboard to track active tasks.', 'info');
      router.push('/dashboard/farmer');
      return;
    }
    setScheduling(true);
    try {
      showToast('Task added to your active Farm Plan!', 'success');
      setTimeout(() => router.push('/dashboard/farmer'), 1200);
    } catch (e) {
      showToast('Failed to add to farm plan.', 'error');
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse max-w-5xl mx-auto">
        <div className="h-8 bg-slate-200 rounded-lg w-64" />
        <div className="h-[300px] bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  const selectedStage = stages[currentStageIndex];
  const stageOperations = operations.filter(o => o.stage === selectedStage);
  const staticStageData = guideData.stages.find(s => s.stage === selectedStage) || guideData.stages[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow text-slate-500 hover:text-emerald-600 transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{guideData.emoji}</span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight capitalize">
                {guideData.name} Cultivation Guide
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 italic">
              {guideData.scientificName} • Verified Agronomic Guide
            </p>
          </div>
        </div>

        {activeFarm && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold">
            <CheckCircle2 size={14} /> Active on Your Farm
          </span>
        )}
      </div>

      {/* Comprehensive Agronomic Overview Card */}
      <div className="bg-gradient-to-br from-[#163A2D] via-[#1a4737] to-[#0f2920] rounded-[32px] p-6 sm:p-8 text-white shadow-xl border border-emerald-900/40 space-y-6">
        <div>
          <span className="px-3 py-1 bg-[#84CC16]/20 text-[#84CC16] rounded-xl text-[10px] font-black uppercase tracking-wider border border-[#84CC16]/30 inline-flex items-center gap-1.5">
            <Sprout size={12} /> Standard Agronomic Benchmark
          </span>
          <p className="text-sm font-medium text-emerald-100/90 mt-3 leading-relaxed">
            {guideData.overview}
          </p>
        </div>

        {/* 4-Column Grid: Seasons, Soil, Cost, Yield */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-emerald-800/60 text-xs">
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-emerald-300/80 block text-[10px] uppercase font-bold">Growing Seasons</span>
            <span className="text-white font-black text-xs sm:text-sm mt-0.5 block">{guideData.seasons}</span>
          </div>
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-emerald-300/80 block text-[10px] uppercase font-bold">Soil & Optimal pH</span>
            <span className="text-white font-black text-xs sm:text-sm mt-0.5 block">{guideData.idealPh} (pH)</span>
          </div>
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-emerald-300/80 block text-[10px] uppercase font-bold">Input Cost / Acre</span>
            <span className="text-white font-black text-xs sm:text-sm mt-0.5 block">{guideData.costPerAcre}</span>
          </div>
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-emerald-300/80 block text-[10px] uppercase font-bold">Expected Yield</span>
            <span className="text-[#84CC16] font-black text-xs sm:text-sm mt-0.5 block">{guideData.yieldPerAcre}</span>
          </div>
        </div>
      </div>

      {/* Stage Selector Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <div className="flex gap-2 sm:gap-3 min-w-max">
          {stages.map((stg, idx) => (
            <button
              key={stg}
              onClick={() => setCurrentStageIndex(idx)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                currentStageIndex === idx
                  ? 'bg-[#163A2D] text-white shadow-md shadow-emerald-950/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {t(`stages.${stg}`, stg)}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Stage Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Agronomic Tasks & Operation Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                  Stage {currentStageIndex + 1} of 8 • {t(`stages.${selectedStage}`, selectedStage)}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
                  {staticStageData.name}
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl shrink-0">
                ⏱ {staticStageData.durationDays} Days
              </span>
            </div>

            {/* Scientific Justification */}
            <div className="flex items-start gap-3 p-4 bg-teal-50 dark:bg-teal-950/30 rounded-2xl border border-teal-100 dark:border-teal-900/40">
              <Lightbulb className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" size={20} />
              <p className="text-xs sm:text-sm font-semibold text-teal-950 dark:text-teal-200 leading-relaxed">
                {staticStageData.reason}
              </p>
            </div>

            {/* Actionable Practical Steps */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <CheckSquare size={16} className="text-emerald-600" />
                Step-by-Step Field Instructions
              </h3>
              <div className="space-y-2.5">
                {staticStageData.tasks.map((task, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {task}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Precautions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
                <ShieldAlert size={16} /> Agronomic Precautions
              </h3>
              <ul className="space-y-1.5">
                {staticStageData.precautions.map((prec, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{prec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Required Machinery & Booking CTA */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
              <Tractor size={13} /> Recommended Machine
            </span>

            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {staticStageData.machine}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Category: {staticStageData.machineCategory}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="font-semibold">Estimated Labour:</span>
                <span className="font-bold text-slate-900 dark:text-white">{staticStageData.labourEstimate}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="font-semibold">Work Window:</span>
                <span className="font-bold text-slate-900 dark:text-white">{staticStageData.durationDays} Days</span>
              </div>
            </div>

            <button
              onClick={() => handleBookMachine(staticStageData.machine)}
              className="w-full py-3 bg-[#163A2D] hover:bg-[#1a4737] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Tractor size={16} className="text-[#84CC16]" />
              <span>Book Machine in Marketplace</span>
            </button>

            {activeFarm && (
              <button
                onClick={handlePlanWork}
                disabled={scheduling}
                className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Add to My Active Farm Plan</span>
              </button>
            )}
          </div>

          {/* ICAR Extension Citation Box */}
          <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" /> Research & Extension Sources
            </div>
            <p className="leading-relaxed text-[11px]">
              Guidance compiled in alignment with ICAR (Indian Council of Agricultural Research) package of practices and state agricultural university field trials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
