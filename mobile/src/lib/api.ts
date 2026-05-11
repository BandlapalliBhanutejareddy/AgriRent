import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// For Android emulator, localhost is 10.0.2.2. For web and iOS, use localhost or your IP.
const API_URL = (typeof window !== 'undefined' && (process.env.EXPO_PUBLIC_API_URL?.includes('10.0.2.2') || !process.env.EXPO_PUBLIC_API_URL)) 
  ? 'http://localhost:4000/api' 
  : (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000/api');

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach the JWT token to every request
api.interceptors.request.use((config) => {
  const session = useAuthStore.getState().session;
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Response Interceptor to unwrap normalized data
api.interceptors.response.use(
  (response) => {
    // Unwrapping normalized backend response { success, data }
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  async (error) => {
    const { response, config } = error;
    
    if (response) {
      const { status, data } = response;
      
      // Handle Session Expiration
      if (status === 401) {
        useAuthStore.getState().logout();
        // Redirect to login would happen via the root layout's auth listener
      }
      
      // Handle Rate Limiting
      if (status === 429) {
        console.warn('Rate limit exceeded. Please wait.');
      }

      // Map normalized error messages
      if (data && data.success === false && data.message) {
        error.message = data.message;
      }
    } else {
      console.warn('Network Error: Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);
