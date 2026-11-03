'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Tractor, CheckCircle, Search, MapPin,
  Activity, CheckCircle2, Clock3, AlertTriangle, DollarSign, Calendar,
  ArrowRight, ShieldCheck, Sparkles, CloudSun, BookOpen, ShieldAlert, X,
  Sprout, PlusCircle, Receipt, Layers, Edit3, Droplets, Fuel, Users, Wrench, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';
import DrillDownModal from '@/components/DrillDownModal';

const STAGES = ['SOWING', 'GERMINATION', 'SEEDLING', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURITY', 'HARVEST'];

const COMMON_CROPS = [
  'Rice',
  'Wheat',
  'Cotton',
  'Maize',
  'Chilli',
  'Sugarcane',
  'Groundnut',
  'Soybean',
  'Pulses',
  'Tomato',
  'Onion',
  'Potato',
  'Millets'
];

const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Perennial'];

const EXPENSE_CATEGORIES = [
  { id: 'Seeds', label: 'Seeds & Seedlings' },
  { id: 'Fertilizer', label: 'Fertilizers & Nutrients' },
  { id: 'Pesticides', label: 'Pesticides & Crop Protection' },
  { id: 'Fuel', label: 'Diesel & Fuel' },
  { id: 'Labor', label: 'Farm Labor & Wages' },
  { id: 'Equipment Rental', label: 'Machinery & Tractor Rental' },
  { id: 'Irrigation', label: 'Irrigation & Water Charges' },
  { id: 'Maintenance', label: 'Repairs & Maintenance' },
  { id: 'Other', label: 'Other Operational Expense' },
];

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

  // Active risk & weather alerts
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  async function loadAlerts() {
    try {
      setAlertsLoading(true);
      const res = await api.get('/farms/alerts/list');
      if (res.data?.alerts) {
        setAlerts(res.data.alerts);
      }
    } catch (e) {
      console.error('Failed to load farmer alerts', e);
    } finally {
      setAlertsLoading(false);
    }
  }

  async function handleDismissAlert(alertId: string) {
    try {
      await api.put(`/farms/alerts/${alertId}/dismiss`);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      showToast('Alert dismissed', 'info');
    } catch (e) {
      showToast('Failed to dismiss alert', 'error');
    }
  }

  // Crop Cycle Modal state
  const [showCropCycleModal, setShowCropCycleModal] = useState(false);
  const [updatingCropCycle, setUpdatingCropCycle] = useState(false);
  const [cropCycleForm, setCropCycleForm] = useState({
    cropName: '',
    variety: '',
    season: 'Kharif',
    stage: 'SOWING',
    sowingDate: '',
    expectedHarvestDate: '',
    reason: ''
  });

  // Farming Expenses state & modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Fertilizer',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: ''
  });
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);

  async function handleUpdateCropCycle(e: React.FormEvent) {
    e.preventDefault();
    if (!farmId || !cropId) return;
    setUpdatingCropCycle(true);
    try {
      const payload = {
        cropName: cropCycleForm.cropName.trim(),
        variety: cropCycleForm.variety.trim(),
        season: cropCycleForm.season,
        stage: cropCycleForm.stage.toUpperCase(),
        sowingDate: cropCycleForm.sowingDate ? new Date(cropCycleForm.sowingDate).toISOString() : null,
        expectedHarvestDate: cropCycleForm.expectedHarvestDate ? new Date(cropCycleForm.expectedHarvestDate).toISOString() : null,
        reason: cropCycleForm.reason.trim() || 'Manual stage update via Farmer Dashboard'
      };

      await api.put(`/farms/${farmId}/crops/${cropId}`, payload);

      if (cropCycleForm.stage.toUpperCase() !== cropStage.toUpperCase()) {
        try {
          await api.post(`/farms/${farmId}/crops/${cropId}/lifecycle/set-stage`, {
            requestedStage: cropCycleForm.stage.toUpperCase(),
            reason: cropCycleForm.reason.trim() || 'Stage updated from Farmer Dashboard'
          });
        } catch (_) {}
      }

      setCropStage(cropCycleForm.stage.toUpperCase());
      setFarmProfile((prev: any) => ({
        ...prev,
        crop: cropCycleForm.cropName,
        variety: cropCycleForm.variety,
        season: cropCycleForm.season,
        sowingDate: cropCycleForm.sowingDate,
        expectedHarvestDate: cropCycleForm.expectedHarvestDate
      }));

      showToast(`Crop cycle updated to ${cropCycleForm.cropName} (${cropCycleForm.stage}) successfully!`, 'success');
      setShowCropCycleModal(false);
      loadDashboardData(farmId, cropId, selectedLanguage);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update crop cycle', 'error');
    } finally {
      setUpdatingCropCycle(false);
    }
  }

  async function handleAdvanceStage() {
    if (!farmId || !cropId) return;
    const currentIdx = STAGES.indexOf(cropStage);
    if (currentIdx === -1 || currentIdx >= STAGES.length - 1) {
      showToast('Crop is already at final Harvest stage!', 'info');
      return;
    }
    const nextStage = STAGES[currentIdx + 1];
    setUpdatingCropCycle(true);
    try {
      try {
        await api.post(`/farms/${farmId}/crops/${cropId}/lifecycle/advance`);
      } catch (_) {
        await api.post(`/farms/${farmId}/crops/${cropId}/lifecycle/set-stage`, {
          requestedStage: nextStage,
          reason: 'Advanced to next growth milestone via Dashboard'
        });
      }
      setCropStage(nextStage);
      showToast(`Advanced to ${nextStage} stage!`, 'success');
      loadDashboardData(farmId, cropId, selectedLanguage);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to advance stage', 'error');
    } finally {
      setUpdatingCropCycle(false);
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!farmId) return;
    const amt = parseFloat(expenseForm.amount);
    if (!expenseForm.title.trim()) {
      showToast('Please enter an expense item title', 'error');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid expense amount in INR (₹)', 'error');
      return;
    }
    setSubmittingExpense(true);
    try {
      await api.post(`/farms/${farmId}/financials/expense`, {
        title: expenseForm.title.trim(),
        category: expenseForm.category,
        amount: amt,
        date: expenseForm.date ? new Date(expenseForm.date).toISOString() : new Date().toISOString(),
        description: expenseForm.description.trim() || expenseForm.category,
        cropId: cropId || undefined
      });

      showToast(`Farming expense of ${formatCurrency(amt, selectedLanguage)} recorded successfully!`, 'success');
      setShowExpenseModal(false);
      setExpenseForm({
        title: '',
        category: 'Fertilizer',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        description: ''
      });

      // Instantly refresh financials & recent expenses
      api.get(`/farms/${farmId}/financials?lang=${selectedLanguage}`)
        .then(r => setBudgetData(r.data))
        .catch(() => {});
      api.get(`/farms/${farmId}/financials/expenses`)
        .then(r => setRecentExpenses(r.data?.expenses || []))
        .catch(() => {});
      api.get(`/analytics/farmer`)
        .then(r => setAnalytics(r.data))
        .catch(() => {});
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to record expense', 'error');
    } finally {
      setSubmittingExpense(false);
    }
  }

  async function fetchDrillDown() {
    try {
      let rows: any[][] = [];
      if (recentExpenses && recentExpenses.length > 0) {
        rows = recentExpenses.map((e: any) => [
          e.date ? new Date(e.date).toLocaleDateString() : 'Recent',
          e.title || 'Farming Expense',
          e.category || 'Inputs',
          e.description || '-',
          formatCurrency(e.amount || 0, selectedLanguage),
          e.isRental ? 'Machinery Rental' : 'Direct Farming Expense'
        ]);
        setDrillDownHeaders(['Date', 'Expense Item', 'Category', 'Details', 'Amount', 'Type']);
      } else {
        const res = await api.get('/analytics/farmer/bookings?limit=100');
        const bookings = res.data || [];
        rows = bookings.map((b: any) => {
          const start = b.startDate ? new Date(b.startDate).toLocaleDateString() : '-';
          const end = b.endDate ? new Date(b.endDate).toLocaleDateString() : '-';
          const period = `${start} to ${end}`;

          return [
            new Date(b.createdAt).toLocaleDateString(),
            b.equipment?.title || 'Unknown',
            b.equipment?.owner?.name || 'Unknown',
            period,
            b.totalPrice ? formatCurrency(b.totalPrice, selectedLanguage) : formatCurrency(0, selectedLanguage),
            b.status,
            b.paymentStatus || 'PENDING',
            b.amountPaid ? formatCurrency(b.amountPaid, selectedLanguage) : formatCurrency(0, selectedLanguage)
          ];
        });
        setDrillDownHeaders(['Date', 'Equipment', 'Owner', 'Rental Period', 'Amount', 'Booking Status', 'Payment Status', 'Amount Paid']);
      }
      setDrillDownRows(rows);
      setDrillDownTitle('Comprehensive Farm Spending Ledger');
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
              const crp = farm.crops[0];
              setFarmProfile({
                crop: crp.cropName,
                variety: crp.variety || '',
                acreage: farm.area,
                location: farm.location,
                season: crp.season || 'Kharif',
                budget: farm.totalBudget || 0,
                sowingDate: crp.sowingDate ? new Date(crp.sowingDate).toISOString().slice(0, 10) : '',
                expectedHarvestDate: crp.expectedHarvestDate ? new Date(crp.expectedHarvestDate).toISOString().slice(0, 10) : ''
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

    setExpensesLoading(true);
    api.get(`/farms/${fId}/financials/expenses`)
      .then(r => {
        setRecentExpenses(r.data?.expenses || []);
        setExpensesLoading(false);
      })
      .catch(() => setExpensesLoading(false));

    api.get(`/analytics/farmer`)
      .then(r => setAnalytics(r.data))
      .catch(() => setAnalytics(null));

    loadAlerts();
  }

  async function handleMarkCompleted() {
    if (!showFeedbackModal) return;
    setCompletingOp(true);
    try {
      const fbStr = t(`completion.${feedbackType}`);
      const notes = feedbackNotes ? `${fbStr}: ${feedbackNotes}` : fbStr;

      await api.post(`/farms/${farmId}/crops/${cropId}/operations/${showFeedbackModal}/complete`, {
        notes,
        completedAt: new Date().toISOString()
      });

      showToast(t('completion.success'), 'success');
      setShowFeedbackModal(null);
      setFeedbackNotes('');
      // Reload updated operations
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
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#163A2D] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-500">{t('common.loadingFarm', 'Loading your farm profile...')}</p>
      </div>
    );
  }

  if (!farmProfile) {
    return (
      <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-[#E1E8E2] dark:border-slate-800 shadow-card max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#16845B] flex items-center justify-center mx-auto mb-4">
          <Tractor size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('common.noFarmProfile', 'No Registered Farm Found')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Set up your crop details, land area, and season to unlock customized equipment schedules.</p>
        <Link href="/dashboard/farmer/setup" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#163A2D] hover:bg-[#205140] text-white rounded-xl font-semibold text-xs transition-colors">
          <span>{t('common.setupFarm', 'Configure Farm Profile')}</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">

      {/* Hero Farm Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#E1E8E2] dark:border-slate-800 rounded-2xl p-6 shadow-card transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#163A2D]/10 text-[#163A2D] dark:text-[#84CC16] text-[11px] font-semibold mb-2">
              <ShieldCheck size={14} />
              <span>Verified Crop Operations Plan</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {farmProfile.crop} Cultivation Operations
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span className="font-semibold text-slate-900 dark:text-white">{farmProfile.acreage}</span> Acres
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span className="font-semibold text-slate-900 dark:text-white">{farmProfile.season}</span> Season
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <MapPin size={13} className="text-slate-400" />
                <span>{farmProfile.location}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <button
              onClick={() => {
                setCropCycleForm({
                  cropName: farmProfile.crop || '',
                  variety: farmProfile.variety || '',
                  season: farmProfile.season || 'Kharif',
                  stage: cropStage || 'SOWING',
                  sowingDate: farmProfile.sowingDate || new Date().toISOString().slice(0, 10),
                  expectedHarvestDate: farmProfile.expectedHarvestDate || '',
                  reason: ''
                });
                setShowCropCycleModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Sprout size={15} />
              <span>Update Crop Cycle</span>
            </button>

            <button
              onClick={() => {
                setExpenseForm({
                  title: '',
                  category: 'Fertilizer',
                  amount: '',
                  date: new Date().toISOString().slice(0, 10),
                  description: ''
                });
                setShowExpenseModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>Add Farm Expense</span>
            </button>

            <Link
              href="/dashboard/marketplace"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#163A2D] hover:bg-[#205140] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Tractor size={15} />
              <span>Browse Machinery</span>
            </Link>
            <Link
              href="/dashboard/weather"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              <CloudSun size={15} />
              <span>Weather & Mandi</span>
            </Link>
          </div>
        </div>

        {overview && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-[#F6F8F6] dark:bg-slate-800/40 p-3.5 rounded-xl">
              <Sparkles size={16} className="text-[#16845B] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">Agricultural Advisory</span>
                <p>{overview}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Risk & Weather Alert Center */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-500" />
              Active Farm & Risk Alerts ({alerts.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert: any) => {
              const isCritical = alert.severity === 'CRITICAL';
              const isWarning = alert.severity === 'WARNING';
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border transition-all relative ${
                    isCritical
                      ? 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-800/50'
                      : isWarning
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
                      : 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isCritical
                            ? 'bg-red-600 text-white'
                            : isWarning
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {alert.category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      title="Dismiss alert"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">{alert.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{alert.message}</p>
                  {alert.advisory && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-200">
                      <span className="font-bold">Recommendation: </span>
                      {alert.advisory}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Farm Journey Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-[#E1E8E2] dark:border-slate-800 rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('farmPlan.completeJourney', 'Crop Growth Journey')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chronological progress through cultivation milestones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdvanceStage}
              disabled={updatingCropCycle || STAGES.indexOf(cropStage) >= STAGES.length - 1}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-[#16845B] dark:text-[#84CC16] border border-emerald-200 dark:border-emerald-800 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              title="Advance to next stage in cycle"
            >
              <ArrowRight size={13} />
              <span>Advance Stage</span>
            </button>
            <button
              onClick={() => {
                setCropCycleForm({
                  cropName: farmProfile.crop || '',
                  variety: farmProfile.variety || '',
                  season: farmProfile.season || 'Kharif',
                  stage: cropStage || 'SOWING',
                  sowingDate: farmProfile.sowingDate || new Date().toISOString().slice(0, 10),
                  expectedHarvestDate: farmProfile.expectedHarvestDate || '',
                  reason: ''
                });
                setShowCropCycleModal(true);
              }}
              className="text-xs font-semibold text-[#16845B] dark:text-[#84CC16] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-md transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer flex items-center gap-1"
            >
              <Edit3 size={12} />
              <span>Stage: {translatedStage(cropStage)}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex items-start gap-2 min-w-[700px]">
            {STAGES.map((s, idx) => {
              const currentIdx = STAGES.indexOf(cropStage);
              const isPast = currentIdx > idx;
              const isCurrent = cropStage === s;
              const isUpcoming = currentIdx < idx;

              return (
                <div key={s} className="flex-1 flex flex-col items-center relative">
                  {/* Connecting Bar */}
                  {idx < STAGES.length - 1 && (
                    <div className={`absolute top-4 left-1/2 w-full h-0.5 z-0 ${
                      isPast ? 'bg-[#16845B]' : 'bg-slate-200 dark:bg-slate-800'
                    }`} />
                  )}

                  {/* Icon Node */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs relative z-10 transition-all ${
                    isPast
                      ? 'bg-[#16845B] text-white shadow-sm'
                      : isCurrent
                      ? 'bg-[#163A2D] text-[#84CC16] ring-4 ring-[#84CC16]/30 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {isPast ? (
                      <CheckCircle2 size={16} />
                    ) : isCurrent ? (
                      <Activity size={16} className="animate-pulse" />
                    ) : (
                      <Clock3 size={15} />
                    )}
                  </div>

                  {/* Stage Label (No Strikethrough!) */}
                  <span className={`text-[11px] font-semibold uppercase text-center mt-2.5 px-1 leading-tight ${
                    isCurrent
                      ? 'text-[#163A2D] dark:text-[#84CC16] font-bold'
                      : isPast
                      ? 'text-[#16845B] dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {translatedStage(s)}
                  </span>

                  {/* Status Subtitle */}
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    {isPast ? 'Completed' : isCurrent ? 'Active Now' : 'Upcoming'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Today's Work & Recommendations (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Today's Work Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E1E8E2] dark:border-slate-800 rounded-2xl p-6 shadow-card relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16845B]"></span>
                <span>{t('todayWork.title', "Today's Work & Next Milestone")}</span>
              </h2>
              <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-[#16845B] dark:text-[#84CC16] text-[11px] font-semibold rounded-md">
                Active Priority
              </span>
            </div>

            {opsLoading || schedLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-2/3"></div>
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
            ) : actualCurrentOp || currentScheduledOp ? (
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {getOperationLabel(actualCurrentOp ? actualCurrentOp.name : currentScheduledOp.name)}
                </h3>

                <div className="bg-[#F6F8F6] dark:bg-slate-800/40 p-3.5 rounded-xl border border-[#E1E8E2] dark:border-slate-800 mt-3 mb-4">
                  <span className="text-[11px] font-semibold text-[#16845B] dark:text-[#84CC16] block mb-0.5">
                    Recommendation Context
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {currentScheduledOp?.reason || t('todayWork.defaultReason', { stage: translatedStage(cropStage) })}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mb-5">
                  <span className="font-semibold text-slate-900 dark:text-white">Status:</span>
                  <span className="inline-flex items-center gap-1 text-[#16845B] dark:text-[#84CC16] font-semibold">
                    <Activity size={14} />
                    <span>Scheduled for Current Crop Cycle</span>
                  </span>
                </div>

                {(actualCurrentOp || currentScheduledOp?.operationId) && (
                  <button
                    onClick={() => setShowFeedbackModal(actualCurrentOp?.id || currentScheduledOp.operationId)}
                    className="w-full py-2.5 px-4 bg-[#163A2D] hover:bg-[#205140] text-white font-semibold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>{t('todayWork.markCompleted', 'Mark Task Completed')}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-medium py-3">
                {t('todayWork.notScheduled', 'No immediate pending operations scheduled. You are on track!')}
              </div>
            )}
          </div>

          {/* Feedback Completion Modal */}
          {showFeedbackModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {t('completion.confirmTitle', 'Confirm Operation Completion')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {t('completion.didYouComplete', 'Did you complete this operation in your field?')}
                </p>

                <div className="space-y-3 mb-5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {t('completion.howDidWorkGo', 'How did the operation proceed?')}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'wentWell', label: 'Went Well' },
                      { id: 'normal', label: 'Normal' },
                      { id: 'problem', label: 'Had Issues' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFeedbackType(opt.id)}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                          feedbackType === opt.id
                            ? 'bg-[#163A2D] text-white border-[#163A2D]'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={feedbackNotes}
                    onChange={e => setFeedbackNotes(e.target.value)}
                    placeholder="Add operational notes or soil observations (optional)..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#16845B]/20"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFeedbackModal(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMarkCompleted}
                    disabled={completingOp}
                    className="flex-1 py-2.5 bg-[#163A2D] hover:bg-[#205140] text-white font-semibold rounded-xl text-xs transition-colors disabled:opacity-50"
                  >
                    {completingOp ? 'Saving...' : 'Yes, Complete Task'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Equipment Card */}
          {currentScheduledOp?.equipment && (
            <div className="bg-white dark:bg-slate-900 border border-[#E1E8E2] dark:border-slate-800 rounded-2xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Tractor size={16} className="text-[#16845B]" />
                  <span>{t('equipment.title', 'Recommended Machinery')}</span>
                </h2>
                <span className="text-[11px] font-semibold text-[#16845B] dark:text-[#84CC16]">
                  Matched for {translatedStage(cropStage)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F6F8F6] dark:bg-slate-800/40 border border-[#E1E8E2] dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {currentScheduledOp.equipment.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      currentScheduledOp.equipment.availabilityStatus === 'AVAILABLE' ? 'text-[#16845B]' : 'text-amber-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        currentScheduledOp.equipment.availabilityStatus === 'AVAILABLE' ? 'bg-[#16845B]' : 'bg-amber-500'
                      }`} />
                      <span>{currentScheduledOp.equipment.availabilityStatus === 'AVAILABLE' ? 'Available for Rent' : 'Reserved'}</span>
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xl font-bold text-slate-900 dark:text-white block">
                    {formatCurrency(currentScheduledOp.equipment.rentalPrice, selectedLanguage)}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ day</span>
                  </span>
                  <button
                    onClick={() => router.push(`/dashboard/marketplace?equipmentId=${currentScheduledOp.equipment.id}`)}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#163A2D] hover:bg-[#205140] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    <span>{t('equipment.bookMachine', 'Book Machine')}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Milestone */}
          {nextScheduledOp && (
            <div className="bg-white dark:bg-slate-900 border border-[#E1E8E2] dark:border-slate-800 rounded-2xl p-5 shadow-card">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Clock3 size={14} />
                <span>Next Upcoming Operation</span>
              </h2>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-white block">
                    {getOperationLabel(nextScheduledOp.name)}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {nextScheduledOp.reason || t('nextWork.defaultReason', 'Scheduled following completion of current stage.')}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md shrink-0">
                  Upcoming
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Spending, Budget & Operations Ledger (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Farm Spending Metrics */}
          <div className="bg-white dark:bg-slate-900 border border-[#E1E8E2] dark:border-slate-800 rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {t('spending.title', 'Farm Spending Overview')}
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">Real-time Farm Budget</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setExpenseForm({
                    title: '',
                    category: 'Fertilizer',
                    amount: '',
                    date: new Date().toISOString().slice(0, 10),
                    description: ''
                  });
                  setShowExpenseModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <PlusCircle size={14} />
                <span>+ Add Expense</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div onClick={fetchDrillDown} className="cursor-pointer p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                  Total Spent
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white block">
                  {analytics ? formatCurrency(analytics.totalSpending, selectedLanguage) : formatCurrency(0, selectedLanguage)}
                </span>
              </div>

              <div onClick={fetchDrillDown} className="cursor-pointer p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                  Active
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white block">
                  {analytics?.activeRentals || 0}
                </span>
              </div>

              <div onClick={fetchDrillDown} className="cursor-pointer p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                  Pending
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white block">
                  {analytics?.pendingBookings || 0}
                </span>
              </div>
            </div>

            {/* Recent Farm Expenses List */}
            {recentExpenses && recentExpenses.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Recent Expenses
                  </span>
                  <button
                    onClick={fetchDrillDown}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    View All ({recentExpenses.length})
                  </button>
                </div>
                <div className="space-y-2">
                  {recentExpenses.slice(0, 3).map((exp: any, idx: number) => (
                    <div
                      key={exp.id || idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <Receipt size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {exp.title || exp.category}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {exp.category} • {exp.date ? new Date(exp.date).toLocaleDateString() : 'Recent'}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white shrink-0 ml-2">
                        {formatCurrency(exp.amount || 0, selectedLanguage)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={fetchDrillDown}
              className="w-full mt-4 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{t('spending.viewReport', 'View Spending Ledger')}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Budget Health Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E1E8E2] dark:border-slate-800 rounded-2xl p-6 shadow-card">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              {t('budget.title', 'Crop Budget Plan')}
            </h2>

            {budgetLoading ? (
              <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : bState ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-[10px] font-medium text-slate-400 block mb-0.5">Budget</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatCurrency(bState.totalBudget, selectedLanguage)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-[10px] font-medium text-slate-400 block mb-0.5">Planned</span>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(bState.projectedTotalCost, selectedLanguage)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-[10px] font-medium text-slate-400 block mb-0.5">Remaining</span>
                    <span className="text-xs font-bold text-[#16845B] dark:text-[#84CC16]">
                      {formatCurrency(bState.remainingBudget, selectedLanguage)}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    <span>Budget Status</span>
                    <span className={bState.budgetStatus === 'BUDGET_OVERRUN' ? 'text-rose-600' : 'text-[#16845B]'}>
                      {budgetStatusText || 'Healthy'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        bState.budgetStatus === 'BUDGET_OVERRUN' ? 'bg-rose-500' : 'bg-[#16845B]'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((bState.projectedTotalCost / (bState.totalBudget || 1)) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-medium py-2">
                Budget estimates will calculate automatically as machinery bookings are placed.
              </div>
            )}
          </div>

          {/* Quick Guidance & AI Copilot Card */}
          <div className="bg-[#F6F8F6] dark:bg-slate-900 border border-[#E1E8E2] dark:border-slate-800 rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-2 mb-2 text-[#16845B] dark:text-[#84CC16]">
              <Sparkles size={16} />
              <h2 className="text-xs font-bold uppercase tracking-wider">AI Farm Advisor</h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 font-normal">
              Need personalized machinery or soil preparation recommendations for {farmProfile.crop}?
            </p>

            <Link
              href="/dashboard/ai-advisor"
              className="w-full py-2.5 px-4 bg-[#163A2D] hover:bg-[#205140] text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Consult Farmer Assistant</span>
              <ArrowRight size={13} />
            </Link>
          </div>

        </div>
      </div>

      {/* Update Crop Cycle Modal */}
      {showCropCycleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Sprout size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Update Crop Cycle</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Configure growth milestone, variety & season</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCropCycleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1.5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCropCycle} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Crop Name <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={cropCycleForm.cropName}
                    onChange={(e) => setCropCycleForm({ ...cropCycleForm, cropName: e.target.value })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {COMMON_CROPS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Crop Variety
                  </label>
                  <input
                    type="text"
                    value={cropCycleForm.variety}
                    onChange={(e) => setCropCycleForm({ ...cropCycleForm, variety: e.target.value })}
                    placeholder="e.g. Sona Masoori, H-4"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Farming Season
                  </label>
                  <select
                    value={cropCycleForm.season}
                    onChange={(e) => setCropCycleForm({ ...cropCycleForm, season: e.target.value })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {SEASONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Growth Stage <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={cropCycleForm.stage}
                    onChange={(e) => setCropCycleForm({ ...cropCycleForm, stage: e.target.value })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {STAGES.map((st) => (
                      <option key={st} value={st}>{st} — {translatedStage(st)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sowing Date
                  </label>
                  <input
                    type="date"
                    value={cropCycleForm.sowingDate}
                    onChange={(e) => setCropCycleForm({ ...cropCycleForm, sowingDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Harvest Date
                  </label>
                  <input
                    type="date"
                    value={cropCycleForm.expectedHarvestDate}
                    onChange={(e) => setCropCycleForm({ ...cropCycleForm, expectedHarvestDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Change Note / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={cropCycleForm.reason}
                  onChange={(e) => setCropCycleForm({ ...cropCycleForm, reason: e.target.value })}
                  placeholder="e.g. Field inspection completed, entering vegetative tillering"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCropCycleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingCropCycle}
                  className="px-5 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {updatingCropCycle ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Cycle...</span>
                    </>
                  ) : (
                    <span>Save & Update Cycle</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Farming Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Farming Expense</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Track fertilizers, seeds, labor wages, machinery & fuel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1.5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Title / Item <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Urea fertilizer 4 bags, Weeding labor 6 workers"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="e.g. 3500"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Date
                </label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Vendor Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Purchased from local dealer, cash payment..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-5 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingExpense ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Record Expense</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
