'use client';

import '@/lib/i18n';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { useTranslation } from "react-i18next";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
  const { session, setSession, user, setUser } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Safety timeout to ensure login page is reachable
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    async function initAuth() {
      try {
        // 1. Check if we already have a session and user in the store (Persisted)
        if (session && user) {
          api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
          try {
            const response = await api.get('/auth/me');
            setUser(response.data);
          } catch (err) {
            console.error('Session validation failed', err);
          }
        } else {
          // 2. Check Supabase session
          const { data: { session: supabaseSession } } = await supabase.auth.getSession();
          if (supabaseSession) {
            setSession(supabaseSession);
            await fetchProfile(supabaseSession.access_token);
          }
        }
      } catch (e) {
        console.error('Auth initialization failed', e);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession) {
          setSession(newSession);
          await fetchProfile(newSession.access_token);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null as any);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(token: string) {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error: any) {
      console.error('Failed to fetch user profile', error);
    } finally {
      setLoading(false);
    }
  };

  const isAuthRoute = pathname === '/login';
  const hasSession = !!session && !!user;

  useEffect(() => {
    if (loading) return;

    if (!hasSession && !isAuthRoute) {
      router.replace('/login');
    } else if (hasSession && isAuthRoute) {
      const storedActive = useStore.getState().activeRole;
      
      if (!storedActive && user?.role === 'BOTH') {
        router.replace('/dashboard/role-select');
        return;
      }

      const currentActive = storedActive || user?.role;
      
      if (currentActive === 'FARMER') {
        router.replace('/dashboard/farmer');
      } else if (currentActive === 'OWNER') {
        router.replace('/dashboard');
      } else if (currentActive === 'ADMIN') {
        router.replace('/dashboard/admin');
      } else {
        router.replace('/dashboard/role-select');
      }
    }
  }, [session, user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="mt-4 text-gray-500 font-medium">{t('loading_agrorent_ai')}</p>
        </div>
      </div>
    );
  }

  // Allow login page to render even if session check failed
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Protect other routes
  if (!hasSession) {
    return null;
  }

  return <>{children}</>;
}
