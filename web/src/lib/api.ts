import axios from 'axios';
import { useStore } from '../store/useStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'; 

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach the token to every request
api.interceptors.request.use((config) => {
  const session = useStore.getState().session;
  // Support both Supabase access_token and our custom token
  const token = session?.access_token || session?.token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor to unwrap normalized data
api.interceptors.response.use(
  (response) => {
    let finalData = response.data;
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      finalData = response.data.data;
    }
    const finalResponse = { ...response, data: finalData };

    if (typeof window !== 'undefined' && response.config.method?.toUpperCase() === 'GET') {
      try {
        localStorage.setItem(`@cache_${response.config.url}`, JSON.stringify(finalData));
      } catch (e) {}
    }

    return finalResponse;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle Session Expiration
      if (status === 401) {
        useStore.getState().logout();
        if (typeof window !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('@cache_')) {
              localStorage.removeItem(key);
            }
          }
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?expired=true';
          }
        }
      }
      
      // Map normalized error messages if present
      if (data && data.success === false && data.message) {
        error.message = data.message;
      } else if (data && data.error) {
        error.message = data.error;
      }
    } else if (error.request) {
      if (typeof window !== 'undefined' && error.config?.url && error.config?.method?.toUpperCase() === 'GET') {
        try {
          const cached = localStorage.getItem(`@cache_${error.config.url}`);
          if (cached) {
            import('react-hot-toast').then(({ toast }) => {
               toast.error('Offline Mode Active: Loading cached data.', { icon: '📡' });
            }).catch(()=>{});
            return Promise.resolve({ data: JSON.parse(cached), status: 200, isOffline: true });
          }
        } catch(e) {}
      }
      error.message = 'No Internet Connection. Please check your network.';
    }
    return Promise.reject(error);
  }
);
