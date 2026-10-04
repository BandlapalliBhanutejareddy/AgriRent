'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Tractor, 
  Clock, 
  CheckCircle, 
  Search, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Bot,
  Leaf,
  MapPin,
  AlertTriangle,
  CheckSquare,
  ShieldAlert,
  DollarSign,
  Calendar,
  Send,
  UserCheck,
  Plus,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from 'react-i18next';

export function FarmReadinessCenter({ 
  lifecycleData, 
  nbaData, 
  equipmentData, 
  budget,
  isLoading
}: { 
  lifecycleData: any, 
  nbaData: any, 
  equipmentData: any[],
  budget: string,
  isLoading?: boolean
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-500">{t('checking', 'Checking...')}</p>
      </div>
    );
  }

  if (!lifecycleData) {
    return (
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-sm font-semibold text-slate-500">{t('cannot_load', 'Could not load this information.')}</p>
      </div>
    );
  }

  if (!nbaData) return null;

  // 1. Evaluate Stage
  const isStageReady = lifecycleData.lifecycleStatus !== 'LATE';
  
  // 2. Evaluate Required Operation
  const hasCriticalOp = nbaData.bestAction?.priority === 'CRITICAL';
  
  // 3. Evaluate Equipment Availability
  const hasEquipment = equipmentData && equipmentData.length > 0;
  
  // 4. Evaluate Budget
  const totalCost = equipmentData?.reduce((acc: number, e: any) => acc + (e.estimatedTotalCost || e.estimatedCost || 0), 0) || 0;
  const isWithinBudget = totalCost <= parseFloat(budget);

  // Overall Readiness
  let status = 'READY';
  let badgeColor = 'bg-emerald-500 hover:bg-emerald-600';
  let Icon = CheckCircle2;
  let title = t('ready_to_start', '✓ READY TO START');
  let mainAction = '';
  
  if (!isStageReady || !hasEquipment || hasCriticalOp) {
    status = 'CAUTION';
    badgeColor = 'bg-amber-500 hover:bg-amber-600';
    Icon = AlertTriangle;
    title = t('check_before_starting', '⚠ CHECK BEFORE STARTING');
    mainAction = t('confirm_machine_before_date', 'Confirm the machine before the work date.');
  }

  if (totalCost > parseFloat(budget) * 1.2 || (hasCriticalOp && !hasEquipment)) {
    status = 'BLOCKED';
    badgeColor = 'bg-rose-500 hover:bg-rose-600';
    Icon = ShieldAlert;
    title = t('check_before_starting', '⚠ CHECK BEFORE STARTING');
    mainAction = t('confirm_machine_before_date', 'Confirm the machine before the work date.');
  }

  return (
    <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className={`p-4 border-b border-slate-100 dark:border-slate-800 ${status === 'READY' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : status === 'CAUTION' ? 'bg-amber-50/50 dark:bg-amber-900/10' : 'bg-rose-50/50 dark:bg-rose-900/10'}`}>
        <div className="flex items-center gap-2">
          <Icon size={20} className={status === 'READY' ? 'text-emerald-600' : status === 'CAUTION' ? 'text-amber-600' : 'text-rose-600'} />
          <h3 className={`text-sm font-black tracking-widest uppercase ${status === 'READY' ? 'text-emerald-600' : status === 'CAUTION' ? 'text-amber-600' : 'text-rose-600'}`}>
            {title}
          </h3>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">{t('machine', 'Machine')}:</span>
            <span className={`font-black ${hasEquipment ? 'text-emerald-600' : 'text-amber-600'}`}>
              {hasEquipment ? t('available_check', '✓ Available') : t('pending_check', '⚠ Pending')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">{t('budget', 'Budget')}:</span>
            <span className={`font-black ${isWithinBudget ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isWithinBudget ? t('within_budget_check', '✓ Within Budget') : t('over_budget', '✕ Over Budget')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">{t('farm_work', 'Farm Work')}:</span>
            <span className={`font-black ${hasCriticalOp ? 'text-amber-600' : 'text-emerald-600'}`}>
              {hasCriticalOp ? t('pending_check', '⚠ Pending') : t('ready_check', '✓ Ready')}
            </span>
          </div>
        </div>
        
        {mainAction && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 block mb-1">{t('main_thing_to_check', 'Main thing to check')}:</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{mainAction}</span>
            <div className="mt-3">
              <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg text-xs transition-all">
                {t('check_now', 'CHECK NOW')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
