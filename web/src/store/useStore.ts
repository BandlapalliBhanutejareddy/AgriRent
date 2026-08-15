import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  phone: string;
  name: string | null;
  role: 'FARMER' | 'OWNER' | 'ADMIN';
}

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

interface AppState {
  session: any | null;
  user: User | null;
  setSession: (session: any) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      setSession: (session) => set({ session }),
      setUser: (user) => set({ user }),
      logout: () => set({ session: null, user: null }),
    }),
    {
      name: 'agrorent-storage',
    }
  )
);

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    {
      name: 'theme-storage',
    }
  )
);
