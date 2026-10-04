import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/lib/i18n';

interface User {
  id: string;
  email: string;
  phone: string;
  name: string | null;
  role: string;
  preferredLanguage?: string;
  profileImage?: string | null;
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
        if (!user) return { user: null, activeRole: null };
        let defaultActive = state.activeRole;
        if (!defaultActive || (user.role !== 'BOTH' && user.role !== defaultActive)) {
          if (user.role === 'FARMER') defaultActive = 'FARMER';
          else if (user.role === 'OWNER') defaultActive = 'OWNER';
          else if (user.role === 'ADMIN') defaultActive = 'ADMIN';
          else if (user.role === 'BOTH') defaultActive = defaultActive || null;
        }

        // Sync language to global i18n instance instantly
        if (user.preferredLanguage) {
          if (i18n.language !== user.preferredLanguage) {
            i18n.changeLanguage(user.preferredLanguage);
          }
        }

        return { user, activeRole: defaultActive };
      }),
      setActiveRole: (activeRole) => set({ activeRole }),
      logout: () => {
        i18n.changeLanguage('en'); // prevent language leak to next user session
        set({ session: null, user: null, activeRole: null });
      },
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
