'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/useStore';
import '../lib/i18n';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  return <>{children}</>;
}