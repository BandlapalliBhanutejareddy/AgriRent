import axios from 'axios';
import { useStore } from '../store/useStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'; 

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach the JWT token to every request
api.interceptors.request.use((config) => {
  const session = useStore.getState().session;
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Response Interceptor to unwrap normalized data
api.interceptors.response.use(
  (response) => {
    // If the response follows our normalization pattern { success, data }
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle Session Expiration
      if (status === 401) {
        useStore.getState().logout();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('agrorent_dev_session');
          window.location.href = '/login?expired=true';
        }
      }
      
      // Handle Rate Limiting
      if (status === 429) {
        console.warn('Rate limit exceeded');
        // Toast will be handled by the calling component or a global listener
      }
      
      // Map normalized error messages if present
      if (data && data.success === false && data.message) {
        error.message = data.message;
      }
    }
    return Promise.reject(error);
  }
);
