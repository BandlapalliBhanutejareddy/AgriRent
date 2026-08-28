import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  phone: string;
  name: string | null;
  role: string;
}

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

interface AppState {
  session: any | null;
  user: User | null;
  activeRole: 'FARMER' | 'OWNER' | 'ADMIN' | null;
  setSession: (session: any) => void;
  setUser: (user: User) => void;
  setActiveRole: (activeRole: 'FARMER' | 'OWNER' | 'ADMIN' | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      activeRole: null,
      setSession: (session) => set({ session }),
      setUser: (user) => set((state) => {
        let defaultActive = state.activeRole;
        if (!defaultActive || (user.role !== 'BOTH' && user.role !== defaultActive)) {
          if (user.role === 'FARMER') defaultActive = 'FARMER';
          else if (user.role === 'OWNER') defaultActive = 'OWNER';
          else if (user.role === 'ADMIN') defaultActive = 'ADMIN';
          else if (user.role === 'BOTH') defaultActive = defaultActive || 'FARMER';
        }
        return { user, activeRole: defaultActive };
      }),
      setActiveRole: (activeRole) => set({ activeRole }),
      logout: () => set({ session: null, user: null, activeRole: null }),
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
