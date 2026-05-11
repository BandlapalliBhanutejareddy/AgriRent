import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: 'FARMER' | 'OWNER' | 'ADMIN';
}

interface AuthState {
  session: any | null;
  user: User | null;
  setSession: (session: any) => void;
  setUser: (user: User) => void;
  login: (phone: string, otp: string) => Promise<void>;
  setDemoUser: (role?: 'FARMER' | 'OWNER') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      setSession: (session) => set({ session }),
      setUser: (user) => set({ user }),
      login: async (phone, otp) => {
        // In a real app, verify OTP with Supabase/Twilio first
        // Then fetch user profile from our backend
        try {
          const response = await api.post('/auth/login', { phone });
          if (response.data.success) {
            set({ 
              session: { token: 'demo-token' }, // Mock session
              user: response.data.user 
            });
          } else {
            throw new Error('User not found');
          }
        } catch (error) {
          throw error;
        }
      },
      setDemoUser: (role = 'FARMER') => {
        set({
          session: { token: 'demo-token' },
          user: {
            id: 'demo-id',
            phone: '+919876543210',
            name: 'Demo ' + role,
            role: role
          }
        });
      },
      logout: () => set({ session: null, user: null }),
    }),
    {
      name: 'agrorent-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
