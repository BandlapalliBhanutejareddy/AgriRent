'use client';

import { useState } from 'react';
import {
  Bot,
  Leaf,
  Droplets,
  Map as MapIcon,
  Search,
  Sparkles,
  Tractor,
  Lightbulb,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  PhoneCall
} from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatters';

const FARMING_STAGES = [
  { id: 'SOWING', label: 'Sowing' },
  { id: 'GERMINATION', label: 'Germination' },
  { id: 'SEEDLING', label: 'Seedling' },
  { id: 'VEGETATIVE', label: 'Vegetative' },
  { id: 'FLOWERING', label: 'Flowering' },
  { id: 'FRUITING', label: 'Fruiting' },
  { id: 'MATURITY', label: 'Maturity' },
  { id: 'HARVEST', label: 'Harvest' },
];

export default function AiAdvisorPage() {
  const { t, i18n } = useTranslation();
  const { user } = useStore();
  const [crop, setCrop] = useState('Rice');
  const [soilType, setSoilType] = useState('Black Soil');
  const [acreage, setAcreage] = useState('6');
  const [location, setLocation] = useState('Andhra Pradesh');
  const [season, setSeason] = useState('Kharif');
  const [farmingStage, setFarmingStage] = useState('SOWING');
  const [objective, setObjective] = useState('Reduce Cost');
  const [budget, setBudget] = useState('20000');
  const [question, setQuestion] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(i18n?.language || user?.preferredLanguage || 'en');

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetSmartPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop.trim()) {
      setError('Please provide at least a crop name.');
      return;
    }

    setLoading(true);
    setPlan(null);
    setError(null);

    try {
      const response = await api.post('/ai/smart-plan', {
        crop,
        soilType,
        acreage: parseFloat(acreage) || 5,
        location,
        season,
        farmingStage,
        objective,
        budget: budget ? parseFloat(budget) : undefined,
        question,
        language: selectedLanguage
      });

      setPlan(response.data);
    } catch (err: any) {
      console.error('Smart Plan API Error:', err);
      setError('Smart Farming AI is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Excellent Match': return 'bg-emerald-500 text-white';
      case 'Very Good Match': return 'bg-teal-500 text-white';
      case 'Good Match': return 'bg-blue-500 text-white';
      case 'Possible Match': return 'bg-amber-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-2xl shadow-lg">
                <Bot size={28} />
             </div>
             <h1 className="text-3xl md:text-4xl font-black tracking-tight">Smart Farming Decision & AI Advisor</h1>
          </div>
          <p className="text-emerald-100 text-base md:text-lg font-normal">
            Generate an end-to-end agronomic plan tailored to your crop, soil, acreage, and budget with automated machinery matching from real AgroRent AI inventory.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
          <label className="text-xs font-bold uppercase tracking-wider text-emerald-200">Language:</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-slate-800 text-white text-sm font-bold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
          >
            <option value="en">English</option>
            <option value="te">Ã Â°Â¤Ã Â±â€ Ã Â°Â²Ã Â±ÂÃ Â°â€”Ã Â±Â (Telugu)</option>
            <option value="hi">Ã Â¤Â¹Ã Â¤Â¿Ã Â¤â€šÃ Â¤Â¦Ã Â¥â‚¬ (Hindi)</option>
            <option value="ta">Ã Â®Â¤Ã Â®Â®Ã Â®Â¿Ã Â®Â´Ã Â¯Â (Tamil)</option>
            <option value="kn">Ã Â²â€¢Ã Â²Â¨Ã Â³ÂÃ Â²Â¨Ã Â²Â¡ (Kannada)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-4">
           <form onSubmit={handleGetSmartPlan} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-lg space-y-6 sticky top-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
                <Leaf className="text-emerald-600" size={20} />
                Farm Profile & Setup
              </h2>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Crop Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Rice, Cotton, Wheat"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-semibold"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Soil Type</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-semibold cursor-pointer"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                  >
                    <option value="Black Soil">Black Soil</option>
                    <option value="Red Soil">Red Soil</option>
                    <option value="Alluvial Soil">Alluvial Soil</option>
                    <option value="Clay Soil">Clay Soil</option>
                    <option value="Loamy Soil">Loamy Soil</option>
                    <option value="Sandy Soil">Sandy Soil</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Acreage (Acres)</label>
                  <input
                    type="number"
                    placeholder="e.g. 6"
                    min="0.5"
                    step="0.5"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-semibold"
                    value={acreage}
                    onChange={(e) => setAcreage(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Andhra Pradesh"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-semibold"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Season</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-semibold cursor-pointer"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                  >
                    <option value="Kharif">Kharif (Monsoon)</option>
                    <option value="Rabi">Rabi (Winter)</option>
                    <option value="Zaid">Zaid (Summer)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Current Farming Stage</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-semibold cursor-pointer"
                  value={farmingStage}
                  onChange={(e) => setFarmingStage(e.target.value)}
                >
                  {FARMING_STAGES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Objective</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-semibold cursor-pointer"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                  >
                    <option value="Reduce Cost">Reduce Cost</option>
                    <option value="Maximum Yield">Maximum Yield</option>
                    <option value="Fast Execution">Fast Execution</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Budget (Ã¢â€šÂ¹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 20000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-semibold"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Specific Question (Optional)</label>
                <textarea
                  placeholder="What equipment should I rent for my field preparation?"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-semibold resize-none"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              <button
                type="submit"
                data-testid="smart-plan-submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-base shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Sparkles className="animate-spin" size={18} />
                    <span>Generating Smart Plan...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Generate Smart Plan</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-semibold">
                  {error}
                </div>
              )}
           </form>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-8 space-y-8">
           {!plan && !loading && !error && (
             <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-300 w-fit mx-auto">
                   <Bot size={48} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Your AI Smart Farming Plan Will Appear Here</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  Fill in your crop, soil type, acreage, stage, and budget to receive tailored agronomy steps and real equipment recommendations.
                </p>
             </div>
           )}

           {loading && (
             <div className="space-y-6 animate-pulse">
                <div className="h-48 bg-slate-100 rounded-3xl" />
                <div className="grid grid-cols-2 gap-4">
                   <div className="h-32 bg-slate-100 rounded-2xl" />
                   <div className="h-32 bg-slate-100 rounded-2xl" />
                </div>
                <div className="h-64 bg-slate-100 rounded-3xl" />
             </div>
           )}

           {plan && (
             <div className="space-y-8 animate-in fade-in duration-500">
                {/* Executive Summary Card */}
                <div className="bg-gradient-to-br from-white to-emerald-50/50 p-6 md:p-8 rounded-3xl border border-emerald-100 shadow-lg space-y-4">
                   <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-100 pb-4">
                      <div>
                         <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                           {plan.farmingStage} STAGE
                         </span>
                         <h2 className="text-2xl font-black text-slate-900 mt-2">
                           Smart Farming Plan for {plan.crop}
                         </h2>
                      </div>
                      <div className="text-right">
                         <span className="text-xs font-bold text-slate-500">Farm Size</span>
                         <p className="text-xl font-black text-slate-900">{plan.farmSize} Acres</p>
                      </div>
                   </div>

                   <p className="text-slate-700 font-medium leading-relaxed">
                     {plan.summary}
                   </p>
                </div>

                {/* Operations & Strategy Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Recommended Operations */}
                   <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-600" size={20} />
                        Recommended Operations
                      </h3>
                      <ul className="space-y-2">
                        {plan.operations.map((op: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-sm font-semibold text-slate-800">
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {idx + 1}
                            </span>
                            {op}
                          </li>
                        ))}
                      </ul>
                   </div>

                   {/* Budget & Cost Analysis */}
                   <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <DollarSign className="text-emerald-600" size={20} />
                        Cost & Budget Intelligence
                      </h3>
                      <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                         <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">Est. Rental Cost</span>
                            <span className="text-lg font-black text-emerald-600">{formatCurrency(plan.estimatedCost.totalEstimatedCost, selectedLanguage)}</span>
                         </div>
                         {plan.estimatedCost.farmerBudget > 0 && (
                           <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500">Your Budget</span>
                              <span className="text-base font-bold text-slate-800">{formatCurrency(plan.estimatedCost.farmerBudget, selectedLanguage)}</span>
                           </div>
                         )}
                         <div className="pt-2 border-t border-slate-200">
                            <span className={`inline-block text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                              plan.estimatedCost.withinBudget ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {plan.estimatedCost.budgetStatus.replace('_', ' ')}
                            </span>
                            <p className="text-xs text-slate-600 font-medium mt-2">
                              {plan.estimatedCost.analysis}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* AI Recommended Real Equipment Section */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-lg space-y-6">
                   <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                         <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                           <Tractor className="text-emerald-600" size={24} />
                           AI Recommended Equipment
                         </h2>
                         <p className="text-xs text-slate-500 font-medium mt-1">
                           Matched from real available AgroRent AI inventory based on 8 compatibility factors
                         </p>
                      </div>
                   </div>

                   {plan.matchedEquipment && plan.matchedEquipment.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {plan.matchedEquipment.map((eq: any) => (
                          <div key={eq.id} className="border border-slate-200 rounded-2xl p-5 hover:shadow-xl transition-all space-y-4 bg-slate-50/50 flex flex-col justify-between">
                             <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                   <div>
                                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${getTierColor(eq.matchTier)}`}>
                                        {eq.matchTier} ({eq.matchScore}%)
                                      </span>
                                      <h4 className="text-lg font-black text-slate-900 mt-2">{eq.title}</h4>
                                      <p className="text-xs text-slate-500 font-semibold">{eq.category} Ã¢â‚¬Â¢ {eq.location || 'Local Region'}</p>
                                   </div>
                                   <div className="text-right shrink-0">
                                      <span className="text-lg font-black text-emerald-600">Ã¢â€šÂ¹{eq.pricePerDay}</span>
                                      <span className="text-[10px] font-bold text-slate-400 block">/day</span>
                                   </div>
                                </div>

                                <div className="p-3 bg-white rounded-xl text-xs text-slate-600 font-medium border border-slate-100">
                                   Ã°Å¸â€™Â¡ {eq.matchReason}
                                </div>
                             </div>

                             <div className="space-y-3 pt-3 border-t border-slate-200">
                                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                   <span className="flex items-center gap-1"><UserCheck size={14} /> Owner: {eq.owner.name}</span>
                                   <span>Est. Total: Ã¢â€šÂ¹{eq.estimatedTotalCost} ({eq.recommendedDays} days)</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                   <Link
                                     href={`/dashboard/marketplace?id=${eq.id}`}
                                     className="py-2.5 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold text-center hover:bg-slate-800 transition-all flex items-center justify-center gap-1"
                                   >
                                     View Details <ArrowRight size={14} />
                                   </Link>
                                   <Link
                                     href={`/dashboard/marketplace?bookId=${eq.id}`}
                                     className="py-2.5 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center hover:bg-emerald-700 transition-all flex items-center justify-center gap-1"
                                   >
                                     Book Equipment
                                   </Link>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="p-6 bg-slate-50 rounded-2xl text-center text-slate-500 text-sm font-medium">
                        No active matching equipment found in inventory for your region at this moment.
                     </div>
                   )}
                </div>

                {/* Action Plan & Risks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Day-by-day Action Plan */}
                   <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Calendar className="text-emerald-600" size={20} />
                        Day-by-Day Action Plan
                      </h3>
                      <div className="space-y-3">
                         {plan.actionPlan.map((ap: any, idx: number) => (
                           <div key={idx} className="p-3 bg-slate-50 rounded-xl space-y-1">
                              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">{ap.day}</span>
                              <p className="text-sm font-semibold text-slate-800">{ap.task}</p>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Risks & Cost Saving Tips */}
                   <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="text-amber-500" size={20} />
                        Farming Risks & Saving Tips
                      </h3>
                      <div className="space-y-3">
                         <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 space-y-1">
                            <span className="text-xs font-black text-amber-800 uppercase tracking-wider">Identified Risks</span>
                            <ul className="text-xs font-medium text-amber-900 list-disc list-inside space-y-1 mt-1">
                              {plan.risks.map((r: string, idx: number) => (
                                <li key={idx}>{r}</li>
                              ))}
                            </ul>
                         </div>

                         <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                            <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Cost Saving Tips</span>
                            <ul className="text-xs font-medium text-emerald-900 list-disc list-inside space-y-1 mt-1">
                              {plan.costSavingTips.map((tip: string, idx: number) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
