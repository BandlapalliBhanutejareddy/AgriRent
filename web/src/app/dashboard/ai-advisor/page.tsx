'use client';

import { useState } from 'react';
import { 
  Bot, 
  Leaf, 
  Droplets, 
  Map as MapIcon, 
  Search, 
  ChevronRight, 
  Sparkles,
  Tractor,
  Lightbulb,
  Volume2
} from 'lucide-react';
import { api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import { useStore } from '@/store/useStore';
import { useTranslation } from 'react-i18next';

export default function AiAdvisorPage() {
    const { t } = useTranslation();
  const { user } = useStore();
  const [crop, setCrop] = useState('');
  const [soilType, setSoilType] = useState('');
  const [acreage, setAcreage] = useState('');
  const [location, setLocation] = useState('');
  const [season, setSeason] = useState('Kharif');
  const [objective, setObjective] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop.trim() && !question.trim()) {
      setError('Please provide at least a crop or a question.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    const prompt = `
      Context:
      Crop: ${crop || 'Not specified'}
      Soil Type: ${soilType || 'Not specified'}
      Land Size (Acreage): ${acreage || 'Not specified'}
      Location: ${location || 'Not specified'}
      Season: ${season}
      Farming Objective: ${objective || 'Not specified'}
      Question: ${question || 'Please provide a comprehensive farm plan and equipment recommendations.'}
      
      Please provide a structured response covering:
      1. Recommended equipment (why it is useful)
      2. Suggested farming steps
      3. Approximate timing
      4. Important precautions
    `;

    try {
      const response = await api.post('/ai/advisor', {
        prompt,
        language: user?.preferredLanguage === 'hi' ? 'Hindi' : 
                  user?.preferredLanguage === 'te' ? 'Telugu' : 
                  user?.preferredLanguage === 'ta' ? 'Tamil' : 
                  user?.preferredLanguage === 'kn' ? 'Kannada' : 'English'
      });
      setResult(response.data.reply || response.data.data?.reply || response.data);
    } catch (err: any) {
      console.error('AI Service Error:', err);
      setError('AI Advisor is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200">
                <Bot size={24} />
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('ai_farm_advisor')}</h1>
          </div>
          <p className="text-slate-500 text-lg max-w-2xl">
            {t('get_personalized_equipment_recommendatio')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Form Section */}
        <div className="lg:col-span-5">
           <form onSubmit={handleGetAdvice} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8 sticky top-8">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-wider">
                  <Leaf size={16} className="text-emerald-600" />
                  {t('what_are_you_planting')}</label>
                <input 
                  type="text"
                  placeholder={t('e_g_wheat_basmati_rice_cotton')}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 font-medium"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-wider">
                    <Droplets size={16} className="text-blue-500" />
                    {t('soil_type', { defaultValue: 'Soil Type' })}</label>
                  <input 
                    type="text"
                    placeholder={t('e_g_loamy', { defaultValue: 'e.g., Loamy' })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 font-medium"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-wider">
                    <MapIcon size={16} className="text-amber-500" />
                    {t('acreage', { defaultValue: 'Acreage' })}</label>
                  <input 
                    type="number"
                    placeholder={t('e_g_5', { defaultValue: 'e.g., 5' })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 font-medium"
                    value={acreage}
                    onChange={(e) => setAcreage(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-wider">
                    <MapIcon size={16} className="text-indigo-500" />
                    Location</label>
                  <input 
                    type="text"
                    placeholder="e.g., Nellore, AP"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 font-medium"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-wider">
                    Season</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 font-medium cursor-pointer"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                  >
                    <option value="Kharif">Kharif (Monsoon)</option>
                    <option value="Rabi">Rabi (Winter)</option>
                    <option value="Zaid">Zaid (Summer)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-wider">
                  Farming Objective</label>
                <input 
                  type="text"
                  placeholder="e.g., Increase yield, reduce pests"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 font-medium"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-wider">
                  <Lightbulb size={16} className="text-yellow-500" />
                  Your Question (Optional)</label>
                <textarea 
                  placeholder="Ask a specific question..."
                  rows={3}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 font-medium resize-none"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                data-testid="advisor-submit"
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? (
                  <>{t('consulting_ai_oracle')}</>
                ) : (
                  <>{t('get_expert_advice')}<Search size={20} /></>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-medium">
                  {error}
                </div>
              )}
           </form>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-7">
           {!result && !loading && (
             <div className="h-full min-h-[400px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="p-6 bg-white rounded-3xl shadow-sm text-slate-200">
                   <Sparkles size={64} />
                </div>
                <div>
                   <h3 className="text-2xl font-bold text-slate-900">{t('your_ai_insights_will_appear_here')}</h3>
                   <p className="text-slate-500 mt-2 max-w-sm">
                     {t('enter_your_crop_details_to_see_personali')}</p>
                </div>
             </div>
           )}

           {loading && (
             <div className="space-y-8 animate-pulse">
                <div className="h-32 bg-slate-100 rounded-3xl" />
                <div className="space-y-4">
                   <div className="h-24 bg-white border border-slate-100 rounded-3xl" />
                   <div className="h-24 bg-white border border-slate-100 rounded-3xl" />
                   <div className="h-24 bg-white border border-slate-100 rounded-3xl" />
                </div>
             </div>
           )}

           {result && (
             <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="p-8 bg-white rounded-[32px] border border-slate-200 relative overflow-hidden">
                    <div className="relative z-10 prose prose-emerald prose-lg max-w-none dark:prose-invert">
                       <ReactMarkdown>{result.reply || result}</ReactMarkdown>
                    </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
