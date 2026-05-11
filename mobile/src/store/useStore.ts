import { create } from 'zustand';

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: 'FARMER' | 'OWNER' | 'ADMIN';
}

interface AppState {
  session: any | null;
  user: User | null;
  setSession: (session: any) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  session: null,
  user: null,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  logout: () => set({ session: null, user: null }),
}));
