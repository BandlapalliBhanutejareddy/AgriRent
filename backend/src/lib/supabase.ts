import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('⚠️ Supabase URL not provided, using fallback client initialization.');
}

if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = ws;
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: ws as any
  }
});
