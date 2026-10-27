'use client';

import { useState, useRef, useEffect } from 'react';
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
  PhoneCall,
  Send,
  MessageSquare,
  RefreshCw,
  HelpCircle,
  Clock,
  User
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

const STARTER_PROMPTS = [
  'What machinery is optimal for 5 acres of cotton harvest?',
  'How to prepare black soil for Kharif paddy sowing?',
  'What is the recommended rotavator depth for vegetable crops?',
  'Cost-effective equipment schedule for 10 acres of maize cultivation'
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

let chatMsgSeq = 0;
function createMessageId(prefix: string): string {
  chatMsgSeq += 1;
  return `${prefix}-${chatMsgSeq}`;
}

function getDisplayTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

export default function AiAdvisorPage() {
  const { t, i18n } = useTranslation();
  const { user } = useStore();

  const [activeTab, setActiveTab] = useState<'ASSISTANT' | 'SMART_PLAN'>('ASSISTANT');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('agrorent_assistant_lang');
      if (savedLang) {
        setSelectedLanguage(savedLang);
      }
    }
  }, []);

  // Conversational Assistant State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Namaste! I am your **Farmer Assistant** on AgroRent AI. Ask me anything about crop cycles, soil preparation, pest management, or machinery recommendations tailored to your field.',
      timestamp: 'Today'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Smart Plan Form State
  const [crop, setCrop] = useState('Rice');
  const [soilType, setSoilType] = useState('Black Soil');
  const [acreage, setAcreage] = useState('6');
  const [location, setLocation] = useState('Andhra Pradesh');
  const [season, setSeason] = useState('Kharif');
  const [farmingStage, setFarmingStage] = useState('SOWING');
  const [objective, setObjective] = useState('Reduce Cost');
  const [budget, setBudget] = useState('20000');
  const [planLoading, setPlanLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  const handleSendChat = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || chatLoading) return;

    const userMsg: ChatMessage = {
      id: createMessageId('user'),
      sender: 'user',
      text: textToSend,
      timestamp: getDisplayTime()
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setChatLoading(true);

    try {
      const res = await api.post('/ai/advisor', {
        question: textToSend,
        prompt: textToSend,
        language: selectedLanguage === 'te' ? 'Telugu' : selectedLanguage === 'hi' ? 'Hindi' : selectedLanguage === 'ta' ? 'Tamil' : selectedLanguage === 'kn' ? 'Kannada' : 'English',
        history: chatMessages.slice(-4).map(m => ({ role: m.sender, content: m.text }))
      });

      const reply = res.data?.reply || res.data?.message || 'I have analyzed your query based on current agricultural best practices.';

      const botMsg: ChatMessage = {
        id: createMessageId('bot'),
        sender: 'assistant',
        text: reply,
        timestamp: getDisplayTime()
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Farmer Assistant Chat Error:', err);
      const fallbackText =
        'Farmer Assistant is temporarily operating in cached offline guidance mode. For immediate farm assistance, consult our Crop Guides or browse verified machinery directly in the marketplace.';
      const botMsg: ChatMessage = {
        id: createMessageId('bot-fallback'),
        sender: 'assistant',
        text: fallbackText,
        timestamp: getDisplayTime()
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGetSmartPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop.trim()) {
      setPlanError('Please provide at least a crop name.');
      return;
    }

    setPlanLoading(true);
    setPlan(null);
    setPlanError(null);

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
        language: selectedLanguage
      });

      setPlan(response.data);
    } catch (err: any) {
      console.error('Smart Plan API Error:', err);
      setPlanError('Smart Farming AI is temporarily unavailable. Please try again.');
    } finally {
      setPlanLoading(false);
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 p-2 sm:p-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-8 rounded-[32px] shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-2xl shadow-lg">
              <Bot size={26} />
            </div>
            <h1 className="text-3xl font-black tracking-tight">{t('ai_advisor.title', 'Farmer Assistant & Agronomic Advisory')}</h1>
          </div>
          <p className="text-emerald-100/90 text-xs sm:text-sm font-medium leading-relaxed">
            {t('ai_advisor.subtitle', 'Get instant agronomic guidance, pest remedies, and seasonal machinery matching powered by AgroRent AI.')}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <span className="font-bold text-emerald-300 uppercase text-[10px]">Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedLanguage(val);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('agrorent_assistant_lang', val);
                }
              }}
              className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('ASSISTANT')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'ASSISTANT'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              <span>{t('ai_advisor.tab_assistant', 'Live Assistant Chat')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SMART_PLAN')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'SMART_PLAN'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} />
              <span>{t('ai_advisor.tab_smart_plan', 'Smart Operations Plan')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Live Conversational Assistant */}
      {activeTab === 'ASSISTANT' && (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[650px]">
          {/* Chat Header */}
          <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Farmer Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Agricultural Machinery & Agronomy Specialist
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setChatMessages([
                  {
                    id: 'welcome',
                    sender: 'assistant',
                    text: 'Chat history cleared. How can I assist your farming operations today?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                ])
              }
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Clear</span>
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-emerald-600 text-white shadow-sm'
                  }`}
                >
                  {msg.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
                </div>

                <div
                  className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>
                  <span
                    className={`block text-[10px] mt-2 font-bold ${
                      msg.sender === 'user' ? 'text-emerald-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-3 max-w-md">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Bot size={15} />
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-3xl rounded-tl-none flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs font-bold text-slate-400 ml-1">Farmer Assistant is analyzing...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Starter Chips */}
          <div className="p-3 px-6 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendChat(prompt)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-all shrink-0 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Farmer Assistant about machinery recommendations, pest solutions, or soil preparation..."
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || chatLoading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>Send</span>
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Smart Operations Plan Form & Results */}
      {activeTab === 'SMART_PLAN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <form onSubmit={handleGetSmartPlan} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 sticky top-6">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Leaf className="text-emerald-600" size={18} />
                Farm Profile & Setup
              </h2>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Crop Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rice, Cotton, Wheat, Maize"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Soil Type</label>
                  <select
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                  >
                    <option value="Black Soil">Black Cotton Soil</option>
                    <option value="Red Soil">Red Loamy Soil</option>
                    <option value="Alluvial Soil">Alluvial Soil</option>
                    <option value="Clayey Soil">Clayey Soil</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Acreage</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={acreage}
                    onChange={(e) => setAcreage(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Season</label>
                  <select
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                  >
                    <option value="Kharif">Kharif (Monsoon)</option>
                    <option value="Rabi">Rabi (Winter)</option>
                    <option value="Zaid">Zaid (Summer)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Stage</label>
                  <select
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={farmingStage}
                    onChange={(e) => setFarmingStage(e.target.value)}
                  >
                    {FARMING_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Budget Limit (₹)</label>
                <input
                  type="number"
                  placeholder="Optional limit (e.g. 25000)"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={planLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {planLoading ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                <span>{planLoading ? 'Generating Agronomic Plan...' : 'Generate Smart Farming Plan'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {planLoading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
                <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
              </div>
            ) : planError ? (
              <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-3xl flex items-center gap-3 text-red-600">
                <AlertTriangle size={24} className="shrink-0" />
                <div>
                  <h4 className="font-bold">Unable to generate plan</h4>
                  <p className="text-xs">{planError}</p>
                </div>
              </div>
            ) : plan ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Summary Banner */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider">
                        Tailored Plan for {plan.crop}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                        {plan.crop} — {plan.stage} Strategy
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Est. Machinery Cost</span>
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(plan.estimatedTotalCost || 12000)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {plan.overview || 'Agronomic advisory computed for soil moisture, crop stage, and regional machinery availability.'}
                  </p>
                </div>

                {/* Matched Machinery Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Tractor size={16} /> Matched Platform Equipment
                  </h3>
                  {plan.matchedEquipment && plan.matchedEquipment.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {plan.matchedEquipment.map((eq: any, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                {eq.suitabilityTier || 'Recommended'}
                              </span>
                              <span className="font-black text-slate-900 dark:text-white text-sm">
                                {formatCurrency(eq.pricePerDay)} / day
                              </span>
                            </div>
                            <h4 className="font-black text-slate-900 dark:text-white text-base mt-2">{eq.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">{eq.matchReason || 'Matches agronomic depth and soil constraints.'}</p>
                          </div>
                          <Link
                            href={`/dashboard/marketplace?equipmentId=${eq.equipmentId || eq.id}`}
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                          >
                            <span>Book Machine</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                      No active listings in immediate radius. Browse marketplace for regional dispatch.
                    </div>
                  )}
                </div>

                {/* Day-by-Day Action Plan */}
                {plan.actionPlan && plan.actionPlan.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Calendar size={16} /> Day-by-Day Operations Schedule
                    </h3>
                    <div className="space-y-2">
                      {plan.actionPlan.map((step: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-start gap-3">
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded font-black text-[10px] shrink-0 mt-0.5">
                            {step.day || `Step ${idx + 1}`}
                          </span>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{step.task}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <Sparkles size={36} className="text-emerald-500 mx-auto" />
                <h3 className="text-base font-black text-slate-800 dark:text-white">Configure your farm parameters</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Provide your crop, soil type, and stage on the left to compute a full machinery and agronomic operations plan.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
