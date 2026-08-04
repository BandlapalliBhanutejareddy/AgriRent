'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useTranslation } from "react-i18next";

export default function Home() {
    const { t } = useTranslation();
  const router = useRouter();
  const { session, user } = useStore();

  useEffect(() => {
    if (session && user) {
      if (user.role === 'FARMER') {
        router.replace('/dashboard/farmer');
      } else {
        router.replace('/dashboard');
      }
    } else {
      router.replace('/login');
    }
  }, [session, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        <p className="mt-4 text-gray-500 font-medium tracking-wide">{t('loading_agrorent_ai')}</p>
      </div>
    </div>
  );
}
