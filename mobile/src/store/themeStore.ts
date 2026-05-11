import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { colors } from '../lib/colors';
import { darkColors } from '../lib/darkColors';

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
  theme: typeof colors;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      theme: colors,
      toggleDarkMode: () => set((state) => ({
        isDarkMode: !state.isDarkMode,
        theme: !state.isDarkMode ? darkColors : colors
      })),
      toggleTheme: () => set((state) => ({
        isDarkMode: !state.isDarkMode,
        theme: !state.isDarkMode ? darkColors : colors
      })),
      initializeTheme: () => {}, // Can be expanded later for persistence
      setDarkMode: (isDark) => set({
        isDarkMode: isDark,
        theme: isDark ? darkColors : colors
      }),
    }),
    {
      name: 'theme-storage-mobile',
    }
  )
);
