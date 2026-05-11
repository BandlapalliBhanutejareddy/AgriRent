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
  Lightbulb
} from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

// Use environment variable if available, otherwise default to local FastAPI port
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

const aiApi = axios.create({
  baseURL: AI_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
});

export default function AiAdvisorPage() {
  const [crop, setCrop] = useState('');
  const [soilType, setSoilType] = useState('');
  const [acreage, setAcreage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await aiApi.post('/recommend-equipment', {
        crop,
        soil_type: soilType || undefined,
        acreage: acreage ? parseFloat(acreage) : undefined
      });
      setResult(response.data);
    } catch (err) {
      console.error('AI Service Error:', err);
      setError('Could not connect to the AI Service. Please ensure the service is running at ' + AI_SERVICE_URL);
    } finally {
      setLoading(false);
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
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">AI Farm Advisor</h1>
          </div>
          <p className="text-slate-500 text-lg max-w-2xl">
            Get personalized equipment recommendations and farming strategies powered by Gemini AI.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Form Section */}
        <div className="lg:col-span-5">
           <form onSubmit={handleGetAdvice} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8 sticky top-8">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-wider">
                  <Leaf size={16} className="text-emerald-600" />
                  What are you planting?
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Wheat, Basmati Rice, Cotton"
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
                    Soil Type
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Loamy"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 font-medium"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-wider">
                    <MapIcon size={16} className="text-amber-500" />
                    Acreage
                  </label>
                  <input 
                    type="number"
                    placeholder="e.g. 5"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 font-medium"
                    value={acreage}
                    onChange={(e) => setAcreage(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? (
                  <>Consulting AI Oracle...</>
                ) : (
                  <>Get Expert Advice <Search size={20} /></>
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
                   <h3 className="text-2xl font-bold text-slate-900">Your AI insights will appear here</h3>
                   <p className="text-slate-500 mt-2 max-w-sm">
                     Enter your crop details to see personalized recommendations for machinery and cultivation strategy.
                   </p>
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
                <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">AI Strategy Recommendations</h2>
                   <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100">
                      <Sparkles size={12} />
                      {result.source === 'gemini' ? 'Gemini 1.5 Flash' : 'Standard Logic'}
                   </div>
                </div>

                <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 relative overflow-hidden">
                   <div className="relative z-10">
                      <h4 className="text-emerald-900 font-black mb-2 flex items-center gap-2">
                        <Lightbulb size={20} />
                        Cultivation Insight
                      </h4>
                      <p className="text-emerald-800 text-lg leading-relaxed font-medium italic">
                        "{result.reasoning}"
                      </p>
                   </div>
                   <Bot size={120} className="absolute -bottom-10 -right-10 text-emerald-100/50" />
                </div>

                <div className="space-y-4">
                   {result.recommendations.map((rec: any, idx: number) => (
                     <div key={idx} className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                                 <Tractor size={24} />
                              </div>
                              <div>
                                 <h4 className="text-xl font-bold text-slate-900">{rec.name}</h4>
                                 <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">{rec.category}</p>
                              </div>
                           </div>
                           <Link 
                             href={`/dashboard/equipment/new?suggestion=${rec.name}`}
                             className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                           >
                              <Search size={20} />
                           </Link>
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">
                          {rec.why}
                        </p>
                     </div>
                   ))}
                </div>

                <div className="p-8 bg-slate-900 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6">
                   <div>
                      <h3 className="text-2xl font-bold">Ready to implement this?</h3>
                      <p className="text-slate-400">Check out our step-by-step cultivation guides.</p>
                   </div>
                   <Link 
                     href={`/dashboard/guides/${crop}`}
                     className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                   >
                     View {crop} Guide
                   </Link>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
