import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : 'https://ezylxyrtnodxthdgynvn.supabase.co';

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eWx4eXJ0bm9keHRoZGd5bnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDkxMjIsImV4cCI6MjA5MzcyNTEyMn0.hohg6GuliXMQ77e2sdotu79jL0WQkalq0VPe_RkOY58';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
