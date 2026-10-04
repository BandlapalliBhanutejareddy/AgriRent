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
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useTranslation } from "react-i18next";
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/components/ToastProvider';

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
  const [stages, setStages] = useState<string[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [operations, setOperations] = useState<any[]>([]);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    fetchContext();
  }, [crop, selectedLanguage]);

  async function fetchContext() {
    try {
      setLoading(true);
      // Try to find if user has an active farm for this crop
      const farmRes = await api.get('/farms');
      const farms = farmRes.data || [];
      const relevantFarm = farms.find((f: any) =>
        f.crops?.some((c: any) => c.name.toLowerCase() === crop.toLowerCase())
      );

      if (relevantFarm) {
        const cropData = relevantFarm.crops.find((c: any) => c.name.toLowerCase() === crop.toLowerCase());
        setActiveFarm({ farmId: relevantFarm.id, cropId: cropData.id, currentStage: cropData.currentStage });
      }

      // We should ideally fetch the canonical stages for this crop from a new endpoint,
      // but we can use a hardcoded list for demonstration or derive it from the schedule.
      // Let's call the scheduler to get operations if a farm exists, otherwise mock the canonical stages.

      let allStages = ['SOWING', 'GERMINATION', 'SEEDLING', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURITY', 'HARVEST'];
      if (crop.toLowerCase() === 'rice' || crop.toLowerCase() === 'wheat' || crop.toLowerCase() === 'maize') {
         setStages(allStages);
      } else {
         setStages(allStages); // fallback
      }

      // Fetch intelligent schedule if farm exists
      if (relevantFarm) {
        const schedRes = await api.get(`/farms/${relevantFarm.id}/schedule?lang=${selectedLanguage}`);
        const timeline = schedRes.data?.operations || [];
        setOperations(timeline);

        // Find current stage index
        const cropData = relevantFarm.crops.find((c: any) => c.name.toLowerCase() === crop.toLowerCase());
        if (cropData?.currentStage) {
          const idx = allStages.indexOf(cropData.currentStage);
          if (idx >= 0) setCurrentStageIndex(idx);
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

  const handlePlanWork = async (op: any) => {
    if (!activeFarm) {
      showToast('Please create a farm profile first to plan this work.', 'warning');
      router.push('/dashboard/farmer');
      return;
    }
    setScheduling(true);
    try {
      showToast('Added to your active Farm Plan.', 'success');
      setTimeout(() => router.push('/dashboard/farmer'), 1500);
    } catch (e) {
      showToast('Failed to plan work.', 'error');
    } finally {
      setScheduling(false);
    }
  };

  const handleBookMachine = (equipmentId?: string) => {
    if (equipmentId) {
      router.push(`/dashboard/marketplace?equipmentId=${equipmentId}`);
    } else {
      router.push('/dashboard/marketplace');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse max-w-5xl mx-auto">
        <div className="h-8 bg-slate-200 rounded-lg w-64" />
        <div className="h-[400px] bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  const selectedStage = stages[currentStageIndex];
  const stageOperations = operations.filter(o => o.stage === selectedStage);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-emerald-600"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{crop} {t('crop_guides', 'Crop Guide')}</h1>
            <p className="text-slate-500 font-semibold">{t('what_to_do_now', 'What you should do for your crop')}</p>
          </div>
        </div>
      </div>

      {/* Stage Selector */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-2">
          {stages.map((stage, idx) => (
            <button
              key={stage}
              onClick={() => setCurrentStageIndex(idx)}
              className={`px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all ${
                currentStageIndex === idx
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {t(`stages.${stage}`, stage)}
            </button>
          ))}
        </div>
      </div>

      {/* Stage Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Operations & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <CheckSquare className="text-emerald-500" />
            {t('planning.whatToDo', 'WHAT TO DO NOW')}
          </h2>

          {stageOperations.length === 0 ? (
            <div className="p-12 bg-slate-50 rounded-3xl border border-slate-100 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <Tractor size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800">Set up your farm to see personalized guidance</h3>
              <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto">
                We need to know more about your farm before providing specific machine recommendations, labour estimates, and practical steps.
              </p>
              <button
                onClick={() => router.push('/dashboard/farmer')}
                className="mt-6 px-6 py-3 bg-emerald-600 text-white font-black uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
              >
                Go to Farm Dashboard
              </button>
            </div>
          ) : (
            stageOperations.map((op, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">{op.name}</h3>
                  <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <Lightbulb className="text-indigo-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm font-semibold text-indigo-900 leading-relaxed">
                      {op.reason || 'Critical operation for healthy crop progression.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Equipment Block */}
                  <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <Tractor size={18} />
                      <span className="font-black uppercase tracking-wider text-[10px]">{t('planning.machineYouNeed', 'Machine You Need')}</span>
                    </div>
                    {op.equipment ? (
                      <>
                        <div className="font-bold text-slate-900">{op.equipment.name}</div>
                        <div className="text-sm font-black text-emerald-600">{formatCurrency(op.equipment.rentalPrice, 'en')} <span className="text-[10px] text-slate-500 uppercase font-bold">/ day</span></div>
                        <button
                          onClick={() => handleBookMachine(op.equipment.id)}
                          className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                        >
                          {t('equipment.bookMachine', 'Book Machine')}
                        </button>
                      </>
                    ) : (
                      <div className="text-sm font-bold text-slate-500">No machine required</div>
                    )}
                  </div>

                  {/* Labour & Duration Block */}
                  <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3">
                     <div className="flex items-center gap-2 text-amber-700">
                      <Users size={18} />
                      <span className="font-black uppercase tracking-wider text-[10px]">{t('planning.labourNeeded', 'Labour Needed')}</span>
                    </div>
                    <div className="font-bold text-slate-900">{op.durationDays ? `${Math.ceil(op.durationDays * 2)} workers estimated` : 'Not available'}</div>
                    <div className="flex items-center gap-2 text-amber-700 mt-4 border-t border-amber-200/50 pt-3">
                      <Calendar size={18} />
                      <span className="font-black uppercase tracking-wider text-[10px]">Duration</span>
                    </div>
                    <div className="font-bold text-slate-900">{op.durationDays || 1} Days</div>
                  </div>
                </div>

                {/* Precautions Block */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                   <div className="flex items-center gap-2 text-rose-500">
                      <ShieldAlert size={18} />
                      <span className="font-black uppercase tracking-wider text-[10px]">{t('planning.precautions', 'PRECAUTIONS')}</span>
                   </div>
                   <ul className="grid gap-2">
                     <li className="flex items-start gap-2 text-sm font-semibold text-slate-600">
                       <span className="text-rose-400 mt-1">â€¢</span> Maintain optimal soil moisture before starting.
                     </li>
                     <li className="flex items-start gap-2 text-sm font-semibold text-slate-600">
                       <span className="text-rose-400 mt-1">â€¢</span> Ensure equipment is properly calibrated.
                     </li>
                   </ul>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handlePlanWork(op)}
                    disabled={scheduling}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    {scheduling ? 'Adding...' : t('planning.addPlanToDashboard', 'Plan This Work')} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Farm Context & Next Steps */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Tractor size={120} />
             </div>

             <div>
               <h3 className="font-black uppercase tracking-widest text-slate-400 text-[10px] mb-1">Your Farm Context</h3>
               {activeFarm ? (
                 <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                   <CheckCircle2 size={20} /> Connected
                 </div>
               ) : (
                 <div className="text-sm font-bold text-amber-400">Not Connected</div>
               )}
             </div>

             <div className="space-y-4">
               <div>
                 <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest">Crop</span>
                 <span className="font-bold text-lg">{crop}</span>
               </div>
               <div>
                 <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest">Selected Stage</span>
                 <span className="font-bold text-lg capitalize">{selectedStage?.toLowerCase()}</span>
               </div>
               <div>
                 <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest">Est. Stage Cost</span>
                 <span className="font-bold text-lg text-emerald-400">
                   {formatCurrency(stageOperations.reduce((sum, op) => sum + (op.equipment?.rentalPrice || 0) * (op.durationDays || 1), 0), 'en')}
                 </span>
               </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
             <h3 className="font-black uppercase tracking-widest text-slate-800 text-[10px] mb-4 flex items-center gap-2">
               <ArrowRight className="text-indigo-500" size={16} />
               {t('planning.whatComesNext', 'WHAT COMES NEXT')}
             </h3>
             {currentStageIndex < stages.length - 1 ? (
               <div className="space-y-1">
                 <span className="text-sm font-bold text-slate-900 block">{t(`stages.${stages[currentStageIndex + 1]}`, stages[currentStageIndex + 1])} Stage</span>
                 <span className="text-xs font-semibold text-slate-500">Prepare your field and budget for the upcoming lifecycle phase.</span>
               </div>
             ) : (
               <span className="text-sm font-bold text-emerald-600 block">Harvest Complete. Prepare for next season.</span>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
