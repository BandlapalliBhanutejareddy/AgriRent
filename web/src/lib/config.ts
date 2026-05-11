import { z } from 'zod';

const configSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_API_URL: z.string().url().optional().default('http://localhost:4000/api'),
});

const getConfig = () => {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  };

  const result = configSchema.safeParse(env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    if (typeof window !== 'undefined') {
       // Only show alert in browser
       // alert('Critical configuration missing. Check console.');
    }
    // Return partial or default in case of failure to avoid total crash if possible
    return env as any;
  }

  return result.data;
};

export const config = getConfig();
