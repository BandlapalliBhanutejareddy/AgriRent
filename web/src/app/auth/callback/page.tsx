'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { Tractor, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setSession, setActiveRole } = useStore();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        const roleParam = searchParams.get('role') || 'FARMER';
        const targetRole = roleParam === 'OWNER' ? 'OWNER' : 'FARMER';

        // 1. Get current Supabase session (with resilient exchange listener)
        let currentSession = (await supabase.auth.getSession()).data.session;

        if (!currentSession?.access_token) {
          // Wait for token hash exchange via onAuthStateChange or short polling
          currentSession = await new Promise((resolve) => {
            const { data: authListener } = supabase.auth.onAuthStateChange((_event, sess) => {
              if (sess?.access_token) {
                authListener.subscription.unsubscribe();
                resolve(sess);
              }
            });
            setTimeout(async () => {
              authListener.subscription.unsubscribe();
              const finalCheck = await supabase.auth.getSession();
              resolve(finalCheck.data.session || null);
            }, 3000);
          });
        }

        if (!currentSession?.access_token) {
          throw new Error('Authentication session was not completed. Please try signing in again.');
        }

        // 2. Synchronize with backend API
        const res = await api.post('/auth/google', {
          accessToken: currentSession.access_token,
          role: targetRole,
        });

        if (!res.data.success || !res.data.user) {
          throw new Error(res.data.error || 'Failed to authenticate with AgroRent services.');
        }

        const user = res.data.user;
        const appToken = res.data.token || currentSession.access_token;

        // 3. Update store and local storage
        setUser(user);
        setSession({ access_token: appToken, user });
        setActiveRole(user.role);

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', appToken);

        // 4. Redirect based on verified role
        if (!isMounted) return;
        if (user.role === 'ADMIN') {
          router.replace('/dashboard/admin');
        } else if (user.role === 'OWNER') {
          router.replace('/dashboard/owner');
        } else {
          router.replace('/dashboard/farmer');
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Google Auth Callback Error:', err);
        setErrorMsg(err.response?.data?.error || err.message || 'Authentication failed. Please return to login.');
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams, setUser, setSession, setActiveRole]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-16 h-16 bg-emerald-600/10 dark:bg-emerald-500/10 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
        <Tractor size={32} />
      </div>

      {errorMsg ? (
        <div className="max-w-md bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg font-black text-red-600 dark:text-red-400 mb-2">Authentication Failed</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{errorMsg}</p>
          <button
            onClick={() => router.replace('/login')}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors"
          >
            Return to Login
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Connecting with Google...</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Verifying your secure credentials and preparing your dashboard.</p>
        </div>
      )}
    </div>
  );
}

