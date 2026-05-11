'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, setSession, setUser } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a persisted dev session
    const savedSession = localStorage.getItem('agrorent_dev_session');
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      setSession(parsed.session);
      setUser(parsed.user);
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.access_token);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.access_token);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (token: string) => {
    try {
      // Force token onto api client immediately
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error: any) {
      console.error('Failed to fetch user profile', error);
      if (error.response?.status === 401) {
        // Stale session, clear it
        setSession(null);
        supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isAuthRoute = pathname === '/login';

    // Check for dev-token in session or localStorage if in dev mode
    const isDevSession = session?.access_token === 'dev-token';

    if (!session && !isAuthRoute) {
      router.replace('/login');
    } else if (session && isAuthRoute && !loading) {
      // Role-based redirection
      const user = useStore.getState().user;
      if (user?.role === 'FARMER') {
        router.replace('/dashboard/marketplace');
      } else if (user?.role === 'OWNER') {
        router.replace('/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [session, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
