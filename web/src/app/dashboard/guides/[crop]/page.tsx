'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Lightbulb, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Tractor
} from 'lucide-react';
import Link from 'next/link';

export default function CropGuideDetail() {
  const params = useParams();
  const router = useRouter();
  const crop = params.crop as string;
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    fetchGuide();
  }, [crop]);

  const fetchGuide = async () => {
    try {
      const response = await api.get('/guides');
      const cropGuides = response.data[crop] || [];
      cropGuides.sort((a: any, b: any) => a.stepOrder - b.stepOrder);
      setSteps(cropGuides);
    } catch (error) {
      console.error('Failed to fetch guide details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-64" />
        <div className="h-[500px] bg-white rounded-2xl border border-slate-100" />
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="p-4 bg-slate-100 rounded-full text-slate-400">
          <Search size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">No Guide Found</h2>
        <p className="text-slate-500 text-center max-w-md">
          We don't have a specific guide for <span className="font-bold text-slate-900">{crop}</span> yet. 
          Check back later as we expand our knowledge base.
        </p>
        <Link 
          href="/dashboard/guides"
          className="flex items-center gap-2 text-emerald-600 font-bold hover:gap-3 transition-all"
        >
          <ArrowLeft size={18} /> Back to Guides
        </Link>
      </div>
    );
  }

  const stepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

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
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight capitalize">{crop} Mastery Guide</h1>
            <p className="text-slate-500">Master every stage of your {crop} cultivation journey.</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Progress</span>
          <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-bold text-emerald-600">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Step Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video rounded-3xl overflow-hidden border-4 border-white shadow-2xl group">
             {stepData.imageUrl ? (
               <img 
                 src={stepData.imageUrl} 
                 alt={stepData.stepTitle}
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
               />
             ) : (
               <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                 <Tractor size={64} className="text-slate-300" />
               </div>
             )}
             <div className="absolute top-6 left-6 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg">
                Step {stepData.stepOrder} of {steps.length}
             </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-4">{stepData.stepTitle}</h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {stepData.description}
              </p>
            </div>

            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm h-fit">
                <Lightbulb size={24} className="text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 text-lg mb-1">Smart Tip</h4>
                <p className="text-emerald-700 font-medium">
                  {stepData.smartTip || 'Follow local weather forecasts to time this activity perfectly for maximum yield.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                currentStep === 0 
                  ? 'text-slate-300 cursor-not-allowed' 
                  : 'text-slate-600 hover:bg-white hover:shadow-md'
              }`}
            >
              <ChevronLeft size={20} /> Previous
            </button>
            <div className="flex items-center gap-2">
               {steps.map((_, idx) => (
                 <div 
                   key={idx} 
                   className={`h-2 rounded-full transition-all duration-300 ${
                     idx === currentStep ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200'
                   }`}
                 />
               ))}
            </div>
            {currentStep === steps.length - 1 ? (
              <button
                onClick={() => router.push('/dashboard/guides')}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-1"
              >
                Complete Guide <CheckCircle2 size={20} />
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all transform hover:-translate-y-1"
              >
                Next Step <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Recommended Tools</h3>
            <p className="text-sm text-slate-500">Based on this step, we recommend using the following machinery for best results.</p>
            
            <div className="space-y-4">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                       <Tractor size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{stepData.recommendedEquipment || 'General Machinery'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Essential for {stepData.stepTitle}</p>
                    </div>
                  </div>
                  <Search size={16} className="text-slate-300 group-hover:text-emerald-500" />
               </div>
               
               <Link 
                 href="/dashboard/equipment/new"
                 className="block w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-center text-sm hover:bg-emerald-100 transition-colors"
               >
                 Add This to My Fleet
               </Link>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden">
             <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-bold">Need help with your {crop}?</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Our AI advisor can help you optimize your yield based on soil type and weather.
                </p>
                <Link 
                  href="/dashboard/ai-advisor"
                  className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all"
                >
                  Consult AI Advisor
                </Link>
             </div>
             <div className="absolute -bottom-10 -right-10 opacity-20">
                <Lightbulb size={160} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
