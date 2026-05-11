'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'FARMER' | 'OWNER'>('OWNER');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, setSession } = useStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');
    
    let authError = null;
    let authData = null;

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      authData = data;
      authError = error;
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      authData = data;
      authError = error;
      
      if (!error && data.user) {
        alert('Account created! Logging you in...');
      }
    }

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    // Success! Sync profile with Express Backend
    if (authData?.session) {
      try {
        const response = await api.post('/auth/sync', {
          phone: email, // Reusing phone field for email temporarily for MVP schema
          role,
        }, {
          headers: {
            Authorization: `Bearer ${authData.session.access_token}`
          }
        });
        
        setUser(response.data);
      } catch (apiError) {
        console.error('Failed to sync profile', apiError);
        setError('Logged in, but failed to sync profile data.');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-emerald-600">AgroRent Admin</h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage your equipment fleet and bookings
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="e.g. owner@agrorent.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-emerald-400"
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </div>
          
          <div className="text-sm text-slate-500 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="mb-3 font-semibold text-slate-700">Sign in as</div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('FARMER')}
                className={`rounded-2xl border px-4 py-3 transition ${role === 'FARMER' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
              >
                Farmer
              </button>
              <button
                type="button"
                onClick={() => setRole('OWNER')}
                className={`rounded-2xl border px-4 py-3 transition ${role === 'OWNER' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
              >
                Equipment Owner
              </button>
            </div>
          </div>

          <div className="text-center space-y-4">
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-emerald-600 hover:text-emerald-500 font-medium"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>

            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div className="bg-emerald-50 p-3 rounded-lg text-xs text-emerald-800">
                <p className="font-bold mb-1">Test Credentials:</p>
                <p>Email: <span className="font-mono">owner@agrorent.com</span></p>
                <p>Pass: <span className="font-mono">password123</span></p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const devUser = { id: 'cmovivsqs00017s3xhl7e70vf', name: 'Suresh (Owner)', role: 'OWNER', phone: '+919876543211' };
                  const devSession = { access_token: 'dev-token' };
                  
                  // Persist for refresh
                  localStorage.setItem('agrorent_dev_session', JSON.stringify({ user: devUser, session: devSession }));
                  
                  setUser(devUser as any);
                  setSession(devSession as any);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-center"
              >
                Developer Bypass (Skip Auth)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
