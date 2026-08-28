'use client';

import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Tractor, Sprout } from 'lucide-react';
import { useEffect } from 'react';

export default function RoleSelectPage() {
  const { user, setActiveRole, activeRole } = useStore();
  const router = useRouter();

  // If they aren't BOTH, or they already have an active role, push them out
  useEffect(() => {
    if (user && user.role !== 'BOTH') {
      router.push(user.role === 'FARMER' ? '/dashboard/farmer' : '/dashboard');
    }
  }, [user, router]);

  const selectMode = (mode: 'FARMER' | 'OWNER') => {
    setActiveRole(mode);
    if (mode === 'FARMER') {
      window.location.href = '/dashboard/farmer';
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          How do you want to use AgroRent today?
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Your account has dual capabilities. Select a portal to continue. You can always switch modes later from the navigation bar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
        {/* Farmer Mode */}
        <button
          onClick={() => selectMode('FARMER')}
          className="group relative bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[32px] p-8 text-left hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
            <Sprout size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">FARMER MODE</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            Rent agricultural equipment, view smart crop recommendations, and manage your bookings.
          </p>
        </button>

        {/* Owner Mode */}
        <button
          onClick={() => selectMode('OWNER')}
          className="group relative bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[32px] p-8 text-left hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
            <Tractor size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">OWNER MODE</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            Rent out your equipment, manage your fleet inventory, and review incoming booking requests.
          </p>
        </button>
      </div>
    </div>
  );
}
