'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Tractor, CheckCircle, Search, PlayCircle, MapPin,
  Activity, CheckCircle2, Circle, Clock3, AlertTriangle, DollarSign, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';
import DrillDownModal from '@/components/DrillDownModal';

const STAGES = ['SOWING', 'GERMINATION', 'SEEDLING', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURITY', 'HARVEST'];

export default function FarmerDashboard() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useStore();
  const { showToast } = useToast();

  const selectedLanguage = i18n.language || 'en';

  const [farmId, setFarmId] = useState<string>('');
  const [cropId, setCropId] = useState<string>('');
  const [cropStage, setCropStage] = useState<string>('');
  const [farmProfile, setFarmProfile] = useState<any>(null);
  const [farmLoading, setFarmLoading] = useState(true);

  const [overview, setOverview] = useState<string>('');
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [operations, setOperations] = useState<any[]>([]);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [budgetData, setBudgetData] = useState<any>(null);

  const [opsLoading, setOpsLoading] = useState(true);
  const [schedLoading, setSchedLoading] = useState(true);
  const [budgetLoading, setBudgetLoading] = useState(true);

  // Drilldown state
  const [drillDownRows, setDrillDownRows] = useState<any[][]>([]);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownHeaders, setDrillDownHeaders] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  async function fetchDrillDown() {
    try {
      const res = await api.get('/analytics/farmer/bookings?limit=100');
      const bookings = res.data;
      const rows = bookings.map((b: any) => {
        const start = b.startDate ? new Date(b.startDate).toLocaleDateString() : '-';
        const end = b.endDate ? new Date(b.endDate).toLocaleDateString() : '-';
        const period = `${start} to ${end}`;

        return [
          new Date(b.createdAt).toLocaleDateString(),
          b.equipment?.title || 'Unknown',
          b.equipment?.owner?.name || 'Unknown',
          period,
          b.totalPrice ? formatCurrency(b.totalPrice) : formatCurrency(0),
          b.status,
          b.paymentStatus || 'PENDING',
          b.amountPaid ? formatCurrency(b.amountPaid) : formatCurrency(0)
        ];
      });
      setDrillDownHeaders(['Date', 'Equipment', 'Owner', 'Rental Period', 'Amount', 'Booking Status', 'Payment Status', 'Amount Paid']);
      setDrillDownRows(rows);
      setDrillDownTitle('Rental Spending Report');
      setIsDrillDownOpen(true);
    } catch (e) {
      showToast('Failed to load spending report', 'warning');
    }
  }

  const [completingOp, setCompletingOp] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackType, setFeedbackType] = useState('wentWell');

  const [copilotData, setCopilotData] = useState<any>(null);
  const [userQuery, setUserQuery] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);

  const translatedStage = (stage: string) => {
    if (!stage) return '';
    return t(`stages.${stage.toUpperCase()}`, stage);
  };

  const getOperationLabel = (name: string) => {
    if (!name) return '';
    const key = name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    return t(`operations.${key}`, t(`operations.${name}`, name));
  };

  const getStatusLabel = (status: string) => {
    if (!status) return '';
    return t(`statuses.${status.toUpperCase()}`, status);
  };

  useEffect(() => {
    let isMounted = true;
    async function initFarm() {
      try {
        const farmsRes = await api.get('/farms');
        if (farmsRes.data && farmsRes.data.length > 0) {
          const farm = farmsRes.data[0];
          if (isMounted) setFarmId(farm.id);

          if (farm.crops && farm.crops.length > 0) {
            const cid = farm.crops[0].id;
            const initialStage = farm.crops[0].stage || 'SOWING';
            if (isMounted) {
              setCropId(cid);
              setCropStage(initialStage);
              setFarmProfile({
                crop: farm.crops[0].cropName,
                acreage: farm.area,
                location: farm.location,
                season: farm.crops[0].season,
                budget: farm.totalBudget || 0
              });
              setFarmLoading(false);
            }
          } else {
            if (isMounted) router.replace('/dashboard/farmer/setup');
          }
        } else {
          if (isMounted) router.replace('/dashboard/farmer/setup');
        }
      } catch (err) {
        if (isMounted) setFarmLoading(false);
      }
    }
    initFarm();
    return () => { isMounted = false; };
  }, [router]);

  useEffect(() => {
    if (farmId && cropId && cropStage) {
      loadDashboardData(farmId, cropId, selectedLanguage);
    }
  }, [farmId, cropId, cropStage, selectedLanguage]);

  function loadDashboardData(fId: string, cId: string, lang: string) {
    setOverviewLoading(true);
    setOpsLoading(true);
    setSchedLoading(true);
    setBudgetLoading(true);

    api.get(`/farms/${fId}/crops/${cId}/overview?lang=${lang}`)
      .then(r => { setOverview(r.data.overview); setOverviewLoading(false); })
      .catch(() => setOverviewLoading(false));

    api.get(`/farms/${fId}/crops/${cId}/operations`)
      .then(r => { setOperations(r.data); setOpsLoading(false); })
      .catch(() => setOpsLoading(false));

    api.get(`/farms/${fId}/schedule?lang=${lang}`)
      .then(r => { setScheduleData(r.data); setSchedLoading(false); })
      .catch(() => setSchedLoading(false));

    api.get(`/farms/${fId}/financials?lang=${lang}`)
      .then(r => { setBudgetData(r.data); setBudgetLoading(false); })
      .catch(() => setBudgetLoading(false));

    api.get(`/analytics/farmer`)
      .then(r => setAnalytics(r.data))
      .catch(() => setAnalytics(null));
  }

  async function handleMarkCompleted() {
    if (!showFeedbackModal) return;
    setCompletingOp(true);
    try {
      const fbStr = t(`completion.${feedbackType}`);
      const fullFeedback = `${fbStr}. ${feedbackNotes}`;
      await api.post(`/farms/${farmId}/crops/${cropId}/operations/${showFeedbackModal}/complete`, {
        feedback: feedbackType,
        notes: feedbackNotes
      });
      showToast(t('completion.success'), 'success');
      setShowFeedbackModal(null);
      setFeedbackNotes('');
      loadDashboardData(farmId, cropId, selectedLanguage);
    } catch (err: any) {
      showToast(err.response?.data?.error || t('completion.failed'), 'error');
    } finally {
      setCompletingOp(false);
    }
  }

  async function fetchCopilotPlan(queryOverride?: string) {
    if (!farmId || !cropId) return;
    setCopilotLoading(true);
    const question = queryOverride || userQuery;
    try {
      const res = await api.post('/ai/farm-copilot', {
        farmId,
        cropId,
        question,
        language: selectedLanguage
      });
      setCopilotData(res.data);
      if (queryOverride || userQuery) setUserQuery('');
    } catch (e) {
      showToast(t('common.couldNotLoadAI'), 'error');
    } finally {
      setCopilotLoading(false);
    }
  }

  const timelineOperations = scheduleData?.operations || [];
  const currentScheduledOp = timelineOperations.find((o: any) => o.status !== 'COMPLETED') || timelineOperations[0];
  const nextScheduledOp = timelineOperations.find((o: any) => o.operationId !== currentScheduledOp?.operationId && o.status !== 'COMPLETED');

  const actualCurrentOp = operations.find((o: any) => o.status !== 'COMPLETED');
  const completedOps = operations.filter((o: any) => o.status === 'COMPLETED');

  const bState = budgetData?.financialState;
  const budgetStatusText = bState ? getStatusLabel(bState.budgetStatus) : '';

  if (farmLoading) {
    return <div className="p-8 text-center animate-pulse">{t('common.loadingFarm')}</div>;
  }

  if (!farmProfile) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200">
        <h2 className="text-xl font-bold">{t('common.noFarmProfile')}</h2>
        <Link href="/dashboard/farmer/setup" className="mt-4 inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold">{t('common.setupFarm')}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto pb-12">

      <div className="text-center p-6">
        <h1 className="text-3xl font-black uppercase text-slate-900 dark:text-white tracking-tight">
          {t('farmPlan.title')}
        </h1>
        <p className="text-lg font-bold text-slate-500 mt-2">
          {farmProfile.crop} Ã¢â‚¬Â¢ {farmProfile.acreage} {t('common.acres')} Ã¢â‚¬Â¢ {farmProfile.season} Ã¢â‚¬Â¢ {farmProfile.location}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-black tracking-widest text-emerald-600 uppercase mb-4 flex items-center gap-2">
          {t('farmPlan.howToFarm')}
        </h3>
        {overviewLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
          </div>
        ) : overview ? (
          <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium">
            {overview}
          </div>
        ) : (
          <div className="text-slate-500">{t('farmPlan.overviewNotAvailable')}</div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-x-auto">
        <h3 className="text-sm font-black tracking-widest text-slate-500 uppercase mb-6 flex items-center gap-2">
          {t('farmPlan.completeJourney')}
        </h3>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {STAGES.map((s, idx) => {
            const isPast = STAGES.indexOf(cropStage) > idx;
            const isCurrent = cropStage === s;
            return (
              <div key={s} className="flex items-center gap-3 md:flex-col relative z-10 w-full md:w-24">
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-xs ${isPast ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                  {isPast ? <CheckCircle2 size={16} /> : isCurrent ? <Activity size={16} /> : <Clock3 size={16} />}
                </div>
                <div className="flex flex-col md:items-center">
                  <span className={`text-[11px] font-black uppercase text-center break-words ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : isPast ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {isPast && `${t('journey.completedPrefix')} `}{translatedStage(s)}
                  </span>
                  {isCurrent && <span className="text-[10px] text-indigo-400 font-bold uppercase md:mt-1 break-words">{t('farmPlan.youAreHere')}</span>}
                  {!isPast && !isCurrent && <span className="text-[10px] text-slate-400 font-bold uppercase md:mt-1 break-words">{t('farmPlan.upcoming')}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        <div className="md:col-span-7 space-y-6">

          <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
            <h3 className="text-sm font-black tracking-widest text-emerald-600 uppercase mb-4 ml-2 flex items-center gap-2">
              {t('todayWork.title')}
            </h3>

            {opsLoading || schedLoading ? (
              <div className="animate-pulse h-24 bg-slate-100 dark:bg-slate-800 rounded-xl ml-2" />
            ) : actualCurrentOp || currentScheduledOp ? (
              <div className="ml-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white uppercase mb-2 block">
                  {getOperationLabel(actualCurrentOp ? actualCurrentOp.name : currentScheduledOp.name)}
                </span>

                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30 mb-6 mt-4">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 block mb-1">{t('todayWork.why')}</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {currentScheduledOp?.reason || t('todayWork.defaultReason', { stage: translatedStage(cropStage) })}
                  </p>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <span className="text-xs font-bold text-slate-500 uppercase">{t('todayWork.status')}</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-lg text-xs font-black uppercase tracking-wider">
                    {t('todayWork.doToday')}
                  </span>
                </div>

                {(actualCurrentOp || currentScheduledOp?.operationId) && (
                  <button
                    onClick={() => setShowFeedbackModal(actualCurrentOp?.id || currentScheduledOp.operationId)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm transition-all shadow-md text-center flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={20} />
                    {t('todayWork.markCompleted')}
                  </button>
                )}
              </div>
            ) : (
              <div className="ml-2 text-sm text-slate-500 font-medium">{t('todayWork.notScheduled')}</div>
            )}
          </div>

          {showFeedbackModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase mb-4">{t('completion.confirmTitle')}</h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">{t('completion.didYouComplete')}</p>

                <div className="space-y-4 mb-6">
                  <span className="text-xs font-bold text-slate-500 uppercase">{t('completion.howDidWorkGo')}</span>
                  <div className="flex gap-2">
                    {['wentWell', 'normal', 'problem'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setFeedbackType(opt)}
                        className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl border ${feedbackType === opt ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30' : 'bg-transparent border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'}`}
                      >
                        {t(`completion.${opt}`)}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={feedbackNotes}
                    onChange={e => setFeedbackNotes(e.target.value)}
                    placeholder={t('completion.whatHappened')}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowFeedbackModal(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-xl text-sm">{t('completion.notYet')}</button>
                  <button onClick={handleMarkCompleted} disabled={completingOp} className="flex-1 py-3 bg-emerald-600 text-white font-black rounded-xl text-sm">{completingOp ? t('completion.saving') : t('completion.yesCompleted')}</button>
                </div>
              </div>
            </div>
          )}

          {currentScheduledOp?.equipment && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-black tracking-widest text-slate-500 uppercase mb-4 flex items-center gap-2">
                {t('equipment.title')}
              </h3>

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-lg font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                      {currentScheduledOp.equipment.name}
                    </span>
                    <span className={`font-bold flex items-center gap-1 mt-1 text-sm ${currentScheduledOp.equipment.availabilityStatus === 'AVAILABLE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {currentScheduledOp.equipment.availabilityStatus === 'AVAILABLE' ? t('equipment.available') : t('equipment.notAvailable')}
                    </span>
                  </div>
                  <div className="text-left md:text-right flex flex-col items-start md:items-end">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(currentScheduledOp.equipment.rentalPrice, selectedLanguage)}<span className="text-sm text-slate-500">{t('equipment.perDay')}</span></span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => router.push(`/dashboard/marketplace?equipmentId=${currentScheduledOp.equipment.id}`)}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-sm uppercase tracking-wider transition-colors text-center"
                  >
                    {t('equipment.bookMachine')}
                  </button>
                  <button
                    onClick={() => showToast(t('common.whyInfo'), 'info')}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-xl text-sm uppercase tracking-wider text-center"
                  >
                    {t('equipment.whyThisMachine')}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-indigo-500/20 rounded-3xl p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-2 h-full bg-indigo-400/50"></div>
             <h3 className="text-sm font-black tracking-widest text-indigo-500 uppercase mb-4 ml-2 flex items-center gap-2">
               {t('nextWork.title')}
             </h3>
             {schedLoading ? (
               <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse ml-2" />
             ) : nextScheduledOp ? (
               <div className="ml-2">
                 <span className="text-lg font-black text-slate-900 dark:text-white uppercase mb-2 block">{getOperationLabel(nextScheduledOp.name)}</span>
                 <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                   {nextScheduledOp.reason || t('nextWork.defaultReason')}
                 </p>
               </div>
             ) : (
               <div className="ml-2 text-sm text-slate-500 font-medium">{t('nextWork.noUpcoming')}</div>
             )}
          </div>
        </div>

        <div className="md:col-span-5 space-y-6">

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
             <h3 className="text-sm font-black tracking-widest text-slate-500 uppercase mb-6 flex items-center gap-2">
               {t('journey.title')}
             </h3>

             <div className="space-y-4">
                 {completedOps.map((op: any) => (
                   <div key={op.id} className="flex items-start gap-3 opacity-60">
                     <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                     <div>
                       <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase block leading-tight line-through">{getOperationLabel(op.name)}</span>
                       <span className="text-xs font-bold text-slate-400 block mt-0.5">{t('farmPlan.completed')}: {new Date(op.completedAt).toLocaleDateString()}</span>
                     </div>
                   </div>
                 ))}
                              {(actualCurrentOp || currentScheduledOp) && (
                   <div className="relative">
                     <div className="absolute -left-[30px] bg-white dark:bg-slate-900 rounded-full p-1 border-2 border-emerald-500 z-10 hidden md:block">
                       <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                     </div>
                     <div className="flex items-start gap-3 pt-2">
                       <Activity size={18} className="text-emerald-500 mt-0.5 shrink-0 md:hidden" />
                       <div>
                         <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase block leading-tight">{getOperationLabel(actualCurrentOp?.name || currentScheduledOp.name)}</span>
                         <span className="text-xs text-emerald-700 mt-1 uppercase font-bold tracking-wider bg-emerald-100 dark:bg-emerald-900/50 inline-block px-2 py-0.5 rounded">YOU ARE HERE</span>
                       </div>
                     </div>
                   </div>
                 )}

               {nextScheduledOp && (
                 <div className="flex items-start gap-3 pt-2">
                   <Clock3 size={18} className="text-slate-400 mt-0.5 shrink-0" />
                   <div>
                     <span className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase block leading-tight">Ã¢ÂÂ³ {getOperationLabel(nextScheduledOp.name)}</span>
                     <span className="text-xs font-bold text-slate-400 block mt-0.5">{t('journey.next')}</span>
                   </div>
                 </div>
               )}
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-6">
            <h3 className="text-sm font-black tracking-widest text-slate-500 uppercase mb-4 flex items-center gap-2">
              {t('spending.title', { defaultValue: 'My Farm Spending' })}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div onClick={fetchDrillDown} className="cursor-pointer p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/50 rounded-2xl transition-colors border border-slate-100 dark:border-slate-700 group">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block group-hover:text-emerald-500 transition-colors">
                  {t('spending.total', { defaultValue: 'Total Spending' })}
                </span>
                <span className="text-xl font-black text-slate-800 dark:text-white">
                  {analytics ? formatCurrency(analytics.totalSpending, selectedLanguage) : formatCurrency(0, selectedLanguage)}
                </span>
              </div>

              <div onClick={fetchDrillDown} className="cursor-pointer p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/50 rounded-2xl transition-colors border border-slate-100 dark:border-slate-700 group">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block group-hover:text-indigo-500 transition-colors">
                  {t('spending.active', { defaultValue: 'Active Rentals' })}
                </span>
                <span className="text-xl font-black text-slate-800 dark:text-white">
                  {analytics?.activeRentals || 0}
                </span>
              </div>

              <div onClick={fetchDrillDown} className="cursor-pointer p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/50 rounded-2xl transition-colors border border-slate-100 dark:border-slate-700 group">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block group-hover:text-amber-500 transition-colors">
                  {t('spending.pending', { defaultValue: 'Pending Bookings' })}
                </span>
                <span className="text-xl font-black text-slate-800 dark:text-white">
                  {analytics?.pendingBookings || 0}
                </span>
              </div>
            </div>

            <button onClick={fetchDrillDown} className="w-full mt-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black rounded-lg text-xs uppercase transition-colors">
              {t('spending.viewReport', { defaultValue: 'View Spending Report' })}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-black tracking-widest text-slate-500 uppercase mb-4 flex items-center gap-2">
              {t('budget.title')}
            </h3>

            {budgetLoading ? (
               <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : bState ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-1">{t('budget.budget')}</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(bState.totalBudget, selectedLanguage)}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-1">{t('budget.planned')}</span>
                    <span className="text-lg font-black text-amber-500">{formatCurrency(bState.projectedTotalCost, selectedLanguage)}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-1">{t('budget.remaining')}</span>
                    <span className="text-lg font-black text-emerald-500">{formatCurrency(bState.remainingBudget, selectedLanguage)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-black uppercase">{budgetStatusText}</span>
                  {bState.budgetStatus === 'BUDGET_OVERRUN' && (
                    <p className="text-xs font-medium text-rose-500 mt-1">{t('budget.overrunWarning')}</p>
                  )}
                </div>

                <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-lg text-xs uppercase transition-colors">
                  {t('budget.viewPlan')}
                </button>
              </div>
            ) : (
              <div className="text-sm text-slate-500 font-medium">{t('budget.notAvailable')}</div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-black tracking-widest text-slate-500 uppercase mb-4 flex items-center gap-2">
              {t('learning.title')}
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { title: translatedStage('SOWING'), query: `${farmProfile.crop} Sowing ${selectedLanguage}` },
                { title: translatedStage('VEGETATIVE'), query: `${farmProfile.crop} Vegetative care ${selectedLanguage}` },
                { title: translatedStage('FLOWERING'), query: `${farmProfile.crop} Flowering care ${selectedLanguage}` }
              ].map(vid => (
                <a
                  key={vid.title}
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(vid.query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/50 rounded-xl transition-colors border border-slate-100 dark:border-slate-700"
                >
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('learning.watchVideos', { title: vid.title })}</span>
                  <PlayCircle size={18} className="text-red-500" />
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 dark:from-emerald-900/10 dark:to-indigo-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-[32px] p-6 shadow-sm">
        <h3 className="text-sm font-black tracking-widest text-emerald-600 uppercase mb-4 flex items-center gap-2">
          {t('copilot.title')}
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={t('copilot.placeholder')}
            className="flex-1 px-6 py-3 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            onKeyDown={(e) => e.key === 'Enter' && fetchCopilotPlan()}
          />
          <button
            onClick={() => fetchCopilotPlan()}
            disabled={copilotLoading}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm transition-all shadow-md"
          >
            {copilotLoading ? t('copilot.loading') : t('copilot.askBtn')}
          </button>
        </div>

        {copilotData && (
          <div className="mt-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
             <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
               {copilotData.copilot?.explanation}
             </div>
          </div>
        )}
      </div>

      <DrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        title={drillDownTitle}
        headers={drillDownHeaders}
        rows={drillDownRows}
      />
    </div>
  );
}
